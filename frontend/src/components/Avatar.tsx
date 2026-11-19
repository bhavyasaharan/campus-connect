import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  className?: string;
  iconClassName?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
  title?: string;
  children?: React.ReactNode;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  name,
  className = 'w-10 h-10 rounded-full',
  iconClassName,
  style,
  onClick,
  title,
  children,
}) => {
  const [hasError, setHasError] = useState(false);

  // Reset error state if image src changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const cleanSrc = src && typeof src === 'string' && src.trim() !== '' ? src.trim() : null;
  const showImage = cleanSrc && !hasError;

  const getInitials = (str?: string) => {
    if (!str) return '';
    const clean = str.replace(/^@/, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(name || alt);

  return (
    <div
      onClick={onClick}
      title={title || name || alt}
      style={style}
      className={`relative inline-flex items-center justify-center overflow-hidden flex-shrink-0 select-none ${className}`}
    >
      {showImage ? (
        <img
          src={cleanSrc}
          alt={alt || name || 'User avatar'}
          className="w-full h-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-900 text-zinc-100 font-bold border border-zinc-700/60 shadow-inner">
          {initials ? (
            <span className={`tracking-wider ${iconClassName || 'text-[40%] leading-none'}`}>
              {initials}
            </span>
          ) : (
            <User className={`text-zinc-400 ${iconClassName || 'w-1/2 h-1/2'}`} />
          )}
        </div>
      )}
      {children}
    </div>
  );
};
