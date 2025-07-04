-- ===================================
-- Migración: Tablas para servidores de usuarios (CORREGIDA)
-- ===================================

-- Crear tabla de categorías de servidores
CREATE TABLE IF NOT EXISTS server_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla de servidores de usuarios
CREATE TABLE IF NOT EXISTS user_servers (
  id VARCHAR(6) PRIMARY KEY, -- ID único de 6 dígitos
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES server_categories(id) ON DELETE SET NULL,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(250) UNIQUE NOT NULL,
  description TEXT,
  website VARCHAR(500),
  country VARCHAR(100),
  language VARCHAR(10) DEFAULT 'es',
  version VARCHAR(100),
  experience INTEGER DEFAULT 1,
  max_level INTEGER DEFAULT 80,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('online', 'offline', 'maintenance', 'pending', 'rejected')),
  premium BOOLEAN DEFAULT FALSE,
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar categorías predeterminadas
INSERT INTO server_categories (name, slug, description, icon) VALUES
('Lineage 2', 'lineage-2', 'Servidores de Lineage 2', '⚔️'),
('Counter-Strike', 'counter-strike', 'Servidores de Counter-Strike', '🔫'),
('World of Warcraft', 'wow', 'Servidores de World of Warcraft', '🛡️'),
('Perfect World', 'perfect-world', 'Servidores de Perfect World', '🏔️'),
('Aion', 'aion', 'Servidores de Aion', '👼'),
('MU Online', 'mu-online', 'Servidores de MU Online', '🗡️')
ON CONFLICT (slug) DO NOTHING;

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_user_servers_user_id ON user_servers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_servers_status ON user_servers(status);
CREATE INDEX IF NOT EXISTS idx_user_servers_approved ON user_servers(approved);
CREATE INDEX IF NOT EXISTS idx_user_servers_category_id ON user_servers(category_id);
CREATE INDEX IF NOT EXISTS idx_user_servers_created_at ON user_servers(created_at);

-- Habilitar RLS (Row Level Security)
ALTER TABLE user_servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_categories ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen (para evitar duplicados)
DROP POLICY IF EXISTS "Los usuarios pueden ver sus propios servidores" ON user_servers;
DROP POLICY IF EXISTS "Los usuarios pueden crear servidores" ON user_servers;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar sus propios servidores" ON user_servers;
DROP POLICY IF EXISTS "Los usuarios pueden eliminar sus propios servidores" ON user_servers;
DROP POLICY IF EXISTS "Servicio puede leer todos los servidores" ON user_servers;
DROP POLICY IF EXISTS "Servicio puede actualizar todos los servidores" ON user_servers;
DROP POLICY IF EXISTS "Todos pueden leer categorías" ON server_categories;

-- Crear políticas de seguridad para user_servers
CREATE POLICY "Los usuarios pueden ver sus propios servidores" ON user_servers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden crear servidores" ON user_servers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar sus propios servidores" ON user_servers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden eliminar sus propios servidores" ON user_servers
  FOR DELETE USING (auth.uid() = user_id);

-- Política especial para que el sistema pueda leer todos los servidores (para APIs)
CREATE POLICY "Servicio puede leer todos los servidores" ON user_servers
  FOR SELECT USING (true);

-- Política especial para que el sistema pueda actualizar todos los servidores (para APIs de admin)
CREATE POLICY "Servicio puede actualizar todos los servidores" ON user_servers
  FOR UPDATE USING (true);

-- Políticas de seguridad para server_categories (solo lectura pública)
CREATE POLICY "Todos pueden leer categorías" ON server_categories
  FOR SELECT USING (true);

-- Función para generar slug único de servidor
CREATE OR REPLACE FUNCTION generate_server_slug(server_title TEXT, user_id UUID)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 1;
BEGIN
  -- Generar slug base desde el título
  base_slug := lower(regexp_replace(server_title, '[^a-zA-Z0-9\s]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  -- Si está vacío, usar un valor por defecto
  IF base_slug = '' THEN
    base_slug := 'servidor';
  END IF;
  
  final_slug := base_slug;
  
  -- Verificar unicidad y agregar número si es necesario
  WHILE EXISTS (SELECT 1 FROM user_servers WHERE slug = final_slug) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar updated_at (eliminar primero si existe)
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar triggers existentes si existen
DROP TRIGGER IF EXISTS update_user_servers_updated_at ON user_servers;
DROP TRIGGER IF EXISTS update_server_categories_updated_at ON server_categories;

-- Crear triggers
CREATE TRIGGER update_user_servers_updated_at
  BEFORE UPDATE ON user_servers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_server_categories_updated_at
  BEFORE UPDATE ON server_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 