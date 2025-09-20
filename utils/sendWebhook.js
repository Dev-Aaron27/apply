import fetch from "node-fetch";

export const sendWebhook = async (application, discordUser) => {
  const webhookURL = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookURL) return;

  const embed = {
    title: "📋 New Staff Application",
    color: 0x5865f2,
    fields: [
      { name: "User", value: `${discordUser.username}#${discordUser.discriminator} (${discordUser.id})` },
      { name: "Age Confirmation", value: application.ageConfirmation },
      { name: "Available Days", value: application.availableDays?.join(", ") || "N/A" },
      { name: "Timezone", value: application.timezone },
      { name: "Why not abuse perms?", value: application.abusePerms.slice(0, 150) + "..." },
    ],
    timestamp: new Date(),
  };

  await fetch(webhookURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ embeds: [embed] }),
  });
};
