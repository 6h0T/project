// Script para analizar Supabase y generar migración automática
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

if (!supabaseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL no está configurada en .env.local');
    process.exit(1);
}

if (!supabaseServiceKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY no está configurada en .env.local');
    console.log('💡 Obtén tu Service Role Key desde: https://supabase.com/dashboard > Settings > API');
    process.exit(1);
}

// Estructura esperada para la importación
const EXPECTED_STRUCTURE = {
    tables: {
        servers: {
            columns: [
                { name: 'id', type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
                { name: 'legacy_id', type: 'integer', nullable: true, unique: true },
                { name: 'title', type: 'text', nullable: false },
                { name: 'description', type: 'text', nullable: true, default: "''" },
                { name: 'website', type: 'text', nullable: true, default: "''" },
                { name: 'ip_address', type: 'text', nullable: true, default: "''" },
                { name: 'experience_rate', type: 'integer', nullable: true, default: '1' },
                { name: 'version', type: 'text', nullable: true, default: "''" },
                { name: 'season', type: 'text', nullable: true, default: "''" },
                { name: 'server_type', type: 'text', nullable: true, default: "''" },
                { name: 'platform', type: 'text', nullable: true, default: "''" },
                { name: 'emulator', type: 'text', nullable: true, default: "''" },
                { name: 'max_level', type: 'text', nullable: true, default: "''" },
                { name: 'country_id', type: 'integer', nullable: true },
                { name: 'language_id', type: 'integer', nullable: false, default: '1' },
                { name: 'timezone', type: 'text', nullable: true, default: "'0'" },
                { name: 'status', type: 'text', nullable: true, default: "'inactive'" },
                { name: 'server_status', type: 'integer', nullable: true, default: '1' },
                { name: 'is_premium', type: 'boolean', nullable: true, default: 'false' },
                { name: 'is_approved', type: 'boolean', nullable: true, default: 'false' },
                { name: 'category_id', type: 'integer', nullable: false },
                { name: 'user_id', type: 'uuid', nullable: true },
                { name: 'legacy_user_id', type: 'integer', nullable: true },
                { name: 'launch_date', type: 'timestamptz', nullable: true },
                { name: 'created_at', type: 'timestamptz', nullable: true, default: 'now()' },
                { name: 'updated_at', type: 'timestamptz', nullable: true, default: 'now()' },
                { name: 'banner_image', type: 'text', nullable: true, default: "''" },
                { name: 'youtube_url', type: 'text', nullable: true, default: "''" },
                { name: 'votes', type: 'integer', nullable: true, default: '0' },
                { name: 'premium_days', type: 'integer', nullable: true, default: '0' },
                { name: 'premium_date', type: 'timestamptz', nullable: true },
                { name: 'email_notifications', type: 'boolean', nullable: true, default: 'false' },
                { name: 'metadata', type: 'jsonb', nullable: true, default: "'{}'" }
            ],
            indexes: [
                'idx_servers_status',
                'idx_servers_category',
                'idx_servers_country',
                'idx_servers_language',
                'idx_servers_premium',
                'idx_servers_approved',
                'idx_servers_user',
                'idx_servers_legacy_id',
                'idx_servers_legacy_user',
                'idx_servers_listing'
            ],
            constraints: [
                'fk_servers_category',
                'fk_servers_country',
                'fk_servers_language',
                'fk_servers_user'
            ]
        },
        server_categories: {
            columns: [
                { name: 'id', type: 'integer', nullable: false },
                { name: 'name', type: 'text', nullable: false },
                { name: 'slug', type: 'text', nullable: false, unique: true },
                { name: 'description', type: 'text', nullable: true, default: "''" },
                { name: 'icon', type: 'text', nullable: true, default: "''" },
                { name: 'created_at', type: 'timestamptz', nullable: true, default: 'now()' }
            ],
            data: [
                { id: 1, name: 'Mu Online', slug: 'mu-online', description: 'Servidores de Mu Online' },
                { id: 3, name: 'Lineage II', slug: 'lineage-2', description: 'Servidores de Lineage II' },
                { id: 7, name: 'Ragnarok Online', slug: 'ragnarok-online', description: 'Servidores de Ragnarok Online' },
                { id: 10, name: 'Minecraft', slug: 'minecraft', description: 'Servidores de Minecraft' },
                { id: 11, name: 'Counter-Strike', slug: 'counter-strike', description: 'Servidores de Counter-Strike' },
                { id: 12, name: 'Perfect World', slug: 'perfect-world', description: 'Servidores de Perfect World' },
                { id: 13, name: 'Silkroad Online', slug: 'silkroad-online', description: 'Servidores de Silkroad Online' },
                { id: 14, name: 'Aion', slug: 'aion', description: 'Servidores de Aion' }
            ]
        },
        countries: {
            columns: [
                { name: 'id', type: 'integer', nullable: false },
                { name: 'name', type: 'text', nullable: false },
                { name: 'code', type: 'text', nullable: false, unique: true },
                { name: 'flag_emoji', type: 'text', nullable: true, default: "''" },
                { name: 'created_at', type: 'timestamptz', nullable: true, default: 'now()' }
            ],
            data: [
                { id: 10, name: 'Argentina', code: 'AR', flag_emoji: '🇦🇷' },
                { id: 12, name: 'Argentina', code: 'AR', flag_emoji: '🇦🇷' },
                { id: 29, name: 'Brasil', code: 'BR', flag_emoji: '🇧🇷' },
                { id: 30, name: 'Brasil', code: 'BR', flag_emoji: '🇧🇷' },
                { id: 41, name: 'Chile', code: 'CL', flag_emoji: '🇨🇱' },
                { id: 63, name: 'Estados Unidos', code: 'US', flag_emoji: '🇺🇸' },
                { id: 131, name: 'Polonia', code: 'PL', flag_emoji: '🇵🇱' },
                { id: 173, name: 'México', code: 'MX', flag_emoji: '🇲🇽' },
                { id: 189, name: 'Portugal', code: 'PT', flag_emoji: '🇵🇹' },
                { id: 227, name: 'Turquía', code: 'TR', flag_emoji: '🇹🇷' },
                { id: 235, name: 'Colombia', code: 'CO', flag_emoji: '🇨🇴' },
                { id: 238, name: 'Venezuela', code: 'VE', flag_emoji: '🇻🇪' }
            ]
        },
        languages: {
            columns: [
                { name: 'id', type: 'integer', nullable: false },
                { name: 'name', type: 'text', nullable: false },
                { name: 'code', type: 'text', nullable: false, unique: true },
                { name: 'flag_emoji', type: 'text', nullable: true, default: "''" },
                { name: 'created_at', type: 'timestamptz', nullable: true, default: 'now()' }
            ],
            data: [
                { id: 1, name: 'Inglés', code: 'en', flag_emoji: '🇺🇸' },
                { id: 3, name: 'Inglés', code: 'en', flag_emoji: '🇺🇸' },
                { id: 9, name: 'Español', code: 'es', flag_emoji: '🇪🇸' },
                { id: 10, name: 'Portugués', code: 'pt', flag_emoji: '🇵🇹' }
            ]
        }
    }
};

async function analyzeDatabase() {
    console.log('🔍 Analizando estructura actual de Supabase...\n');

    const analysis = {
        existingTables: {},
        missingTables: [],
        missingColumns: {},
        missingIndexes: {},
        missingConstraints: {},
        missingData: {},
        migrationScript: []
    };

    try {
        // 1. Verificar tablas existentes
        console.log('📋 Verificando tablas existentes...');
        const { data: tables, error: tablesError } = await supabase
            .rpc('get_table_info');

        if (tablesError) {
            // Si la función no existe, usar consulta directa
            const { data: directTables } = await supabase
                .from('information_schema.tables')
                .select('table_name')
                .eq('table_schema', 'public')
                .in('table_name', ['servers', 'server_categories', 'countries', 'languages', 'user_profiles', 'banners']);

            if (directTables) {
                analysis.existingTables = directTables.reduce((acc, table) => {
                    acc[table.table_name] = true;
                    return acc;
                }, {});
            }
        }

        // 2. Verificar cada tabla esperada
        for (const [tableName, tableConfig] of Object.entries(EXPECTED_STRUCTURE.tables)) {
            console.log(`\n🔍 Analizando tabla: ${tableName}`);

            // Verificar si la tabla existe
            const tableExists = await checkTableExists(tableName);
            
            if (!tableExists) {
                console.log(`❌ Tabla ${tableName} no existe`);
                analysis.missingTables.push(tableName);
                analysis.missingColumns[tableName] = tableConfig.columns;
                continue;
            }

            console.log(`✅ Tabla ${tableName} existe`);
            analysis.existingTables[tableName] = true;

            // Verificar columnas
            const existingColumns = await getTableColumns(tableName);
            const missingColumns = findMissingColumns(tableConfig.columns, existingColumns);
            
            if (missingColumns.length > 0) {
                console.log(`⚠️  Faltan ${missingColumns.length} columnas en ${tableName}:`);
                missingColumns.forEach(col => console.log(`   - ${col.name} (${col.type})`));
                analysis.missingColumns[tableName] = missingColumns;
            } else {
                console.log(`✅ Todas las columnas existen en ${tableName}`);
            }

            // Verificar datos (para tablas auxiliares)
            if (tableConfig.data) {
                const missingData = await findMissingData(tableName, tableConfig.data);
                if (missingData.length > 0) {
                    console.log(`⚠️  Faltan ${missingData.length} registros en ${tableName}`);
                    analysis.missingData[tableName] = missingData;
                } else {
                    console.log(`✅ Todos los datos existen en ${tableName}`);
                }
            }

            // Verificar índices
            if (tableConfig.indexes) {
                const existingIndexes = await getTableIndexes(tableName);
                const missingIndexes = tableConfig.indexes.filter(idx => !existingIndexes.includes(idx));
                if (missingIndexes.length > 0) {
                    console.log(`⚠️  Faltan ${missingIndexes.length} índices en ${tableName}`);
                    analysis.missingIndexes[tableName] = missingIndexes;
                }
            }

            // Verificar constraints
            if (tableConfig.constraints) {
                const existingConstraints = await getTableConstraints(tableName);
                const missingConstraints = tableConfig.constraints.filter(c => !existingConstraints.includes(c));
                if (missingConstraints.length > 0) {
                    console.log(`⚠️  Faltan ${missingConstraints.length} constraints en ${tableName}`);
                    analysis.missingConstraints[tableName] = missingConstraints;
                }
            }
        }

        // 3. Generar script de migración
        console.log('\n🔧 Generando script de migración...');
        analysis.migrationScript = generateMigrationScript(analysis);

        // 4. Guardar script
        const scriptContent = analysis.migrationScript.join('\n');
        fs.writeFileSync('supabase/auto_migration.sql', scriptContent);
        console.log('📄 Script de migración guardado en: supabase/auto_migration.sql');

        // 5. Mostrar resumen
        showAnalysisSummary(analysis);

        return analysis;

    } catch (error) {
        console.error('❌ Error durante el análisis:', error);
        throw error;
    }
}

async function checkTableExists(tableName) {
    try {
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
        
        return !error || !error.message.includes('does not exist');
    } catch (err) {
        return false;
    }
}

async function getTableColumns(tableName) {
    try {
        // Intentar obtener información de columnas usando una consulta simple
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(0);

        if (error) return [];

        // Si tenemos datos, podemos inferir las columnas
        // Para una verificación más precisa, necesitaríamos acceso directo a information_schema
        return [];
    } catch (err) {
        return [];
    }
}

function findMissingColumns(expectedColumns, existingColumns) {
    // Simplificado - en un entorno real necesitaríamos acceso a information_schema
    return expectedColumns.filter(expected => 
        !existingColumns.some(existing => existing.name === expected.name)
    );
}

async function findMissingData(tableName, expectedData) {
    try {
        const { data: existingData, error } = await supabase
            .from(tableName)
            .select('id');

        if (error) return expectedData;

        const existingIds = existingData.map(row => row.id);
        return expectedData.filter(expected => !existingIds.includes(expected.id));
    } catch (err) {
        return expectedData;
    }
}

async function getTableIndexes(tableName) {
    // Simplificado - retorna array vacío
    return [];
}

async function getTableConstraints(tableName) {
    // Simplificado - retorna array vacío
    return [];
}

function generateMigrationScript(analysis) {
    const script = [
        '-- ===================================',
        '-- SCRIPT DE MIGRACIÓN AUTOMÁTICA',
        `-- Generado el: ${new Date().toISOString()}`,
        '-- ===================================',
        ''
    ];

    // 1. Crear tablas faltantes
    if (analysis.missingTables.length > 0) {
        script.push('-- ===================================');
        script.push('-- 1. CREAR TABLAS FALTANTES');
        script.push('-- ===================================');
        script.push('');

        analysis.missingTables.forEach(tableName => {
            const tableConfig = EXPECTED_STRUCTURE.tables[tableName];
            script.push(`-- Crear tabla ${tableName}`);
            script.push(`CREATE TABLE IF NOT EXISTS ${tableName} (`);
            
            const columnDefs = tableConfig.columns.map(col => {
                let def = `  ${col.name} ${col.type}`;
                if (!col.nullable) def += ' NOT NULL';
                if (col.default) def += ` DEFAULT ${col.default}`;
                if (col.unique) def += ' UNIQUE';
                return def;
            });
            
            script.push(columnDefs.join(',\n'));
            script.push(');');
            script.push('');
        });
    }

    // 2. Agregar columnas faltantes
    Object.entries(analysis.missingColumns).forEach(([tableName, columns]) => {
        if (columns.length > 0 && !analysis.missingTables.includes(tableName)) {
            script.push(`-- Agregar columnas faltantes a ${tableName}`);
            columns.forEach(col => {
                script.push(`ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}${col.nullable ? '' : ' NOT NULL'}${col.default ? ` DEFAULT ${col.default}` : ''};`);
            });
            script.push('');
        }
    });

    // 3. Insertar datos faltantes
    Object.entries(analysis.missingData).forEach(([tableName, data]) => {
        if (data.length > 0) {
            script.push(`-- Insertar datos faltantes en ${tableName}`);
            data.forEach(row => {
                const columns = Object.keys(row).join(', ');
                const values = Object.values(row).map(v => typeof v === 'string' ? `'${v}'` : v).join(', ');
                script.push(`INSERT INTO ${tableName} (${columns}) VALUES (${values}) ON CONFLICT (id) DO NOTHING;`);
            });
            script.push('');
        }
    });

    // 4. Crear índices faltantes
    Object.entries(analysis.missingIndexes).forEach(([tableName, indexes]) => {
        if (indexes.length > 0) {
            script.push(`-- Crear índices faltantes para ${tableName}`);
            indexes.forEach(indexName => {
                // Mapear nombres de índices a definiciones
                const indexDefs = {
                    'idx_servers_status': 'CREATE INDEX IF NOT EXISTS idx_servers_status ON servers (status);',
                    'idx_servers_category': 'CREATE INDEX IF NOT EXISTS idx_servers_category ON servers (category_id);',
                    'idx_servers_country': 'CREATE INDEX IF NOT EXISTS idx_servers_country ON servers (country_id);',
                    'idx_servers_language': 'CREATE INDEX IF NOT EXISTS idx_servers_language ON servers (language_id);',
                    'idx_servers_premium': 'CREATE INDEX IF NOT EXISTS idx_servers_premium ON servers (is_premium);',
                    'idx_servers_approved': 'CREATE INDEX IF NOT EXISTS idx_servers_approved ON servers (is_approved);',
                    'idx_servers_user': 'CREATE INDEX IF NOT EXISTS idx_servers_user ON servers (user_id);',
                    'idx_servers_legacy_id': 'CREATE INDEX IF NOT EXISTS idx_servers_legacy_id ON servers (legacy_id);',
                    'idx_servers_legacy_user': 'CREATE INDEX IF NOT EXISTS idx_servers_legacy_user ON servers (legacy_user_id);',
                    'idx_servers_listing': 'CREATE INDEX IF NOT EXISTS idx_servers_listing ON servers (status, is_approved, category_id, created_at DESC);'
                };
                
                if (indexDefs[indexName]) {
                    script.push(indexDefs[indexName]);
                }
            });
            script.push('');
        }
    });

    // 5. Habilitar RLS y crear políticas
    script.push('-- ===================================');
    script.push('-- 5. CONFIGURAR SEGURIDAD RLS');
    script.push('-- ===================================');
    script.push('');
    
    Object.keys(EXPECTED_STRUCTURE.tables).forEach(tableName => {
        script.push(`ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;`);
    });
    
    script.push('');
    script.push('-- Políticas básicas de lectura pública para tablas auxiliares');
    script.push('DO $$');
    script.push('BEGIN');
    
    ['server_categories', 'countries', 'languages'].forEach(tableName => {
        script.push(`    -- Política para ${tableName}`);
        script.push(`    IF NOT EXISTS (`);
        script.push(`        SELECT 1 FROM pg_policies`);
        script.push(`        WHERE tablename = '${tableName}'`);
        script.push(`        AND policyname = 'Everyone can read ${tableName}'`);
        script.push(`    ) THEN`);
        script.push(`        CREATE POLICY "Everyone can read ${tableName}"`);
        script.push(`        ON ${tableName} FOR SELECT TO anon, authenticated USING (true);`);
        script.push(`    END IF;`);
        script.push('');
    });
    
    script.push('END $$;');

    script.push('');
    script.push('-- ===================================');
    script.push('-- MIGRACIÓN COMPLETADA');
    script.push('-- ===================================');
    script.push('SELECT \'🎉 Migración automática completada exitosamente!\' as resultado;');

    return script;
}

function showAnalysisSummary(analysis) {
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMEN DEL ANÁLISIS');
    console.log('='.repeat(50));

    console.log(`\n📋 Tablas existentes: ${Object.keys(analysis.existingTables).length}`);
    Object.keys(analysis.existingTables).forEach(table => {
        console.log(`   ✅ ${table}`);
    });

    if (analysis.missingTables.length > 0) {
        console.log(`\n❌ Tablas faltantes: ${analysis.missingTables.length}`);
        analysis.missingTables.forEach(table => {
            console.log(`   - ${table}`);
        });
    }

    const totalMissingColumns = Object.values(analysis.missingColumns).reduce((sum, cols) => sum + cols.length, 0);
    if (totalMissingColumns > 0) {
        console.log(`\n⚠️  Columnas faltantes: ${totalMissingColumns}`);
        Object.entries(analysis.missingColumns).forEach(([table, columns]) => {
            if (columns.length > 0) {
                console.log(`   ${table}: ${columns.length} columnas`);
            }
        });
    }

    const totalMissingData = Object.values(analysis.missingData).reduce((sum, data) => sum + data.length, 0);
    if (totalMissingData > 0) {
        console.log(`\n📝 Registros faltantes: ${totalMissingData}`);
        Object.entries(analysis.missingData).forEach(([table, data]) => {
            if (data.length > 0) {
                console.log(`   ${table}: ${data.length} registros`);
            }
        });
    }

    console.log('\n🚀 PRÓXIMOS PASOS:');
    console.log('1. Ejecutar: supabase/auto_migration.sql en Supabase SQL Editor');
    console.log('2. Ejecutar: node scripts/import-from-php.js export_2025-07-16_15-44-50.json');
    console.log('\n' + '='.repeat(50));
}

// Ejecutar análisis
if (require.main === module) {
    analyzeDatabase()
        .then(() => {
            console.log('\n✅ Análisis completado exitosamente');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Error durante el análisis:', error);
            process.exit(1);
        });
}

module.exports = { analyzeDatabase };