'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';

interface BotIdClientProps {
  protect?: string[];
  onVerified?: () => void;
  onError?: () => void;
  className?: string;
}

declare global {
  interface Window {
    BotIdClient: any;
  }
}

export default function BotIdClient({ 
  protect = ["/api/signup"], 
  onVerified, 
  onError,
  className = ""
}: BotIdClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);

  const initializeBotId = () => {
    if (typeof window !== 'undefined' && window.BotIdClient && containerRef.current) {
      try {
        // Limpiar widget anterior si existe
        if (widgetRef.current) {
          widgetRef.current.destroy?.();
        }

        // Crear nuevo widget
        widgetRef.current = new window.BotIdClient({
          containerId: containerRef.current.id,
          protectedRoutes: protect,
          onVerified: () => {
            console.log('BotId verificado exitosamente');
            onVerified?.();
          },
          onError: (error: any) => {
            console.error('Error en BotId:', error);
            onError?.();
          },
          theme: 'dark', // Tema oscuro para que coincida con el diseño
          size: 'normal'
        });
      } catch (error) {
        console.error('Error inicializando BotId:', error);
        onError?.();
      }
    }
  };

  useEffect(() => {
    // Intentar inicializar inmediatamente si el script ya está cargado
    if (window.BotIdClient) {
      initializeBotId();
    }

    return () => {
      // Limpiar al desmontar
      if (widgetRef.current) {
        widgetRef.current.destroy?.();
      }
    };
  }, []);

  return (
    <>
      <Script 
        src="https://botid.org/botid.js" 
        strategy="lazyOnload"
        onLoad={initializeBotId}
        onError={() => {
          console.error('Error cargando BotId script');
          onError?.();
        }}
      />
      
      <div className={`botid-container ${className}`}>
        <div 
          ref={containerRef}
          id={`botid-widget-${Math.random().toString(36).substr(2, 9)}`}
          className="min-h-[60px] flex items-center justify-center bg-slate-800 border border-slate-600 rounded-lg p-4"
        >
          <div className="text-slate-400 text-sm animate-pulse">
            Cargando verificación de seguridad...
          </div>
        </div>
      </div>
    </>
  );
} 