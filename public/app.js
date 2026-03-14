document.addEventListener('DOMContentLoaded', () => {
    const ticketSelect = document.getElementById('ticketSelect');
    const btnIngreso = document.getElementById('btnIngreso');
    const btnSalida = document.getElementById('btnSalida');
    const gpsText = document.getElementById('gps-text');
    const gpsAccuracy = document.getElementById('gps-accuracy');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    let currentPosition = null;

    // Usuario Ficticio para la demostración
    const USER_ID = 1; 

    // Reloj en tiempo real
    const liveClock = document.getElementById('live-clock');
    const liveDate = document.getElementById('live-date');

    function initClock() {
        setInterval(() => {
            const now = new Date();
            liveClock.innerHTML = now.toLocaleTimeString('es-PE', { hour12: true });
            liveDate.textContent = now.toLocaleDateString('es-PE', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            }).toUpperCase();
        }, 1000);
    }

    // Inicializar Geolocalización
    function initGPS() {
        if (!navigator.geolocation) {
            gpsText.textContent = "Geolocalización no soportada por el navegador.";
            return;
        }

        navigator.geolocation.watchPosition(
            (position) => {
                currentPosition = position.coords;
                const { latitude, longitude, accuracy } = currentPosition;
                
                gpsText.textContent = `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`;
                gpsAccuracy.textContent = `Precisión: ${Math.round(accuracy)} metros`;
                
                if (accuracy > 100) {
                    gpsAccuracy.classList.add('bad');
                    gpsAccuracy.textContent += ' (Muy baja, ubíquese en zona despejada)';
                    btnIngreso.disabled = true;
                    btnSalida.disabled = true;
                } else {
                    gpsAccuracy.classList.remove('bad');
                    // Habilitar botones si hay ticket seleccionado
                    if (ticketSelect.value) {
                        btnIngreso.disabled = false;
                        btnSalida.disabled = false;
                    }
                }
            },
            (error) => {
                gpsText.textContent = "Error obteniendo ubicación. Active el GPS.";
                console.error(error);
                btnIngreso.disabled = true;
                btnSalida.disabled = true;
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    }

    // Event Listener Seleccionar Ticket
    ticketSelect.addEventListener('change', () => {
        if (currentPosition && currentPosition.accuracy <= 100) {
            btnIngreso.disabled = false;
            btnSalida.disabled = false;
        }
    });

    // Enviar Marcación a la API
    async function registrarMarcacion(tipo) {
        if (!currentPosition) return;

        const ticketId = ticketSelect.value;
        const btn = tipo === 'INGRESO' ? btnIngreso : btnSalida;
        const btnOriginalText = btn.innerHTML;
        
        btn.disabled = true;
        btn.innerHTML = 'Enviando...';

        try {
            const response = await fetch('/api/marcacion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    usuario_id: USER_ID,
                    ticket_id: parseInt(ticketId),
                    tipo: tipo,
                    latitud: currentPosition.latitude,
                    longitud: currentPosition.longitude,
                    precision_gps: currentPosition.accuracy
                })
            });

            const data = await response.json();

            if (response.ok) {
                showToast(`¡${tipo} registrado con éxito!`, 'success');
                cargarHistorial();
            } else {
                showToast(`Error: ${data.error}`, 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Error de conexión con el servidor', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = btnOriginalText;
        }
    }

    btnIngreso.addEventListener('click', () => registrarMarcacion('INGRESO'));
    btnSalida.addEventListener('click', () => registrarMarcacion('SALIDA'));

    function showToast(message, type) {
        toastMessage.textContent = message;
        toast.className = `toast ${type} show`;
        
        setTimeout(() => {
            toast.className = 'toast hidden';
        }, 4000);
    }

    // Llamadas asíncronas a Backend
    async function cargarTicketsDisponibles() {
        try {
            const res = await fetch('/api/supervisor/tickets/abiertos');
            const tickets = await res.json();
            const sel = document.getElementById('ticketSelect');
            if(sel) {
                sel.innerHTML = '<option value="" disabled selected>Seleccione un ticket (Local)...</option>';
                tickets.forEach(t => {
                    sel.innerHTML += `<option value="${t.id}">${t.numero_ticket.toUpperCase()} (${t.local_nombre})</option>`;
                });
            }
        } catch(e) { console.error(e); }
    }

    async function cargarHistorial() {
        try {
            const res = await fetch(`/api/marcaciones/usuario/${USER_ID}`);
            const historial = await res.json();
            const tb = document.getElementById('tbHistorialTecnico');
            if(!tb) return;
            
            tb.innerHTML = '';
            
            // Filtrar solo los del mes actual
            const hoy = new Date();
            const filtrados = historial.filter(m => {
                const d = new Date(m.fecha_hora);
                return d.getMonth() === hoy.getMonth() && d.getFullYear() === hoy.getFullYear();
            });

            if(filtrados.length === 0) {
                tb.innerHTML = `<tr><td colspan="3" style="padding: 25px; text-align: center; color: var(--text-muted); font-size: 0.9rem;"><em>(No hay marcaciones este mes)</em></td></tr>`;
                return;
            }

            filtrados.forEach(m => {
                const d = new Date(m.fecha_hora);
                const tipoHtml = m.tipo === 'INGRESO' ? 
                    `<span style="color: var(--success); font-size: 0.85rem; background: rgba(16, 185, 129, 0.2); padding: 4px 8px; border-radius: 4px; font-weight: bold;">INGRESO</span>` : 
                    `<span style="color: var(--danger); font-size: 0.85rem; background: rgba(239, 68, 68, 0.2); padding: 4px 8px; border-radius: 4px; font-weight: bold;">SALIDA</span>`;
                
                const fechaFormat = d.toLocaleDateString('sv-SE'); // YYYY-MM-DD
                const horaFormat = d.toLocaleTimeString('es-PE', { hour12: false });

                tb.innerHTML += `
                    <tr style="border-bottom: 1px solid var(--border);">
                        <td style="padding: 15px 20px;">
                            <div style="font-weight: 600;">${m.numero_ticket.toUpperCase()}</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">${m.local_nombre}</div>
                        </td>
                        <td style="padding: 15px 20px;">${tipoHtml}</td>
                        <td style="padding: 15px 20px;">
                            <div style="font-family: monospace; font-size: 0.95rem;">${fechaFormat}</div>
                            <div style="font-family: monospace; font-size: 0.95rem; font-weight: bold;">${horaFormat}</div>
                        </td>
                    </tr>
                `;
            });
        } catch(e) { console.error(e); }
    }

    // Iniciar
    initGPS();
    initClock();
    cargarTicketsDisponibles();
    cargarHistorial();
});
