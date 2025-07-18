-- ===================================
-- SCRIPT COMPLETO PARA FINALIZAR LA MIGRACIÓN
-- ===================================

-- 1. Agregar categorías faltantes
INSERT INTO server_categories (id, name, slug, description) VALUES 
  (7, 'Ragnarok Online', 'ragnarok-online', 'Servidores de Ragnarok Online'),
  (10, 'Minecraft', 'minecraft', 'Servidores de Minecraft'),
  (5, 'Metin2', 'metin2', 'Servidores de Metin2')
ON CONFLICT (id) DO NOTHING;

-- 2. Agregar TODOS los países faltantes identificados en el export
INSERT INTO countries (id, name, code, flag_emoji) VALUES 
  (0, 'Desconocido', 'XX', '🌍'),
  (1, 'Estados Unidos', 'US', '🇺🇸'),
  (3, 'Canadá', 'CA', '🇨🇦'),
  (4, 'Reino Unido', 'GB', '🇬🇧'),
  (5, 'Francia', 'FR', '🇫🇷'),
  (6, 'Italia', 'IT', '🇮🇹'),
  (8, 'España', 'ES', '🇪🇸'),
  (11, 'Holanda', 'NL', '🇳🇱'),
  (16, 'Suecia', 'SE', '🇸🇪'),
  (27, 'Australia', 'AU', '🇦🇺'),
  (35, 'Japón', 'JP', '🇯🇵'),
  (36, 'Alemania', 'DE', '🇩🇪'),
  (39, 'Corea del Sur', 'KR', '🇰🇷'),
  (44, 'China', 'CN', '🇨🇳'),
  (45, 'India', 'IN', '🇮🇳'),
  (46, 'Tailandia', 'TH', '🇹🇭'),
  (47, 'Singapur', 'SG', '🇸🇬'),
  (48, 'Turquía', 'TR', '🇹🇷'),
  (49, 'Grecia', 'GR', '🇬🇷'),
  (54, 'Noruega', 'NO', '🇳🇴'),
  (55, 'Finlandia', 'FI', '🇫🇮'),
  (56, 'Dinamarca', 'DK', '🇩🇰'),
  (58, 'Bélgica', 'BE', '🇧🇪'),
  (61, 'Suiza', 'CH', '🇨🇭'),
  (62, 'Ecuador', 'EC', '🇪🇨'),
  (65, 'Reino Unido', 'GB', '🇬🇧'),
  (67, 'Austria', 'AT', '🇦🇹'),
  (69, 'República Checa', 'CZ', '🇨🇿'),
  (71, 'Hungría', 'HU', '🇭🇺'),
  (73, 'Eslovaquia', 'SK', '🇸🇰'),
  (76, 'Eslovenia', 'SI', '🇸🇮'),
  (85, 'Croacia', 'HR', '🇭🇷'),
  (92, 'Serbia', 'RS', '🇷🇸'),
  (97, 'Bosnia', 'BA', '🇧🇦'),
  (99, 'Montenegro', 'ME', '🇲🇪'),
  (106, 'Bulgaria', 'BG', '🇧🇬'),
  (129, 'Rumania', 'RO', '🇷🇴'),
  (135, 'Moldavia', 'MD', '🇲🇩'),
  (153, 'Perú', 'PE', '🇵🇪'),
  (170, 'Bolivia', 'BO', '🇧🇴'),
  (172, 'Paraguay', 'PY', '🇵🇾'),
  (175, 'Guatemala', 'GT', '🇬🇹'),
  (178, 'Honduras', 'HN', '🇭🇳'),
  (179, 'El Salvador', 'SV', '🇸🇻'),
  (180, 'Nicaragua', 'NI', '🇳🇮'),
  (183, 'Filipinas', 'PH', '🇵🇭'),
  (185, 'Costa Rica', 'CR', '🇨🇷'),
  (187, 'Panamá', 'PA', '🇵🇦'),
  (190, 'Rusia', 'RU', '🇷🇺'),
  (194, 'Uzbequistán', 'UZ', '🇺🇿'),
  (219, 'Kazajistán', 'KZ', '🇰🇿'),
  (224, 'Ucrania', 'UA', '🇺🇦'),
  (228, 'Bielorrusia', 'BY', '🇧🇾'),
  (230, 'Lituania', 'LT', '🇱🇹'),
  (232, 'Uruguay', 'UY', '🇺🇾'),
  (233, 'Letonia', 'LV', '🇱🇻')
ON CONFLICT (id) DO NOTHING;

-- 3. Agregar idiomas faltantes si es necesario
INSERT INTO languages (id, name, code, flag_emoji) VALUES 
  (2, 'Alemán', 'de', '🇩🇪')
ON CONFLICT (id) DO NOTHING;

-- 4. Verificar que todo se agregó correctamente
SELECT 'Categorías agregadas:' as tipo, COUNT(*) as cantidad FROM server_categories WHERE id IN (5, 7, 10);
SELECT 'Países agregados:' as tipo, COUNT(*) as cantidad FROM countries WHERE id IN (0,1,3,4,5,6,8,11,16,27,35,36,39,44,45,46,47,48,49,54,55,56,58,61,62,65,67,69,71,73,76,85,92,97,99,106,129,135,153,170,172,175,178,179,180,183,185,187,190,194,219,224,228,230,232,233);
SELECT 'Idiomas agregados:' as tipo, COUNT(*) as cantidad FROM languages WHERE id = 2;

-- 5. Mostrar estadísticas finales
SELECT 
  'servers' as tabla,
  COUNT(*) as total_registros
FROM servers
UNION ALL
SELECT 
  'server_categories' as tabla,
  COUNT(*) as total_registros
FROM server_categories
UNION ALL
SELECT 
  'countries' as tabla,
  COUNT(*) as total_registros
FROM countries
UNION ALL
SELECT 
  'languages' as tabla,
  COUNT(*) as total_registros
FROM languages;

SELECT '🎉 Migración completada! Ahora puedes ejecutar la importación nuevamente.' as resultado;