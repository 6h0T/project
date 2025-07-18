// Script para importar TODOS los 450 servidores del export original
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function importAllServers() {
    try {
        console.log('🚀 IMPORTACIÓN COMPLETA DE TODOS LOS SERVIDORES');
        console.log('='.repeat(60));

        // Leer archivo JSON original
        const data = JSON.parse(fs.readFileSync('export_2025-07-16_15-44-50.json', 'utf8'));
        console.log(`📊 Total de servidores en export: ${data.servers.length}`);

        // Obtener servidores ya importados para evitar duplicados
        const { data: existingServers } = await supabase
            .from('servers')
            .select('legacy_id')
            .not('legacy_id', 'is', null);

        const existingIds = new Set(existingServers?.map(s => s.legacy_id) || []);
        console.log(`📋 Servidores ya importados: ${existingIds.size}`);

        // Filtrar servidores que no han sido importados
        const serversToImport = data.servers.filter(server => {
            const id = parseInt(server.id);
            return id && !existingIds.has(id);
        });

        console.log(`🔄 Servidores pendientes de importar: ${serversToImport.length}`);
        console.log('='.repeat(60));

        let importedCount = 0;
        let errorCount = 0;
        const errors = [];

        // Función helper para limpiar datos
        const safeString = (value, defaultValue = null) => {
            if (value === null || value === undefined || value === '') {
                return defaultValue;
            }
            return value.toString().trim() || defaultValue;
        };

        const safeInt = (value, defaultValue = null) => {
            if (value === null || value === undefined || value === '' || value === '0') {
                return defaultValue;
            }
            const parsed = parseInt(value, 10);
            return isNaN(parsed) || parsed <= 0 ? defaultValue : parsed;
        };

        const safeDate = (value) => {
            if (!value || value === '0000-00-00 00:00:00' || value === '2019-01-01 00:00:00') {
                return null;
            }
            try {
                const date = new Date(value);
                return isNaN(date.getTime()) ? null : date.toISOString();
            } catch (err) {
                return null;
            }
        };

        // Procesar todos los servidores
        for (let i = 0; i < serversToImport.length; i++) {
            const server = serversToImport[i];
            
            try {
                // Generar slug único
                const baseSlug = (server.titulo || `servidor-${server.id}`)
                    .toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-')
                    .trim('-');
                
                const uniqueSlug = `${baseSlug}-${server.id}`;

                // Preparar datos del servidor
                const serverData = {
                    // Campos básicos requeridos
                    title: safeString(server.titulo, `Servidor ${server.id}`),
                    slug: uniqueSlug,
                    description: safeString(server.desc),
                    website: safeString(server.url),
                    ip: safeString(server.ip_serv, 'unknown'),
                    
                    // Campos de localización y configuración
                    country: server.pais ? `Country_${server.pais}` : 'Unknown',
                    language: getLanguageCode(server.lenguaje),
                    experience: safeInt(server.experiencia, 1),
                    max_level: safeInt(server.max_nivel, 80),
                    
                    // Estados y configuración
                    status: server.activo === '1' ? 'online' : 'offline',
                    premium: server.premium === '1',
                    approved: server.aprobacion === '1',
                    
                    // IDs y relaciones
                    category_id: safeInt(server.cat_id, 1),
                    legacy_id: safeInt(server.id),
                    legacy_user_id: safeInt(server.usuario),
                    
                    // Campos adicionales de la estructura existente
                    ip_address: safeString(server.ip_serv),
                    experience_rate: safeInt(server.experiencia, 1),
                    season: safeString(server.season),
                    server_type: safeString(server.tipo_serv),
                    platform: safeString(server.plataforma),
                    emulator: safeString(server.emulador),
                    country_id: safeInt(server.pais),
                    language_id: safeInt(server.lenguaje, 1),
                    timezone: safeString(server.zona_horaria, '0'),
                    server_status: safeInt(server.estado_serv, 1),
                    is_premium: server.premium === '1',
                    is_approved: server.aprobacion === '1',
                    
                    // Fechas
                    launch_date: safeDate(server.fecha_online),
                    created_at: safeDate(server.fecha) || new Date().toISOString(),
                    updated_at: safeDate(server.fecha_actualiz) || new Date().toISOString(),
                    
                    // Campos multimedia y estadísticas
                    banner_image: safeString(server.banner),
                    youtube_url: safeString(server.yt_desc),
                    votes: safeInt(server.votos, 0),
                    premium_days: safeInt(server.dias_premium, 0),
                    premium_date: safeDate(server.fecha_premium),
                    email_notifications: server.mail_notifi === '1',
                    
                    // Metadatos
                    metadata: {
                        imported_from: 'php_export_complete',
                        import_date: new Date().toISOString(),
                        original_data: {
                            legacy_id: server.id,
                            legacy_user_id: server.usuario,
                            original_category: server.cat_id,
                            original_country: server.pais,
                            original_language: server.lenguaje
                        }
                    }
                };

                // Limpiar campos vacíos (convertir strings vacíos a null)
                Object.keys(serverData).forEach(key => {
                    if (serverData[key] === '') {
                        serverData[key] = null;
                    }
                });

                // Insertar servidor
                const { data: insertedServer, error } = await supabase
                    .from('servers')
                    .insert(serverData)
                    .select('id, title, legacy_id');

                if (error) {
                    console.log(`❌ Error: ${server.titulo} (ID: ${server.id}) - ${error.message}`);
                    errors.push({
                        server: server.titulo,
                        id: server.id,
                        error: error.message,
                        category: server.cat_id,
                        country: server.pais,
                        language: server.lenguaje
                    });
                    errorCount++;
                } else {
                    console.log(`✅ ${importedCount + 1}/${serversToImport.length} - ${server.titulo} (ID: ${server.id})`);
                    importedCount++;
                }

                // Mostrar progreso cada 50 servidores
                if ((importedCount + errorCount) % 50 === 0) {
                    const progress = Math.round(((importedCount + errorCount) / serversToImport.length) * 100);
                    console.log(`📊 Progreso: ${progress}% - Importados: ${importedCount}, Errores: ${errorCount}`);
                }

            } catch (err) {
                console.log(`❌ Error procesando: ${server.titulo} (ID: ${server.id}) - ${err.message}`);
                errors.push({
                    server: server.titulo,
                    id: server.id,
                    error: err.message,
                    category: server.cat_id,
                    country: server.pais,
                    language: server.lenguaje
                });
                errorCount++;
            }
        }

        // Resumen final
        console.log('\n' + '='.repeat(60));
        console.log('📊 RESUMEN FINAL DE IMPORTACIÓN');
        console.log('='.repeat(60));
        console.log(`✅ Servidores importados exitosamente: ${importedCount}`);
        console.log(`❌ Servidores con errores: ${errorCount}`);
        console.log(`📋 Total procesados: ${serversToImport.length}`);
        
        const successRate = Math.round((importedCount / serversToImport.length) * 100);
        console.log(`📈 Tasa de éxito: ${successRate}%`);

        // Obtener total final en la base de datos
        const { data: finalCount } = await supabase
            .from('servers')
            .select('id', { count: 'exact' });
        
        console.log(`🎯 Total de servidores en la base de datos: ${finalCount?.length || 0}`);

        // Mostrar errores agrupados si los hay
        if (errors.length > 0) {
            console.log('\n📋 ANÁLISIS DE ERRORES:');
            
            // Agrupar errores por tipo
            const errorsByType = {};
            errors.forEach(err => {
                const errorType = err.error.split(':')[0];
                if (!errorsByType[errorType]) {
                    errorsByType[errorType] = [];
                }
                errorsByType[errorType].push(err);
            });

            Object.entries(errorsByType).forEach(([type, errs]) => {
                console.log(`\n❌ ${type}: ${errs.length} errores`);
                errs.slice(0, 5).forEach(err => {
                    console.log(`   - ${err.server} (ID: ${err.id})`);
                });
                if (errs.length > 5) {
                    console.log(`   ... y ${errs.length - 5} más`);
                }
            });
        }

        console.log('\n🎉 ¡IMPORTACIÓN COMPLETA FINALIZADA!');

    } catch (error) {
        console.error('❌ Error general durante la importación:', error);
    }
}

// Función helper para mapear códigos de idioma
function getLanguageCode(languageId) {
    const languageMap = {
        '1': 'en',
        '2': 'de', 
        '3': 'en',
        '4': 'fr',
        '5': 'it',
        '7': 'pl',
        '8': 'tr',
        '9': 'es',
        '10': 'pt'
    };
    return languageMap[languageId] || 'en';
}

// Ejecutar importación
importAllServers();