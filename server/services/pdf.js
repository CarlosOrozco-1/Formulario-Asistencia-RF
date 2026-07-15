/**
 * Servicio de generación de PDFs (jsPDF server-side)
 * Usa jspdf y jspdf-autotable para generar reportes en el servidor.
 */
const { jsPDF } = require('jspdf');
require('jspdf-autotable');

function generarReporteDiscipulado(db, fecha, asistencias, miembros) {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(21, 128, 61);
    doc.text('Reporte de Asistencia - Discipulado', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Fecha: ${fecha}`, 105, 28, { align: 'center' });
    const presentes = asistencias.filter(a => a.estado === 'presente').length;
    const reportados = asistencias.filter(a => a.estado === 'reportado').length;
    const ausentes = miembros.length - presentes - reportados;
    doc.autoTable({
        startY: 35, head: [['Resumen', 'Cantidad']],
        body: [['Presentes', presentes], ['Reportados', reportados], ['Ausentes', ausentes], ['Total', miembros.length]],
        theme: 'grid', headStyles: { fillColor: [21, 128, 61] }, margin: { left: 40, right: 40 }
    });
    doc.autoTable({
        startY: doc.lastAutoTable.finalY + 10,
        head: [['#', 'Nombre', 'Estado']],
        body: miembros.map((m, i) => [i + 1, m.nombre, (asistencias.find(a => a.miembro_id === m.id)?.estado || 'ausente').toUpperCase()]),
        theme: 'striped', headStyles: { fillColor: [21, 128, 61] }
    });
    return Buffer.from(doc.output('arraybuffer'));
}

function generarReportePueblo(db, fecha, asistencias, categorias) {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(21, 128, 61);
    doc.text('Reporte de Asistencia - Pueblo', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Fecha: ${fecha}`, 105, 28, { align: 'center' });
    const total = asistencias.reduce((sum, a) => sum + (a.cantidad || 0), 0);
    doc.autoTable({
        startY: 35, head: [['Categoría', 'Cantidad']],
        body: categorias.map(c => [c.nombre, asistencias.find(a => a.categoria_id === c.id)?.cantidad || 0]),
        theme: 'striped', headStyles: { fillColor: [21, 128, 61] }, margin: { left: 40, right: 40 }
    });
    doc.setFontSize(12);
    doc.setTextColor(21, 128, 61);
    doc.text(`Total: ${total}`, 105, doc.lastAutoTable.finalY + 10, { align: 'center' });
    return Buffer.from(doc.output('arraybuffer'));
}

module.exports = { generarReporteDiscipulado, generarReportePueblo };
