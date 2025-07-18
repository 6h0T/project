// Script para verificar qué servidores tenemos en la base de datos
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkServers() {
    try {
        console.log('🔍 Verificando servidores en la base de datos...\n');

        // 1. Contar total de servidores
        const { data: allServers, error: allError } = await supabase
            .from('servers')
            .select('id, title, category_id, status, approved, is_approved, legacy_id')
            .limit(1000);

        if (allError) {
            console.error('❌ Error obteniendo servidores:', allError);
            return;
        }

        console.log(`📊 Total de servidores en la tabla: ${allServers.length}`);

        // 2. Contar servidores aprobados
        const approvedServers = allServers.filter(s => s.approved === true || s.is_approved === true);
        console.log(`✅ Servidores aprobados: ${approvedServers.length}`);

        // 3. Contar servidores online/activos
        const activeServers = allServers.filter(s => s.status === 'online' || s.status === 'active');
        console.log(`🟢 Servidores online/activos: ${activeServers.length}`);

        // 4. Contar servidores que cumplen ambas condiciones
        const validServers = allServers.filter(s => 
            (s.approved === true || s.is_approved === true) && 
            (s.status === 'online' || s.status === 'active')
        );
        console.log(`🎯 Servidores válidos (aprobados Y activos): ${validServers.length}`);

        // 5. Contar por categoría
        console.log('\n📋 Servidores por categoría:');
        const categoryCount = {};
        allServers.forEach(server => {
            const catId = server.category_id || 'sin_categoria';
            categoryCount[catId] = (categoryCount[catId] || 0) + 1;
        });

        Object.entries(categoryCount).forEach(([catId, count]) => {
            console.log(`   - Categoría ${catId}: ${count} servidores`);
        });

        // 6. Mostrar algunos servidores de Lineage II (categoría 1 y 3)
        console.log('\n🎮 Servidores de Lineage II (categorías 1 y 3):');
        const lineageServers = allServers.filter(s => s.category_id === 1 || s.category_id === 3);
        console.log(`   Total: ${lineageServers.length}`);
        
        lineageServers.slice(0, 10).forEach(server => {
            const status = (server.approved || server.is_approved) ? '✅' : '❌';
            const online = (server.status === 'online' || server.status === 'active') ? '🟢' : '🔴';
            console.log(`   ${status}${online} ${server.title} (Cat: ${server.category_id}, Legacy: ${server.legacy_id})`);
        });

        // 7. Probar consulta específica como la API
        console.log('\n🔍 Probando consulta específica de la API...');
        const { data: apiTest, error: apiError } = await supabase
            .from('servers')
            .select(`
                id,
                title,
                slug,
                description,
                website,
                country,
                version,
                experience,
                premium,
                status,
                created_at,
                category_id,
                legacy_id,
                ip,
                ip_address,
                experience_rate,
                votes,
                is_premium,
                is_approved
            `)
            .or('approved.eq.true,is_approved.eq.true')
            .in('status', ['online', 'active'])
            .in('category_id', [1, 3]) // Lineage II categories
            .limit(10);

        if (apiError) {
            console.error('❌ Error en consulta API:', apiError);
        } else {
            console.log(`✅ Consulta API exitosa: ${apiTest.length} servidores encontrados`);
            apiTest.forEach(server => {
                console.log(`   - ${server.title} (Cat: ${server.category_id})`);
            });
        }

    } catch (error) {
        console.error('❌ Error general:', error);
    }
}

checkServers();