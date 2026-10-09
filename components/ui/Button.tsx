import Link from 'next/link';

export function Button({
  children,
  href,
  variant = 'solid',
  type = 'button',
}: {
  children: React.ReactNode;
  href?: string;
  variant?: 'solid' | 'outline' | 'quiet' | 'cta';
  type?: 'button' | 'submit';
}) {
  const className = `sans group inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#047857] ${
    variant === 'solid'
      ? 'cta-depth bg-[#b66b45] px-5 py-3 text-white hover:bg-[#9f5938]'
      : variant === 'cta'
        ? // Modern primary CTA: a rich emerald gradient pill with a glass inset
          // highlight for depth, a soft coloured glow, a lift on hover, a press
          // state for tactile feedback, and an arrow that slides forward.
          'bg-gradient-to-br from-[#0aa06e] via-[#059669] to-[#047857] px-6 py-3.5 text-white shadow-[0_10px_24px_-10px_rgba(4,120,87,.6),inset_0_1px_0_rgba(255,255,255,.22)] hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-12px_rgba(4,120,87,.75),inset_0_1px_0_rgba(255,255,255,.3)] active:translate-y-0 active:scale-[.98] [&_svg]:transition-transform hover:[&_svg]:translate-x-1'
        : variant === 'outline'
          ? 'border border-[#b9c1b8] px-5 py-3 text-[#065f46] hover:bg-white'
          : 'px-5 py-3 text-[#065f46] hover:bg-white/70'
  }`;
  return href ? (
    <Link href={href} className={className}>
      {children}
    </Link>
  ) : (
    <button type={type} className={className}>
      {children}
    </button>
  );
}
