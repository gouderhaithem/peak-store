"use server";

import { createServiceClient } from "@/lib/supabase/server";

export interface ContactInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ContactResult {
  ok: true;
}

export interface ContactError {
  ok: false;
  error: string;
}

export async function submitContact(
  input: ContactInput
): Promise<ContactResult | ContactError> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const subject = input.subject.trim() || "general";
  const message = input.message.trim();

  if (!name || !email || !message) {
    return { ok: false, error: "All fields are required." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (message.length < 10) {
    return { ok: false, error: "Message must be at least 10 characters." };
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("contact_messages")
    .insert({ name, email, subject, message });

  if (error) {
    return { ok: false, error: "Failed to send message. Please try again." };
  }

  return { ok: true };
}
