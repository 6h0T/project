'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ExternalLink, Users, Crown, Star, TrendingUp, Globe, Clock } from 'lucide-react';
import CountryFlag from './CountryFlag';

interface Server {
  id: number | string;
  title: string;
  slug: string;
  description: string | null;
  website: string | null;
  country: string | null;
  version: string | null;
  experience: number | null;
  premium: boolean;
  approved: boolean;
  votes?: number;
  category?: {
    id: number;
    name: string;
    slug: string;
  };
  _count?: {
    votes: number;
  };
}

interface ServerCardProps {
  server: Server;
  index?: number;
  rank?: number;
}

export default function ServerCard({ server, index = 0, rank }: ServerCardProps) {
  const rankPosition = rank || index + 1;
  
  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-md hover:bg-slate-800/70 transition-all duration-300">
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          
          {/* Número de ranking circular */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {rankPosition}
            </div>
          </div>
          
          {/* Información principal del servidor */}
          <div className="flex-1 min-w-0">
            
            {/* Título y badges */}
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-xl font-bold text-white truncate">{server.title}</h3>
              {server.version && (
                <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30 text-xs">
                  {server.version}
                </Badge>
              )}
              {server.experience && (
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                  Exp x{server.experience}
                </Badge>
              )}
            </div>
            
            {/* País y tipo */}
            <div className="flex items-center space-x-3 mb-2">
              <div className="flex items-center space-x-1">
                <CountryFlag country={server.country || 'International'} size="sm" />
                <span className="text-slate-300 text-sm">{server.country}</span>
              </div>
              <span className="text-slate-400 text-sm">Normal</span>
            </div>
            
            {/* Uptime */}
            <div className="flex items-center space-x-1 mb-3">
              <Clock className="h-4 w-4 text-slate-400" />
              <span className="text-slate-300 text-sm">99.5% uptime</span>
            </div>
            
            {/* Descripción */}
            <p className="text-slate-300 text-sm line-clamp-2 mb-3">
              {server.description || 'Sin descripción disponible'}
            </p>
            
            {/* Información adicional */}
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <span className="text-slate-400">PvP</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-slate-400">{server.category?.name || 'L2J'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-400 text-sm">Online</span>
              </div>
            </div>
          </div>
          
          {/* Panel lateral derecho - Votación */}
          <div className="flex-shrink-0 text-center border-l border-slate-600 pl-4">
            <div className="flex items-center text-cyan-400 mb-1">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span className="text-sm">votos</span>
            </div>
            <div className="text-2xl font-bold text-cyan-400 mb-2">
              {server.votes || server._count?.votes || 0}
            </div>
            <div className="text-xs text-slate-400 mb-3">este mes</div>
            
            <Button asChild size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 w-full mb-2">
              <Link href={`/vote/${server.id}`}>
                Clic para votar
              </Link>
            </Button>
            
            <div className="text-xs text-slate-400">Ir a votar</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}