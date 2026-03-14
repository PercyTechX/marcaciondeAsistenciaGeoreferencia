const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'marcacion_db',
    password: process.env.DB_PASSWORD || 'Computo1234',
    port: process.env.DB_PORT || 5432,
});

async function runTests() {
    console.log('--- INICIANDO TESTING AUTOMÁTICO ---');
    try {
        // 1. Probar Conexión Inicial
        const res = await pool.query('SELECT NOW() as hora_actual');
        console.log('✅ Conexión a Base de Datos: EXITOSA (' + res.rows[0].hora_actual + ')');
        
        // 2. Revisar Tablas
        const tablesQuery = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `;
        const tables = await pool.query(tablesQuery);
        const tableNames = tables.rows.map(t => t.table_name);
        
        const requiredTables = ['clientes', 'locales', 'usuarios', 'tickets', 'marcaciones'];
        const missingTables = requiredTables.filter(t => !tableNames.includes(t));
        
        if (missingTables.length === 0) {
            console.log('✅ Esquema de Base de datos: COMPLETO. Todas las tablas están creadas.');
        } else {
            console.log('❌ Esquema Incompleto. Faltan las tablas: ' + missingTables.join(', '));
            console.log('   -> RECUERDA: Debes ejecutar el script init.sql en pgAdmin.');
            return;
        }

        // 3. Revisar Datos (Mock Data)
        const userCount = await pool.query('SELECT COUNT(*) FROM usuarios');
        if (parseInt(userCount.rows[0].count) === 0) {
            console.log('⚠️ Aviso: La tabla de usuarios está vacía. Es necesario insertar Mock Data.');
        } else {
            console.log('✅ Datos: Las tablas contienen información.');
        }

    } catch (err) {
        console.error('❌ ERROR AL CONECTAR A POSTGRESQL:');
        console.error('   -> ' + err.message);
        if (err.message.includes('database "marcacion_db" does not exist')) {
            console.error('   -> ACCIÓN REQUERIDA: Debes crear la base de datos "marcacion_db" en pgAdmin.');
        }
    } finally {
        await pool.end();
        console.log('--- FIN DEL TESTING ---');
    }
}

runTests();
