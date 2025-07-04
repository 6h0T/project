'use client';

import Link from 'next/link';
import { Star, TrendingUp, Clock, Shield, Vote, Crown, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CountryFlag from './CountryFlag';

interface ServerProps {
  id: number;
  name: string;
  description: string;
  country: string;
  chronicle: string;
  serverType: string;
  platform: string;
  players: number;
  votes: number;
  uptime: string;
  exp: string;
  features: string[];
  rank: number | string;
  isPremium?: boolean;
}

export default function ServerCard({ server }: { server: ServerProps }) {
  const getChronicleColor = (chronicle: string) => {
    const colors: { [key: string]: string } = {
      'Interlude': 'bg-blue-500',
      'High Five': 'bg-purple-500',
      'Classic': 'bg-green-500',
      'Gracia': 'bg-orange-500',
      'Freya': 'bg-pink-500',
      'Season 6': 'bg-red-500',
      'Season 4': 'bg-indigo-500',
      'Season 2': 'bg-yellow-500',
      'TBC': 'bg-emerald-500',
      'WotLK': 'bg-cyan-500',
      'Vanilla': 'bg-amber-500',
      'Rising Tide': 'bg-violet-500',
      'Genesis': 'bg-rose-500',
      'CS 1.6': 'bg-slate-500',
      'CS Source': 'bg-zinc-500',
      'CS:GO': 'bg-neutral-500',
    };
    return colors[chronicle] || 'bg-gray-500';
  };

  // URLs de ejemplo para servidores premium
  const getPremiumServerUrl = (serverId: number) => {
    const urls: { [key: number]: string } = {
      101: 'https://l2premium-elite.com',
      102: 'https://legends-premium.com', 
      103: 'https://royal-premium.com'
    };
    return urls[serverId] || '#';
  };

  // Determinar el estilo de la card según si es premium o no - MÁS COMPACTO
  const cardStyle = server.isPremium 
    ? "bg-gradient-to-br from-yellow-900/30 via-slate-800/50 to-orange-900/30 backdrop-blur-md border-2 border-yellow-500/50 rounded-lg p-4 hover:bg-gradient-to-br hover:from-yellow-900/40 hover:via-slate-800/60 hover:to-orange-900/40 transition-all duration-300 hover:transform hover:scale-[1.01] hover:shadow-xl hover:shadow-yellow-500/20 cursor-pointer"
    : "bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-lg p-4 hover:bg-slate-800/70 transition-all duration-300 hover:transform hover:scale-[1.01] hover:shadow-lg hover:shadow-cyan-500/10 cursor-pointer";

  return (
    <Link href={`/vote/${server.id}`} className="block">
      <div className={cardStyle}>
        
        {/* Efecto de brillo para servidores premium */}
        {server.isPremium && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent animate-pulse"></div>
        )}
        
        {/* Contenedor principal con dos columnas - MÁS COMPACTO */}
        <div className="grid grid-cols-12 gap-4 h-full relative z-10">
          
          {/* Columna izquierda - Información del servidor (8 columnas) */}
          <div className="col-span-8 flex flex-col">
            
            {/* Header con ranking y nombre - COMPACTO */}
            <div className="flex items-center space-x-2 mb-3">
              {server.isPremium ? (
                <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-yellow-500/30">
                  <Crown className="h-4 w-4" />
                </div>
              ) : (
                <div className="w-6 h-6 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-md flex items-center justify-center text-white font-bold text-xs">
                  {server.rank}
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                {/* Nombre del servidor con versión y experiencia en la misma línea - COMPACTO */}
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className={`text-base font-bold truncate ${server.isPremium ? 'text-yellow-100' : 'text-white'}`}>
                    {server.name}
                  </h3>
                  
                  {/* Versión/Crónica - COMPACTO */}
                  <span className={`px-1.5 py-0.5 rounded text-xs text-white font-medium ${getChronicleColor(server.chronicle)} flex-shrink-0`}>
                    {server.chronicle}
                  </span>
                  
                  {/* Experiencia con efecto glow dorado - COMPACTO */}
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <Star className={`h-3 w-3 ${server.isPremium ? 'text-yellow-300' : 'text-yellow-400'}`} />
                    <span 
                      className={`font-semibold text-xs ${server.isPremium ? 'text-yellow-300' : 'text-yellow-400'}`}
                      style={{
                        textShadow: `
                          0 0 5px rgba(255, 215, 0, 0.8),
                          0 0 10px rgba(255, 215, 0, 0.6)
                        `
                      }}
                    >
                      {server.exp}
                    </span>
                  </div>
                </div>
                
                {/* Bandera del país junto con características secundarias - COMPACTO */}
                <div className="flex items-center space-x-2 mb-1">
                  <CountryFlag country={server.country} size="sm" />
                  <span className={`text-xs ${server.isPremium ? 'text-yellow-200' : 'text-slate-400'}`}>
                    {server.country}
                  </span>
                  
                  {/* Características secundarias - LIMITADAS */}
                  {server.features.slice(0, 2).map((feature, index) => (
                    <span
                      key={index}
                      className={`px-1.5 py-0.5 text-xs rounded border ${
                        server.isPremium 
                          ? 'bg-yellow-900/30 text-yellow-200 border-yellow-600/50' 
                          : 'bg-slate-700/50 text-slate-300 border-slate-600'
                      }`}
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                {/* Uptime - COMPACTO */}
                <div className={`flex items-center space-x-1 text-xs ${server.isPremium ? 'text-yellow-200' : 'text-slate-400'}`}>
                  <Clock className="h-3 w-3" />
                  <span>{server.uptime} uptime</span>
                </div>
              </div>
            </div>

            {/* Descripción del servidor - COMPACTA */}
            <div className="flex-1 mb-2">
              <p className={`text-xs leading-relaxed line-clamp-2 ${server.isPremium ? 'text-yellow-100' : 'text-slate-300'}`}>
                {server.description}
              </p>
            </div>

            {/* Footer con información técnica - COMPACTO */}
            <div className={`flex items-center justify-between pt-2 border-t ${server.isPremium ? 'border-yellow-700/50' : 'border-slate-700'}`}>
              <div className="flex items-center space-x-3">
                <span className={`text-xs ${server.isPremium ? 'text-yellow-200' : 'text-slate-400'}`}>
                  {server.serverType}
                </span>
                <span className={`text-xs ${server.isPremium ? 'text-yellow-200' : 'text-slate-400'}`}>
                  {server.platform}
                </span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Shield className={`h-3 w-3 ${server.isPremium ? 'text-yellow-400' : 'text-green-400'}`} />
                <span className={`text-xs ${server.isPremium ? 'text-yellow-400' : 'text-green-400'}`}>
                  Online
                </span>
              </div>
            </div>
          </div>

          {/* Columna derecha - Sistema de votación/enlace (4 columnas) - COMPACTA */}
          <div className="col-span-4 flex flex-col justify-center items-center space-y-2">
            {/* Contador de votos - COMPACTO */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <TrendingUp className={`h-4 w-4 ${server.isPremium ? 'text-yellow-400' : 'text-cyan-400'}`} />
                <span className={`text-xs ${server.isPremium ? 'text-yellow-200' : 'text-slate-400'}`}>
                  votos
                </span>
              </div>
              <div className={`text-xl font-bold mb-1 ${server.isPremium ? 'text-yellow-400' : 'text-cyan-400'}`}>
                {server.votes}
              </div>
              <div className={`text-xs ${server.isPremium ? 'text-yellow-300' : 'text-slate-500'}`}>
                este mes
              </div>
            </div>

            {/* Acción principal - Votar (se activa al hacer click en la tarjeta) */}
            <div className="text-center">
              <div className={`flex items-center justify-center space-x-1 mb-1 ${server.isPremium ? 'text-yellow-300' : 'text-cyan-400'}`}>
                <Vote className="h-4 w-4" />
                <span className="text-xs font-medium">
                  Clic para votar
                </span>
              </div>
            </div>

            {/* Botón secundario para servidores premium - Enlace directo */}
            {server.isPremium && (
              <Button 
                asChild
                size="sm"
                className="w-full font-bold py-2 shadow-lg transition-all duration-300 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white hover:shadow-yellow-500/30 text-xs"
                onClick={(e) => e.stopPropagation()} // Evitar que se active el link de la tarjeta
              >
                <a 
                  href={getPremiumServerUrl(server.id)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-1 h-3 w-3" />
                  🌐 JUGAR
                </a>
              </Button>
            )}

            {/* Información adicional - COMPACTA */}
            <div className={`text-xs text-center ${server.isPremium ? 'text-yellow-300' : 'text-slate-500'}`}>
              {server.isPremium ? (
                <p>Web disponible</p>
              ) : (
                <p>Ir a votar</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}