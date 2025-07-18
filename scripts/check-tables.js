// Script para verificar las tablas existentes en Supabase
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
    try {
        console.log('🔍 Verificando tablas existentes...\n');

        // Verificar tabla user_profiles
        const { data: userProfiles, error: userError } = await supabase
            .from('user_profiles')
            .select('*')
            .limit(1);

        if (userError) {
            console.log('❌ Tabla user_profiles:', userError.message);
        } else {
            console.log('✅ Tabla user_profiles existe');
            if (userProfiles.length > 0) {
                console.log('📋 Estructura user_profiles:', Object.keys(userProfiles[0]));
            }
        }

        // Verificar tabla servers
        const { data: servers, error: serverError } = await supabase
            .from('servers')
            .select('*')
            .limit(1);

        if (serverError) {
            console.log('❌ Tabla servers:', serverError.message);
        } else {
            console.log('✅ Tabla servers existe');
            if (servers.length > 0) {
                console.log('📋 Estructura servers:', Object.keys(servers[0]));
            }
        }

        // Verificar tabla banners
        const { data: banners, error: bannerError } = await supabase
            .from('banners')
            .select('*')
            .limit(1);

        if (bannerError) {
            console.log('❌ Tabla banners:', bannerError.message);
        } else {
            console.log('✅ Tabla banners existe');
            if (banners.length > 0) {
                console.log('📋 Estructura banners:', Object.keys(banners[0]));
            }
        }

    } catch (error) {
        console.error('❌ Error verificando tablas:', error.message);
    }
}

checkTables();