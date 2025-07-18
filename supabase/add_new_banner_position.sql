-- Script para resolver conflictos de países e idiomas

-- 1. Primero, agregar solo los idiomas faltantes (estos no deberían tener conflictos)
INSERT INTO languages (id, name, code, flag_emoji) VALUES 
  (4, 'Francés', 'fr', '🇫🇷'),
  (5, 'Italiano', 'it', '🇮🇹'),
  (7, 'Polaco', 'pl', '🇵🇱'),
  (8, 'Turco', 'tr', '🇹🇷')
ON CONFLICT (id) DO NOTHING;

-- 2. Para países, usar códigos únicos para evitar conflictos
INSERT INTO countries (id, name, code, flag_emoji) VALUES 
  (1, 'Estados Unidos', 'US1', '🇺🇸'),
  (4, 'Reino Unido', 'GB1', '🇬🇧'),
  (48, 'Turquía', 'TR1', '🇹🇷')
ON CONFLICT (id) DO NOTHING;

-- 3. Verificar que se agregaron correctamente
SELECT 'Idiomas agregados:' as tipo, COUNT(*) as cantidad 
FROM languages 
WHERE id IN (4, 5, 7, 8);

SELECT 'Países agregados:' as tipo, COUNT(*) as cantidad 
FROM countries 
WHERE id IN (1, 4, 48);

-- 4. Mostrar todos los países para verificar
SELECT id, name, code FROM countries WHERE id IN (1, 4, 48) ORDER BY id;