-- ===================================
-- GameServers Hub - Tabla de Servidores (CORREGIDO)
-- Estructura completa basada en datos PHP importados
-- ===================================

-- Eliminar tabla existente si existe
DROP TABLE IF EXISTS servers CASCADE;

-- ===================================
-- Tabla: servers
-- ===================================
CREATE TABLE servers (
  -- Identificadores principales
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id integer UNIQUE, -- ID original del sistema PHP
  
  -- Información básica del servidor
  title text NOT NULL,
  description text DEFAULT '',
  website text DEFAULT '',
  ip_address text DEFAULT '',
  
  -- Configuración del servidor
  experience_rate integer DEFAULT 1,
  version text DEFAULT '', -- Versión/Crónica del juego
  season text DEFAULT '', -- Season del servidor
  server_type text DEFAULT '', -- Tipo de servidor (PVP, PVE, etc.)
  platform text DEFAULT '', -- Plataforma (L2J, etc.)
  emulator text DEFAULT '', -- Emulador utilizado
  max_level text DEFAULT '', -- Nivel máximo
  
  -- Localización y idioma
  country_id integer,
  language_id integer NOT NULL DEFAULT 1,
  timezone text DEFAULT '0',
  
  -- Estados del servidor
  status text DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'maintenance')),
  server_status integer DEFAULT 1, -- Estado numérico del servidor (1=offline, 2=online, 3=maintenance)
  is_premium boolean DEFAULT false,
  is_approved boolean DEFAULT false,
  
  -- Relaciones
  category_id integer NOT NULL,
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  legacy_user_id integer, -- ID original del usuario PHP para mapeo
  
  -- Fechas importantes
  launch_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Multimedia y promoción
  banner_image text DEFAULT '',
  youtube_url text DEFAULT '',
  
  -- Estadísticas y métricas
  votes integer DEFAULT 0,
  
  -- Sistema premium
  premium_days integer DEFAULT 0,
  premium_date timestamptz,
  
  -- Configuraciones adicionales
  email_notifications boolean DEFAULT false,
  
  -- Metadatos adicionales (campos que pueden ser útiles en el futuro)
  metadata jsonb DEFAULT '{}' -- Para almacenar datos adicionales flexibles
);

-- ===================================
-- Índices para optimización
-- ===================================

-- Índices para filtros comunes
CREATE INDEX idx_servers_status ON servers (status);
CREATE INDEX idx_servers_category ON servers (category_id);
CREATE INDEX idx_servers_country ON servers (country_id);
CREATE INDEX idx_servers_language ON servers (language_id);
CREATE INDEX idx_servers_premium ON servers (is_premium);
CREATE INDEX idx_servers_approved ON servers (is_approved);
CREATE INDEX idx_servers_user ON servers (user_id);
CREATE INDEX idx_servers_legacy_id ON servers (legacy_id);
CREATE INDEX idx_servers_legacy_user ON servers (legacy_user_id);

-- Índice compuesto para listados principales
CREATE INDEX idx_servers_listing ON servers (status, is_approved, category_id, created_at DESC);

