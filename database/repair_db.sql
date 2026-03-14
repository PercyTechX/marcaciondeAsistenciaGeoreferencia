-- ==============================================================
-- SCRIPT DE REPARACIÓN / MIGRACIÓN - Sistema Geofencing GDS
-- ==============================================================
-- INSTRUCCIONES:
-- 1. Abre pgAdmin 4 (o psql en tu terminal).
-- 2. Conéctate a la base de datos del proyecto (la misma configurada en tu .env).
-- 3. Copia y pega TODO este script en el editor SQL y ejecútalo.
-- 4. Si todo va bien verás mensajes DO, SELECT, etc. sin errores.
-- ==============================================================

-- ---------------------------------------------------------------
-- PASO 1: BORRAR TABLAS ANTIGUAS EN ORDEN CORRECTO
--   (Las tablas con foreign keys se borran primero)
-- ---------------------------------------------------------------
DROP TABLE IF EXISTS marcaciones  CASCADE;
DROP TABLE IF EXISTS tickets      CASCADE;
DROP TABLE IF EXISTS locales      CASCADE;
DROP TABLE IF EXISTS usuarios     CASCADE;
DROP TABLE IF EXISTS clientes     CASCADE;

-- ---------------------------------------------------------------
-- PASO 2: RECREAR TABLAS CON ESTRUCTURA CORRECTA Y ACTUALIZADA
-- ---------------------------------------------------------------

-- Tabla de Clientes (Empresas externas)
CREATE TABLE clientes (
    id               SERIAL PRIMARY KEY,
    ruc              VARCHAR(20)  UNIQUE NOT NULL,
    razon_social     VARCHAR(150) NOT NULL,
    nombre_comercial VARCHAR(150),
    direccion        TEXT
);

-- Tabla de Locales (Sedes propias GDS + locales de clientes)
CREATE TABLE locales (
    id          SERIAL PRIMARY KEY,
    cliente_id  INT REFERENCES clientes(id) ON DELETE SET NULL,  -- NULL = sede propia (GDS)
    es_sede_gds BOOLEAN DEFAULT false,
    nombre      VARCHAR(100) NOT NULL,
    direccion   TEXT,
    latitud     NUMERIC(10, 8) NOT NULL,
    longitud    NUMERIC(11, 8) NOT NULL
);

-- Tabla de Usuarios del Sistema
CREATE TABLE usuarios (
    id            SERIAL PRIMARY KEY,
    dni           VARCHAR(15)  UNIQUE NOT NULL,
    nombre        VARCHAR(100) NOT NULL,
    usuario       VARCHAR(50)  UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol           VARCHAR(20)  CHECK (rol IN ('TECNICO', 'SUPERVISOR', 'ADMIN_TI')) NOT NULL,
    activo        BOOLEAN DEFAULT true
);

-- Tabla de Tickets de Servicio
CREATE TABLE tickets (
    id             SERIAL PRIMARY KEY,
    numero_ticket  VARCHAR(50) UNIQUE NOT NULL,
    local_id       INT REFERENCES locales(id) NOT NULL,
    descripcion    TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    estado         VARCHAR(20) DEFAULT 'ABIERTO' CHECK (estado IN ('ABIERTO', 'CERRADO'))
);

-- Tabla de Marcaciones (Log principal del sistema)
CREATE TABLE marcaciones (
    id            SERIAL PRIMARY KEY,
    usuario_id    INT REFERENCES usuarios(id) NOT NULL,
    ticket_id     INT REFERENCES tickets(id)  NOT NULL,
    tipo          VARCHAR(10) CHECK (tipo IN ('INGRESO', 'SALIDA')) NOT NULL,
    fecha_hora    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    latitud       NUMERIC(10, 8),
    longitud      NUMERIC(11, 8),
    precision_gps NUMERIC(8, 2),
    es_manual     BOOLEAN DEFAULT false,
    creado_por    INT REFERENCES usuarios(id) NOT NULL
);

-- Índice de rendimiento para consultas de concurrencia y reportes
CREATE INDEX idx_marcaciones_usuario_ticket ON marcaciones(usuario_id, ticket_id);

-- ---------------------------------------------------------------
-- PASO 3: INSERTAR DATOS BASE (seed mínimo para usar el sistema)
-- ---------------------------------------------------------------

-- Cliente de prueba
INSERT INTO clientes (id, ruc, razon_social, nombre_comercial, direccion)
VALUES (1, '20551234567', 'Cliente ABC S.A.C.', 'Cliente ABC', 'Av. Larco 123');

-- Locales de prueba
INSERT INTO locales (id, cliente_id, es_sede_gds, nombre, direccion, latitud, longitud)
VALUES
  (1, NULL, true,  'Sede GDS Principal',    'Lima - Peru',        -11.976447, -77.103373),
  (2, 1,    false, 'Cliente ABC - Av. Larco', 'Av. Larco 123',   -12.122115, -77.031023);

-- Usuarios iniciales del sistema (contraseñas sin hash - solo para demo local)
-- IMPORTANTE: En producción debes hashear las contraseñas con bcrypt
INSERT INTO usuarios (id, dni, nombre, usuario, password_hash, rol, activo)
VALUES
  (1, '12345678', 'Técnico Demo',  'tec',   '123', 'TECNICO',    true),
  (2, '87654321', 'Supervisor GDS','sup',   '123', 'SUPERVISOR', true),
  (3, '00000000', 'Admin TI',      'admin', '123', 'ADMIN_TI',   true);

-- Tickets de demostración
INSERT INTO tickets (id, numero_ticket, local_id, descripcion, estado)
VALUES
  (1, 'TCK-001', 1, 'Mantenimiento preventivo Sede Principal', 'ABIERTO'),
  (2, 'TCK-002', 2, 'Diagnóstico de red Cliente ABC',          'ABIERTO');

-- ---------------------------------------------------------------
-- PASO 4: RESETEAR SECUENCIAS (IMPORTANTE para evitar conflictos
--          al insertar nuevos registros desde la app)
-- ---------------------------------------------------------------
SELECT setval('clientes_id_seq', (SELECT MAX(id) FROM clientes));
SELECT setval('locales_id_seq',  (SELECT MAX(id) FROM locales));
SELECT setval('usuarios_id_seq', (SELECT MAX(id) FROM usuarios));
SELECT setval('tickets_id_seq',  (SELECT MAX(id) FROM tickets));

-- ---------------------------------------------------------------
-- VERIFICACIÓN FINAL: estas consultas deben devolver filas
-- ---------------------------------------------------------------
SELECT 'clientes OK - filas: ' || COUNT(*) FROM clientes;
SELECT 'locales OK - filas: '  || COUNT(*) FROM locales;
SELECT 'usuarios OK - filas: ' || COUNT(*) FROM usuarios;
SELECT 'tickets OK - filas: '  || COUNT(*) FROM tickets;
