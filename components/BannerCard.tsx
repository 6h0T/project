'use client';

interface BannerCardProps {
  title: string;
  subtitle: string;
  size: 'large' | 'medium';
  className?: string;
}

export default function BannerCard({ title, subtitle, size, className = '' }: BannerCardProps) {
  const sizeClasses = {
    large: 'w-full h-72', // Para el banner lateral (460x280 equivalente)
    medium: 'w-full h-16'  // Para los banners superiores (356x78 equivalente)
  };

  const contentClasses = {
    large: 'p-4',
    medium: 'p-2'
  };

  const titleClasses = {
    large: 'text-sm font-medium mb-1',
    medium: 'text-xs font-medium mb-0.5'
  };

  const subtitleClasses = {
    large: 'text-xs',
    medium: 'text-xs'
  };

  const iconClasses = {
    large: 'w-12 h-12 mb-3',
    medium: 'w-6 h-6 mb-1'
  };

  return (
    <div className={`relative overflow-hidden ${sizeClasses[size]} ${className}`}>
      {/* Glassmorphism Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-700/85 backdrop-blur-xl border border-white/10 rounded-lg"></div>
      
      {/* Subtle animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 animate-gradient rounded-lg"></div>
      
      {/* Glass reflection effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-transparent rounded-lg"></div>
      
      {/* Content */}
      <div className={`relative ${sizeClasses[size]} flex items-center justify-center ${contentClasses[size]}`}>
        <div className="text-center">
          <div className={`bg-slate-700/50 rounded-lg flex items-center justify-center mx-auto backdrop-blur-sm border border-white/20 ${iconClasses[size]}`}>
            <span className={`text-slate-400 ${size === 'large' ? 'text-lg' : 'text-sm'}`}>📢</span>
          </div>
          <h3 className={`text-slate-300 ${titleClasses[size]}`}>{title}</h3>
          <p className={`text-slate-500 ${subtitleClasses[size]}`}>{subtitle}</p>
        </div>
      </div>
    </div>
  );
}