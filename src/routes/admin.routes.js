const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');

// Clientes
router.post('/clientes', adminController.crearCliente);
router.get('/clientes', adminController.obtenerClientes);

// Locales
router.post('/locales', adminController.crearLocal);
router.get('/locales', adminController.obtenerLocales);

// Usuarios
router.post('/usuarios', adminController.crearUsuario);
router.get('/usuarios', adminController.obtenerUsuarios);

module.exports = router;
