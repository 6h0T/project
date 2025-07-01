/*
  # Función para deducir créditos

  1. Función
    - `deduct_credits` - Función para deducir créditos de un usuario de forma segura
*/

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