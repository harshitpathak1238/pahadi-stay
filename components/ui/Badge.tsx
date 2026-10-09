type BadgeProps = { children: React.ReactNode; tone?: 'rating' | 'urgency' | 'neutral' };

export function Badge({ children, tone = 'neutral' }: BadgeProps) {
  const toneClass = tone === 'rating' ? 'bg-[#f4f8f4]/95 text-[#065f46]' : tone === 'urgency' ? 'bg-[#fff0e8] text-[#9f5938]' : 'bg-[#e7eadf] text-[#047857]';
  return <span className={`sans inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${toneClass}`}>{children}</span>;
}
