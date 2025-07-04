-- =====================================
-- VERIFICAR ESTRUCTURA DE user_profiles (CORREGIDO)
-- =====================================

-- Corrección: Eliminar ambigüedad en column reference "constraint_name"

-- =====================================
-- PASO 1: MOSTRAR ESTRUCTURA COMPLETA
-- =====================================

-- Mostrar todas las columnas de user_profiles
SELECT 
    'ESTRUCTURA COMPLETA:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================
-- PASO 2: MOSTRAR CONSTRAINS Y CLAVES (CORREGIDO)
-- =====================================

-- Mostrar restricciones (primary key, foreign keys, etc.)
SELECT 
    'CONSTRAINTS:' as info,
    tc.constraint_name,
    tc.constraint_type,
    ccu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu 
    ON tc.constraint_name = ccu.constraint_name
    AND tc.table_schema = ccu.table_schema
WHERE tc.table_name = 'user_profiles' 
AND tc.table_schema = 'public';

-- =====================================
-- PASO 3: VERIFICAR DATOS EXISTENTES (MUESTRA)
-- =====================================

-- Mostrar solo los tipos de columna y primera fila (sin datos sensibles)
SELECT 
    'MUESTRA DE DATOS:' as info;

-- Contar registros
SELECT 
    'TOTAL REGISTROS:' as info,
    COUNT(*) as total_users
FROM user_profiles;

-- =====================================
-- PASO 4: IDENTIFICAR COLUMNA DE USUARIO
-- =====================================

-- Buscar columnas que podrían ser el ID del usuario
SELECT 
    'POSIBLES COLUMNAS DE USUARIO:' as info,
    column_name,
    data_type,
    CASE 
        WHEN column_name = 'id' THEN '← PROBABLEMENTE ESTA'
        WHEN column_name ILIKE '%user%' THEN '← POSIBLE'
        WHEN data_type = 'uuid' THEN '← UUID (revisar)'
        ELSE ''
    END as notas
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public'
AND (
    column_name ILIKE '%user%' 
    OR column_name ILIKE '%id%'
    OR data_type = 'uuid'
)
ORDER BY 
    CASE WHEN column_name = 'id' THEN 1 ELSE 2 END,
    column_name;

-- =====================================
-- PASO 5: VERIFICAR POLÍTICAS RLS ACTUALES
-- =====================================

-- Mostrar políticas activas
SELECT 
    'POLÍTICAS RLS ACTIVAS:' as info,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY cmd, policyname;

-- Verificar estado de RLS
SELECT 
    'ESTADO RLS:' as info,
    tablename,
    rowsecurity as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'user_profiles') as policy_count
FROM pg_tables 
WHERE tablename = 'user_profiles';

-- =====================================
-- PASO 6: PRUEBA DE FUNCIONAMIENTO
-- =====================================

-- Verificar función admin
SELECT 
    'FUNCIÓN ADMIN:' as info,
    proname as function_name,
    prosrc as function_body
FROM pg_proc 
WHERE proname = 'is_admin_simple';

-- =====================================
-- INFORMACIÓN PARA CORRECCIÓN
-- =====================================

DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'VERIFICACIÓN COMPLETADA';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Revisar resultados arriba para:';
    RAISE NOTICE '- Estructura completa de user_profiles';
    RAISE NOTICE '- Constraints y claves';
    RAISE NOTICE '- Columnas posibles para usuario';
    RAISE NOTICE '- Políticas RLS activas';
    RAISE NOTICE '- Estado de RLS';
    RAISE NOTICE '';
    RAISE NOTICE 'Si las políticas están activas, el dashboard debería funcionar';
    RAISE NOTICE '========================================';
END $$; 