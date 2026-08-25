type BadgeProps = { children: React.ReactNode; tone?: 'rating' | 'urgency' | 'neutral' };

export function Badge({ children, tone = 'neutral' }: BadgeProps) {
  const toneClass = tone === 'rating' ? 'bg-[#f7f4ec]/95 text-[#173f35]' : tone === 'urgency' ? 'bg-[#fff0e8] text-[#9f5938]' : 'bg-[#e7eadf] text-[#24584a]';
  return <span className={`sans inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${toneClass}`}>{children}</span>;
}
