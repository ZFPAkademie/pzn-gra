/**
 * Jurkovič-inspired decorative components
 * Functionalist elegance, geometric refinement
 */

// Horizontal ornament bar
export function JurkovicOrnament({ 
  className = '', 
  variant = 'horizontal' 
}: { 
  className?: string;
  variant?: 'horizontal' | 'corner' | 'diamond' | 'simple';
}) {
  if (variant === 'horizontal') {
    return (
      <svg className={className} viewBox="0 0 200 20" fill="none" aria-hidden="true">
        <path 
          d="M0 10 L20 10 M30 10 L40 0 L50 10 L60 0 L70 10 M80 10 L120 10 M130 10 L140 0 L150 10 L160 0 L170 10 M180 10 L200 10" 
          stroke="currentColor" 
          strokeWidth="1"
        />
        <circle cx="25" cy="10" r="2" fill="currentColor"/>
        <circle cx="75" cy="10" r="2" fill="currentColor"/>
        <circle cx="125" cy="10" r="2" fill="currentColor"/>
        <circle cx="175" cy="10" r="2" fill="currentColor"/>
      </svg>
    );
  }
  
  if (variant === 'corner') {
    return (
      <svg className={className} viewBox="0 0 60 60" fill="none" aria-hidden="true">
        <path d="M0 0 L60 0 M0 0 L0 60" stroke="currentColor" strokeWidth="1"/>
        <path d="M10 0 L10 10 L0 10" stroke="currentColor" strokeWidth="1"/>
        <path d="M20 0 L20 20 L0 20" stroke="currentColor" strokeWidth="1" strokeDasharray="2 4"/>
      </svg>
    );
  }
  
  if (variant === 'diamond') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 2 L22 12 L12 22 L2 12 Z" stroke="currentColor" strokeWidth="1"/>
        <path d="M12 6 L18 12 L12 18 L6 12 Z" stroke="currentColor" strokeWidth="1"/>
      </svg>
    );
  }
  
  if (variant === 'simple') {
    return (
      <svg className={className} viewBox="0 0 100 10" fill="none" aria-hidden="true">
        <path d="M0 5 L35 5 M65 5 L100 5" stroke="currentColor" strokeWidth="1"/>
        <path d="M40 5 L45 0 L50 5 L55 0 L60 5" stroke="currentColor" strokeWidth="1"/>
      </svg>
    );
  }
  
  return null;
}

// Mountain silhouette
export function MountainSilhouette({ className = '' }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 400 120" 
      fill="none" 
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path 
        d="M0 120 L40 80 L60 90 L100 40 L130 70 L160 50 L200 20 L240 60 L280 30 L310 55 L340 45 L380 70 L400 50 L400 120 Z" 
        fill="currentColor"
      />
    </svg>
  );
}

// Stat display
export function Stat({ 
  value, 
  unit, 
  label 
}: { 
  value: string; 
  unit?: string; 
  label: string;
}) {
  return (
    <div className="text-center group">
      <div className="mb-2">
        <span className="text-5xl md:text-6xl font-extralight text-navy tracking-tight">{value}</span>
        {unit && <span className="text-2xl text-gold ml-1">{unit}</span>}
      </div>
      <p className="text-sm text-navy/50 tracking-wider uppercase">{label}</p>
    </div>
  );
}

// Section label
export function SectionLabel({ 
  children, 
  light = false 
}: { 
  children: React.ReactNode; 
  light?: boolean;
}) {
  return (
    <p className={`text-xs tracking-[0.35em] uppercase ${light ? 'text-gold' : 'text-navy/40'}`}>
      {children}
    </p>
  );
}
