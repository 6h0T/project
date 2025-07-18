-- ===================================
-- SCRIPT FINAL PARA AGREGAR TODOS LOS DATOS FALTANTES
-- ===================================

-- 1. Agregar categorías faltantes identificadas (YA AGREGADAS SEGÚN EL LOG)
INSERT INTO server_categories (id, name, slug, description) VALUES 
  (15, 'Conquer Online', 'conquer-online', 'Servidores de Conquer Online'),
  (16, 'Argentum Online', 'argentum-online', 'Servidores de Argentum Online'),
  (17, 'Priston Tale', 'priston-tale', 'Servidores de Priston Tale'),
  (18, 'Gunbound', 'gunbound', 'Servidores de Gunbound')
ON CONFLICT (id) DO NOTHING;

-- 2. Agregar idiomas faltantes identificados
INSERT INTO languages (id, name, code, flag_emoji) VALUES 
  (4, 'Francés', 'fr', '🇫🇷'),
  (5, 'Italiano', 'it', '🇮🇹'),
  (7, 'Polaco', 'pl', '🇵🇱'),
  (8, 'Turco', 'tr', '🇹🇷')
ON CONFLICT (id) DO NOTHING;

-- 3. Agregar países faltantes con códigos únicos para evitar conflictos
INSERT INTO countries (id, name, code, flag_emoji) VALUES 
  (1, 'Estados Unidos', 'US_1', '🇺🇸'),
  (4, 'Reino Unido', 'GB_4', '🇬�'),
  (48, 'Turquía', 'TR_48', '🇹🇷')
ON CONFLICT (id) DO NOTHING;

-- 4. Verificar que todo se agregó correctamente
SELECT 'Categorías agregadas:' as tipo, COUNT(*) as cantidad 
FROM server_categories 
WHERE id IN (15, 16, 17, 18);

SELECT 'Idiomas agregados:' as tipo, COUNT(*) as cantidad 
FROM languages 
WHERE id IN (4, 5, 7, 8);

SELECT 'Países agregados:' as tipo, COUNT(*) as cantidad 
FROM countries 
WHERE id IN (1, 4, 48);

-- 5. Mostrar estadísticas finales
SELECT 
  'server_categories' as tabla,
  COUNT(*) as total_registros
FROM server_categories
UNION ALL
SELECT 
  'languages' as tabla,
  COUNT(*) as total_registros
FROM languages
UNION ALL
SELECT 
  'countries' as tabla,
  COUNT(*) as total_registros
FROM countries;

SELECT '🎉 TODOS los datos faltantes agregados! Ahora puedes ejecutar la importación final.' as resultado;