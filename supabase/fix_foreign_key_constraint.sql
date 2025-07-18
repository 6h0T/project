-- Script para corregir la foreign key constraint incorrecta

-- 1. Verificar las constraints actuales
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='servers'
    AND kcu.column_name = 'category_id';

-- 2. Eliminar la constraint incorrecta
ALTER TABLE servers DROP CONSTRAINT IF EXISTS servers_category_id_fkey;

-- 3. Crear la constraint correcta apuntando a server_categories
ALTER TABLE servers 
ADD CONSTRAINT servers_category_id_fkey 
FOREIGN KEY (category_id) 
REFERENCES server_categories(id);

-- 4. Verificar que la constraint se creó correctamente
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='servers'
    AND kcu.column_name = 'category_id';

SELECT '🎉 Foreign key constraint corregida! Ahora apunta a server_categories.' as resultado;