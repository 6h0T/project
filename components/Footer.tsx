'use client';

import Link from 'next/link';
import { Heart, Shield, Users, Zap, Code } from 'lucide-react';
import ClientIPDisplay from './ClientIPDisplay';

export default function Footer() {
  return (
    <footer className="bg-slate-900/95 border-t border-slate-700/50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Logo y descripción */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="h-8 w-auto"
              />
              <span className="text-xl font-bold text-white">Gaming Servers Hub</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Descubre los mejores servidores privados de MMORPG. Conecta con miles de jugadores 
              en Lineage II, Aion Online, MU Online, Perfect World, Counter Strike y World of Warcraft.
            </p>
            <div className="flex items-center space-x-4">
              <ClientIPDisplay />
            </div>
          </div>

          {/* Enlaces rápidos */}
          <div>
            <h3 className="text-white font-semibold mb-4">Enlaces Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/servers" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">
                  Lista de Servidores
                </Link>
              </li>
              <li>
                <Link href="/create-server" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">
                  Agregar Servidor
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">
                  Acerca de
                </Link>
              </li>
            </ul>
          </div>

          {/* Juegos */}
          <div>
            <h3 className="text-white font-semibold mb-4">Juegos</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">
                  Lineage II
                </Link>
              </li>
              <li>
                <Link href="/aion" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">
                  Aion Online
                </Link>
              </li>
              <li>
                <Link href="/mu-online" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">
                  MU Online
                </Link>
              </li>
              <li>
                <Link href="/perfect-world" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">
                  Perfect World
                </Link>
              </li>
              <li>
                <Link href="/counter-strike" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">
                  Counter Strike
                </Link>
              </li>
              <li>
                <Link href="/wow" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">
                  World of Warcraft
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Separador */}
        <div className="border-t border-slate-700/50 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            
            {/* Copyright */}
            <div className="text-slate-400 text-sm">
              © 2024 Gaming Servers Hub. Todos los derechos reservados.
            </div>

            {/* Estadísticas */}
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2 text-slate-400">
                <Users className="h-4 w-4 text-cyan-400" />
                <span>15,432 jugadores activos</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-400">
                <Shield className="h-4 w-4 text-green-400" />
                <span>450+ servidores</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-400">
                <Zap className="h-4 w-4 text-yellow-400" />
                <span>99.8% uptime</span>
              </div>
            </div>

            {/* Desarrollado por */}
            <div className="flex items-center space-x-2 text-slate-400 text-sm">
              <Code className="h-4 w-4 text-cyan-400" />
              <span>Desarrollado por</span>
              <a 
                href="https://gh0tstudio.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
              >
                gh0tstudio.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}