// Script para probar la importación de un solo servidor y ver el error exacto
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSingleServer() {
    try {
        console.log('🧪 Probando importación de un servidor específico...');

        const data = JSON.parse(fs.readFileSync('export_2025-07-16_15-44-50.json', 'utf8'));
        
        // Buscar el servidor HunterXro que está fallando
        const server = data.servers.find(s => s.titulo === 'HunterXro');
        
        if (!server) {
            console.log('❌ Servidor no encontrado');
            return;
        }

        console.log('📋 Datos del servidor:');
        console.log(`- ID: ${server.id}`);
        console.log(`- Título: ${server.titulo}`);
        console.log(`- Categoría: ${server.cat_id}`);
        console.log(`- País: ${server.pais}`);
        console.log(`- Idioma: ${server.lenguaje}`);

        // Verificar que la categoría existe
        const { data: category } = await supabase
            .from('server_categories')
            .select('*')
            .eq('id', parseInt(server.cat_id))
            .single();

        if (category) {
            console.log(`✅ Categoría ${server.cat_id} existe: ${category.name}`);
        } else {
            console.log(`❌ Categoría ${server.cat_id} NO existe`);
        }

        // Verificar que el país existe
        if (server.pais) {
            const { data: country } = await supabase
                .from('countries')
                .select('*')
                .eq('id', parseInt(server.pais))
                .single();

            if (country) {
                console.log(`✅ País ${server.pais} existe: ${country.name}`);
            } else {
                console.log(`❌ País ${server.pais} NO existe`);
            }
        }

        // Verificar que el idioma existe
        if (server.lenguaje) {
            const { data: language } = await supabase
                .from('languages')
                .select('*')
                .eq('id', parseInt(server.lenguaje))
                .single();

            if (language) {
                console.log(`✅ Idioma ${server.lenguaje} existe: ${language.name}`);
            } else {
                console.log(`❌ Idioma ${server.lenguaje} NO existe`);
            }
        }

        // Intentar insertar con datos mínimos
        console.log('\n🔧 Intentando insertar con datos mínimos...');
        
        const minimalData = {
            title: server.titulo,
            slug: `server-${server.id}`,
            description: server.desc || null,
            website: server.url || null,
            ip: 'unknown',
            country: 'Unknown',
            language: 'es',
            experience: 1,
            max_level: 80,
            category_id: parseInt(server.cat_id),
            status: 'offline',
            premium: false,
            approved: true,
            legacy_id: parseInt(server.id),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        console.log('📋 Datos a insertar:', JSON.stringify(minimalData, null, 2));

        const { data: result, error } = await supabase
            .from('servers')
            .insert(minimalData)
            .select();

        if (error) {
            console.log('❌ Error detallado:', error);
        } else {
            console.log('✅ Servidor insertado exitosamente:', result);
        }

    } catch (error) {
        console.error('❌ Error general:', error);
    }
}

testSingleServer();