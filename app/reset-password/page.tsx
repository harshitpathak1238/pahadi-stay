import { Suspense } from 'react';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
export const metadata = { title: 'Reset password', description: 'Create a new secure Pahadi Stay password.' };
export default function ResetPassword() { return <div className="mx-auto max-w-md px-5 py-16 md:py-24"><Suspense fallback={<div className="auth-panel" aria-busy="true" /> }><ResetPasswordForm/></Suspense></div>; }
