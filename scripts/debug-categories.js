// Script para debuggear categorías faltantes
const fs = require('fs');

function debugCategories() {
    try {
        console.log('🔍 Analizando categorías de servidores que fallan...');

        const data = JSON.parse(fs.readFileSync('export_2025-07-16_15-44-50.json', 'utf8'));
        
        // Lista de servidores que están fallando
        const failingServers = [
            'HunterXro', 'Proximity', 'Apocalypse Ro', 'CalaRo', 'Suzaku Ro', 
            'Sword Art Ro', 'Conquer51 2.0', 'HebrithCo', 'Evolved PWI 1.5.5', 
            'Game Over Ro', 'Aura-RO', 'ValkyrieOnline'
        ];

        console.log('\n📋 Categorías de servidores que fallan:');
        
        failingServers.forEach(serverName => {
            const server = data.servers.find(s => s.titulo === serverName);
            if (server) {
                console.log(`${serverName} (ID: ${server.id}) -> Categoría: ${server.cat_id}`);
            } else {
                console.log(`${serverName} -> NO ENCONTRADO`);
            }
        });

        // Obtener todas las categorías únicas usadas
        const allCategories = new Set();
        data.servers.forEach(server => {
            if (server.cat_id) {
                allCategories.add(parseInt(server.cat_id));
            }
        });

        console.log('\n🎮 TODAS las categorías usadas en el export:');
        console.log([...allCategories].sort((a,b) => a-b).join(', '));

        // Categorías que sabemos que existen
        const existingCategories = [1, 2, 3, 4, 5, 6, 7, 10, 12, 13, 15, 16, 17, 18, 31];
        
        const missingCategories = [...allCategories].filter(cat => !existingCategories.includes(cat));
        
        console.log('\n❌ Categorías que AÚN FALTAN:');
        console.log(missingCategories.sort((a,b) => a-b).join(', '));

        // Generar SQL para las categorías faltantes
        if (missingCategories.length > 0) {
            console.log('\n🔧 SQL para agregar categorías faltantes:');
            missingCategories.forEach(id => {
                const categoryName = getCategoryName(id);
                const slug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                console.log(`INSERT INTO server_categories (id, name, slug, description) VALUES (${id}, '${categoryName}', '${slug}', 'Servidores de ${categoryName}') ON CONFLICT (id) DO NOTHING;`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
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
        18: 'Gunbound',
        19: 'Ultima Online',
        20: 'Diablo II',
        21: 'Counter-Strike Source',
        22: 'World of Warcraft Classic'
    };
    return categories[id] || `Juego ${id}`;
}

debugCategories();