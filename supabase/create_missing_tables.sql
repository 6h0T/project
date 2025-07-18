-- ===================================
-- CREAR TABLAS FALTANTES PARA IMPORTACIÓN
-- Script basado en diagnóstico - crea solo lo que falta
-- ===================================

-- ===================================
-- 1. CREAR TABLAS AUXILIARES PRIMERO
-- ===================================

-- Tabla de categorías de servidores
CREATE TABLE IF NOT EXISTS server_categories (
  id integer PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Tabla de países
CREATE TABLE IF NOT EXISTS countries (
  id integer PRIMARY KEY,
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  flag_emoji text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Tabla de idiomas
CREATE TABLE IF NOT EXISTS languages (
  id integer PRIMARY KEY,
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  flag_emoji text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- ===================================
-- 2. CREAR TABLA SERVERS PRINCIPAL
-- ===================================
CREATE TABLE IF NOT EXISTS servers (
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
  user_id uuid,
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
  
  -- Metadatos adicionales
  metadata jsonb DEFAULT '{}'
);

-- ===================================
-- 3. INSERTAR DATOS BÁSICOS
-- ===================================

-- Insertar categorías (solo si no existen)
INSERT INTO server_categories (id, name, slug, description) 
SELECT * FROM (VALUES
  (1, 'Mu Online', 'mu-online', 'Servidores de Mu Online'),
  (3, 'Lineage II', 'lineage-2', 'Servidores de Lineage II'),
  (7, 'Ragnarok Online', 'ragnarok-online', 'Servidores de Ragnarok Online'),
  (10, 'Minecraft', 'minecraft', 'Servidores de Minecraft'),
  (11, 'Counter-Strike', 'counter-strike', 'Servidores de Counter-Strike'),
  (12, 'Perfect World', 'perfect-world', 'Servidores de Perfect World'),
  (13, 'Silkroad Online', 'silkroad-online', 'Servidores de Silkroad Online'),
  (14, 'Aion', 'aion', 'Servidores de Aion')
) AS new_categories(id, name, slug, description)
WHERE NOT EXISTS (
  SELECT 1 FROM server_categories WHERE server_categories.id = new_categories.id
);

-- Insertar países (solo si no existen)
INSERT INTO countries (id, name, code, flag_emoji)
SELECT * FROM (VALUES
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
) AS new_countries(id, name, code, flag_emoji)
WHERE NOT EXISTS (
  SELECT 1 FROM countries WHERE countries.id = new_countries.id
);

-- Insertar idiomas (solo si no existen)
INSERT INTO languages (id, name, code, flag_emoji)
SELECT * FROM (VALUES
  (1, 'Inglés', 'en', '🇺🇸'),
  (3, 'Inglés', 'en', '🇺🇸'),
  (9, 'Español', 'es', '🇪🇸'),
  (10, 'Portugués', 'pt', '🇵🇹')
) AS new_languages(id, name, code, flag_emoji)
WHERE NOT EXISTS (
  SELECT 1 FROM languages WHERE languages.id = new_languages.id
);

-- ===================================
-- 4. CREAR ÍNDICES PARA OPTIMIZACIÓN
-- ===================================

-- Índices para servers
CREATE INDEX IF NOT EXISTS idx_servers_status ON servers (status);
CREATE INDEX IF NOT EXISTS idx_servers_category ON servers (category_id);
CREATE INDEX IF NOT EXISTS idx_servers_country ON servers (country_id);
CREATE INDEX IF NOT EXISTS idx_servers_language ON servers (language_id);
CREATE INDEX IF NOT EXISTS idx_servers_premium ON servers (is_premium);
CREATE INDEX IF NOT EXISTS idx_servers_approved ON servers (is_approved);
CREATE INDEX IF NOT EXISTS idx_servers_user ON servers (user_id);
CREATE INDEX IF NOT EXISTS idx_servers_legacy_id ON servers (legacy_id);
CREATE INDEX IF NOT EXISTS idx_servers_legacy_user ON servers (legacy_user_id);
CREATE INDEX IF NOT EXISTS idx_servers_listing ON servers (status, is_approved, category_id, created_at DESC);

-- ===================================
-- 5. AGREGAR FOREIGN KEYS (solo si no existen)
-- ===================================

-- Verificar y agregar constraint para category_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_servers_category' 
        AND table_name = 'servers'
    ) THEN
        ALTER TABLE servers 
        ADD CONSTRAINT fk_servers_category 
        FOREIGN KEY (category_id) REFERENCES server_categories(id);
    END IF;
END $$;

-- Verificar y agregar constraint para country_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_servers_country' 
        AND table_name = 'servers'
    ) THEN
        ALTER TABLE servers 
        ADD CONSTRAINT fk_servers_country 
        FOREIGN KEY (country_id) REFERENCES countries(id);
    END IF;
END $$;

-- Verificar y agregar constraint para language_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_servers_language' 
        AND table_name = 'servers'
    ) THEN
        ALTER TABLE servers 
        ADD CONSTRAINT fk_servers_language 
        FOREIGN KEY (language_id) REFERENCES languages(id);
    END IF;
