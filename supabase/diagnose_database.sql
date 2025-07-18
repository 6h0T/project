-- ===================================
-- DIAGNÓSTICO COMPLETO DE BASE DE DATOS (VERSIÓN SEGURA)
-- Este script analiza el estado actual sin fallar por tablas faltantes
-- ===================================

-- ===================================
-- 1. VERIFICAR TABLAS EXISTENTES
-- ===================================
SELECT '=== TABLAS EXISTENTES ===' as seccion;
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ===================================
-- 2. VERIFICAR ESTRUCTURA DE TABLA SERVERS
-- ===================================
SELECT '=== ESTRUCTURA DE TABLA SERVERS ===' as seccion;

-- Verificar si la tabla servers existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'servers' AND table_schema = 'public')
        THEN 'EXISTE'
        ELSE 'NO EXISTE'
    END as servers_table_status;

-- Mostrar columnas de servers si existe
SELECT 
    'COLUMNAS DE SERVERS:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'servers' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ===================================
-- 3. VERIFICAR ESTRUCTURA DE OTRAS TABLAS RELACIONADAS
-- ===================================
SELECT '=== ESTRUCTURA DE TABLAS RELACIONADAS ===' as seccion;

-- server_categories
SELECT 
    'SERVER_CATEGORIES:' as tabla,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'server_categories' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- countries
SELECT 
    'COUNTRIES:' as tabla,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'countries' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- languages
SELECT 
    'LANGUAGES:' as tabla,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'languages' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- user_profiles
SELECT 
    'USER_PROFILES:' as tabla,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- banners
SELECT 
    'BANNERS:' as tabla,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'banners' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ===================================
-- 4. VERIFICAR ÍNDICES EXISTENTES
-- ===================================
SELECT '=== ÍNDICES EXISTENTES ===' as seccion;
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('servers', 'server_categories', 'countries', 'languages', 'user_profiles', 'banners')
ORDER BY tablename, indexname;

-- ===================================
-- 5. VERIFICAR CONSTRAINTS Y FOREIGN KEYS
-- ===================================
SELECT '=== CONSTRAINTS Y FOREIGN KEYS ===' as seccion;
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
AND tc.table_name IN ('servers', 'server_categories', 'countries', 'languages', 'user_profiles', 'banners')
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

-- ===================================
-- 6. VERIFICAR POLÍTICAS RLS
-- ===================================
SELECT '=== POLÍTICAS RLS ===' as seccion;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ===================================
-- 7. VERIFICAR TRIGGERS
-- ===================================
SELECT '=== TRIGGERS ===' as seccion;
SELECT 
    trigger_schema,
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ===================================
-- 8. VERIFICAR FUNCIONES PERSONALIZADAS
-- ===================================
SELECT '=== FUNCIONES PERSONALIZADAS ===' as seccion;
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name NOT LIKE 'pg_%'
ORDER BY routine_name;

-- ===================================
-- 9. ANÁLISIS DE COMPATIBILIDAD
-- ===================================
SELECT '=== ANÁLISIS DE COMPATIBILIDAD ===' as seccion;

-- Verificar qué columnas faltan en servers
SELECT 'COLUMNAS ESPERADAS EN SERVERS:' as info;
SELECT 
    expected_column,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'servers' 
            AND column_name = expected_column
            AND table_schema = 'public'
        ) THEN 'EXISTE'
        ELSE 'FALTA'
    END as status
FROM (
    VALUES 
        ('id'),
        ('legacy_id'),
        ('title'),
        ('description'),
        ('website'),
        ('ip_address'),
        ('experience_rate'),
        ('version'),
        ('season'),
        ('server_type'),
        ('platform'),
        ('emulator'),
        ('max_level'),
        ('country_id'),
        ('language_id'),
        ('timezone'),
        ('status'),
        ('server_status'),
        ('is_premium'),
        ('is_approved'),
        ('category_id'),
        ('user_id'),
        ('legacy_user_id'),
        ('launch_date'),
        ('created_at'),
        ('updated_at'),
        ('banner_image'),
        ('youtube_url'),
        ('votes'),
        ('premium_days'),
        ('premium_date'),
        ('email_notifications'),
        ('metadata')
) AS expected(expected_column);

-- ===================================
-- 10. VERIFICAR EXISTENCIA DE TABLAS AUXILIARES
-- ===================================
SELECT '=== ESTADO DE TABLAS AUXILIARES ===' as seccion;
SELECT 
    'TABLA' as tipo,
    'server_categories' as nombre,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'server_categories' AND table_schema = 'public') THEN 'EXISTE' ELSE 'NO EXISTE' END as estado
UNION ALL
SELECT 
    'TABLA' as tipo,
    'countries' as nombre,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'countries' AND table_schema = 'public') THEN 'EXISTE' ELSE 'NO EXISTE' END as estado
UNION ALL
SELECT 
    'TABLA' as tipo,
    'languages' as nombre,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'languages' AND table_schema = 'public') THEN 'EXISTE' ELSE 'NO EXISTE' END as estado
UNION ALL
SELECT 
    'TABLA' as tipo,
    'user_profiles' as nombre,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles' AND table_schema = 'public') THEN 'EXISTE' ELSE 'NO EXISTE' END as estado
UNION ALL
SELECT 
    'TABLA' as tipo,
    'banners' as nombre,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'banners' AND table_schema = 'public') THEN 'EXISTE' ELSE 'NO EXISTE' END as estado;

-- ===================================
-- RESUMEN FINAL
-- ===================================
SELECT '=== RESUMEN FINAL ===' as seccion;

SELECT 
    'ESTADO DE TABLAS PRINCIPALES:' as resumen,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'servers' AND table_schema = 'public') THEN '✅' ELSE '❌' END as servers,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'server_categories' AND table_schema = 'public') THEN '✅' ELSE '❌' END as categories,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'countries' AND table_schema = 'public') THEN '✅' ELSE '❌' END as countries,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'languages' AND table_schema = 'public') THEN '✅' ELSE '❌' END as languages,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles' AND table_schema = 'public') THEN '✅' ELSE '❌' END as user_profiles,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'banners' AND table_schema = 'public') THEN '✅' ELSE '❌' END as banners;

-- ===================================
-- DIAGNÓSTICO COMPLETADO
-- ===================================
SELECT '🎉 DIAGNÓSTICO COMPLETADO' as resultado;
SELECT 'Revisa los resultados arriba para identificar qué tablas/columnas faltan' as instrucciones;
SELECT 'Las tablas que muestren ❌ necesitan ser creadas' as nota;