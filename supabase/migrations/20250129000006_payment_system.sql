-- ===================================
-- SISTEMA COMPLETO DE PAGOS Y CRÉDITOS
-- ===================================

-- ===================================
-- 1. TABLA: user_credits (Sistema principal de créditos)
-- ===================================
CREATE TABLE IF NOT EXISTS user_credits (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credits INTEGER DEFAULT 0 CHECK (credits >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ===================================
-- 2. TABLA: payment_orders (Órdenes de pago)
-- ===================================
CREATE TABLE IF NOT EXISTS payment_orders (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id VARCHAR(100) UNIQUE NOT NULL,
  external_id VARCHAR(200), -- ID del proveedor de pago externo
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) DEFAULT 'USD',
  credits_amount INTEGER NOT NULL CHECK (credits_amount > 0),
  bonus_credits INTEGER DEFAULT 0 CHECK (bonus_credits >= 0),
  total_credits INTEGER GENERATED ALWAYS AS (credits_amount + bonus_credits) STORED,
  payment_method VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'expired')),
  expires_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================
-- 3. TABLA: payment_transactions (Transacciones de pago)
-- ===================================
CREATE TABLE IF NOT EXISTS payment_transactions (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES payment_orders(id) ON DELETE CASCADE,
  transaction_id VARCHAR(200) UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  payment_method VARCHAR(50) NOT NULL,
  external_data JSONB DEFAULT '{}',
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================
-- 4. TABLA: credit_history (Historial de créditos)
-- ===================================
CREATE TABLE IF NOT EXISTS credit_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credits_change INTEGER NOT NULL, -- Positivo para agregar, negativo para deducir
  credits_before INTEGER NOT NULL CHECK (credits_before >= 0),
  credits_after INTEGER NOT NULL CHECK (credits_after >= 0),
  transaction_type VARCHAR(50) NOT NULL, -- 'purchase', 'bonus', 'deduction', 'refund', 'manual'
  description TEXT,
  order_id BIGINT REFERENCES payment_orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ===================================
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_order_id ON payment_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_transaction_id ON payment_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_credit_history_user_id ON credit_history(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_history_created_at ON credit_history(created_at);

-- ===================================
-- HABILITAR ROW LEVEL SECURITY (RLS)
-- ===================================
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_history ENABLE ROW LEVEL SECURITY;

-- ===================================
-- ELIMINAR POLÍTICAS EXISTENTES (IDEMPOTENTE)
-- ===================================
DROP POLICY IF EXISTS "Users can view own credits" ON user_credits;
DROP POLICY IF EXISTS "Users can view own orders" ON payment_orders;
DROP POLICY IF EXISTS "Users can create own orders" ON payment_orders;
DROP POLICY IF EXISTS "Users can view own transactions" ON payment_transactions;
DROP POLICY IF EXISTS "Users can view own credit history" ON credit_history;
DROP POLICY IF EXISTS "Service can manage all credits" ON user_credits;
DROP POLICY IF EXISTS "Service can manage all orders" ON payment_orders;
DROP POLICY IF EXISTS "Service can manage all transactions" ON payment_transactions;
DROP POLICY IF EXISTS "Service can manage all credit history" ON credit_history;

-- ===================================
-- POLÍTICAS DE SEGURIDAD
-- ===================================

-- user_credits: Los usuarios solo pueden ver sus propios créditos
CREATE POLICY "Users can view own credits" ON user_credits
  FOR SELECT USING (auth.uid() = user_id);

-- payment_orders: Los usuarios solo pueden ver sus propias órdenes
CREATE POLICY "Users can view own orders" ON payment_orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders" ON payment_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- payment_transactions: Los usuarios solo pueden ver transacciones de sus órdenes
CREATE POLICY "Users can view own transactions" ON payment_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM payment_orders 
      WHERE payment_orders.id = payment_transactions.order_id 
      AND payment_orders.user_id = auth.uid()
    )
  );

-- credit_history: Los usuarios solo pueden ver su propio historial
CREATE POLICY "Users can view own credit history" ON credit_history
  FOR SELECT USING (auth.uid() = user_id);

-- Políticas para el sistema (APIs)
CREATE POLICY "Service can manage all credits" ON user_credits
  FOR ALL USING (true);

CREATE POLICY "Service can manage all orders" ON payment_orders
  FOR ALL USING (true);

CREATE POLICY "Service can manage all transactions" ON payment_transactions
  FOR ALL USING (true);

CREATE POLICY "Service can manage all credit history" ON credit_history
  FOR ALL USING (true);

-- ===================================
-- FUNCIONES SQL PARA MANEJO DE CRÉDITOS
-- ===================================