END $$;

-- Verificar y agregar constraint para user_id (si user_profiles existe)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_profiles' 
        AND table_schema = 'public'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_servers_user' 
        AND table_name = 'servers'
    ) THEN
        ALTER TABLE servers 
        ADD CONSTRAINT fk_servers_user 
        FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ===================================
-- 6. HABILITAR ROW LEVEL SECURITY
-- ===================================

-- Habilitar RLS en todas las tablas
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE languages ENABLE ROW LEVEL SECURITY;

-- ===================================
-- 7. CREAR POLÍTICAS DE SEGURIDAD
-- ===================================

-- Políticas para servers
DO $$
BEGIN
    -- Todos pueden leer servidores aprobados y activos
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'servers' 
        AND policyname = 'Everyone can read approved active servers'
    ) THEN
        CREATE POLICY "Everyone can read approved active servers"
          ON servers FOR SELECT TO anon, authenticated
          USING (is_approved = true AND status = 'active');
    END IF;

    -- Los usuarios pueden leer sus propios servidores
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'servers' 
        AND policyname = 'Users can read own servers'
    ) THEN
        CREATE POLICY "Users can read own servers"
          ON servers FOR SELECT TO authenticated
          USING (auth.uid() = user_id);
    END IF;

    -- Los usuarios pueden crear servidores
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'servers' 
        AND policyname = 'Users can create servers'
    ) THEN
        CREATE POLICY "Users can create servers"
          ON servers FOR INSERT TO authenticated
          WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Los usuarios pueden actualizar sus propios servidores
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'servers' 
        AND policyname = 'Users can update own servers'
    ) THEN
        CREATE POLICY "Users can update own servers"
          ON servers FOR UPDATE TO authenticated
          USING (auth.uid() = user_id);
    END IF;

    -- Los usuarios pueden eliminar sus propios servidores
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'servers' 
        AND policyname = 'Users can delete own servers'
    ) THEN
        CREATE POLICY "Users can delete own servers"
          ON servers FOR DELETE TO authenticated
          USING (auth.uid() = user_id);
    END IF;
END $$;

-- Políticas para tablas auxiliares (lectura pública)
DO $$
BEGIN
    -- Categorías
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'server_categories' 
        AND policyname = 'Everyone can read categories'
    ) THEN
        CREATE POLICY "Everyone can read categories"
          ON server_categories FOR SELECT TO anon, authenticated USING (true);
    END IF;

    -- Países
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'countries' 
        AND policyname = 'Everyone can read countries'
    ) THEN
        CREATE POLICY "Everyone can read countries"
          ON countries FOR SELECT TO anon, authenticated USING (true);
    END IF;

    -- Idiomas
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'languages' 
        AND policyname = 'Everyone can read languages'
    ) THEN
        CREATE POLICY "Everyone can read languages"
          ON languages FOR SELECT TO anon, authenticated USING (true);
    END IF;
END $$;

-- ===================================
-- 8. CREAR TRIGGER PARA updated_at
-- ===================================

-- Crear trigger solo si no existe y si la función existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'update_updated_at_column'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_servers_updated_at'
    ) THEN
        CREATE TRIGGER update_servers_updated_at
          BEFORE UPDATE ON servers
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ===================================
-- 9. VERIFICACIÓN FINAL
-- ===================================

-- Mostrar resumen de lo creado
SELECT '=== VERIFICACIÓN FINAL ===' as seccion;

SELECT 
    'TABLAS CREADAS:' as resultado,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'servers') THEN '✅' ELSE '❌' END as servers,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'server_categories') THEN '✅' ELSE '❌' END as categories,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'countries') THEN '✅' ELSE '❌' END as countries,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'languages') THEN '✅' ELSE '❌' END as languages;

-- Contar registros insertados
SELECT 'DATOS INSERTADOS:' as resultado;
SELECT 'Categorías:' as tabla, COUNT(*) as registros FROM server_categories;
SELECT 'Países:' as tabla, COUNT(*) as registros FROM countries;
SELECT 'Idiomas:' as tabla, COUNT(*) as registros FROM languages;
SELECT 'Servidores:' as tabla, COUNT(*) as registros FROM servers;

-- ===================================
-- ¡ESTRUCTURA COMPLETADA!
-- ===================================
SELECT '🎉 ¡ESTRUCTURA COMPLETADA EXITOSAMENTE!' as resultado;
SELECT 'Ahora puedes ejecutar el script de importación:' as siguiente_paso;
SELECT 'node scripts/import-from-php.js export_2025-07-16_15-44-50.json' as comando;