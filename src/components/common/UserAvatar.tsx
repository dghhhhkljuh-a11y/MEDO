import React from 'react';
import { User, ShieldCheck } from 'lucide-react';

interface UserAvatarProps {
  displayName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showStatusBadge?: boolean;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  displayName = 'Alex Rivers',
  size = 'md',
  className = '',
  showStatusBadge = false,
}) => {
  // Compute initials
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'P';

  const sizeMap = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
  };

  return (
    <div className={`relative shrink-0 select-none ${className}`}>
      <div
        className={`${sizeMap[size]} rounded-full bg-gradient-to-br from-cyan-500 via-indigo-600 to-purple-600 p-[1.5px] shadow-md ring-1 ring-white/10 flex items-center justify-center font-bold font-mono tracking-tight text-white`}
      >
        <div className="w-full h-full rounded-full bg-slate-900/90 dark:bg-slate-950/90 flex items-center justify-center text-cyan-200">
          {initials}
        </div>
      </div>

      {showStatusBadge && (
        <span
          className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center"
          title="Root Administrator Verified"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
        </span>
      )}
    </div>
  );
};
