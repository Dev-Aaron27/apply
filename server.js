import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { validateApplication } from "./middlewares/validate.js";
import { sendWebhook } from "./utils/sendWebhook.js";

dotenv.config();
const app = express();

// ----- Security + logging -----
app.use(helmet()); // basic security headers
app.use(cors({
  origin: true,      // allow all origins
  credentials: true  // allow cookies/auth headers
}));
app.use(express.json());
app.use(morgan("tiny"));

// ----- Health check -----
app.get("/", (req, res) => {
  res.send("🚀 Discord Staff Application API is running!");
});

// ----- POST /applications -----
app.post("/applications", validateApplication, async (req, res) => {
  try {
    const { token, ...application } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Discord OAuth2 token required" });
    }

    // Fetch Discord user info
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!userResponse.ok) {
      return res.status(401).json({ error: "Invalid Discord token" });
    }

    const discordUser = await userResponse.json();

    // Send Discord webhook
    await sendWebhook(application, discordUser);

    res.status(200).json({ message: "Application submitted successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ----- GET /applications (info only) -----
app.get("/applications", (req, res) => {
  res.json({ message: "POST your application to this endpoint using Discord OAuth2 token." });
});

// ----- Start server -----
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
