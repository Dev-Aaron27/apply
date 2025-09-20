import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import { sendWebhook } from "./webhook.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// CORS only for your frontend
app.use(cors({ origin: "https://apply.my-board.org" }));
app.use(bodyParser.json());

// Rate limiting: max 1 application per Discord ID per 24h (simple in-memory)
const lastSubmission = {};
const RATE_LIMIT_HOURS = 24;

// Validation function
function validateApplication(data) {
  const errors = [];

  const requiredFields = [
    "discordId",
    "discordUsername",
    "ageConfirmation",
    "abusePerms",
    "useServices",
    "availableDays",
    "moderationExperience",
    "rulesUnderstanding",
    "ruleViolationHandling",
    "timezone",
    "availableHours",
    "positiveEnvironment",
    "conflictResolution"
  ];

  requiredFields.forEach(f => {
    if (!data[f] || (typeof data[f] === "string" && data[f].trim() === "")) {
      errors.push(`${f} is required.`);
    }
  });

  if (data.abusePerms && data.abusePerms.length < 50) {
    errors.push("abusePerms must be at least 50 characters.");
  }

  if (!Array.isArray(data.availableDays) || data.availableDays.length === 0) {
    errors.push("availableDays must be a non-empty array.");
  }

  return errors;
}

// Staff application endpoint
app.post("/api/staff-application", async (req, res) => {
  try {
    const appData = req.body;
    const errors = validateApplication(appData);
    if (errors.length) return res.status(400).json({ success: false, errors });

    // Rate limit per Discord ID
    const last = lastSubmission[appData.discordId];
    if (last && (Date.now() - last < RATE_LIMIT_HOURS * 60 * 60 * 1000)) {
      return res.status(429).json({ success: false, errors: ["You can only submit once per 24 hours."] });
    }
    lastSubmission[appData.discordId] = Date.now();

    // Discord user object (fake for webhook)
    const discordUser = {
      id: appData.discordId,
      username: appData.discordUsername,
      global_name: appData.discriminator || "0000",
      avatar: appData.avatar || "default",
      email: appData.email || null
    };

    await sendWebhook(appData, discordUser);

    return res.json({ success: true, message: "Application submitted successfully" });
  } catch (err) {
    console.error("Application error:", err);
    return res.status(500).json({ success: false, errors: ["Server error"] });
  }
});

// Discord OAuth callback
app.post("/api/staff-application/discord-auth", async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ success: false, errors: ["Code is required"] });

  try {
    const params = new URLSearchParams();
    params.append("client_id", process.env.DISCORD_CLIENT_ID);
    params.append("client_secret", process.env.DISCORD_CLIENT_SECRET);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", process.env.DISCORD_REDIRECT_URI);
    params.append("scope", "identify email guilds"); // <-- add this line

    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      body: params.toString(),
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error("Token response:", tokenData);
      return res.status(400).json({ success: false, errors: ["Failed to get access token"] });
    }

    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    const userData = await userRes.json();
    return res.json(userData);

  } catch (err) {
    console.error("Discord OAuth error:", err);
    return res.status(500).json({ success: false, errors: ["Discord OAuth error"] });
  }
});
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
