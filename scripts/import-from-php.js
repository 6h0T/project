// Script para importar datos del proyecto PHP a Supabase
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Fallback a anon key
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

async function importData() {
    try {
        // Leer archivo JSON exportado
        const jsonFile = process.argv[2];
        if (!jsonFile) {
            console.error('❌ Uso: node import-from-php.js <archivo-json>');
            process.exit(1);
        }

        const data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
        console.log('📊 Estadísticas de importación:');
        console.log(data.export_stats);

        // 1. Importar usuarios
        if (data.users && data.users.length > 0) {
            console.log(`\n👥 Importando ${data.users.length} usuarios...`);
            console.log('⚠️  NOTA: Los usuarios deben crearse primero en Supabase Auth antes de poder importar perfiles.');
            console.log('📋 Para importar usuarios completos, necesitas usar la Admin API de Supabase.');
            
            // Por ahora, solo mostraremos los datos que se importarían
            for (const user of data.users) {
                try {
                    const userData = {
                        username: user.username || user.user || user.nombre,
                        email: user.email || user.correo,
                        credits: user.credits || user.creditos || 100,
                        created_at: user.created_at || user.fecha_registro || new Date().toISOString(),
                    };

                    console.log(`📄 Usuario a importar: ${userData.username} (${userData.email})`);
                    
                    // TODO: Implementar creación de usuario en auth.users primero
                    // const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
                    //     email: userData.email,
                    //     password: 'temp_password_123', // Usuario deberá resetear
                    //     email_confirm: true
                    // });
                    
                    // if (authError) {
                    //     console.log(`⚠️  Error creando auth usuario ${userData.username}:`, authError.message);
                    //     continue;
                    // }
                    
                    // // Luego insertar el perfil
                    // const { error } = await supabase
                    //     .from('user_profiles')
                    //     .insert({
                    //         id: authUser.user.id,
                    //         email: userData.email,
                    //         username: userData.username,
                    //         credits: userData.credits,
                    //         created_at: userData.created_at
                    //     });

                } catch (err) {
                    console.log(`❌ Error procesando usuario:`, err.message);
                }
            }
            
            console.log(`\n💡 Se encontraron ${data.users.length} usuarios para importar.`);
            console.log('🔧 Para completar la importación de usuarios, necesitas implementar la creación en auth.users primero.');
        }

        // 2. Analizar estructura de servidores
        if (data.servers && data.servers.length > 0) {
            console.log(`\n🎮 Analizando ${data.servers.length} servidores...`);
            
            // Función helper para convertir valores de forma segura
            const safeParseInt = (value, defaultValue = null) => {
                // Manejar casos null, undefined, cadenas vacías, y ceros
                if (value === null || value === undefined || value === '' || value === '0' || value === 0) {
                    return defaultValue;
                }
                
                // Si es un string, verificar si está vacío después de trim
                if (typeof value === 'string' && value.trim() === '') {
                    return defaultValue;
                }
                
                // Convertir a string y limpiar
                const cleanValue = value.toString().trim().replace(/x$/i, '');
                
                // Si después de limpiar queda vacío o es cero, retornar default
                if (cleanValue === '' || cleanValue === '0') {
                    return defaultValue;
                }
                
                const parsed = parseInt(cleanValue, 10);
                // Si es NaN, 0, o negativo (para IDs), retornar default
                return isNaN(parsed) || parsed <= 0 ? defaultValue : parsed;
            };

            const safeString = (value, defaultValue = '') => {
                if (value === null || value === undefined || value === '') {
                    return defaultValue;
                }
                return value.toString().trim() || defaultValue;
            };

            // Función helper para fechas
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

            // Analizar estructura de datos disponibles
            console.log('\n📊 Estructura de datos de servidores:');
            const sampleServer = data.servers[0];
            const availableFields = Object.keys(sampleServer);
            console.log('Campos disponibles:', availableFields.join(', '));

            // Mostrar estadísticas de campos vacíos
            const fieldStats = {};
            availableFields.forEach(field => {
                const emptyCount = data.servers.filter(server => 
                    server[field] === null || 
                    server[field] === undefined || 
                    server[field] === '' ||
                    server[field] === '0'
                ).length;
                fieldStats[field] = {
                    empty: emptyCount,
                    filled: data.servers.length - emptyCount,
                    percentage: Math.round((emptyCount / data.servers.length) * 100)
                };
            });

            console.log('\n📈 Estadísticas de campos vacíos:');
            Object.entries(fieldStats).forEach(([field, stats]) => {
                if (stats.percentage > 50) {
                    console.log(`⚠️  ${field}: ${stats.percentage}% vacío (${stats.empty}/${data.servers.length})`);
                } else if (stats.percentage > 0) {
                    console.log(`📝 ${field}: ${stats.percentage}% vacío (${stats.empty}/${data.servers.length})`);
                } else {
                    console.log(`✅ ${field}: 100% completo`);
                }
            });

            // Crear estructura de datos limpia para importación futura
            console.log('\n🔧 Preparando datos para importación...');
            const cleanedServers = data.servers.map((server, index) => {
                return {
                    // Campos básicos requeridos
                    id: safeParseInt(server.id),
                    title: safeString(server.titulo, `Servidor ${index + 1}`),
                    description: safeString(server.desc),
                    website: safeString(server.url),
                    ip_address: safeString(server.ip_serv),
                    
                    // Campos de configuración
                    experience_rate: safeParseInt(server.experiencia, 1),
                    version: safeString(server.version || server.cronica),
                    season: safeString(server.season),
                    server_type: safeString(server.tipo_serv),
                    platform: safeString(server.plataforma),
                    emulator: safeString(server.emulador),
                    max_level: safeString(server.max_nivel),
                    
                    // Campos de localización
                    country_id: safeParseInt(server.pais),
                    language_id: safeParseInt(server.lenguaje),
                    timezone: safeString(server.zona_horaria),
                    
                    // Campos de estado
                    status: server.activo === '1' ? 'active' : 'inactive',
                    server_status: safeParseInt(server.estado_serv, 1),
                    is_premium: server.premium === '1',
                    is_approved: server.aprobacion === '1',
                    
                    // Campos de categoría y usuario
                    category_id: safeParseInt(server.cat_id),
                    user_id: safeParseInt(server.usuario),
                    
                    // Campos de fechas usando safeDate
                    launch_date: safeDate(server.fecha_online),
                    created_at: safeDate(server.fecha) || new Date().toISOString(),
                    updated_at: safeDate(server.fecha_actualiz) || safeDate(server.fecha) || new Date().toISOString(),
                    
                    // Campos adicionales
                    banner_image: safeString(server.banner),
                    youtube_url: safeString(server.yt_desc),
                    votes: safeParseInt(server.votos, 0),
                    premium_days: safeParseInt(server.dias_premium, 0),
                    premium_date: safeDate(server.fecha_premium),
                    email_notifications: server.mail_notifi === '1'
                };
            });

            console.log(`✅ ${cleanedServers.length} servidores procesados y listos para importación`);
            
            // Guardar datos limpios para referencia futura
            const cleanedData = {
                servers: cleanedServers,
                stats: fieldStats,
                total_servers: cleanedServers.length,
                processed_at: new Date().toISOString()
            };
            
            // Opcional: guardar en archivo para revisión
            try {
                fs.writeFileSync('cleaned_servers_data.json', JSON.stringify(cleanedData, null, 2));
                console.log('📄 Datos limpios guardados en: cleaned_servers_data.json');
            } catch (err) {
                console.log('⚠️  No se pudo guardar archivo de datos limpios:', err.message);
            }

            // Preguntar si se quiere proceder con la importación real
            console.log('\n🚀 ¿Proceder con la importación a Supabase?');
            console.log('⚠️  IMPORTANTE: Asegúrate de haber ejecutado el archivo supabase/create_servers_table.sql primero');
            console.log('📋 Esto insertará los servidores en la tabla servers de Supabase');
            
            // Importar TODOS los servidores
            console.log('\n🔧 Importando TODOS los 450 servidores...');
            
            const serversToImport = cleanedServers;
            let importedCount = 0;
            let errorCount = 0;

            for (const serverData of serversToImport) {
                try {
                    // Función de limpieza ultra-agresiva (sin logging)
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

                    // Mapear a la estructura EXISTENTE de Supabase
                    const dbServerData = {
                        // Campos principales (estructura existente)
                        title: serverData.title || 'Servidor sin nombre',
                        slug: (serverData.title || 'servidor-sin-nombre').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                        description: serverData.description || '',
                        website: serverData.website || '',
                        ip: serverData.ip_address || 'unknown', // Campo requerido, no puede ser null
                        
                        // Mapear país y idioma a strings (estructura existente)
                        country: serverData.country_id ? `Country_${serverData.country_id}` : 'Unknown',
                        language: serverData.language_id === 9 ? 'es' : serverData.language_id === 1 ? 'en' : serverData.language_id === 10 ? 'pt' : 'en',
                        
                        // Campos numéricos existentes
                        experience: ultraSafeInt(serverData.experience_rate, 'experience', 1),
                        max_level: ultraSafeInt(serverData.max_level, 'max_level', 80),
                        category_id: ultraSafeInt(serverData.category_id, 'category_id', 1),
                        
                        // Estados (mapear a estructura existente - solo 'online' u 'offline')
                        status: serverData.server_status === 2 ? 'online' : 'offline',
                        premium: serverData.is_premium || false,
                        approved: serverData.is_approved || false,
                        
                        // Campos adicionales (estructura existente)
                        legacy_id: ultraSafeInt(serverData.id, 'legacy_id'),
                        ip_address: serverData.ip_address || '',
                        experience_rate: ultraSafeInt(serverData.experience_rate, 'experience_rate', 1),
                        season: serverData.season || '',
                        server_type: serverData.server_type || '',
                        platform: serverData.platform || '',
                        emulator: serverData.emulator || '',
                        country_id: ultraSafeInt(serverData.country_id, 'country_id'),
                        language_id: ultraSafeInt(serverData.language_id, 'language_id', 1),
                        timezone: serverData.timezone || '0',
                        server_status: ultraSafeInt(serverData.server_status, 'server_status', 1),
                        is_premium: serverData.is_premium || false,
                        is_approved: serverData.is_approved || false,
                        legacy_user_id: ultraSafeInt(serverData.user_id, 'legacy_user_id'),
                        launch_date: serverData.launch_date,
                        banner_image: serverData.banner_image || '',
                        youtube_url: serverData.youtube_url || '',
                        votes: ultraSafeInt(serverData.votes, 'votes', 0),
                        premium_days: ultraSafeInt(serverData.premium_days, 'premium_days', 0),
                        premium_date: serverData.premium_date,
                        email_notifications: serverData.email_notifications || false,
                        
                        // Timestamps
                        created_at: serverData.created_at || new Date().toISOString(),
                        updated_at: serverData.updated_at || new Date().toISOString(),
                        
                        // Metadatos
                        metadata: {
                            imported_from: 'php_export',
                            import_date: new Date().toISOString(),
                            original_data: {
                                legacy_id: serverData.id,
                                legacy_user_id: serverData.user_id
                            }
                        }
                    };

                    // Verificación EXHAUSTIVA de TODOS los campos
                    console.log(`🔍 Verificando TODOS los campos para cadenas vacías...`);
                    const allEmptyStrings = Object.entries(dbServerData).filter(([key, value]) => {
                        return value === '';
                    });

                    if (allEmptyStrings.length > 0) {
                        console.log(`🚨 CAMPOS CON CADENAS VACÍAS:`, allEmptyStrings.map(([key, value]) => `${key}: "${value}"`));
                        
                        // Convertir TODAS las cadenas vacías a null
                        allEmptyStrings.forEach(([key]) => {
                            console.log(`🔧 Convirtiendo ${key} de "" a null`);
                            dbServerData[key] = null;
                        });
                    }

                    // Verificación final - NO debe haber ninguna cadena vacía
                    const finalEmptyCheck = Object.entries(dbServerData).filter(([key, value]) => {
                        return value === '';
                    });

                    if (finalEmptyCheck.length > 0) {
                        console.log(`🚨 ERROR: AÚN HAY CADENAS VACÍAS DESPUÉS DE LA LIMPIEZA:`, finalEmptyCheck);
                    } else {
                        console.log(`✅ Verificación completa: No hay cadenas vacías`);
                    }

                    // Mostrar datos finales que se van a insertar (solo campos numéricos)
                    const numericFields = ['legacy_id', 'experience_rate', 'country_id', 'language_id', 'server_status', 'category_id', 'legacy_user_id', 'votes', 'premium_days'];
                    const numericData = {};
                    numericFields.forEach(field => {
                        numericData[field] = dbServerData[field];
                    });
                    console.log(`📋 Datos numéricos finales:`, numericData);

                    // Insertar servidor en Supabase
                    const { data: insertedServer, error } = await supabase
                        .from('servers')
                        .insert(dbServerData)
                        .select('id, title, legacy_id');

                    if (error) {
                        console.log(`❌ Error importando servidor "${serverData.title}":`, error.message);
                        console.log(`🔍 Datos completos que causaron el error:`, JSON.stringify(dbServerData, null, 2));
                        errorCount++;
                    } else {
                        console.log(`✅ Servidor importado: "${serverData.title}" (ID: ${insertedServer[0]?.legacy_id})`);
                        importedCount++;
                    }
                } catch (err) {
                    console.log(`❌ Error procesando servidor "${serverData.title}":`, err.message);
                    errorCount++;
                }
            }

            console.log(`\n📊 Resumen de importación de servidores:`);
            console.log(`✅ Importados exitosamente: ${importedCount}`);
            console.log(`❌ Errores: ${errorCount}`);
            console.log(`📋 Total procesados: ${serversToImport.length}`);
            
            if (importedCount > 0) {
                console.log('\n💡 Para importar todos los servidores:');
                console.log('1. Modifica el script para procesar todos los cleanedServers (no solo los primeros 10)');
                console.log('2. Mapea los legacy_user_id a los UUIDs reales de user_profiles');
                console.log('3. Ejecuta el script completo');
            }
        }

        // 3. Importar banners
        if (data.banners && data.banners.length > 0) {
            console.log(`\n🎯 Importando ${data.banners.length} banners...`);
            
            for (const banner of data.banners) {
                try {
                    const bannerData = {
                        user_id: null, // Necesitarás mapear esto después de importar usuarios
                        title: banner.title || banner.titulo || 'Banner sin título',
                        description: banner.description || banner.descripcion || '',
                        image_url: banner.image_url || banner.imagen || banner.banner || '',
                        target_url: banner.target_url || banner.url_destino || banner.url || '',
                        position: banner.position || banner.posicion || 'top',
                        game_category: banner.game_category || banner.categoria || null,
                        status: (banner.active === true || banner.activo === '1') ? 'active' : 'inactive',
                        credits_cost: banner.credits_cost || banner.costo_creditos || 10,
                        start_date: banner.start_date || banner.fecha_inicio || new Date().toISOString(),
                        end_date: banner.end_date || banner.fecha_fin || null,
                        created_at: banner.created_at || banner.fecha_creacion || new Date().toISOString(),
                        updated_at: banner.updated_at || banner.fecha_actualizacion || new Date().toISOString(),
                        user_server_id: banner.user_server_id || banner.servidor_id || null,
                    };

                    const { error } = await supabase
                        .from('banners')
                        .insert(bannerData);

                    if (error) {
                        console.log(`⚠️  Error importando banner ${bannerData.title}:`, error.message);
                    } else {
                        console.log(`✅ Banner importado: ${bannerData.title}`);
                    }
                } catch (err) {
                    console.log(`❌ Error procesando banner:`, err.message);
                }
            }
        }

        console.log('\n🎉 ¡Importación completada!');
        console.log('📋 Revisa los logs para ver qué datos se importaron correctamente.');

    } catch (error) {
        console.error('❌ Error durante la importación:', error);
    }
}

// Ejecutar importación
importData();