'use client';
import { signIn } from 'next-auth/react';

export function LoginActions() {
  return <div className="mt-8 grid gap-3 sans"><button onClick={() => signIn('google', { callbackUrl: '/admin/dashboard' })} className="rounded-full bg-[#065f46] px-5 py-3 font-bold text-white transition hover:bg-[#047857]">Continue with Google</button><input className="rounded-xl border p-3" placeholder="Email or phone"/><button className="rounded-full border border-[#065f46] px-5 py-3 font-bold text-[#065f46]">Send one-time code</button></div>;
}
