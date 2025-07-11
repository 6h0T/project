-- Actualizar la tabla de banners para soportar las nuevas posiciones específicas
ALTER TABLE banners 
ALTER COLUMN position TYPE text;

-- Actualizar el check constraint para incluir las nuevas posiciones
ALTER TABLE banners 
DROP CONSTRAINT IF EXISTS banners_position_check;

ALTER TABLE banners 
ADD CONSTRAINT banners_position_check 
CHECK (position IN (
  'top-1', 'top-2', 
  'sidebar-1', 'sidebar-2', 'sidebar-3', 'sidebar-4', 'sidebar-5',
  'content-1', 'content-2', 
  'right-skyscraper'
));

-- Agregar índices para mejorar el rendimiento de consultas
CREATE INDEX IF NOT EXISTS idx_banners_position ON banners(position);
CREATE INDEX IF NOT EXISTS idx_banners_status_position ON banners(status, position);

-- Comentarios para documentar la estructura
COMMENT ON COLUMN banners.position IS 'Posición específica del banner en el sitio: top-1, top-2, sidebar-1 a sidebar-5, content-1, content-2, right-skyscraper'; 