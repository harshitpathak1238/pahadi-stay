'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, LockKeyhole, Mail, UserRound } from 'lucide-react';

type AuthMode = 'login' | 'signup' | 'forgot';

function GoogleMark() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5"><path fill="#4285F4" d="M21.35 12.27c0-.72-.06-1.42-.18-2.09H12v3.96h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.91-4.2 2.91-7.26Z" /><path fill="#34A853" d="M12 21.7c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.7-1.72-5.47-4.03H3.28v2.53A9.74 9.74 0 0 0 12 21.7Z" /><path fill="#FBBC05" d="M6.53 13.78A5.86 5.86 0 0 1 6.22 12c0-.62.11-1.22.31-1.78V7.69H3.28A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.03 4.31l3.25-2.53Z" /><path fill="#EA4335" d="M12 6.19c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.28 14.63 2.3 12 2.3a9.74 9.74 0 0 0-8.72 5.39l3.25 2.53C7.3 7.91 9.46 6.19 12 6.19Z" /></svg>;
}

export function AuthForm({ initialMode = 'login', initialEmail = '' }: { initialMode?: AuthMode; initialEmail?: string }) {
  const [mode, setMode] = useState(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    const data = Object.fromEntries(new FormData(event.currentTarget));

    try {
      if (mode === 'login') {
        const accountResponse = await fetch('/api/auth/account-exists', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: data.email }) });
        const account = await accountResponse.json();
        if (!account.exists) {
          window.location.href = `/signup?email=${encodeURIComponent(String(data.email))}`;
          return;
        }
        if (!account.hasPassword) {
          setError('This account uses Google sign-in. Continue with Google above.');
          return;
        }
        const result = await signIn('credentials', { email: data.email, password: data.password, redirect: false, callbackUrl: '/account' });
        if (result?.error) setError('That email and password do not match.');
        else window.location.href = '/account';
      } else {
        const response = await fetch(`/api/auth/${mode === 'signup' ? 'signup' : 'forgot-password'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        const result = await response.json();
        if (!response.ok) setError(result.error);
        else {
          setMessage(result.message ?? 'Account created. You can now sign in.');
          if (mode === 'signup') setMode('login');
        }
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copy = mode === 'login'
    ? ['Welcome back.', 'Sign in to keep your stays, rides, and trips together.']
    : mode === 'signup'
      ? ['Make room for more trips.', 'Create an account in under a minute.']
      : ['Reset your password.', 'Enter your email and we will send a secure reset link.'];

  return <div className="auth-panel">
    <div className="mb-7">
      <span className="inline-flex rounded-2xl bg-[#e7eadf] p-3 text-[#24584a]"><KeyRound size={22} /></span>
      <h1 className="mt-5 text-4xl leading-tight text-[#173f35] md:text-5xl">{copy[0]}</h1>
      <p className="sans mt-3 text-base leading-7 text-[#607067]">{copy[1]}</p>
    </div>
    {message && <p className="mb-4 flex items-center gap-2 rounded-xl bg-[#e2eee7] p-3 sans text-sm text-[#24584a]"><CheckCircle2 size={17} />{message}</p>}
    {error && <p className="mb-4 rounded-xl bg-[#fff0e8] p-3 sans text-sm text-[#9f5938]">{error}</p>}

    {mode !== 'forgot' && <>
      <button type="button" onClick={() => signIn('google', { callbackUrl: '/account' })} className="google-button sans">
        <GoogleMark />
        <span>Continue with Google</span>
      </button>
      {mode === 'login' && <div className="auth-divider"><span />or continue with email<span /></div>}
    </>}

    <form onSubmit={submit} className="grid gap-4 sans">
      {mode === 'signup' && <label><span className="auth-label"><UserRound size={15} />Full name</span><input name="name" required minLength={2} className="auth-input" placeholder="Your name" /></label>}
      <label><span className="auth-label"><Mail size={15} />Email address</span><input name="email" type="email" defaultValue={initialEmail} required className="auth-input" placeholder="you@example.com" /></label>
      {mode !== 'forgot' && <label><span className="auth-label"><LockKeyhole size={15} />Password</span><span className="relative block"><input name="password" type={showPassword ? 'text' : 'password'} required minLength={8} className="auth-input pr-12" placeholder="At least 8 characters" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#607067]" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label>}
      <button disabled={loading} className="cta-depth mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-[#b66b45] px-5 py-3.5 font-bold text-white transition hover:bg-[#9f5938] disabled:opacity-60">{loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'} {!loading && <ArrowRight size={17} />}</button>
    </form>

    {mode === 'login' && <button type="button" onClick={() => setMode('forgot')} className="mt-5 w-full text-center sans text-sm font-semibold text-[#24584a] hover:text-[#b66b45]">Forgot your password?</button>}
    {mode === 'login' ? <p className="mt-6 text-center sans text-sm text-[#607067]">New to Pahadi? <button type="button" onClick={() => setMode('signup')} className="font-bold text-[#b66b45]">Create an account</button></p> : <p className="mt-6 text-center sans text-sm text-[#607067]">Already have an account? <button type="button" onClick={() => setMode('login')} className="font-bold text-[#b66b45]">Sign in</button></p>}
  </div>;
}
