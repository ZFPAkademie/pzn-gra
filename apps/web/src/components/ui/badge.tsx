/**
 * Badge Component
 * Sprint 1: Status indicators per SPRINT_1_PLAN.md §5.3
 */

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'highlight' | 'success' | 'warning';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-slate-100 text-slate-700',
    highlight: 'bg-amber-100 text-amber-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-red-100 text-red-800',
  };

  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 
        rounded-full text-xs font-medium
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
