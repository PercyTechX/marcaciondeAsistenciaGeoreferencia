require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function updateGPS() {
    try {
        const query = `
            UPDATE locales 
            SET latitud = -11.976447, longitud = -77.103373 
            WHERE id = 1
        `;
        await pool.query(query);
        console.log('✅ Coordenadas de Sede GDS Principal actualizadas exitosamente a tu ubicación real.');
    } catch (err) {
        console.error('❌ Error actualizando GPS:', err.message);
    } finally {
        pool.end();
    }
}

updateGPS();
