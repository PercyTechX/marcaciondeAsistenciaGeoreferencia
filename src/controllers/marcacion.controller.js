const db = require('../config/db.config');

// Función auxiliar para calcular distancia usando la fórmula de Haversine
function calcularDistanciaHaversine(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Radio de la Tierra en metros
    const rad = Math.PI / 180;
    const dLat = (lat2 - lat1) * rad;
    const dLon = (lon2 - lon1) * rad;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Retorna la distancia en metros
}

exports.registrarMarcacion = async (req, res) => {
    const { usuario_id, ticket_id, tipo, latitud, longitud, precision_gps } = req.body;

    // Validación básica de parámetros
    if (!usuario_id || !ticket_id || !tipo || !latitud || !longitud || !precision_gps) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos.' });
    }
    
    // Regla 1: Validar Precisión del GPS (> 100 metros se rechaza)
    if (precision_gps > 100) {
        return res.status(400).json({ error: 'Precisión GPS muy baja. Ubíquese en una zona más despejada.' });
    }

    let client;
    try {
        client = await db.connect(); // Intentar conectar a PostgreSQL
        await client.query('BEGIN'); // Iniciamos transacción

        // 1. Obtener datos del Local para validar la Geocerca
        const localQuery = `
            SELECT l.latitud, l.longitud 
            FROM locales l
            JOIN tickets t ON t.local_id = l.id
            WHERE t.id = $1
        `;
        const localResult = await client.query(localQuery, [ticket_id]);
        
        if (localResult.rowCount === 0) {
            throw new Error('Ticket o Local no encontrado.');
        }

        const local = localResult.rows[0];

        // Regla 2: Validación de Geocerca (100 metros)
        const distancia = calcularDistanciaHaversine(latitud, longitud, local.latitud, local.longitud);
        if (distancia > 100) {
            throw new Error(`Marcación bloqueada. Estás a ${Math.round(distancia)}m del local (Máx: 100m).`);
        }

        // Regla 3: Bloqueo de Concurrencia (No puede haber un INGRESO activo sin SALIDA)
        if (tipo === 'INGRESO') {
            const concurrenciaQuery = `
                SELECT tipo FROM marcaciones 
                WHERE usuario_id = $1 
                ORDER BY fecha_hora DESC LIMIT 1
            `;
            const ultimaMarcacion = await client.query(concurrenciaQuery, [usuario_id]);
            
            if (ultimaMarcacion.rows.length > 0 && ultimaMarcacion.rows[0].tipo === 'INGRESO') {
                throw new Error('Ya tienes un ticket con INGRESO activo. Debes marcar SALIDA primero.');
            }
        }

        if (tipo === 'SALIDA') {
             // Validar que efectivamente haya un ingreso previo para ESTE ticket
             const valSalida = await client.query(
                 `SELECT tipo FROM marcaciones WHERE usuario_id = $1 AND ticket_id = $2 ORDER BY fecha_hora DESC LIMIT 1`, 
                 [usuario_id, ticket_id]
             );
             if(valSalida.rows.length === 0 || valSalida.rows[0].tipo !== 'INGRESO') {
                 throw new Error('No puedes marcar SALIDA sin haber marcado INGRESO para este ticket.');
             }
        }

        // 3. Insertar la Marcación
        const insertQuery = `
            INSERT INTO marcaciones (usuario_id, ticket_id, tipo, latitud, longitud, precision_gps, es_manual, creado_por)
            VALUES ($1, $2, $3, $4, $5, $6, false, $1)
            RETURNING id, fecha_hora
        `;
        const result = await client.query(insertQuery, [usuario_id, ticket_id, tipo, latitud, longitud, precision_gps]);

        await client.query('COMMIT'); // Confirmamos transacción
        
        res.status(200).json({ 
            mensaje: 'Marcación registrada correctamente',
            datos: result.rows[0] 
        });

    } catch (error) {
        if (client) await client.query('ROLLBACK'); // Revertimos los cambios solo si hubo conexión

        // Manejo especial si no se pudo conectar a PostgreSQL
        if (error.code === 'ECONNREFUSED' || error.message.includes('connect')) {
            return res.status(500).json({ error: 'No se pudo conectar a PostgreSQL. Verifica que la BD esté iniciada y las credenciales sean correctas.' });
        }

        res.status(400).json({ error: error.message });
    } finally {
        if (client) client.release();
    }
};

exports.obtenerHistorialUsuario = async (req, res) => {
    const { usuario_id } = req.params;
    try {
        const result = await db.query(`
            SELECT m.*, t.numero_ticket, l.nombre as local_nombre
            FROM marcaciones m
            JOIN tickets t ON m.ticket_id = t.id
            JOIN locales l ON t.local_id = l.id
            WHERE m.usuario_id = $1
            ORDER BY m.fecha_hora DESC
            LIMIT 100
        `, [usuario_id]);
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
