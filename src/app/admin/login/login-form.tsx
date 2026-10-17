"use client";

import { Loader2, Lock } from "lucide-react";
import { useActionState } from "react";
import { login, type LoginState } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-xl ring-1 ring-zinc-200/70">
      <div className="mb-6 flex flex-col items-center text-center">
        <span className="mb-3 grid size-12 place-items-center rounded-2xl bg-zinc-900 text-white">
          <Lock className="size-5" />
        </span>
        <h1 className="text-lg font-bold text-zinc-900">Admin login</h1>
        <p className="text-[13px] text-zinc-500">Edit your link page</p>
      </div>
      <input
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="Password"
        required
        autoFocus
        className="w-full rounded-xl border border-zinc-200 px-3.5 py-3 text-[15px] outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
      />
      {state.error && <p className="mt-2 text-[13px] text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-[15px] font-semibold text-white hover:bg-zinc-700 disabled:bg-zinc-500"
      >
        {pending && <Loader2 className="size-4 animate-spin" />} Log in
      </button>
    </form>
  );
}
