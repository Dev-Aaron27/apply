// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { sendWebhook } from "./webhook.js"; // your function file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Simple validation function
function validateApplication(data) {
  const errors = [];
  const requiredFields = [
    "discordId",
    "discordUsername",
    "ageConfirmation",
    "abusePerms",
    "useServices",
    "availableDays",
    "codingLanguages",
    "moderationExperience",
    "rulesUnderstanding",
    "ruleViolationHandling",
    "timezone",
    "availableHours",
    "positiveEnvironment",
    "technicalSkills",
    "conflictResolution",
    "hostingSupport",
  ];

  requiredFields.forEach((field) => {
    if (!data[field] || (typeof data[field] === "string" && data[field].trim() === "")) {
      errors.push(`${field} is required.`);
    }
  });

  // Minimum length validations (example)
  const minCharFields = {
    abusePerms: 10,
    useServices: 5,
    codingLanguages: 2,
    moderationExperience: 10,
    rulesUnderstanding: 10,
    ruleViolationHandling: 10,
    positiveEnvironment: 5,
    technicalSkills: 5,
    conflictResolution: 5,
    hostingSupport: 5,
  };

  for (const field in minCharFields) {
    if (data[field] && data[field].length < minCharFields[field]) {
      errors.push(`${field} must be at least ${minCharFields[field]} characters.`);
    }
  }

  if (!Array.isArray(data.availableDays) || data.availableDays.length === 0) {
    errors.push("availableDays must be a non-empty array.");
  }

  return errors;
}

// POST endpoint
app.post("/api/staff-application", async (req, res) => {
  const application = req.body;

  const validationErrors = validateApplication(application);
  if (validationErrors.length > 0) {
    return res.status(400).json({ success: false, errors: validationErrors });
  }

  // Construct a Discord user object for webhook
  const discordUser = {
    id: application.discordId,
    username: application.discordUsername,
    discriminator: application.discriminator || "0000",
    avatar: application.avatar || "default",
    email: application.email || null,
  };

  try {
    await sendWebhook(application, discordUser);
    return res.json({ success: true, message: "Application submitted successfully." });
  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(500).json({ success: false, message: "Failed to submit application." });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
