'use client';

import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';

export default function ClientIPDisplay() {
  const [clientIP, setClientIP] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClientIP = async () => {
      try {
        // Try multiple IP services for reliability
        const services = [
          'https://api.ipify.org?format=json',
          'https://ipapi.co/json/',
          'https://httpbin.org/ip'
        ];

        for (const service of services) {
          try {
            const response = await fetch(service);
            const data = await response.json();
            
            // Different services return IP in different formats
            const ip = data.ip || data.origin || data.query;
            if (ip) {
              setClientIP(ip);
              break;
            }
          } catch (error) {
            continue; // Try next service
          }
        }
      } catch (error) {
        console.error('Error fetching IP:', error);
        setClientIP('No disponible');
      } finally {
        setLoading(false);
      }
    };

    fetchClientIP();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-slate-400">
        <Globe className="h-4 w-4" />
        <span className="text-sm">Detectando IP...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 text-slate-400">
      <Globe className="h-4 w-4" />
      <span className="text-sm">Tu IP: {clientIP}</span>
    </div>
  );
}