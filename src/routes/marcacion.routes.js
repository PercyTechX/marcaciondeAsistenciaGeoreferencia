// marcacion.routes.js
const express = require('express');
const router = express.Router();
const marcacionController = require('../controllers/marcacion.controller');

// Definir endpoints de marcación
router.post('/marcacion', marcacionController.registrarMarcacion);
router.get('/marcaciones/usuario/:usuario_id', marcacionController.obtenerHistorialUsuario);

module.exports = router;
