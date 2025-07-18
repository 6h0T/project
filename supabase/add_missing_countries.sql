-- Agregar países faltantes que están causando errores en la importación
-- Basado en los errores de foreign key constraint observados

-- Países identificados en los errores:
INSERT INTO countries (id, name, code, flag_emoji) VALUES 
  (36, 'Alemania', 'DE', '🇩🇪'),
  (48, 'Turquía', 'TR', '🇹🇷'),
  (62, 'Ecuador', 'EC', '🇪🇨'),
  (65, 'Reino Unido', 'GB', '🇬🇧'),
  (153, 'Perú', 'PE', '🇵🇪'),
  (183, 'Filipinas', 'PH', '🇵🇭'),
  (190, 'Rusia', 'RU', '🇷🇺'),
  (224, 'Ucrania', 'UA', '🇺🇦'),
  (232, 'Uruguay', 'UY', '🇺🇾')
ON CONFLICT (id) DO NOTHING;

-- Verificar que se agregaron correctamente
SELECT id, name, code FROM countries WHERE id IN (36, 48, 62, 65, 153, 183, 190, 224, 232);