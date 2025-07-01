import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, Search, AlertTriangle } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center py-8">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              Servidor no encontrado
            </CardTitle>
            <CardDescription className="text-slate-300">
              El servidor que buscas no existe o ha sido eliminado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-slate-400 text-sm">
              <p>Posibles causas:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>El ID del servidor es incorrecto</li>
                <li>El servidor fue eliminado</li>
                <li>El servidor está en revisión</li>
              </ul>
            </div>
            
            <div className="flex flex-col space-y-3">
              <Button asChild className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
                <Link href="/servers">
                  <Search className="mr-2 h-4 w-4" />
                  Ver todos los servidores
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Ir al inicio
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}