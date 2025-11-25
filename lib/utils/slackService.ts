import axios from "axios";

type SlackChannel =
  | "signups"
  | "onboarding-admin"
  | "onboarding-staff"
  | "business-deletion";

const webhookMap: Record<SlackChannel, string | undefined> = {
  signups: process.env.SLACK_SIGNUP_WEBHOOK_URL,
  "onboarding-admin": process.env.SLACK_ONBOARDING_ADMIN_WEBHOOK_URL,
  "onboarding-staff": process.env.SLACK_ONBOARDING_STAFF_WEBHOOK_URL,
  "business-deletion": process.env.SLACK_BUSINESS_DELETION_WEBHOOK_URL,
};

export async function slackNotify(
  channel: SlackChannel,
  text: string
) {
  const url = webhookMap[channel];
  if (!url) return;
  try {
    await axios.post(url, { text });
  } catch (err) {
    console.error("Slack notify error:", err);
  }
}