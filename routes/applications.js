import express from "express";
import fetch from "node-fetch";
import { validateApplication } from "../middlewares/validate.js";
import { sendWebhook } from "../utils/sendWebhook.js";

const router = express.Router();

// 📌 POST /applications
router.post("/", validateApplication, async (req, res, next) => {
  try {
    const { token, ...application } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Discord OAuth2 token required" });
    }

    // Get user info from Discord API
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
    next(err);
  }
});

export default router;
