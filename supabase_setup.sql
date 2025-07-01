-- ===================================
-- GameServers Hub - Configuración de Base de Datos
-- Ejecuta este script en el SQL Editor de Supabase
-- ===================================

-- Limpiar datos existentes (opcional)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP TABLE IF EXISTS banners CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- ===================================
-- Tabla: user_profiles
-- ===================================
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  username text UNIQUE,
  full_name text,
  credits integer DEFAULT 100,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ===================================
-- Tabla: banners
-- ===================================
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

-- ===================================
-- Habilitar Row Level Security (RLS)
-- ===================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

-- ===================================
-- Políticas de Seguridad para user_profiles
-- ===================================
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

-- ===================================
-- Políticas de Seguridad para banners
-- ===================================
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

-- ===================================
-- Función para crear perfil automáticamente
-- ===================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_profiles (id, email, username, full_name, credits)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'username'),
    100
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================
-- Trigger para crear perfil automáticamente
-- ===================================
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ===================================
-- Función para actualizar updated_at automáticamente
-- ===================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- Triggers para updated_at
-- ===================================
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_banners_updated_at
  BEFORE UPDATE ON banners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================
-- ¡CONFIGURACIÓN COMPLETADA!
-- ===================================
-- Ahora puedes:
-- 1. Registrar usuarios en /registro
-- 2. Los usuarios se crearán automáticamente con 100 créditos
-- 3. Podrán crear banners desde el dashboard
-- 4. Todo está protegido con RLS para seguridad
-- =================================== 