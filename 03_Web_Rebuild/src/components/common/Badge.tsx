import React from 'react';

interface BadgeProps {
  count?: number;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ count, className = "" }) => {
  return (
    <span 
      className={`absolute top-1 right-2 flex h-2.5 w-2.5 z-10 ${className}`}
    >
      <span className="animate-badge-breathe absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
      {count !== undefined && count > 0 && (
        <span className="hidden">{count}</span>
      )}
    </span>
  );
};
export default Badge;
