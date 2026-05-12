// Funciones auxiliares para la interfaz web
let previewFacturaId = '';

// Verificar el estado del backend a través del frontend para evitar problemas de CORS
async function verificarEstadoBackend() {
    try {
        const response = await fetch('/status');
        const badge = document.getElementById('statusBadge');

        if (response.ok) {
            if (badge) {
                badge.textContent = '🟢 Conectado';
                badge.classList.remove('offline');
                badge.classList.add('online');
            }
            return;
        }

        if (badge) {
            badge.textContent = '🔴 Desconectado';
            badge.classList.remove('online');
            badge.classList.add('offline');
        }
    } catch (error) {
        const badge = document.getElementById('statusBadge');
        if (badge) {
            badge.textContent = '🔴 Desconectado';
            badge.classList.remove('online');
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

async function solicitarPreview(facturaId) {
    try {
        mostrarCarga(true);
        const response = await fetch(`/preview/${encodeURIComponent(facturaId)}`);
        const badge = document.getElementById('statusBadge');

        if (!response.ok) {
            throw new Error('No se pudo cargar la vista previa');
        }

        const factura = await response.json();
        renderPreview(factura);

        if (badge) {
            badge.textContent = '🟢 Conectado';
            badge.classList.remove('offline');
            badge.classList.add('online');
        }
    } catch (error) {
        mostrarError('No se pudo cargar la vista previa. Verifica el número de factura y vuelve a intentarlo.');
    } finally {
        mostrarCarga(false);
    }
}

function renderPreview(factura) {
    const container = document.getElementById('previewContainer');
    const content = document.getElementById('previewContent');

    if (!container || !content) return;

    const detalleRows = factura.detalle.map(item => `
        <tr>
            <td>${item.descripcion}</td>
            <td>${item.cantidad}</td>
            <td>€${item.precio_unitario.toFixed(2)}</td>
            <td>€${item.total.toFixed(2)}</td>
        </tr>
    `).join('');

    // Asegurar que haya al menos 4 filas visibles
    const minRows = 4;
    const emptyRows = Math.max(0, minRows - factura.detalle.length);
    const emptyRowHtml = '<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>'.repeat(emptyRows);

    content.innerHTML = `
        <div class="preview-section">
            <div class="preview-block">
                <h4>Factura</h4>
                <p><strong>Número:</strong> ${factura.numero_factura}</p>
                <p><strong>Fecha:</strong> ${factura.fecha_emision}</p>
            </div>
            <div class="preview-block">
                <h4>Empresa</h4>
                <p>${factura.empresa.nombre}</p>
                <p>${factura.empresa.direccion}</p>
                <p>${factura.empresa.telefono}</p>
                <p>${factura.empresa.email}</p>
            </div>
            <div class="preview-block">
                <h4>Cliente</h4>
                <p>${factura.cliente.nombre}</p>
                <p>${factura.cliente.direccion}</p>
                <p>${factura.cliente.telefono}</p>
            </div>
        </div>
        <div class="preview-table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>Descripción</th>
                        <th>Cantidad</th>
                        <th>Precio unitario</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${detalleRows}
                    ${emptyRowHtml}
                </tbody>
            </table>
            <div class="preview-totals">
                <p><strong>Subtotal:</strong> €${factura.subtotal.toFixed(2)}</p>
                <p><strong>Impuesto:</strong> €${factura.impuesto.toFixed(2)}</p>
                <p><strong>Total:</strong> €${factura.total.toFixed(2)}</p>
            </div>
        </div>
    `;

    container.style.display = 'block';
    previewFacturaId = factura.numero_factura || '';
}

function descargarPreviewFactura() {
    if (!previewFacturaId) {
        mostrarError('No hay factura seleccionada para descargar');
        return;
    }
    descargarFactura(previewFacturaId);
}

function hidePreview() {
    const container = document.getElementById('previewContainer');
    if (container) {
        container.style.display = 'none';
    }
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
    
    document.getElementById('previewBtn')?.addEventListener('click', () => {
        const facturaId = document.getElementById('id_factura').value.trim();
        if (!facturaId) {
            mostrarError('Por favor ingresa un número de factura para previsualizar');
            return;
        }
        solicitarPreview(facturaId);
    });

    document.getElementById('downloadPreviewBtn')?.addEventListener('click', () => {
        descargarPreviewFactura();
    });

    document.getElementById('closePreviewBtn')?.addEventListener('click', hidePreview);

    // Reintentar verificar estado cada 30 segundos
    setInterval(verificarEstadoBackend, 30000);
});

