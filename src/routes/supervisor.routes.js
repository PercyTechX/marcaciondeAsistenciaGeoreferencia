const express = require('express');
const router = express.Router();
const supervisorController = require('../controllers/supervisor.controller');

router.post('/tickets', supervisorController.crearTicket);
router.get('/tickets', supervisorController.obtenerTickets);
router.get('/tickets/abiertos', supervisorController.obtenerTicketsAbiertos);
router.put('/tickets/:id/cerrar', supervisorController.cerrarTicket);

module.exports = router;
