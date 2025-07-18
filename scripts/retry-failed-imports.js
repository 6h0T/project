// Script para reintentar la importación de servidores que fallaron
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function retryFailedImports() {
    try {
        console.log('🔄 Reintentando importación de servidores que fallaron...\n');

        // Leer archivo JSON exportado
        const jsonFile = process.argv[2] || 'export_2025-07-16_15-44-50.json';
        const data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));

        // Obtener IDs de servidores ya importados
        const { data: existingServers, error: fetchError } = await supabase
            .from('servers')
            .select('legacy_id')
            .not('legacy_id', 'is', null);

        if (fetchError) {
            console.error('❌ Error obteniendo servidores existentes:', fetchError);
            return;
        }

        const existingLegacyIds = new Set(existingServers.map(s => s.legacy_id));
        console.log(`📊 Servidores ya importados: ${existingLegacyIds.size}`);

        // Función helper para convertir valores de forma segura
        const safeParseInt = (value, defaultValue = null) => {
            if (value === null || value === undefined || value === '' || value === '0' || value === 0) {
                return defaultValue;
            }
            
            if (typeof value === 'string' && value.trim() === '') {
                return defaultValue;
            }
            
            const cleanValue = value.toString().trim().replace(/x$/i, '');
            
            if (cleanValue === '' || cleanValue === '0') {
                return defaultValue;
            }
            
            const parsed = parseInt(cleanValue, 10);
            return isNaN(parsed) || parsed <= 0 ? defaultValue : parsed;
        };

        const safeString = (value, defaultValue = '') => {
            if (value === null || value === undefined || value === '') {
                return defaultValue;
            }
            return value.toString().trim() || defaultValue;
        };

        const safeDate = (value) => {
            if (!value || value === '0000-00-00 00:00:00' || value === '2019-01-01 00:00:00' || value === null) {
                return null;
            }
            try {
                const date = new Date(value);
                return isNaN(date.getTime()) ? null : date.toISOString();
            } catch (err) {
                return null;
            }
        };

        // Filtrar solo servidores que no se importaron
        const failedServers = data.servers.filter(server => {
            const legacyId = safeParseInt(server.id);
            return legacyId && !existingLegacyIds.has(legacyId);
        });

        console.log(`🔄 Servidores pendientes de importar: ${failedServers.length}`);

        if (failedServers.length === 0) {
            console.log('✅ ¡Todos los servidores ya fueron importados!');
            return;
        }

        let importedCount = 0;
        let errorCount = 0;

        for (const server of failedServers) {
            try {
                // Función de limpieza ultra-agresiva
                const ultraSafeInt = (value, fieldName, defaultValue = null) => {
                    if (value === null || value === undefined) {
                        return defaultValue;
                    }
                    
                    if (value === '' || value === '0' || value === 0) {
                        return defaultValue;
                    }
                    
                    if (typeof value === 'string' && value.trim() === '') {
                        return defaultValue;
                    }
                    
                    const parsed = parseInt(value, 10);
                    if (isNaN(parsed) || parsed <= 0) {
                        return defaultValue;
                    }
                    
                    return parsed;
                };

                // Procesar datos del servidor
                const serverData = {
                    id: safeParseInt(server.id),
                    title: safeString(server.titulo, `Servidor ${server.id}`),
                    description: safeString(server.desc),
                    website: safeString(server.url),
                    ip_address: safeString(server.ip_serv),
                    experience_rate: safeParseInt(server.experiencia, 1),
                    version: safeString(server.version || server.cronica),
                    season: safeString(server.season),
                    server_type: safeString(server.tipo_serv),
                    platform: safeString(server.plataforma),
                    emulator: safeString(server.emulador),
                    max_level: safeString(server.max_nivel),
                    country_id: safeParseInt(server.pais),
                    language_id: safeParseInt(server.lenguaje),
                    timezone: safeString(server.zona_horaria),
                    status: server.activo === '1' ? 'active' : 'inactive',
                    server_status: safeParseInt(server.estado_serv, 1),
                    is_premium: server.premium === '1',
                    is_approved: server.aprobacion === '1',
                    category_id: safeParseInt(server.cat_id),
                    user_id: safeParseInt(server.usuario),
                    launch_date: safeDate(server.fecha_online),
                    created_at: safeDate(server.fecha) || new Date().toISOString(),
                    updated_at: safeDate(server.fecha_actualiz) || safeDate(server.fecha) || new Date().toISOString(),
                    banner_image: safeString(server.banner),
                    youtube_url: safeString(server.yt_desc),
                    votes: safeParseInt(server.votos, 0),
                    premium_days: safeParseInt(server.dias_premium, 0),
                    premium_date: safeDate(server.fecha_premium),
                    email_notifications: server.mail_notifi === '1'
                };

                // Generar slug único
                const baseSlug = (serverData.title || 'servidor-sin-nombre').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                const uniqueSlug = `${baseSlug}-${serverData.id}`;

                // Mapear a la estructura EXISTENTE de Supabase
                const dbServerData = {
                    title: serverData.title || 'Servidor sin nombre',
                    slug: uniqueSlug,
                    description: serverData.description || null,
                    website: serverData.website || null,
                    ip: serverData.ip_address || 'unknown',
                    
                    country: serverData.country_id ? `Country_${serverData.country_id}` : 'Unknown',
                    language: serverData.language_id === 9 ? 'es' : serverData.language_id === 1 ? 'en' : serverData.language_id === 10 ? 'pt' : 'en',
                    
                    experience: ultraSafeInt(serverData.experience_rate, 'experience', 1),
                    max_level: ultraSafeInt(serverData.max_level, 'max_level', 80),
                    category_id: ultraSafeInt(serverData.category_id, 'category_id', 1),
                    
                    status: serverData.server_status === 2 ? 'online' : 'offline',
                    premium: serverData.is_premium || false,
                    approved: serverData.is_approved || false,
                    
                    legacy_id: ultraSafeInt(serverData.id, 'legacy_id'),
                    ip_address: serverData.ip_address || null,
                    experience_rate: ultraSafeInt(serverData.experience_rate, 'experience_rate', 1),
                    season: serverData.season || null,
                    server_type: serverData.server_type || null,
                    platform: serverData.platform || null,
                    emulator: serverData.emulator || null,
                    country_id: ultraSafeInt(serverData.country_id, 'country_id'),
                    language_id: ultraSafeInt(serverData.language_id, 'language_id', 1),
                    timezone: serverData.timezone || '0',
                    server_status: ultraSafeInt(serverData.server_status, 'server_status', 1),
                    is_premium: serverData.is_premium || false,
                    is_approved: serverData.is_approved || false,
                    legacy_user_id: ultraSafeInt(serverData.user_id, 'legacy_user_id'),
                    launch_date: serverData.launch_date,
                    banner_image: serverData.banner_image || null,
                    youtube_url: serverData.youtube_url || null,
                    votes: ultraSafeInt(serverData.votes, 'votes', 0),
                    premium_days: ultraSafeInt(serverData.premium_days, 'premium_days', 0),
                    premium_date: serverData.premium_date,
                    email_notifications: serverData.email_notifications || false,
                    
                    created_at: serverData.created_at || new Date().toISOString(),
                    updated_at: serverData.updated_at || new Date().toISOString(),
                    
                    metadata: {
                        imported_from: 'php_export_retry',
                        import_date: new Date().toISOString(),
                        original_data: {
                            legacy_id: serverData.id,
                            legacy_user_id: serverData.user_id
                        }
                    }
                };

                // Convertir cadenas vacías a null
                Object.keys(dbServerData).forEach(key => {
                    if (dbServerData[key] === '') {
                        dbServerData[key] = null;
                    }
                });

                // Insertar servidor en Supabase
                const { data: insertedServer, error } = await supabase
                    .from('servers')
                    .insert(dbServerData)
                    .select('id, title, legacy_id');

                if (error) {
                    console.log(`❌ Error importando servidor "${serverData.title}" (ID: ${serverData.id}):`, error.message);
                    errorCount++;
                } else {
                    console.log(`✅ Servidor importado: "${serverData.title}" (ID: ${insertedServer[0]?.legacy_id})`);
                    importedCount++;
                }
            } catch (err) {
                console.log(`❌ Error procesando servidor ID ${server.id}:`, err.message);
                errorCount++;
            }
        }

        console.log(`\n📊 Resumen del reintento de importación:`);
        console.log(`✅ Importados exitosamente: ${importedCount}`);
        console.log(`❌ Errores: ${errorCount}`);
        console.log(`📋 Total procesados: ${failedServers.length}`);
        
        // Estadísticas finales
        const { data: finalCount } = await supabase
            .from('servers')
            .select('id', { count: 'exact' });
        
        console.log(`\n🎯 Total de servidores en la base de datos: ${finalCount?.length || 0}`);
        console.log(`📈 Porcentaje de éxito total: ${Math.round((finalCount?.length || 0) / 450 * 100)}%`);

    } catch (error) {
        console.error('❌ Error durante el reintento:', error);
    }
}

// Ejecutar reintento
retryFailedImports();