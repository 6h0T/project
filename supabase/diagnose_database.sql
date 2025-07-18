-- Script para diagnosticar conflictos en la base de datos

-- 1. Ver todos los países existentes
SELECT id, name, code, flag_emoji FROM countries ORDER BY id;

-- 2. Ver todos los idiomas existentes  
SELECT id, name, code, flag_emoji FROM languages ORDER BY id;

-- 3. Buscar países con códigos duplicados o que podrían causar conflicto
SELECT code, COUNT(*) as count, array_agg(id) as ids, array_agg(name) as names
FROM countries 
GROUP BY code 
HAVING COUNT(*) > 1;

-- 4. Verificar si existen países con los códigos que queremos insertar
SELECT id, name, code FROM countries WHERE code IN ('US', 'GB', 'TR');

-- 5. Ver qué IDs de países están siendo usados en los servidores que fallan
SELECT DISTINCT country_id, COUNT(*) as server_count
FROM servers 
WHERE country_id IS NOT NULL
GROUP BY country_id
ORDER BY country_id;