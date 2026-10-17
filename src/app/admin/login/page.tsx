import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in", robots: { index: false, follow: false } };

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh place-items-center bg-gradient-to-b from-emerald-100 to-zinc-100 px-4">
      <LoginForm />
    </div>
  );
}
