/**
 * Adaptador de infraestructura para generar reportes PDF con jsPDF.
 */
const { jsPDF } = require('jspdf');
require('jspdf-autotable');

const generarReporteDiscipulado = (fecha, asistencias, miembros) => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(21, 128, 61);
    doc.text('Reporte de Asistencia - Discipulado', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Fecha: ${fecha}`, 105, 28, { align: 'center' });
    const presentes = asistencias.filter(item => item.estado === 'presente').length;
    const reportados = asistencias.filter(item => item.estado === 'reportado').length;
    const ausentes = miembros.length - presentes - reportados;
    doc.autoTable({
        startY: 35,
        head: [['Resumen', 'Cantidad']],
        body: [
            ['Presentes', presentes],
            ['Reportados', reportados],
            ['Ausentes', ausentes],
            ['Total', miembros.length]
        ],
        theme: 'grid',
        headStyles: { fillColor: [21, 128, 61] },
        margin: { left: 40, right: 40 }
    });
    doc.autoTable({
        startY: doc.lastAutoTable.finalY + 10,
        head: [['#', 'Nombre', 'Estado']],
        body: miembros.map((miembro, index) => {
            const registro = asistencias.find(item => item.miembro_id === miembro.id);
            return [index + 1, miembro.nombre, (registro?.estado || 'ausente').toUpperCase()];
        }),
        theme: 'striped',
        headStyles: { fillColor: [21, 128, 61] }
    });
    return Buffer.from(doc.output('arraybuffer'));
};

const generarReportePueblo = (fecha, asistencias, categorias) => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(21, 128, 61);
    doc.text('Reporte de Asistencia - Pueblo', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Fecha: ${fecha}`, 105, 28, { align: 'center' });
    const total = asistencias.reduce((sum, item) => sum + (item.cantidad || 0), 0);
    doc.autoTable({
        startY: 35,
        head: [['Categoría', 'Cantidad']],
        body: categorias.map(categoria => {
            const registro = asistencias.find(item => item.categoria_id === categoria.id);
            return [categoria.nombre, registro?.cantidad || 0];
        }),
        theme: 'striped',
        headStyles: { fillColor: [21, 128, 61] },
        margin: { left: 40, right: 40 }
    });
    doc.setFontSize(12);
    doc.setTextColor(21, 128, 61);
    doc.text(`Total: ${total}`, 105, doc.lastAutoTable.finalY + 10, {
        align: 'center'
    });
    return Buffer.from(doc.output('arraybuffer'));
};

module.exports = { generarReporteDiscipulado, generarReportePueblo };
