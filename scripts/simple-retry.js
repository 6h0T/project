// Script simplificado para reintentar importación
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function simpleRetry() {
    try {
        console.log('🔄 Iniciando reintento simplificado...');

        // Leer archivo JSON
        const data = JSON.parse(fs.readFileSync('export_2025-07-16_15-44-50.json', 'utf8'));

        // Obtener servidores ya importados
        const { data: existingServers } = await supabase
            .from('servers')
            .select('legacy_id')
            .not('legacy_id', 'is', null);

        const existingIds = new Set(existingServers?.map(s => s.legacy_id) || []);
        console.log(`📊 Servidores ya importados: ${existingIds.size}`);

        // Filtrar servidores pendientes
        const pendingServers = data.servers.filter(server => {
            const id = parseInt(server.id);
            return id && !existingIds.has(id);
        });

        console.log(`🔄 Servidores pendientes: ${pendingServers.length}`);

        let imported = 0;
        let errors = 0;

        // Procesar en lotes pequeños
        for (let i = 0; i < Math.min(pendingServers.length, 10); i++) {
            const server = pendingServers[i];
            
            try {
                const serverData = {
                    title: server.titulo || `Servidor ${server.id}`,
                    slug: `server-${server.id}`,
                    description: server.desc || null,
                    website: server.url || null,
                    ip: 'unknown',
                    country: server.pais ? `Country_${server.pais}` : 'Unknown',
                    language: server.lenguaje === '9' ? 'es' : 'en',
                    experience: parseInt(server.experiencia) || 1,
                    max_level: 80,
                    category_id: parseInt(server.cat_id) || 1,
                    status: server.activo === '1' ? 'online' : 'offline',
                    premium: server.premium === '1',
                    approved: server.aprobacion === '1',
                    legacy_id: parseInt(server.id),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };

                const { error } = await supabase
                    .from('servers')
                    .insert(serverData);

                if (error) {
                    console.log(`❌ Error: ${server.titulo} (ID: ${server.id}) - ${error.message}`);
                    errors++;
                } else {
                    console.log(`✅ Importado: ${server.titulo} (ID: ${server.id})`);
                    imported++;
                }

            } catch (err) {
                console.log(`❌ Error procesando: ${server.titulo} - ${err.message}`);
                errors++;
            }
        }

        console.log(`\n📊 Resumen:`);
        console.log(`✅ Importados: ${imported}`);
        console.log(`❌ Errores: ${errors}`);

    } catch (error) {
        console.error('❌ Error general:', error.message);
    }
}

simpleRetry();