-- ===================================
-- Tabla auxiliar: server_categories
-- ===================================
CREATE TABLE IF NOT EXISTS server_categories (
  id integer PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- ===================================
-- Tabla auxiliar: countries
-- ===================================
CREATE TABLE IF NOT EXISTS countries (
  id integer PRIMARY KEY,
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  flag_emoji text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- ===================================
-- Tabla auxiliar: languages
-- ===================================
CREATE TABLE IF NOT EXISTS languages (
  id integer PRIMARY KEY,
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  flag_emoji text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- ===================================
-- Insertar datos básicos (con manejo de duplicados)
-- ===================================

-- Insertar categorías básicas
INSERT INTO server_categories (id, name, slug, description) VALUES
(1, 'Mu Online', 'mu-online', 'Servidores de Mu Online'),
(3, 'Lineage II', 'lineage-2', 'Servidores de Lineage II'),
(7, 'Ragnarok Online', 'ragnarok-online', 'Servidores de Ragnarok Online'),
(10, 'Minecraft', 'minecraft', 'Servidores de Minecraft'),
(11, 'Counter-Strike', 'counter-strike', 'Servidores de Counter-Strike'),
(12, 'Perfect World', 'perfect-world', 'Servidores de Perfect World'),
(13, 'Silkroad Online', 'silkroad-online', 'Servidores de Silkroad Online'),
(14, 'Aion', 'aion', 'Servidores de Aion')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Insertar países comunes
INSERT INTO countries (id, name, code, flag_emoji) VALUES
(10, 'Argentina', 'AR', '🇦🇷'),
(12, 'Argentina', 'AR', '🇦🇷'),
(29, 'Brasil', 'BR', '🇧🇷'),
(30, 'Brasil', 'BR', '🇧🇷'),
(41, 'Chile', 'CL', '🇨🇱'),
(63, 'Estados Unidos', 'US', '🇺🇸'),
(131, 'Polonia', 'PL', '🇵🇱'),
(173, 'México', 'MX', '🇲🇽'),
(189, 'Portugal', 'PT', '🇵🇹'),
(227, 'Turquía', 'TR', '🇹🇷'),
(235, 'Colombia', 'CO', '🇨🇴'),
(238, 'Venezuela', 'VE', '🇻🇪')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  flag_emoji = EXCLUDED.flag_emoji;

-- Insertar idiomas comunes
INSERT INTO languages (id, name, code, flag_emoji) VALUES
(1, 'Inglés', 'en', '🇺🇸'),
(3, 'Inglés', 'en', '🇺🇸'),
(9, 'Español', 'es', '🇪🇸'),
(10, 'Portugués', 'pt', '🇵🇹')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  flag_emoji = EXCLUDED.flag_emoji;

-- ===================================
-- Agregar foreign keys
-- ===================================
ALTER TABLE servers 
ADD CONSTRAINT fk_servers_category 
FOREIGN KEY (category_id) REFERENCES server_categories(id);

ALTER TABLE servers 
ADD CONSTRAINT fk_servers_country 
FOREIGN KEY (country_id) REFERENCES countries(id);

ALTER TABLE servers 
ADD CONSTRAINT fk_servers_language 
FOREIGN KEY (language_id) REFERENCES languages(id);

-- ===================================
-- Habilitar Row Level Security (RLS)
-- ===================================
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE languages ENABLE ROW LEVEL SECURITY;

-- ===================================
-- Políticas de Seguridad para servers
-- ===================================

-- Todos pueden leer servidores aprobados y activos
CREATE POLICY "Everyone can read approved active servers"
  ON servers
  FOR SELECT
  TO anon, authenticated
  USING (is_approved = true AND status = 'active');

-- Los usuarios pueden leer sus propios servidores
CREATE POLICY "Users can read own servers"
  ON servers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Los usuarios pueden crear servidores
CREATE POLICY "Users can create servers"
  ON servers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden actualizar sus propios servidores
CREATE POLICY "Users can update own servers"
  ON servers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Los usuarios pueden eliminar sus propios servidores
CREATE POLICY "Users can delete own servers"
  ON servers
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ===================================
-- Políticas para tablas auxiliares
-- ===================================

-- Todos pueden leer categorías, países e idiomas
CREATE POLICY "Everyone can read categories"
  ON server_categories FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Everyone can read countries"
  ON countries FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Everyone can read languages"
  ON languages FOR SELECT TO anon, authenticated USING (true);

-- ===================================
-- Función para actualizar updated_at
-- ===================================
CREATE TRIGGER update_servers_updated_at
  BEFORE UPDATE ON servers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================
-- ¡ESTRUCTURA COMPLETADA!
-- ===================================
-- La tabla servers está lista para:
-- 1. Importar datos desde el archivo JSON
-- 2. Manejar búsquedas avanzadas
-- 3. Filtros por categoría, país, idioma
-- 4. Sistema de votación y premium
-- 5. Políticas de seguridad RLS
-- ===================================