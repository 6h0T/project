-- ===================================
-- SCRIPT DE MIGRACIÓN AUTOMÁTICA
-- Generado el: 2025-07-17T19:51:44.433Z
-- ===================================

-- Agregar columnas faltantes a servers
ALTER TABLE servers ADD COLUMN IF NOT EXISTS id uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE servers ADD COLUMN IF NOT EXISTS legacy_id integer;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS title text NOT NULL;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS description text DEFAULT '';
ALTER TABLE servers ADD COLUMN IF NOT EXISTS website text DEFAULT '';
ALTER TABLE servers ADD COLUMN IF NOT EXISTS ip_address text DEFAULT '';
ALTER TABLE servers ADD COLUMN IF NOT EXISTS experience_rate integer DEFAULT 1;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS version text DEFAULT '';
ALTER TABLE servers ADD COLUMN IF NOT EXISTS season text DEFAULT '';
ALTER TABLE servers ADD COLUMN IF NOT EXISTS server_type text DEFAULT '';
ALTER TABLE servers ADD COLUMN IF NOT EXISTS platform text DEFAULT '';
ALTER TABLE servers ADD COLUMN IF NOT EXISTS emulator text DEFAULT '';
ALTER TABLE servers ADD COLUMN IF NOT EXISTS max_level text DEFAULT '';
ALTER TABLE servers ADD COLUMN IF NOT EXISTS country_id integer;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS language_id integer NOT NULL DEFAULT 1;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS timezone text DEFAULT '0';
ALTER TABLE servers ADD COLUMN IF NOT EXISTS status text DEFAULT 'inactive';
ALTER TABLE servers ADD COLUMN IF NOT EXISTS server_status integer DEFAULT 1;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS is_premium boolean DEFAULT false;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS category_id integer NOT NULL;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS legacy_user_id integer;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS launch_date timestamptz;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE servers ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE servers ADD COLUMN IF NOT EXISTS banner_image text DEFAULT '';
ALTER TABLE servers ADD COLUMN IF NOT EXISTS youtube_url text DEFAULT '';
ALTER TABLE servers ADD COLUMN IF NOT EXISTS votes integer DEFAULT 0;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS premium_days integer DEFAULT 0;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS premium_date timestamptz;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS email_notifications boolean DEFAULT false;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- Agregar columnas faltantes a server_categories
ALTER TABLE server_categories ADD COLUMN IF NOT EXISTS id integer NOT NULL;
ALTER TABLE server_categories ADD COLUMN IF NOT EXISTS name text NOT NULL;
ALTER TABLE server_categories ADD COLUMN IF NOT EXISTS slug text NOT NULL;
ALTER TABLE server_categories ADD COLUMN IF NOT EXISTS description text DEFAULT '';
ALTER TABLE server_categories ADD COLUMN IF NOT EXISTS icon text DEFAULT '';
ALTER TABLE server_categories ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Agregar columnas faltantes a countries
ALTER TABLE countries ADD COLUMN IF NOT EXISTS id integer NOT NULL;
ALTER TABLE countries ADD COLUMN IF NOT EXISTS name text NOT NULL;
ALTER TABLE countries ADD COLUMN IF NOT EXISTS code text NOT NULL;
ALTER TABLE countries ADD COLUMN IF NOT EXISTS flag_emoji text DEFAULT '';
ALTER TABLE countries ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Agregar columnas faltantes a languages
ALTER TABLE languages ADD COLUMN IF NOT EXISTS id integer NOT NULL;
ALTER TABLE languages ADD COLUMN IF NOT EXISTS name text NOT NULL;
ALTER TABLE languages ADD COLUMN IF NOT EXISTS code text NOT NULL;
ALTER TABLE languages ADD COLUMN IF NOT EXISTS flag_emoji text DEFAULT '';
ALTER TABLE languages ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Insertar datos faltantes en server_categories
INSERT INTO server_categories (id, name, slug, description) VALUES (7, 'Ragnarok Online', 'ragnarok-online', 'Servidores de Ragnarok Online') ON CONFLICT (id) DO NOTHING;
INSERT INTO server_categories (id, name, slug, description) VALUES (10, 'Minecraft', 'minecraft', 'Servidores de Minecraft') ON CONFLICT (id) DO NOTHING;
INSERT INTO server_categories (id, name, slug, description) VALUES (11, 'Counter-Strike', 'counter-strike', 'Servidores de Counter-Strike') ON CONFLICT (id) DO NOTHING;
INSERT INTO server_categories (id, name, slug, description) VALUES (14, 'Aion', 'aion', 'Servidores de Aion') ON CONFLICT (id) DO NOTHING;

-- Crear índices faltantes para servers
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
-- 5. CONFIGURAR SEGURIDAD RLS
-- ===================================

ALTER TABLE servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE languages ENABLE ROW LEVEL SECURITY;

-- Políticas básicas de lectura pública para tablas auxiliares
DO $$
BEGIN
    -- Política para server_categories
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'server_categories'
        AND policyname = 'Everyone can read server_categories'
    ) THEN
        CREATE POLICY "Everyone can read server_categories"
        ON server_categories FOR SELECT TO anon, authenticated USING (true);
    END IF;

    -- Política para countries
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'countries'
        AND policyname = 'Everyone can read countries'
    ) THEN
        CREATE POLICY "Everyone can read countries"
        ON countries FOR SELECT TO anon, authenticated USING (true);
    END IF;

    -- Política para languages
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
-- MIGRACIÓN COMPLETADA
-- ===================================
SELECT '🎉 Migración automática completada exitosamente!' as resultado;