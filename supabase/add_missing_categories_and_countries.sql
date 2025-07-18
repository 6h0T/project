-- ===================================
-- AGREGAR TODAS LAS CATEGORÍAS Y PAÍSES FALTANTES
-- ===================================

-- 1. Agregar TODAS las categorías faltantes identificadas en el export
INSERT INTO server_categories (id, name, slug, description) VALUES 
  (15, 'Tibia', 'tibia', 'Servidores de Tibia'),
  (16, 'Cabal Online', 'cabal-online', 'Servidores de Cabal Online'),
  (17, 'Knight Online', 'knight-online', 'Servidores de Knight Online'),
  (18, 'Flyff', 'flyff', 'Servidores de Flyff (Fly For Fun)')
ON CONFLICT (id) DO NOTHING;

-- 2. Agregar TODOS los países faltantes (lista completa)
INSERT INTO countries (id, name, code, flag_emoji) VALUES 
  (1, 'Estados Unidos', 'US', '🇺🇸'),
  (4, 'Reino Unido', 'GB', '🇬🇧'),
  (29, 'Brasil', 'BR', '🇧🇷'),
  (30, 'Brasil', 'BR', '🇧🇷'),
  (35, 'Japón', 'JP', '🇯🇵'),
  (36, 'Alemania', 'DE', '🇩🇪'),
  (39, 'Corea del Sur', 'KR', '🇰🇷'),
  (41, 'Chile', 'CL', '🇨🇱'),
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
  (63, 'Estados Unidos', 'US', '🇺🇸'),
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
  (131, 'Polonia', 'PL', '🇵🇱'),
  (135, 'Moldavia', 'MD', '🇲🇩'),
  (153, 'Perú', 'PE', '🇵🇪'),
  (170, 'Bolivia', 'BO', '🇧🇴'),
  (172, 'Paraguay', 'PY', '🇵🇾'),
  (173, 'México', 'MX', '🇲🇽'),
  (175, 'Guatemala', 'GT', '🇬🇹'),
  (178, 'Honduras', 'HN', '🇭🇳'),
  (179, 'El Salvador', 'SV', '🇸🇻'),
  (180, 'Nicaragua', 'NI', '🇳🇮'),
  (183, 'Filipinas', 'PH', '🇵🇭'),
  (185, 'Costa Rica', 'CR', '🇨🇷'),
  (187, 'Panamá', 'PA', '🇵🇦'),
  (189, 'Portugal', 'PT', '🇵🇹'),
  (190, 'Rusia', 'RU', '🇷🇺'),
  (194, 'Uzbequistán', 'UZ', '🇺🇿'),
  (219, 'Kazajistán', 'KZ', '🇰🇿'),
  (224, 'Ucrania', 'UA', '🇺🇦'),
  (227, 'Turquía', 'TR', '🇹🇷'),
  (228, 'Bielorrusia', 'BY', '🇧🇾'),
  (230, 'Lituania', 'LT', '🇱🇹'),
  (232, 'Uruguay', 'UY', '🇺🇾'),
  (233, 'Letonia', 'LV', '🇱🇻'),
  (235, 'Colombia', 'CO', '🇨🇴'),
  (238, 'Venezuela', 'VE', '🇻🇪')
ON CONFLICT (id) DO NOTHING;

-- 3. Verificar que todo se agregó correctamente
SELECT 'Categorías agregadas:' as tipo, COUNT(*) as cantidad 
FROM server_categories 
WHERE id IN (15, 16, 17, 18);

SELECT 'Países agregados:' as tipo, COUNT(*) as cantidad 
FROM countries 
WHERE id IN (1,4,29,30,35,36,39,41,44,45,46,47,48,49,54,55,56,58,61,62,63,65,67,69,71,73,76,85,92,97,99,106,129,131,135,153,170,172,173,175,178,179,180,183,185,187,189,190,194,219,224,227,228,230,232,233,235,238);

-- 4. Mostrar estadísticas finales
SELECT 
  'server_categories' as tabla,
  COUNT(*) as total_registros
FROM server_categories
UNION ALL
SELECT 
  'countries' as tabla,
  COUNT(*) as total_registros
FROM countries;

SELECT '🎉 Todas las categorías y países faltantes agregados! Ahora puedes ejecutar la importación nuevamente.' as resultado;