import { redirect } from "next/navigation";
import { getSessionStaff } from "./lib/auth";

export type ChatGPTUser = {
  userId: string;
  displayName: string;
  email: string;
  fullName: string | null;
};

export async function getChatGPTUser(): Promise<ChatGPTUser | null> {
  const session = await getSessionStaff();
  if (!session) return null;
  return {
    userId: session.userId,
    displayName: session.displayName,
    email: session.email,
    fullName: session.displayName,
  };
}

export async function requireChatGPTUser(returnTo: string): Promise<ChatGPTUser> {
  const user = await getChatGPTUser();
  if (user) return user;
  redirect(`/login?next=${encodeURIComponent(returnTo || "/staff")}`);
}

export function chatGPTSignInPath(returnTo: string): string {
  return `/login?next=${encodeURIComponent(returnTo || "/staff")}`;
}
