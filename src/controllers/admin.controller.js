const db = require('../config/db.config');

// --- GESTIÓN DE CLIENTES ---
exports.crearCliente = async (req, res) => {
    const { ruc, razon_social, nombre_comercial, direccion } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO clientes (ruc, razon_social, nombre_comercial, direccion) VALUES ($1, $2, $3, $4) RETURNING *',
            [ruc, razon_social, nombre_comercial, direccion]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.obtenerClientes = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM clientes ORDER BY id DESC');
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- GESTIÓN DE LOCALES ---
exports.crearLocal = async (req, res) => {
    // Si cliente_id es null o string vacio lo tomamos como NULL (Sede propia)
    const { cliente_id, nombre, direccion, latitud, longitud } = req.body;
    let clientId = cliente_id ? parseInt(cliente_id) : null;
    let esSedeGds = clientId === null;
    
    try {
        const result = await db.query(
            'INSERT INTO locales (cliente_id, es_sede_gds, nombre, direccion, latitud, longitud) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [clientId, esSedeGds, nombre, direccion, latitud, longitud]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.obtenerLocales = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT l.*, c.nombre_comercial as cliente_nombre 
            FROM locales l 
            LEFT JOIN clientes c ON l.cliente_id = c.id 
            ORDER BY l.id DESC
        `);
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- GESTIÓN DE USUARIOS ---
exports.crearUsuario = async (req, res) => {
    const { dni, nombre, usuario, password_hash, rol } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO usuarios (dni, nombre, usuario, password_hash, rol) VALUES ($1, $2, $3, $4, $5) RETURNING id, dni, nombre, usuario, rol, activo',
            [dni, nombre, usuario, password_hash, rol] // NOTA: No estamos encriptando en BD todavia, solo pasando el hash raw del front
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.obtenerUsuarios = async (req, res) => {
    try {
        const result = await db.query('SELECT id, dni, nombre, usuario, rol, activo FROM usuarios ORDER BY id DESC');
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