-- Función para obtener créditos de un usuario
CREATE OR REPLACE FUNCTION get_user_credits(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  user_credits_amount INTEGER;
BEGIN
  -- Obtener créditos actuales del usuario
  SELECT credits INTO user_credits_amount
  FROM user_credits
  WHERE user_id = p_user_id;
  
  -- Si no existe registro, crear uno con 0 créditos
  IF user_credits_amount IS NULL THEN
    INSERT INTO user_credits (user_id, credits)
    VALUES (p_user_id, 0)
    ON CONFLICT (user_id) DO NOTHING;
    
    user_credits_amount := 0;
  END IF;
  
  RETURN COALESCE(user_credits_amount, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para agregar créditos
CREATE OR REPLACE FUNCTION add_user_credits(
  p_user_id UUID,
  p_credits INTEGER,
  p_type VARCHAR(50) DEFAULT 'manual',
  p_description TEXT DEFAULT NULL,
  p_order_id BIGINT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  current_credits INTEGER;
  new_credits INTEGER;
BEGIN
  -- Validar que los créditos sean positivos
  IF p_credits <= 0 THEN
    RAISE EXCEPTION 'Los créditos deben ser mayor a 0';
  END IF;
  
  -- Obtener créditos actuales
  current_credits := get_user_credits(p_user_id);
  new_credits := current_credits + p_credits;
  
  -- Actualizar créditos
  INSERT INTO user_credits (user_id, credits, updated_at)
  VALUES (p_user_id, new_credits, NOW())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    credits = new_credits,
    updated_at = NOW();
  
  -- Registrar en historial
  INSERT INTO credit_history (
    user_id, 
    credits_change, 
    credits_before, 
    credits_after, 
    transaction_type, 
    description, 
    order_id
  )
  VALUES (
    p_user_id, 
    p_credits, 
    current_credits, 
    new_credits, 
    p_type, 
    p_description, 
    p_order_id
  );
  
  RETURN new_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para deducir créditos
CREATE OR REPLACE FUNCTION deduct_user_credits(
  p_user_id UUID,
  p_credits INTEGER,
  p_type VARCHAR(50) DEFAULT 'deduction',
  p_description TEXT DEFAULT NULL,
  p_order_id BIGINT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  current_credits INTEGER;
  new_credits INTEGER;
BEGIN
  -- Validar que los créditos sean positivos
  IF p_credits <= 0 THEN
    RAISE EXCEPTION 'Los créditos a deducir deben ser mayor a 0';
  END IF;
  
  -- Obtener créditos actuales
  current_credits := get_user_credits(p_user_id);
  
  -- Verificar que tenga suficientes créditos
  IF current_credits < p_credits THEN
    RAISE EXCEPTION 'Créditos insuficientes. Actual: %, Requerido: %', current_credits, p_credits;
  END IF;
  
  new_credits := current_credits - p_credits;
  
  -- Actualizar créditos
  UPDATE user_credits 
  SET credits = new_credits, updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Registrar en historial
  INSERT INTO credit_history (
    user_id, 
    credits_change, 
    credits_before, 
    credits_after, 
    transaction_type, 
    description, 
    order_id
  )
  VALUES (
    p_user_id, 
    -p_credits, 
    current_credits, 
    new_credits, 
    p_type, 
    p_description, 
    p_order_id
  );
  
  RETURN new_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para procesar completación de pago
CREATE OR REPLACE FUNCTION process_payment_completion(
  p_order_id VARCHAR(100),
  p_transaction_id VARCHAR(200) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  order_record payment_orders%ROWTYPE;
  transaction_exists BOOLEAN := FALSE;
BEGIN
  -- Obtener la orden
  SELECT * INTO order_record
  FROM payment_orders
  WHERE order_id = p_order_id;
  
  -- Verificar que la orden existe
  IF order_record.id IS NULL THEN
    RAISE EXCEPTION 'Orden no encontrada: %', p_order_id;
  END IF;
  
  -- Verificar que la orden no esté ya completada
  IF order_record.status = 'completed' THEN
    RETURN TRUE; -- Ya está completada
  END IF;
  
  -- Verificar si ya existe una transacción completada
  IF p_transaction_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM payment_transactions 
      WHERE transaction_id = p_transaction_id AND status = 'completed'
    ) INTO transaction_exists;
    
    IF transaction_exists THEN
      RETURN TRUE; -- Transacción ya procesada
    END IF;
  END IF;
  
  -- Actualizar orden como completada
  UPDATE payment_orders
  SET status = 'completed', completed_at = NOW(), updated_at = NOW()
  WHERE id = order_record.id;
  
  -- Agregar créditos al usuario
  PERFORM add_user_credits(
    order_record.user_id,
    order_record.total_credits,
    'purchase',
    'Compra de créditos - Orden: ' || order_record.order_id,
    order_record.id
  );
  
  -- Actualizar transacción si se proporciona
  IF p_transaction_id IS NOT NULL THEN
    UPDATE payment_transactions
    SET status = 'completed', processed_at = NOW()
    WHERE transaction_id = p_transaction_id;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================
-- TRIGGERS PARA UPDATED_AT
-- ===================================
DROP TRIGGER IF EXISTS update_user_credits_updated_at ON user_credits;
DROP TRIGGER IF EXISTS update_payment_orders_updated_at ON payment_orders;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers
CREATE TRIGGER update_user_credits_updated_at
  BEFORE UPDATE ON user_credits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_orders_updated_at
  BEFORE UPDATE ON payment_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===================================
-- MIGRAR CRÉDITOS EXISTENTES DE user_profiles
-- ===================================
INSERT INTO user_credits (user_id, credits, created_at, updated_at)
SELECT 
  id as user_id,
  COALESCE(credits, 0) as credits,
  COALESCE(created_at, NOW()) as created_at,
  COALESCE(updated_at, NOW()) as updated_at
FROM user_profiles
WHERE id NOT IN (SELECT user_id FROM user_credits)
ON CONFLICT (user_id) DO NOTHING;

-- ===================================
-- CONFIGURACIÓN COMPLETADA
-- ===================================
-- Ahora tienes:
-- 1. Sistema completo de créditos con user_credits
-- 2. Sistema de órdenes de pago
-- 3. Historial completo de transacciones
-- 4. Funciones SQL para manejar créditos
-- 5. Migración de datos existentes
-- 6. Seguridad RLS implementada 