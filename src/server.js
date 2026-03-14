const express = require('express');
const cors = require('cors');
require('dotenv').config();

const marcacionRoutes = require('./routes/marcacion.routes');
const adminRoutes = require('./routes/admin.routes');
const supervisorRoutes = require('./routes/supervisor.routes');
const reportesRoutes = require('./routes/reportes.routes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const path = require('path');

// Archivos estáticos del Frontend
app.use(express.static(path.join(__dirname, '../public')));

// Rutas API
app.use('/api', marcacionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/supervisor', supervisorRoutes);
app.use('/api/reportes', reportesRoutes);

// Manejo de Error 404
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint no encontrado' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});
