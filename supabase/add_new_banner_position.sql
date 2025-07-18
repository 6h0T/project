-- ===================================
-- Script para agregar nueva posición de banner
-- Este script maneja duplicados correctamente
-- ===================================

-- Primero, verificar qué categorías ya existen
SELECT 'Categorías existentes:' as info;
SELECT id, name, slug FROM server_categories ORDER BY id;

-- Verificar si la tabla servers ya existe
SELECT 'Verificando tabla servers:' as info;
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'servers'
) as servers_table_exists;

-- Si la tabla servers no existe, crearla
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'servers') THEN
        -- Crear tabla servers
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

        RAISE NOTICE 'Tabla servers creada exitosamente';
    ELSE
        RAISE NOTICE 'Tabla servers ya existe, saltando creación';
    END IF;
END $$;

-- Crear índices solo si no existen
DO $$
BEGIN
    -- Índices para filtros comunes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_servers_status') THEN
        CREATE INDEX idx_servers_status ON servers (status);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_servers_category') THEN
        CREATE INDEX idx_servers_category ON servers (category_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_servers_country') THEN
        CREATE INDEX idx_servers_country ON servers (country_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_servers_language') THEN
        CREATE INDEX idx_servers_language ON servers (language_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_servers_premium') THEN
        CREATE INDEX idx_servers_premium ON servers (is_premium);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_servers_approved') THEN
        CREATE INDEX idx_servers_approved ON servers (is_approved);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_servers_user') THEN
        CREATE INDEX idx_servers_user ON servers (user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_servers_legacy_id') THEN
        CREATE INDEX idx_servers_legacy_id ON servers (legacy_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_servers_legacy_user') THEN
        CREATE INDEX idx_servers_legacy_user ON servers (legacy_user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_servers_listing') THEN
        CREATE INDEX idx_servers_listing ON servers (status, is_approved, category_id, created_at DESC);
    END IF;

    RAISE NOTICE 'Índices verificados/creados exitosamente';
END $$;

-- Crear tablas auxiliares solo si no existen
CREATE TABLE IF NOT EXISTS countries (
  id integer PRIMARY KEY,
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  flag_emoji text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS languages (
  id integer PRIMARY KEY,
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  flag_emoji text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Insertar datos solo si no existen (usando WHERE NOT EXISTS)
-- Países
INSERT INTO countries (id, name, code, flag_emoji)
SELECT 10, 'Argentina', 'AR', '🇦🇷'
WHERE NOT EXISTS (SELECT 1 FROM countries WHERE id = 10);

INSERT INTO countries (id, name, code, flag_emoji)
SELECT 12, 'Argentina', 'AR', '🇦🇷'
WHERE NOT EXISTS (SELECT 1 FROM countries WHERE id = 12);

INSERT INTO countries (id, name, code, flag_emoji)
SELECT 29, 'Brasil', 'BR', '🇧🇷'
WHERE NOT EXISTS (SELECT 1 FROM countries WHERE id = 29);

INSERT INTO countries (id, name, code, flag_emoji)
SELECT 30, 'Brasil', 'BR', '🇧🇷'
WHERE NOT EXISTS (SELECT 1 FROM countries WHERE id = 30);

INSERT INTO countries (id, name, code, flag_emoji)
SELECT 41, 'Chile', 'CL', '🇨🇱'
WHERE NOT EXISTS (SELECT 1 FROM countries WHERE id = 41);

INSERT INTO countries (id, name, code, flag_emoji)
SELECT 63, 'Estados Unidos', 'US', '🇺🇸'
WHERE NOT EXISTS (SELECT 1 FROM countries WHERE id = 63);

INSERT INTO countries (id, name, code, flag_emoji)
SELECT 131, 'Polonia', 'PL', '🇵🇱'
WHERE NOT EXISTS (SELECT 1 FROM countries WHERE id = 131);

INSERT INTO countries (id, name, code, flag_emoji)
SELECT 173, 'México', 'MX', '🇲🇽'
WHERE NOT EXISTS (SELECT 1 FROM countries WHERE id = 173);

INSERT INTO countries (id, name, code, flag_emoji)
SELECT 189, 'Portugal', 'PT', '🇵🇹'
WHERE NOT EXISTS (SELECT 1 FROM countries WHERE id = 189);

INSERT INTO countries (id, name, code, flag_emoji)
SELECT 227, 'Turquía', 'TR', '🇹🇷'
WHERE NOT EXISTS (SELECT 1 FROM countries WHERE id = 227);

INSERT INTO countries (id, name, code, flag_emoji)
SELECT 235, 'Colombia', 'CO', '🇨🇴'
WHERE NOT EXISTS (SELECT 1 FROM countries WHERE id = 235);

INSERT INTO countries (id, name, code, flag_emoji)
SELECT 238, 'Venezuela', 'VE', '🇻🇪'
WHERE NOT EXISTS (SELECT 1 FROM countries WHERE id = 238);

-- Idiomas
INSERT INTO languages (id, name, code, flag_emoji)
SELECT 1, 'Inglés', 'en', '🇺🇸'
WHERE NOT EXISTS (SELECT 1 FROM languages WHERE id = 1);

INSERT INTO languages (id, name, code, flag_emoji)
SELECT 3, 'Inglés', 'en', '🇺🇸'
WHERE NOT EXISTS (SELECT 1 FROM languages WHERE id = 3);

INSERT INTO languages (id, name, code, flag_emoji)
SELECT 9, 'Español', 'es', '🇪🇸'
WHERE NOT EXISTS (SELECT 1 FROM languages WHERE id = 9);

INSERT INTO languages (id, name, code, flag_emoji)
SELECT 10, 'Portugués', 'pt', '🇵🇹'
WHERE NOT EXISTS (SELECT 1 FROM languages WHERE id = 10);

-- Categorías (solo las que no existen)
INSERT INTO server_categories (id, name, slug, description)
SELECT 1, 'Mu Online', 'mu-online', 'Servidores de Mu Online'
WHERE NOT EXISTS (SELECT 1 FROM server_categories WHERE id = 1);

INSERT INTO server_categories (id, name, slug, description)
SELECT 3, 'Lineage II', 'lineage-2', 'Servidores de Lineage II'
WHERE NOT EXISTS (SELECT 1 FROM server_categories WHERE id = 3);

INSERT INTO server_categories (id, name, slug, description)
SELECT 7, 'Ragnarok Online', 'ragnarok-online', 'Servidores de Ragnarok Online'
WHERE NOT EXISTS (SELECT 1 FROM server_categories WHERE id = 7);

INSERT INTO server_categories (id, name, slug, description)
SELECT 10, 'Minecraft', 'minecraft', 'Servidores de Minecraft'
WHERE NOT EXISTS (SELECT 1 FROM server_categories WHERE id = 10);

INSERT INTO server_categories (id, name, slug, description)
SELECT 12, 'Perfect World', 'perfect-world', 'Servidores de Perfect World'
WHERE NOT EXISTS (SELECT 1 FROM server_categories WHERE id = 12);

INSERT INTO server_categories (id, name, slug, description)
SELECT 13, 'Silkroad Online', 'silkroad-online', 'Servidores de Silkroad Online'
WHERE NOT EXISTS (SELECT 1 FROM server_categories WHERE id = 13);

INSERT INTO server_categories (id, name, slug, description)
SELECT 14, 'Aion', 'aion', 'Servidores de Aion'
WHERE NOT EXISTS (SELECT 1 FROM server_categories WHERE id = 14);

-- Agregar foreign keys solo si no existen
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_servers_category') THEN
        ALTER TABLE servers 
        ADD CONSTRAINT fk_servers_category 
        FOREIGN KEY (category_id) REFERENCES server_categories(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_servers_country') THEN
        ALTER TABLE servers 
        ADD CONSTRAINT fk_servers_country 
        FOREIGN KEY (country_id) REFERENCES countries(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_servers_language') THEN
        ALTER TABLE servers 
        ADD CONSTRAINT fk_servers_language 
        FOREIGN KEY (language_id) REFERENCES languages(id);
    END IF;
END $$;

-- Habilitar RLS solo si no está habilitado
DO $$
BEGIN
    -- Verificar y habilitar RLS para servers
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'servers' AND rowsecurity = true) THEN
        ALTER TABLE servers ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'server_categories' AND rowsecurity = true) THEN
        ALTER TABLE server_categories ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'countries' AND rowsecurity = true) THEN
        ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'languages' AND rowsecurity = true) THEN
        ALTER TABLE languages ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Crear políticas solo si no existen
DO $$
BEGIN
    -- Políticas para servers
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'servers' AND policyname = 'Everyone can read approved active servers') THEN
        CREATE POLICY "Everyone can read approved active servers"
          ON servers FOR SELECT TO anon, authenticated
          USING (is_approved = true AND status = 'active');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'servers' AND policyname = 'Users can read own servers') THEN
        CREATE POLICY "Users can read own servers"
          ON servers FOR SELECT TO authenticated
          USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'servers' AND policyname = 'Users can create servers') THEN
        CREATE POLICY "Users can create servers"
          ON servers FOR INSERT TO authenticated
          WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'servers' AND policyname = 'Users can update own servers') THEN
        CREATE POLICY "Users can update own servers"
          ON servers FOR UPDATE TO authenticated
          USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'servers' AND policyname = 'Users can delete own servers') THEN
        CREATE POLICY "Users can delete own servers"
          ON servers FOR DELETE TO authenticated
          USING (auth.uid() = user_id);
    END IF;

    -- Políticas para tablas auxiliares
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'server_categories' AND policyname = 'Everyone can read categories') THEN
        CREATE POLICY "Everyone can read categories"
          ON server_categories FOR SELECT TO anon, authenticated USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'countries' AND policyname = 'Everyone can read countries') THEN
        CREATE POLICY "Everyone can read countries"
          ON countries FOR SELECT TO anon, authenticated USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'languages' AND policyname = 'Everyone can read languages') THEN
        CREATE POLICY "Everyone can read languages"
          ON languages FOR SELECT TO anon, authenticated USING (true);
    END IF;
END $$;

-- Crear trigger solo si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers 
                   WHERE trigger_name = 'update_servers_updated_at') THEN
        CREATE TRIGGER update_servers_updated_at
          BEFORE UPDATE ON servers
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Verificar el resultado final
SELECT 'Verificación final:' as info;
SELECT 'Categorías disponibles:' as info;
SELECT id, name, slug FROM server_categories ORDER BY id;

SELECT 'Países disponibles:' as info;
SELECT COUNT(*) as total_countries FROM countries;

SELECT 'Idiomas disponibles:' as info;
SELECT COUNT(*) as total_languages FROM languages;

SELECT 'Tabla servers creada:' as info;
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'servers'
) as servers_ready;

-- ===================================
-- ¡CONFIGURACIÓN COMPLETADA!
-- ===================================
SELECT '¡Configuración completada exitosamente!' as resultado;
SELECT 'Ahora puedes ejecutar el script de importación:' as siguiente_paso;
SELECT 'node scripts/import-from-php.js export_2025-07-16_15-44-50.json' as comando;