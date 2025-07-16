-- Script para agregar la nueva posición de banner
-- Ejecutar en Supabase SQL Editor

-- Eliminar constraint existente
ALTER TABLE banners DROP CONSTRAINT IF EXISTS banners_position_check;

-- Crear nuevo constraint con la posición adicional
ALTER TABLE banners ADD CONSTRAINT banners_position_check 
CHECK (position IN (
    -- Posiciones de Página Principal
    'home-top-1',
    'home-top-2', 
    'home-sidebar-right',
    'home-recent-servers',
    'home-sidebar-left-bottom',  -- NUEVA POSICIÓN
    -- Posiciones de Página de Votación
    'vote-left-skyscraper',
    'vote-right-skyscraper'
));

-- Verificar que el constraint se actualizó correctamente
SELECT 
    'SUCCESS: Nueva posición agregada correctamente' as status,
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'banners'::regclass 
    AND contype = 'c'
    AND conname = 'banners_position_check';

-- Mostrar todas las posiciones permitidas
SELECT 'Posiciones de banner permitidas:' as info;
SELECT unnest(ARRAY[
    'home-top-1',
    'home-top-2', 
    'home-sidebar-right',
    'home-recent-servers',
    'home-sidebar-left-bottom',
    'vote-left-skyscraper',
    'vote-right-skyscraper'
]) as posiciones_permitidas;