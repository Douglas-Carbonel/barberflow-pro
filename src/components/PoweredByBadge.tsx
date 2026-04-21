interface Props {
  className?: string;
  variant?: 'light' | 'dark';
}

export function PoweredByBadge({ className = '', variant = 'dark' }: Props) {
  const colorClass = variant === 'light' ? 'text-white/60' : 'text-muted-foreground/60';
  return (
    <p
      data-testid="text-powered-by-newage"
      className={`text-[10px] tracking-wide select-none ${colorClass} ${className}`}
    >
      Powered by <span className="font-semibold">NewAge</span>
    </p>
  );
}
