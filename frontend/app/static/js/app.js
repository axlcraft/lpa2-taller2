// Funciones auxiliares para la interfaz web

const API_URL = 'http://backend:8000';

// Verificar el estado del backend
async function verificarEstadoBackend() {
    try {
        const response = await fetch(`${API_URL}/`, {
            method: 'GET',
            mode: 'no-cors'
        });
        
        const badge = document.getElementById('statusBadge');
        if (badge) {
            badge.textContent = '🟢 Conectado';
            badge.classList.add('online');
        }
    } catch (error) {
        const badge = document.getElementById('statusBadge');
        if (badge) {
            badge.textContent = '🔴 Desconectado';
            badge.classList.add('offline');
        }
    }
}

// Manejar el envío del formulario
document.getElementById('facturaForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const facturaId = document.getElementById('id_factura').value.trim();
    
    if (!facturaId) {
        mostrarError('Por favor ingresa un número de factura');
        return;
    }
    
    if (facturaId.length < 3) {
        mostrarError('El número de factura debe tener al menos 3 caracteres');
        return;
    }
    
    descargarFactura(facturaId);
});

// Descargar la factura
function descargarFactura(facturaId) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/generar-pdf';
    
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'id_factura';
    input.value = facturaId;
    
    form.appendChild(input);
    document.body.appendChild(form);
    
    mostrarCarga(true);
    
    setTimeout(() => {
        form.submit();
        document.body.removeChild(form);
        mostrarCarga(false);
        mostrarExito(`Factura ${facturaId} descargada exitosamente`);
    }, 1000);
}

// Mostrar mensaje de error
function mostrarError(mensaje) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-error';
    alertDiv.innerHTML = `
        <span class="alert-icon">⚠️</span>
        <p>${mensaje}</p>
    `;
    
    const formulario = document.getElementById('facturaForm');
    formulario.insertAdjacentElement('afterend', alertDiv);
    
    setTimeout(() => alertDiv.remove(), 5000);
}

// Mostrar mensaje de éxito
function mostrarExito(mensaje) {
    const successDiv = document.getElementById('successMessage');
    const successText = document.getElementById('successText');
    
    if (successDiv && successText) {
        successText.textContent = mensaje;
        successDiv.style.display = 'flex';
        
        setTimeout(() => {
            successDiv.style.display = 'none';
        }, 5000);
    }
}

// Mostrar/ocultar indicador de carga
function mostrarCarga(mostrar) {
    const loadingDiv = document.getElementById('loading');
    const submitBtn = document.getElementById('submitBtn');
    
    if (loadingDiv) {
        loadingDiv.style.display = mostrar ? 'block' : 'none';
    }
    
    if (submitBtn) {
        submitBtn.disabled = mostrar;
    }
}

// Inicializar la página
document.addEventListener('DOMContentLoaded', () => {
    verificarEstadoBackend();
    
    // Reintentar verificar estado cada 30 segundos
    setInterval(verificarEstadoBackend, 30000);
});

