// Script para investigar la estructura actual de la base de datos
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function investigateStructure() {
    console.log('🔍 Investigando estructura actual de la base de datos...\n');

    try {
        // 1. Verificar tabla servers
        console.log('📋 Tabla SERVERS:');
        const { data: servers, error: serversError } = await supabase
            .from('servers')
            .select('*')
            .limit(5);

        if (serversError) {
            console.log('❌ Error en tabla servers:', serversError.message);
        } else {
            console.log(`✅ Servidores encontrados: ${servers?.length || 0}`);
            if (servers && servers.length > 0) {
                console.log('📄 Estructura de servidor (primer registro):');
                console.log(JSON.stringify(servers[0], null, 2));
            }
        }

        // 2. Verificar tabla user_servers
        console.log('\n📋 Tabla USER_SERVERS:');
        const { data: userServers, error: userServersError } = await supabase
            .from('user_servers')
            .select('*')
            .limit(5);

        if (userServersError) {
            console.log('❌ Error en tabla user_servers:', userServersError.message);
        } else {
            console.log(`✅ User servers encontrados: ${userServers?.length || 0}`);
            if (userServers && userServers.length > 0) {
                console.log('📄 Estructura de user_server (primer registro):');
                console.log(JSON.stringify(userServers[0], null, 2));
            }
        }

        // 3. Verificar categorías
        console.log('\n📋 Tabla SERVER_CATEGORIES:');
        const { data: categories, error: categoriesError } = await supabase
            .from('server_categories')
            .select('*')
            .order('id');

        if (categoriesError) {
            console.log('❌ Error en tabla server_categories:', categoriesError.message);
        } else {
            console.log(`✅ Categorías encontradas: ${categories?.length || 0}`);
            categories?.forEach(cat => {
                console.log(`   - ID: ${cat.id}, Nombre: ${cat.name}, Slug: ${cat.slug}`);
            });
        }

        // 4. Verificar países
        console.log('\n📋 Tabla COUNTRIES:');
        const { data: countries, error: countriesError } = await supabase
            .from('countries')
            .select('*')
            .limit(10)
            .order('id');

        if (countriesError) {
            console.log('❌ Error en tabla countries:', countriesError.message);
        } else {
            console.log(`✅ Países encontrados: ${countries?.length || 0}`);
            countries?.forEach(country => {
                console.log(`   - ID: ${country.id}, Nombre: ${country.name}, Código: ${country.code}`);
            });
        }

        // 5. Contar servidores por categoría
        console.log('\n📊 SERVIDORES POR CATEGORÍA:');
        const { data: serversByCategory, error: countError } = await supabase
            .from('servers')
            .select('category_id, server_categories(name)')
            .not('category_id', 'is', null);

        if (countError) {
            console.log('❌ Error contando servidores por categoría:', countError.message);
        } else {
            const categoryCount = {};
            serversByCategory?.forEach(server => {
                const categoryName = server.server_categories?.name || `ID: ${server.category_id}`;
                categoryCount[categoryName] = (categoryCount[categoryName] || 0) + 1;
            });

            Object.entries(categoryCount).forEach(([category, count]) => {
                console.log(`   - ${category}: ${count} servidores`);
            });
        }

        // 6. Verificar servidores importados recientemente
        console.log('\n📅 SERVIDORES IMPORTADOS RECIENTEMENTE:');
        const { data: recentServers, error: recentError } = await supabase
            .from('servers')
            .select('id, title, legacy_id, category_id, created_at')
            .not('legacy_id', 'is', null)
            .order('created_at', { ascending: false })
            .limit(10);

        if (recentError) {
            console.log('❌ Error obteniendo servidores recientes:', recentError.message);
        } else {
            console.log(`✅ Servidores con legacy_id: ${recentServers?.length || 0}`);
            recentServers?.forEach(server => {
                console.log(`   - ${server.title} (Legacy ID: ${server.legacy_id}, Cat: ${server.category_id})`);
            });
        }

    } catch (error) {
        console.error('❌ Error general:', error);
    }
}

investigateStructure();