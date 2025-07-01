import { NextResponse } from 'next/server'
import { getCategories } from '@/lib/database'

export async function GET() {
  try {
    const { data: categories, error } = await getCategories()
    
    if (error) {
      throw error
    }

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}