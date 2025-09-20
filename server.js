import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { validateApplication } from "./middlewares/validate.js";
import { sendWebhook } from "./utils/sendWebhook.js";

dotenv.config();
const app = express();

// Security + logging
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(morgan("tiny"));

const allowedOrigins = [
  "https://apply.my-board.org",
  "http://localhost:3000"
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);

    const normalizedOrigin = origin.replace(/\/$/, ""); // remove trailing slash
    if (allowedOrigins.includes(normalizedOrigin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed"));
    }
  },
  credentials: true
}));

// ----- Health check -----
app.get("/", (req, res) => {
  res.send("🚀 Discord Staff Application API is running!");
});

// ----- POST /applications -----
app.post("/applications", validateApplication, async (req, res, next) => {
  try {
    const { token, ...application } = req.body;

    if (!token) return res.status(400).json({ error: "Discord OAuth2 token required" });

    // Fetch user info from Discord API
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!userResponse.ok) return res.status(401).json({ error: "Invalid Discord token" });

    const discordUser = await userResponse.json();

    // Send Discord webhook
    await sendWebhook(application, discordUser);

    res.status(200).json({ message: "Application submitted successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ----- Optional GET /applications for info -----
app.get("/applications", (req, res) => {
  res.json({ message: "POST your application to this endpoint using Discord OAuth2 token." });
});

// ----- Start server -----
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
