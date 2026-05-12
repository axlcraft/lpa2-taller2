from flask import Flask, render_template, request, send_file, abort, jsonify
import requests
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import mm
from io import BytesIO
import os

app = Flask(__name__)
BACKEND_URL = os.getenv('BACKEND_API_URL', 'http://backend:8000')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/status')
def status():
    try:
        response = requests.get(f'{BACKEND_URL}/', timeout=3)
        if response.status_code == 200:
            return jsonify({"status": "ok", "backend": response.json()})
        return jsonify({"status": "error", "backend_status": response.status_code}), 502
    except requests.exceptions.RequestException:
        return jsonify({"status": "unavailable"}), 503

@app.route('/generar-pdf', methods=['POST'])
def generar_pdf():
    try:
        id_factura = request.form['id_factura']
        response = requests.get(f'{BACKEND_URL}/facturas/v1/{id_factura}')

        if response.status_code != 200:
            abort(response.status_code, description="Factura no encontrada")

        factura = response.json()

        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, leftMargin=20*mm, rightMargin=20*mm, topMargin=20*mm, bottomMargin=20*mm)
        styles = getSampleStyleSheet()
        elements = []

        elements.append(Paragraph(f"Factura: {factura.get('numero_factura', '')}", styles['Title']))
        elements.append(Spacer(1, 8))
        elements.append(Paragraph(f"Fecha de emisión: {factura.get('fecha_emision', '')}", styles['Normal']))
        elements.append(Spacer(1, 12))

        elements.append(Paragraph("Empresa", styles['Heading2']))
        empresa = factura.get('empresa', {})
        elements.append(Paragraph(empresa.get('nombre', ''), styles['Normal']))
        elements.append(Paragraph(empresa.get('direccion', ''), styles['Normal']))
        elements.append(Paragraph(f"Teléfono: {empresa.get('telefono', '')}", styles['Normal']))
        elements.append(Paragraph(f"Email: {empresa.get('email', '')}", styles['Normal']))
        elements.append(Spacer(1, 12))

        elements.append(Paragraph("Cliente", styles['Heading2']))
        cliente = factura.get('cliente', {})
        elements.append(Paragraph(cliente.get('nombre', ''), styles['Normal']))
        elements.append(Paragraph(cliente.get('direccion', ''), styles['Normal']))
        elements.append(Paragraph(f"Teléfono: {cliente.get('telefono', '')}", styles['Normal']))
        elements.append(Spacer(1, 12))

        detalle = factura.get('detalle', [])
        table_data = [["Descripción", "Cantidad", "Precio unitario", "Total"]]
        for item in detalle:
            table_data.append([
                item.get('descripcion', ''),
                str(item.get('cantidad', '')),
                f"€{item.get('precio_unitario', 0):,.2f}",
                f"€{item.get('total', 0):,.2f}"
            ])

        table = Table(table_data, colWidths=[220*mm/4, 40*mm/4, 60*mm/4, 40*mm/4])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4CAF50')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(table)
        elements.append(Spacer(1, 12))

        subtotal = factura.get('subtotal', 0)
        impuesto = factura.get('impuesto', 0)
        total = factura.get('total', 0)

        elements.append(Paragraph(f"Subtotal: €{subtotal:,.2f}", styles['Normal']))
        elements.append(Paragraph(f"Impuesto: €{impuesto:,.2f}", styles['Normal']))
        elements.append(Paragraph(f"Total: €{total:,.2f}", styles['Heading2']))

        doc.build(elements)
        buffer.seek(0)

        return send_file(
            buffer,
            as_attachment=True,
            download_name=f"{id_factura}.pdf",
            mimetype='application/pdf'
        )

    except requests.exceptions.ConnectionError:
        abort(503, description="Error de conexión con el servidor")
    except Exception as e:
        abort(500, description=str(e))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000, debug=True)

