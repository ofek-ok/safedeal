import { notFound } from "next/navigation";

/**
 * Vercel's deployment protection is the sign-in boundary for this private app.
 * Vercel does not provide a verified employee identity to application code, so
 * activity is attributed to the shared SafeDeal team account until individual
 * staff authentication is configured.
 */
export type ChatGPTUser = {
  userId: string;
  displayName: string;
  email: string;
  fullName: string | null;
};

const TEAM_USER_ID = "vercel-protected-team";
const TEAM_EMAIL = "team@safedeal.invalid";

export async function getChatGPTUser(): Promise<ChatGPTUser | null> {
  const protectedRuntime = process.env.VERCEL === "1" && process.env.SAFEDEAL_VERCEL_AUTH_REQUIRED === "true";
  const localRuntime = process.env.NODE_ENV === "development";
  if (!protectedRuntime && !localRuntime) return null;

  return {
    userId: process.env.SAFEDEAL_STAFF_USER_ID || TEAM_USER_ID,
    displayName: "צוות SafeDeal",
    email: process.env.SAFEDEAL_STAFF_USER_EMAIL || TEAM_EMAIL,
    fullName: "צוות SafeDeal",
  };
}

export async function requireChatGPTUser(_returnTo: string): Promise<ChatGPTUser> {
  const user = await getChatGPTUser();
  if (user) return user;
  notFound();
}

export function chatGPTSignInPath(_returnTo: string): string {
  return "/staff";
}
