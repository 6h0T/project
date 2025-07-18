// Script para encontrar categorías e idiomas faltantes
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findMissingData() {
    try {
        console.log('🔍 Analizando categorías e idiomas faltantes...\n');

        // Leer archivo de exportación
        const data = JSON.parse(fs.readFileSync('export_2025-07-16_15-44-50.json', 'utf8'));

        // Obtener categorías existentes
        const { data: existingCategories } = await supabase
            .from('server_categories')
            .select('id');
        
        const existingCategoryIds = new Set(existingCategories?.map(c => c.id) || []);

        // Obtener idiomas existentes
        const { data: existingLanguages } = await supabase
            .from('languages')
            .select('id');
        
        const existingLanguageIds = new Set(existingLanguages?.map(l => l.id) || []);

        // Obtener países existentes
        const { data: existingCountries } = await supabase
            .from('countries')
            .select('id');
        
        const existingCountryIds = new Set(existingCountries?.map(c => c.id) || []);

        // Analizar datos del export
        const usedCategoryIds = new Set();
        const usedLanguageIds = new Set();
        const usedCountryIds = new Set();

        data.servers.forEach(server => {
            if (server.cat_id) {
                usedCategoryIds.add(parseInt(server.cat_id));
            }
            if (server.lenguaje) {
                usedLanguageIds.add(parseInt(server.lenguaje));
            }
            if (server.pais) {
                usedCountryIds.add(parseInt(server.pais));
            }
        });

        // Encontrar faltantes
        const missingCategories = [...usedCategoryIds].filter(id => !existingCategoryIds.has(id));
        const missingLanguages = [...usedLanguageIds].filter(id => !existingLanguageIds.has(id));
        const missingCountries = [...usedCountryIds].filter(id => !existingCountryIds.has(id));

        console.log('📊 ANÁLISIS COMPLETO:');
        console.log(`\n🎮 CATEGORÍAS:`);
        console.log(`   - Usadas en export: ${[...usedCategoryIds].sort((a,b) => a-b).join(', ')}`);
        console.log(`   - Existentes en BD: ${[...existingCategoryIds].sort((a,b) => a-b).join(', ')}`);
        console.log(`   - FALTANTES: ${missingCategories.sort((a,b) => a-b).join(', ')}`);

        console.log(`\n🌐 IDIOMAS:`);
        console.log(`   - Usados en export: ${[...usedLanguageIds].sort((a,b) => a-b).join(', ')}`);
        console.log(`   - Existentes en BD: ${[...existingLanguageIds].sort((a,b) => a-b).join(', ')}`);
        console.log(`   - FALTANTES: ${missingLanguages.sort((a,b) => a-b).join(', ')}`);

        console.log(`\n🌍 PAÍSES:`);
        console.log(`   - Usados en export: ${[...usedCountryIds].sort((a,b) => a-b).join(', ')}`);
        console.log(`   - Existentes en BD: ${[...existingCountryIds].sort((a,b) => a-b).join(', ')}`);
        console.log(`   - FALTANTES: ${missingCountries.sort((a,b) => a-b).join(', ')}`);

        // Generar SQL para agregar faltantes
        console.log('\n🔧 SQL PARA AGREGAR FALTANTES:');
        
        if (missingCategories.length > 0) {
            console.log('\n-- Categorías faltantes:');
            missingCategories.forEach(id => {
                const categoryName = getCategoryName(id);
                const slug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                console.log(`INSERT INTO server_categories (id, name, slug, description) VALUES (${id}, '${categoryName}', '${slug}', 'Servidores de ${categoryName}') ON CONFLICT (id) DO NOTHING;`);
            });
        }

        if (missingLanguages.length > 0) {
            console.log('\n-- Idiomas faltantes:');
            missingLanguages.forEach(id => {
                const languageInfo = getLanguageInfo(id);
                console.log(`INSERT INTO languages (id, name, code, flag_emoji) VALUES (${id}, '${languageInfo.name}', '${languageInfo.code}', '${languageInfo.flag}') ON CONFLICT (id) DO NOTHING;`);
            });
        }

        if (missingCountries.length > 0) {
            console.log('\n-- Países faltantes:');
            missingCountries.forEach(id => {
                const countryInfo = getCountryInfo(id);
                console.log(`INSERT INTO countries (id, name, code, flag_emoji) VALUES (${id}, '${countryInfo.name}', '${countryInfo.code}', '${countryInfo.flag}') ON CONFLICT (id) DO NOTHING;`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

function getCategoryName(id) {
    const categories = {
        1: 'Mu Online',
        2: 'Aion',
        3: 'Lineage II',
        4: 'Perfect World',
        5: 'Counter-Strike',
        6: 'World of Warcraft',
        7: 'Ragnarok Online',
        8: 'Tibia',
        9: 'Cabal Online',
        10: 'Minecraft',
        11: 'Knight Online',
        12: 'Flyff',
        13: 'Silkroad Online',
        14: 'Metin2',
        15: 'Conquer Online',
        16: 'Argentum Online',
        17: 'Priston Tale',
        18: 'Gunbound'
    };
    return categories[id] || `Categoría ${id}`;
}

function getLanguageInfo(id) {
    const languages = {
        1: { name: 'Inglés', code: 'en', flag: '🇺🇸' },
        2: { name: 'Alemán', code: 'de', flag: '🇩🇪' },
        3: { name: 'Inglés', code: 'en', flag: '🇺🇸' },
        4: { name: 'Francés', code: 'fr', flag: '🇫🇷' },
        5: { name: 'Italiano', code: 'it', flag: '🇮🇹' },
        6: { name: 'Ruso', code: 'ru', flag: '🇷🇺' },
        7: { name: 'Polaco', code: 'pl', flag: '🇵🇱' },
        8: { name: 'Turco', code: 'tr', flag: '🇹🇷' },
        9: { name: 'Español', code: 'es', flag: '🇪🇸' },
        10: { name: 'Portugués', code: 'pt', flag: '🇵🇹' },
        11: { name: 'Checo', code: 'cs', flag: '🇨🇿' },
        12: { name: 'Húngaro', code: 'hu', flag: '🇭🇺' }
    };
    return languages[id] || { name: `Idioma ${id}`, code: `lang${id}`, flag: '🌍' };
}

function getCountryInfo(id) {
    const countries = {
        // Agregar países comunes que podrían faltar
        2: { name: 'Canadá', code: 'CA', flag: '🇨🇦' },
        9: { name: 'Francia', code: 'FR', flag: '🇫🇷' },
        13: { name: 'Italia', code: 'IT', flag: '🇮🇹' },
        14: { name: 'España', code: 'ES', flag: '🇪🇸' },
        15: { name: 'Holanda', code: 'NL', flag: '🇳🇱' },
        17: { name: 'Bélgica', code: 'BE', flag: '🇧🇪' },
        18: { name: 'Suiza', code: 'CH', flag: '🇨🇭' },
        19: { name: 'Austria', code: 'AT', flag: '🇦🇹' },
        20: { name: 'Dinamarca', code: 'DK', flag: '🇩🇰' },
        21: { name: 'Noruega', code: 'NO', flag: '🇳🇴' },
        22: { name: 'Suecia', code: 'SE', flag: '🇸🇪' },
        23: { name: 'Finlandia', code: 'FI', flag: '🇫🇮' },
        24: { name: 'Islandia', code: 'IS', flag: '🇮🇸' },
        25: { name: 'Irlanda', code: 'IE', flag: '🇮🇪' },
        26: { name: 'Reino Unido', code: 'GB', flag: '🇬🇧' },
        28: { name: 'Nueva Zelanda', code: 'NZ', flag: '🇳🇿' },
        31: { name: 'Sudáfrica', code: 'ZA', flag: '🇿🇦' },
        32: { name: 'Egipto', code: 'EG', flag: '🇪🇬' },
        33: { name: 'Marruecos', code: 'MA', flag: '🇲🇦' },
        34: { name: 'Argelia', code: 'DZ', flag: '🇩🇿' },
        37: { name: 'Israel', code: 'IL', flag: '🇮🇱' },
        38: { name: 'Arabia Saudí', code: 'SA', flag: '🇸🇦' },
        40: { name: 'Irán', code: 'IR', flag: '🇮🇷' },
        42: { name: 'Pakistán', code: 'PK', flag: '🇵🇰' },
        43: { name: 'Bangladesh', code: 'BD', flag: '🇧🇩' },
        50: { name: 'Luxemburgo', code: 'LU', flag: '🇱🇺' },
        51: { name: 'Malta', code: 'MT', flag: '🇲🇹' },
        52: { name: 'Chipre', code: 'CY', flag: '🇨🇾' },
        53: { name: 'Estonia', code: 'EE', flag: '🇪🇪' },
        57: { name: 'Lituania', code: 'LT', flag: '🇱🇹' },
        59: { name: 'República Checa', code: 'CZ', flag: '🇨🇿' },
        60: { name: 'Eslovaquia', code: 'SK', flag: '🇸🇰' },
        64: { name: 'Hungría', code: 'HU', flag: '🇭🇺' },
        66: { name: 'Eslovenia', code: 'SI', flag: '🇸🇮' },
        68: { name: 'Croacia', code: 'HR', flag: '🇭🇷' },
        70: { name: 'Bosnia', code: 'BA', flag: '🇧🇦' },
        72: { name: 'Serbia', code: 'RS', flag: '🇷🇸' },
        74: { name: 'Montenegro', code: 'ME', flag: '🇲🇪' },
        75: { name: 'Albania', code: 'AL', flag: '🇦🇱' },
        77: { name: 'Macedonia', code: 'MK', flag: '🇲🇰' },
        78: { name: 'Bulgaria', code: 'BG', flag: '🇧🇬' },
        79: { name: 'Rumania', code: 'RO', flag: '🇷🇴' },
        80: { name: 'Moldavia', code: 'MD', flag: '🇲🇩' },
        81: { name: 'Ucrania', code: 'UA', flag: '🇺🇦' },
        82: { name: 'Bielorrusia', code: 'BY', flag: '🇧🇾' },
        83: { name: 'Letonia', code: 'LV', flag: '🇱🇻' },
        84: { name: 'Lituania', code: 'LT', flag: '🇱🇹' },
        86: { name: 'Polonia', code: 'PL', flag: '🇵🇱' },
        87: { name: 'República Checa', code: 'CZ', flag: '🇨🇿' },
        88: { name: 'Eslovaquia', code: 'SK', flag: '🇸🇰' },
        89: { name: 'Hungría', code: 'HU', flag: '🇭🇺' },
        90: { name: 'Rumania', code: 'RO', flag: '🇷🇴' },
        91: { name: 'Bulgaria', code: 'BG', flag: '🇧🇬' },
        93: { name: 'Croacia', code: 'HR', flag: '🇭🇷' },
        94: { name: 'Eslovenia', code: 'SI', flag: '🇸🇮' },
        95: { name: 'Bosnia', code: 'BA', flag: '🇧🇦' },
        96: { name: 'Serbia', code: 'RS', flag: '🇷🇸' },
        98: { name: 'Montenegro', code: 'ME', flag: '🇲🇪' },
        100: { name: 'Albania', code: 'AL', flag: '🇦🇱' }
    };
    return countries[id] || { name: `País ${id}`, code: `C${id}`, flag: '🌍' };
}

findMissingData();