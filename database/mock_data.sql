-- ==========================================
-- DATOS MOCK (DE PRUEBA) - TESTING INICIAL
-- ==========================================

-- 1. Insertamos un Cliente de prueba
INSERT INTO clientes (id, ruc, razon_social, nombre_comercial, direccion) 
VALUES (1, '20551234567', 'Cliente ABC S.A.C.', 'Cliente ABC', 'Av. Larco 123')
ON CONFLICT (id) DO NOTHING;

-- 2. Insertamos Locales (El ID 1 será nuestra Sede GDS, el ID 2 un local de cliente)
INSERT INTO locales (id, cliente_id, es_sede_gds, nombre, direccion, latitud, longitud) 
VALUES 
(1, NULL, true, 'Sede GDS Principal', 'Ubicación Real Usuario', -11.976447, -77.103373),
(2, 1, false, 'Cliente ABC - Av. Larco', 'Av. Larco 123', -12.122115, -77.031023)
ON CONFLICT (id) DO NOTHING;

-- 3. Insertamos Usuarios de prueba (Las contraseñas no tienen hash solo por la demostración local)
INSERT INTO usuarios (id, dni, nombre, usuario, password_hash, rol, activo)
VALUES 
(1, '12345678', 'Técnico Demo', 'tec', '123', 'TECNICO', true),
(2, '87654321', 'Supervisor GDS', 'sup', '123', 'SUPERVISOR', true),
(3, '00000000', 'Admin TI', 'admin', '123', 'ADMIN_TI', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Abrimos un par de Tickets
INSERT INTO tickets (id, numero_ticket, local_id, descripcion, estado)
VALUES 
(1, 'TCK-001', 1, 'Mantenimiento preventivo Sede Principal', 'ABIERTO'),
(2, 'TCK-002', 2, 'Diagnóstico de red Cliente ABC', 'ABIERTO')
ON CONFLICT (id) DO NOTHING;

-- Reseteamos las secuencias para que los nuevos IDs autoincrementables no choquen
SELECT setval('clientes_id_seq', (SELECT MAX(id) FROM clientes));
SELECT setval('locales_id_seq', (SELECT MAX(id) FROM locales));
SELECT setval('usuarios_id_seq', (SELECT MAX(id) FROM usuarios));
SELECT setval('tickets_id_seq', (SELECT MAX(id) FROM tickets));
