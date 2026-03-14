const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportes.controller');

router.get('/consolidado', reportesController.obtenerConsolidadoHoras);
router.get('/tecnicos', reportesController.obtenerTecnicosComboBox);

module.exports = router;
