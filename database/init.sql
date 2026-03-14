-- 1. Tabla de Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    ruc VARCHAR(20) UNIQUE NOT NULL,
    razon_social VARCHAR(150) NOT NULL,
    nombre_comercial VARCHAR(150),
    direccion TEXT
);

-- 2. Tabla de Locales (Clientes y Propios)
CREATE TABLE IF NOT EXISTS locales (
    id SERIAL PRIMARY KEY,
    cliente_id INT REFERENCES clientes(id) ON DELETE SET NULL, -- NULL si es sede propia (GDS)
    es_sede_gds BOOLEAN DEFAULT false,
    nombre VARCHAR(100) NOT NULL,
    direccion TEXT,
    latitud NUMERIC(10, 8) NOT NULL,
    longitud NUMERIC(11, 8) NOT NULL
);

-- 3. Tabla de Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    dni VARCHAR(15) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    usuario VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) CHECK (rol IN ('TECNICO', 'SUPERVISOR', 'ADMIN_TI')) NOT NULL,
    activo BOOLEAN DEFAULT true
);

-- 4. Tabla de Tickets
CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    numero_ticket VARCHAR(50) UNIQUE NOT NULL,
    local_id INT REFERENCES locales(id) NOT NULL,
    descripcion TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(20) DEFAULT 'ABIERTO' CHECK (estado IN ('ABIERTO', 'CERRADO'))
);

-- 5. Tabla de Marcaciones (Logs)
CREATE TABLE IF NOT EXISTS marcaciones (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) NOT NULL,
    ticket_id INT REFERENCES tickets(id) NOT NULL,
    tipo VARCHAR(10) CHECK (tipo IN ('INGRESO', 'SALIDA')) NOT NULL,
    fecha_hora TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    latitud NUMERIC(10, 8),
    longitud NUMERIC(11, 8),
    precision_gps NUMERIC(8, 2), -- Guardamos el radio de precisión en metros
    es_manual BOOLEAN DEFAULT false,
    creado_por INT REFERENCES usuarios(id) NOT NULL
);

-- Índice para mejorar las consultas de concurrencia y reportes
-- Creamos el índice si no existe, como estamos usando PostgreSQL anterior es mejor asegurarse si no existe
CREATE INDEX IF NOT EXISTS idx_marcaciones_usuario_ticket ON marcaciones(usuario_id, ticket_id);
