-- ===================================
-- Migración: Tablas para servidores de usuarios (CORREGIDA)
-- ===================================

-- Crear tabla de categorías de servidores
CREATE TABLE IF NOT EXISTS game_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agregar columna icon si no existe
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'game_categories' AND column_name = 'icon'
  ) THEN
    ALTER TABLE game_categories ADD COLUMN icon VARCHAR(255);
  END IF;
END $$;

-- Crear tabla de servidores de usuarios
CREATE TABLE IF NOT EXISTS user_servers (
  id VARCHAR(6) PRIMARY KEY, -- ID único de 6 dígitos
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES game_categories(id) ON DELETE SET NULL,
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

-- Insertar categorías predeterminadas con slugs correctos
INSERT INTO game_categories (name, slug, description, icon) VALUES
('Lineage II', 'lineage-ii', 'Servidores de Lineage II', '⚔️'),
('Counter-Strike', 'counter-strike', 'Servidores de Counter-Strike', '🔫'),
('World of Warcraft', 'wow', 'Servidores de World of Warcraft', '🛡️'),
('Perfect World', 'perfect-world', 'Servidores de Perfect World', '🏔️'),
('Aion', 'aion', 'Servidores de Aion', '👼'),
('MU Online', 'mu-online', 'Servidores de MU Online', '🗡️')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon;

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_user_servers_user_id ON user_servers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_servers_status ON user_servers(status);
CREATE INDEX IF NOT EXISTS idx_user_servers_approved ON user_servers(approved);
CREATE INDEX IF NOT EXISTS idx_user_servers_category_id ON user_servers(category_id);
CREATE INDEX IF NOT EXISTS idx_user_servers_created_at ON user_servers(created_at);
CREATE INDEX IF NOT EXISTS idx_game_categories_slug ON game_categories(slug);

-- Habilitar RLS (Row Level Security)
ALTER TABLE user_servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_categories ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen (para evitar duplicados)
DROP POLICY IF EXISTS "Los usuarios pueden ver sus propios servidores" ON user_servers;
DROP POLICY IF EXISTS "Los usuarios pueden crear servidores" ON user_servers;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar sus propios servidores" ON user_servers;
DROP POLICY IF EXISTS "Los usuarios pueden eliminar sus propios servidores" ON user_servers;
DROP POLICY IF EXISTS "Servicio puede leer todos los servidores" ON user_servers;
DROP POLICY IF EXISTS "Servicio puede actualizar todos los servidores" ON user_servers;
DROP POLICY IF EXISTS "Todos pueden leer categorías" ON game_categories;

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

-- Políticas de seguridad para game_categories (solo lectura pública)
CREATE POLICY "Todos pueden leer categorías" ON game_categories
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
DROP TRIGGER IF EXISTS update_game_categories_updated_at ON game_categories;

-- Crear triggers
CREATE TRIGGER update_user_servers_updated_at
  BEFORE UPDATE ON user_servers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_categories_updated_at
  BEFORE UPDATE ON game_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===================================
-- SISTEMA REAL DE VOTACIÓN
-- ===================================

-- Tabla para almacenar votos reales
CREATE TABLE IF NOT EXISTS server_votes (
  id BIGSERIAL PRIMARY KEY,
  server_id VARCHAR(50) NOT NULL, -- Puede ser ID numérico o string
  server_type VARCHAR(20) DEFAULT 'user_server' CHECK (server_type IN ('user_server', 'hardcoded', 'supabase')),
  voter_ip INET NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Opcional si el usuario está logueado
  user_agent TEXT,
  country VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para estadísticas mensuales de votos
CREATE TABLE IF NOT EXISTS server_vote_stats (
  id BIGSERIAL PRIMARY KEY,
  server_id VARCHAR(50) NOT NULL,
  server_type VARCHAR(20) DEFAULT 'user_server',
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  total_votes INTEGER DEFAULT 0,
  unique_ips INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(server_id, server_type, month, year)
);

-- Crear índices para optimización
CREATE INDEX IF NOT EXISTS idx_server_votes_server_id ON server_votes(server_id);
CREATE INDEX IF NOT EXISTS idx_server_votes_ip ON server_votes(voter_ip);
CREATE INDEX IF NOT EXISTS idx_server_votes_created_at ON server_votes(created_at);
CREATE INDEX IF NOT EXISTS idx_server_vote_stats_server ON server_vote_stats(server_id, server_type);
CREATE INDEX IF NOT EXISTS idx_server_vote_stats_month_year ON server_vote_stats(month, year);

-- Habilitar RLS
ALTER TABLE server_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_vote_stats ENABLE ROW LEVEL SECURITY;

-- Políticas para server_votes
DROP POLICY IF EXISTS "Cualquiera puede leer votos" ON server_votes;
DROP POLICY IF EXISTS "Sistema puede insertar votos" ON server_votes;

CREATE POLICY "Cualquiera puede leer votos" ON server_votes FOR SELECT USING (true);
CREATE POLICY "Sistema puede insertar votos" ON server_votes FOR INSERT WITH CHECK (true);

-- Políticas para server_vote_stats  
DROP POLICY IF EXISTS "Cualquiera puede leer estadísticas" ON server_vote_stats;
DROP POLICY IF EXISTS "Sistema puede gestionar estadísticas" ON server_vote_stats;

CREATE POLICY "Cualquiera puede leer estadísticas" ON server_vote_stats FOR SELECT USING (true);
CREATE POLICY "Sistema puede gestionar estadísticas" ON server_vote_stats 
  FOR ALL USING (true) WITH CHECK (true);

-- Función para verificar si una IP puede votar
CREATE OR REPLACE FUNCTION can_vote_for_server(
  p_server_id VARCHAR(50),
  p_voter_ip INET
) RETURNS BOOLEAN AS $$
DECLARE
  last_vote_time TIMESTAMPTZ;
BEGIN
  -- Buscar el último voto de esta IP para este servidor
  SELECT created_at INTO last_vote_time
  FROM server_votes
  WHERE server_id = p_server_id 
    AND voter_ip = p_voter_ip
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Si no hay votos previos, puede votar
  IF last_vote_time IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Verificar si han pasado 12 horas
  IF NOW() - last_vote_time >= INTERVAL '12 hours' THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener tiempo restante hasta poder votar
CREATE OR REPLACE FUNCTION time_until_next_vote(
  p_server_id VARCHAR(50),
  p_voter_ip INET
) RETURNS INTERVAL AS $$
DECLARE
  last_vote_time TIMESTAMPTZ;
  time_left INTERVAL;
BEGIN
  -- Buscar el último voto
  SELECT created_at INTO last_vote_time
  FROM server_votes
  WHERE server_id = p_server_id 
    AND voter_ip = p_voter_ip
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Si no hay votos previos, puede votar inmediatamente
  IF last_vote_time IS NULL THEN
    RETURN INTERVAL '0';
  END IF;
  
  -- Calcular tiempo restante
  time_left := (last_vote_time + INTERVAL '12 hours') - NOW();
  
  -- Si ya puede votar, retornar 0
  IF time_left <= INTERVAL '0' THEN
    RETURN INTERVAL '0';
  ELSE
    RETURN time_left;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Función para registrar un voto
CREATE OR REPLACE FUNCTION register_vote(
  p_server_id VARCHAR(50),
  p_server_type VARCHAR(20),
  p_voter_ip INET,
  p_user_id UUID DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_country VARCHAR(10) DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  can_vote BOOLEAN;
  time_left INTERVAL;
  current_month INTEGER;
  current_year INTEGER;
  total_votes INTEGER;
  result JSON;
BEGIN
  -- Verificar si puede votar
  SELECT can_vote_for_server(p_server_id, p_voter_ip) INTO can_vote;
  
  IF NOT can_vote THEN
    -- Obtener tiempo restante
    SELECT time_until_next_vote(p_server_id, p_voter_ip) INTO time_left;
    
    result := json_build_object(
      'success', false,
      'error', 'Ya has votado recientemente',
      'message', 'Solo puedes votar una vez cada 12 horas',
      'timeLeft', json_build_object(
        'hours', EXTRACT(HOUR FROM time_left)::INTEGER,
        'minutes', EXTRACT(MINUTE FROM time_left)::INTEGER
      )
    );
    RETURN result;
  END IF;
  
  -- Registrar el voto
  INSERT INTO server_votes (
    server_id, server_type, voter_ip, user_id, user_agent, country
  ) VALUES (
    p_server_id, p_server_type, p_voter_ip, p_user_id, p_user_agent, p_country
  );
  
  -- Actualizar estadísticas mensuales
  current_month := EXTRACT(MONTH FROM NOW())::INTEGER;
  current_year := EXTRACT(YEAR FROM NOW())::INTEGER;
  
  INSERT INTO server_vote_stats (server_id, server_type, month, year, total_votes, unique_ips)
  VALUES (p_server_id, p_server_type, current_month, current_year, 1, 1)
  ON CONFLICT (server_id, server_type, month, year)
  DO UPDATE SET
    total_votes = server_vote_stats.total_votes + 1,
    unique_ips = (
      SELECT COUNT(DISTINCT voter_ip)
      FROM server_votes sv
      WHERE sv.server_id = p_server_id
        AND sv.server_type = p_server_type
        AND EXTRACT(MONTH FROM sv.created_at) = current_month
        AND EXTRACT(YEAR FROM sv.created_at) = current_year
    ),
    updated_at = NOW();
  
  -- Obtener total de votos del mes
  SELECT total_votes INTO total_votes
  FROM server_vote_stats
  WHERE server_id = p_server_id 
    AND server_type = p_server_type
    AND month = current_month 
    AND year = current_year;
  
  result := json_build_object(
    'success', true,
    'message', '¡Voto registrado exitosamente! Gracias por tu apoyo.',
    'totalVotes', COALESCE(total_votes, 1)
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener conteo de votos de un servidor
CREATE OR REPLACE FUNCTION get_server_vote_count(
  p_server_id VARCHAR(50),
  p_server_type VARCHAR(20) DEFAULT 'user_server'
) RETURNS INTEGER AS $$
DECLARE
  current_month INTEGER;
  current_year INTEGER;
  vote_count INTEGER;
BEGIN
  current_month := EXTRACT(MONTH FROM NOW())::INTEGER;
  current_year := EXTRACT(YEAR FROM NOW())::INTEGER;
  
  SELECT total_votes INTO vote_count
  FROM server_vote_stats
  WHERE server_id = p_server_id 
    AND server_type = p_server_type
    AND month = current_month 
    AND year = current_year;
  
  RETURN COALESCE(vote_count, 0);
END;
$$ LANGUAGE plpgsql; 