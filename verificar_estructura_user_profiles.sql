-- =====================================
-- VERIFICAR ESTRUCTURA DE user_profiles
-- =====================================

-- Error: column "user_id" does not exist
-- Necesitamos identificar el nombre correcto de la columna

-- =====================================
-- PASO 1: MOSTRAR ESTRUCTURA COMPLETA
-- =====================================

-- Mostrar todas las columnas de user_profiles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================
-- PASO 2: MOSTRAR CONSTRAINS Y CLAVES
-- =====================================

-- Mostrar restricciones (primary key, foreign keys, etc.)
SELECT 
    constraint_name,
    constraint_type,
    column_name
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu 
    ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'user_profiles' 
AND tc.table_schema = 'public';

-- =====================================
-- PASO 3: VERIFICAR DATOS EXISTENTES
-- =====================================

-- Mostrar una muestra de datos (sin información sensible)
SELECT 
    'Datos de muestra (primeras 3 filas):' as info;

-- Mostrar estructura con datos de ejemplo
SELECT *
FROM user_profiles 
LIMIT 3;

-- =====================================
-- PASO 4: IDENTIFICAR COLUMNA DE USUARIO
-- =====================================

-- Buscar columnas que podrían ser el ID del usuario
SELECT 
    'Posibles columnas de usuario:' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public'
AND (
    column_name ILIKE '%user%' 
    OR column_name ILIKE '%id%'
    OR data_type = 'uuid'
);

-- =====================================
-- INFORMACIÓN PARA CORRECCIÓN
-- =====================================

DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'VERIFICACIÓN DE ESTRUCTURA user_profiles';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'ERROR: column "user_id" does not exist';
    RAISE NOTICE '';
    RAISE NOTICE 'Necesitamos identificar:';
    RAISE NOTICE '1. Nombre correcto de la columna de usuario';
    RAISE NOTICE '2. Estructura completa de la tabla';
    RAISE NOTICE '3. Relaciones con auth.users';
    RAISE NOTICE '';
    RAISE NOTICE 'Revisar resultados arriba para:';
    RAISE NOTICE '- Columnas disponibles';
    RAISE NOTICE '- Tipos de datos';
    RAISE NOTICE '- Constrains y claves';
    RAISE NOTICE '========================================';
END $$; 