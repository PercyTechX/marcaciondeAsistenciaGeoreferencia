const db = require('../config/db.config');

exports.crearTicket = async (req, res) => {
    const { numero_ticket, local_id, descripcion, fecha_creacion } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO tickets (numero_ticket, local_id, descripcion, fecha_creacion, estado) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [numero_ticket, local_id, descripcion, fecha_creacion || new Date(), 'ABIERTO']
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.obtenerTickets = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT t.*, l.nombre as local_nombre, c.nombre_comercial as cliente_nombre 
            FROM tickets t 
            JOIN locales l ON t.local_id = l.id 
            LEFT JOIN clientes c ON l.cliente_id = c.id
            ORDER BY t.fecha_creacion DESC
        `);
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.obtenerTicketsAbiertos = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT t.*, l.nombre as local_nombre, c.nombre_comercial as cliente_nombre 
            FROM tickets t 
            JOIN locales l ON t.local_id = l.id 
            LEFT JOIN clientes c ON l.cliente_id = c.id
            WHERE t.estado = 'ABIERTO'
            ORDER BY t.fecha_creacion DESC
        `);
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.cerrarTicket = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(
            "UPDATE tickets SET estado = 'CERRADO' WHERE id = $1 RETURNING *",
            [id]
        );
        if(result.rowCount === 0) return res.status(404).json({error: 'Ticket no encontrado'});
        res.status(200).json(result.rows[0]);
    } catch(error) {
        res.status(500).json({error: error.message});
    }
};
