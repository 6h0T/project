import { NextRequest, NextResponse } from 'next/server';

// Función para verificar BotId (simulación del código que proporcionaste)
async function checkBotId(): Promise<{ isBot: boolean }> {
  try {
    // Aquí implementarías la lógica real de BotId
    // Por ahora simulo la verificación
    
    // En una implementación real, verificarías tokens o headers
    // que BotId proporciona para validar que no es un bot
    
    const isBot = Math.random() < 0.1; // 10% de probabilidad de ser bot (para testing)
    
    return { isBot };
  } catch (error) {
    console.error('Error verificando BotId:', error);
    return { isBot: true }; // En caso de error, asumir que es bot por seguridad
  }
}

export async function POST(req: NextRequest) {
  try {
    const { isBot } = await checkBotId();
    
    if (isBot) {
      return NextResponse.json({ message: "🤖", isBot: true }, { status: 403 });
    }
    
    return NextResponse.json({ message: "😌", isBot: false }, { status: 200 });
  } catch (error) {
    console.error('Error en verify-captcha:', error);
    return NextResponse.json(
      { message: "Error interno del servidor", isBot: true }, 
      { status: 500 }
    );
  }
} 