const db = require('../config/db.config');

exports.obtenerConsolidadoHoras = async (req, res) => {
    // Parámetros de filtro
    const mes = req.query.mes || new Date().getMonth() + 1;
    const anio = req.query.anio || new Date().getFullYear();
    const tecnico_id = req.query.tecnico_id; // Opcional

    try {
        let params = [mes, anio];
        let whereTecnico = '';
        
        if (tecnico_id) {
            params.push(tecnico_id);
            whereTecnico = `AND p.usuario_id = $3`;
        }

        const query = `
        WITH ParesMarcaciones AS (
            SELECT 
                m1.usuario_id,
                m1.ticket_id,
                DATE(m1.fecha_hora AT TIME ZONE 'America/Lima') AS fecha_reporte,
                m1.fecha_hora AS hora_ingreso,
                MIN(m2.fecha_hora) AS hora_salida,
                t.estado as estado_ticket
            FROM marcaciones m1
            LEFT JOIN marcaciones m2 
                ON m1.usuario_id = m2.usuario_id 
                AND m1.ticket_id = m2.ticket_id 
                AND m2.tipo = 'SALIDA' 
                AND m2.fecha_hora > m1.fecha_hora
            JOIN tickets t ON m1.ticket_id = t.id
            WHERE m1.tipo = 'INGRESO'
            GROUP BY m1.usuario_id, m1.ticket_id, m1.fecha_hora, t.estado
        )
        SELECT 
            u.nombre AS tecnico, 
            t.numero_ticket, 
            COALESCE(c.nombre_comercial, l.nombre) AS local_cliente, 
            p.fecha_reporte,
            TO_CHAR(p.hora_ingreso AT TIME ZONE 'America/Lima', 'HH24:MI:SS') AS ingreso,
            TO_CHAR(p.hora_salida AT TIME ZONE 'America/Lima', 'HH24:MI:SS') AS salida,
            ROUND(EXTRACT(EPOCH FROM (p.hora_salida - p.hora_ingreso)) / 3600.0, 2) AS horas_totales,
            p.estado_ticket,
            CASE WHEN p.hora_salida IS NULL THEN true ELSE false END as en_ruta
        FROM ParesMarcaciones p
        JOIN usuarios u ON p.usuario_id = u.id
        JOIN tickets t ON p.ticket_id = t.id
        JOIN locales l ON t.local_id = l.id
        LEFT JOIN clientes c ON l.cliente_id = c.id
        WHERE EXTRACT(MONTH FROM p.fecha_reporte) = $1 
          AND EXTRACT(YEAR FROM p.fecha_reporte) = $2
          ${whereTecnico}
        ORDER BY p.fecha_reporte DESC, p.hora_ingreso DESC;
        `;

        const result = await db.query(query, params);
        res.status(200).json(result.rows);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.obtenerTecnicosComboBox = async (req, res) => {
    try {
        // Obtenemos solo los usuarios que son técnicos o supervisores para el filtro
        const result = await db.query("SELECT id, nombre FROM usuarios WHERE rol IN ('TECNICO', 'SUPERVISOR') ORDER BY nombre");
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
