'use client';

import { getCountryCode } from '@/lib/countries';

interface CountryFlagProps {
  country: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function CountryFlag({ country, size = 'md', className = '' }: CountryFlagProps) {
  const countryCode = getCountryCode(country);
  
  const sizeClasses = {
    sm: 'w-4 h-3',
    md: 'w-6 h-4',
    lg: 'w-8 h-6'
  };

  return (
    <span 
      className={`fi fi-${countryCode} inline-block rounded-sm ${sizeClasses[size]} ${className}`}
      title={country}
    />
  );
}