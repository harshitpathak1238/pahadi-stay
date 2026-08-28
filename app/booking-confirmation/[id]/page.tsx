'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Confirmation({ params }: { params: { id: string } }) {
  const [status, setStatus] = useState('CONFIRMING');
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const check = async () => {
      try { const response = await fetch(`/api/trips/${params.id}`, { cache: 'no-store' }); const result = await response.json(); if (!response.ok) throw new Error(result.error); if (active) setStatus(result.status); } catch (requestError) { if (active) setError(requestError instanceof Error ? requestError.message : 'Could not check payment status.'); }
    };
    check(); const timer = window.setInterval(check, 3000); return () => { active = false; window.clearInterval(timer); };
  }, [params.id]);
  const confirmed = status === 'CONFIRMED';
  const failed = status === 'CANCELLED' || status === 'FAILED';
  return <div className="mx-auto max-w-2xl px-5 py-24 text-center"><div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl ${confirmed ? 'bg-[#d6a06d] text-[#173f35]' : failed ? 'bg-[#fff0e8] text-[#9f5938]' : 'bg-[#e2eee7] text-[#24584a]'}`}>{confirmed ? '✓' : failed ? '!' : '…'}</div><h1 className="mt-7 text-5xl">{confirmed ? 'Your hills are waiting.' : failed ? 'Payment needs attention.' : 'Confirming your payment.'}</h1><p className="sans mt-5 text-[#6c7770]">{error || (confirmed ? `Trip ${params.id} is confirmed. We have sent the details to your email and WhatsApp.` : failed ? 'This trip was not confirmed. Return to checkout to retry payment.' : 'We are waiting for the payment provider. This page will update automatically.')}</p>{failed && <Link href="/checkout" className="mt-7 inline-flex rounded-xl bg-[#b66b45] px-5 py-3 sans font-bold text-white">Retry payment</Link>}</div>;
}
