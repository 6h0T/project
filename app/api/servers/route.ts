import { NextRequest, NextResponse } from 'next/server'
import { getServers, getCategories } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Validar datos requeridos
    if (!data.title || !data.ip || !data.categoryId) {
      return NextResponse.json({ 
        error: 'Faltan campos requeridos: title, ip, categoryId' 
      }, { status: 400 })
    }

    // Generar slug único
    const baseSlug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    let slug = baseSlug
    let counter = 1
    
    // En una implementación real, verificarías la unicidad en la base de datos
    const { data: existingServers } = await getServers()
    while (existingServers.some(s => s.slug === slug)) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Simular creación de servidor
    const newServerId = Math.max(...existingServers.map(s => s.id)) + 1
    const newServer = {
      id: newServerId,
      title: data.title,
      slug,
      description: data.description || '',
      website: data.website || '',
      ip: data.ip,
      country: data.country || '',
      language: data.language || 'es',
      version: data.version || '',
      experience: data.experience ? parseInt(data.experience) : null,
      maxLevel: data.maxLevel ? parseInt(data.maxLevel) : null,
      status: 'review',
      premium: false,
      approved: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      categoryId: parseInt(data.categoryId),
      userId: 1, // Usuario de prueba
      category: { id: parseInt(data.categoryId), name: 'Lineage 2', slug: 'lineage-2' },
      user: { id: 1, nickname: 'Admin', email: 'admin@test.com' },
      _count: { votes: 0 }
    }

    // URL amigable con ID + slug
    const friendlyUrl = `/info/${newServer.id}_${slug}`

    return NextResponse.json({
      success: true,
      message: 'Servidor creado exitosamente',
      server: newServer,
      url: friendlyUrl,
      id: newServer.id
    }, { status: 201 })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { data: servers, error } = await getServers()
    
    if (error) {
      throw error
    }

    return NextResponse.json({ servers })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}