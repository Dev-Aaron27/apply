import fetch from "node-fetch";

export const sendWebhook = async (application, discordUser) => {
  const webhookURL = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookURL) return;

  const fields = [
    { name: "👤 Discord User", value: `${discordUser.username}#${discordUser.discriminator}\nID: ${discordUser.id}`, inline: false },
    { name: "📧 Email", value: discordUser.email || "N/A", inline: false },
    { name: "Q1: Age Confirmation", value: application.ageConfirmation || "N/A", inline: false },
    { name: "Q2: Why would you not abuse perms?", value: application.abusePerms || "N/A", inline: false },
    { name: "Q3: How would you use our services?", value: application.useServices || "N/A", inline: false },
    { name: "Q4: Available Days", value: application.availableDays?.join(", ") || "N/A", inline: false },
    { name: "Q5: Coding Languages", value: application.codingLanguages || "N/A", inline: false },
    { name: "Q6: Moderation Experience", value: application.moderationExperience || "N/A", inline: false },
    { name: "Q7: Rules Understanding", value: application.rulesUnderstanding || "N/A", inline: false },
    { name: "Q8: Handling Rule Violations", value: application.ruleViolationHandling || "N/A", inline: false },
    { name: "Q9: Timezone", value: application.timezone || "N/A", inline: false },
    { name: "Q10: Available Hours", value: application.availableHours || "N/A", inline: false },
    { name: "Q11: Positive Environment Contribution", value: application.positiveEnvironment || "N/A", inline: false },
    { name: "Q12: Technical Skills", value: application.technicalSkills || "N/A", inline: false },
    { name: "Q13: Conflict Resolution", value: application.conflictResolution || "N/A", inline: false },
    { name: "Q14: Hosting / Support Experience", value: application.hostingSupport || "N/A", inline: false },
  ];

  const embed = {
    title: "📋 New Staff Application",
    color: 0x5865f2,
    author: {
      name: `${discordUser.username}#${discordUser.discriminator}`,
      icon_url: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`,
    },
    fields,
    footer: { text: `User ID: ${discordUser.id}` },
    timestamp: new Date(),
  };

  await fetch(webhookURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ embeds: [embed] }),
  });
};
