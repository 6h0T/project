-- ============================================================================
-- SCRIPT DE LIMPIEZA Y CONFIGURACIÓN DE BASE DE DATOS
-- ============================================================================
-- Este script limpia y recrea toda la estructura de la base de datos

-- ============================================================================
-- LIMPIEZA (Eliminar elementos existentes)
-- ============================================================================

-- Eliminar triggers existentes
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS update_banners_updated_at ON banners;

-- Eliminar funciones existentes
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS deduct_credits(uuid, integer);

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can read own banners" ON banners;
DROP POLICY IF EXISTS "Users can create banners" ON banners;
DROP POLICY IF EXISTS "Users can update own banners" ON banners;
DROP POLICY IF EXISTS "Users can delete own banners" ON banners;
DROP POLICY IF EXISTS "Everyone can read active banners" ON banners;

-- Deshabilitar RLS temporalmente
ALTER TABLE IF EXISTS user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS banners DISABLE ROW LEVEL SECURITY;

-- Eliminar tablas existentes (en orden correcto por dependencias)
DROP TABLE IF EXISTS banners;
DROP TABLE IF EXISTS user_profiles;

-- ============================================================================
-- CREACIÓN DE TABLAS
-- ============================================================================

-- Crear tabla de perfiles de usuario
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  credits integer DEFAULT 1000, -- Créditos iniciales para nuevos usuarios
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Crear tabla de banners
CREATE TABLE banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  image_url text NOT NULL,
  target_url text NOT NULL,
  position text NOT NULL CHECK (position IN ('top', 'sidebar', 'bottom')),
  game_category text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'rejected')),
  credits_cost integer DEFAULT 100,
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- SEGURIDAD (RLS)
-- ============================================================================

-- Habilitar RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

-- Políticas para user_profiles
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Políticas para banners
CREATE POLICY "Users can read own banners"
  ON banners
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create banners"
  ON banners
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own banners"
  ON banners
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own banners"
  ON banners
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Política para que todos puedan ver banners activos
CREATE POLICY "Everyone can read active banners"
  ON banners
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

-- ============================================================================
-- FUNCIONES Y TRIGGERS
-- ============================================================================

-- Función para crear perfil automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_profiles (id, email, full_name, credits)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    1000 -- Créditos iniciales
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_banners_updated_at
  BEFORE UPDATE ON banners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para deducir créditos de forma segura
CREATE OR REPLACE FUNCTION deduct_credits(user_id uuid, amount integer)
RETURNS void AS $$
BEGIN
  -- Verificar que el usuario tenga suficientes créditos
  IF (SELECT credits FROM user_profiles WHERE id = user_id) < amount THEN
    RAISE EXCEPTION 'Créditos insuficientes';
  END IF;
  
  -- Deducir los créditos
  UPDATE user_profiles 
  SET credits = credits - amount 
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CONFIGURACIÓN ADICIONAL
-- ============================================================================

-- Crear perfiles para usuarios existentes que no tengan perfil
INSERT INTO user_profiles (id, email, full_name, credits)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', ''),
  1000
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Mostrar resumen de la configuración
DO $$
BEGIN
  RAISE NOTICE '✅ Base de datos configurada correctamente';
  RAISE NOTICE 'Tablas creadas: user_profiles, banners';
  RAISE NOTICE 'Políticas RLS: Configuradas';
  RAISE NOTICE 'Triggers: Configurados';
  RAISE NOTICE 'Funciones: Configuradas';
END $$;