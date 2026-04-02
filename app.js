/**
 * Sistema de Asistencia RF
 * Archivo: app.js
 * 
 * Este archivo contiene toda la lógica de la aplicación:
 * - Inicialización de la base de datos SQLite
 * - Componentes React para las vistas de Discipulado y Pueblo
 * - Generación de reportes en PDF
 */

// ============================================
// Importar hooks de React desde el scope global
// ============================================
// Destructurar useState y useEffect desde la librería React cargada en el HTML
const { useState, useEffect } = React;

// ============================================
// Constantes y datos iniciales
// ============================================

// Estados posibles para la asistencia del discipulado
const STATUS = { 
    PRESENT: 'presente', 
    REPORTED: 'reportado', 
    ABSENT: 'ausente' 
};

// Lista inicial de miembros del discipulado
const INITIAL_MEMBERS = [
    "Hrno. Santos Hernández", 
    "Hrna. Norma de Hernández", 
    "Hrno. Gerson Sánchez", 
    "Hrna. Jackeline de Sánchez", 
    "Hrna. Sarai Sánchez", 
    "Hrno. Gabriel Olivares", 
    "Hrna. Marian de Olivares", 
    "Hrna. Sofia Olivares", 
    "Hrno. Carlos Orozco", 
    "Hrna. Ana Maria de Orozco", 
    "Hrna. Angy Orozco", 
    "Hrna. Alejandra Orozco", 
    "Hrno. Emanuel Godinez", 
    "Hrna. Heydi de Godinez", 
    "Hrno. Jamed", 
    "Hrno. Oscar Lopez", 
    "Hrno. Héctor", 
    "Hrna. Nuria", 
    "Hrno. Fernando Eguizabal", 
    "Hrna. Leidy López de Eguizabal", 
    "Hrna. Maybelin de Leonardo", 
    "Hrno. Brayan Leonardo", 
    "Hrno. Daniel Solis", 
    "Hrna. Karla Soto", 
    "Hrno. Marlon González", 
    "Hrno. Jorge", 
    "Hrno. Andre", 
    "Hrno. Denis"
];

// Categorías iniciales para asistencia del pueblo basadas en departamentos
const PUEBLO_INITIAL = [
    { nombre: "Alabanza", cantidad: 0 },
    { nombre: "Shofares", cantidad: 0 },
    { nombre: "Danza en general", cantidad: 0 },
    { nombre: "Intercesión", cantidad: 0 },
    { nombre: "Ancianos", cantidad: 0 },
    { nombre: "Multimedia", cantidad: 0 },
    { nombre: "Servidores", cantidad: 0 },
    { nombre: "Maestros", cantidad: 0 },
    { nombre: "Ovejitas", cantidad: 0 },
    { nombre: "Encargadas corderitos", cantidad: 0 },
    { nombre: "Corderitos", cantidad: 0 },
    { nombre: "Cafetería", cantidad: 0 },
    { nombre: "Departamento de Orden", cantidad: 0 },
    { nombre: "Nuevos", cantidad: 0 },
    { nombre: "Pueblo en general", cantidad: 0 }
];

// ============================================
// Funciones de Base de Datos
// ============================================

/**
 * Inicializa la base de datos SQLite en el navegador
 * Crea las tablas necesarias e inserta datos iniciales si no existen
 * @returns {Promise<Database>} Instancia de la base de datos
 */
async function initDB() {
    // Inicializar SQL.js con la ubicación del archivo wasm
    const SQL = await initSqlJs({ 
        locateFile: file => `https://unpkg.com/sql.js@1.8.0/dist/${file}` 
    });
    const db = new SQL.Database();
    
    // Crear tablas necesarias para el sistema
    // Tabla de discipulos: registra los hermanos del grupo
    db.run(`
        CREATE TABLE IF NOT EXISTS discipulos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT UNIQUE
        )
    `);
    
    // Tabla de asistencia del discipulo: registra la asistencia por fecha
    db.run(`
        CREATE TABLE IF NOT EXISTS asistencia_discipulado (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            discipulo_id INTEGER,
            fecha TEXT,
            estado TEXT,
            FOREIGN KEY(discipulo_id) REFERENCES discipulos(id)
        )
    `);
    
    // Tabla de pueblo: registra las categorías de asistencia del pueblo
    db.run(`
        CREATE TABLE IF NOT EXISTS pueblo (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT UNIQUE,
            cantidad INTEGER DEFAULT 0
        )
    `);
    
    // Tabla de asistencia del pueblo: registra la asistencia por fecha
    db.run(`
        CREATE TABLE IF NOT EXISTS asistencia_pueblo (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pueblo_id INTEGER,
            fecha TEXT,
            cantidad INTEGER,
            FOREIGN KEY(pueblo_id) REFERENCES pueblo(id)
        )
    `);

    // Insertar miembros iniciales del discipulado si no existen
    const existingMembers = db.exec("SELECT nombre FROM discipulos");
    if (existingMembers.length === 0 || existingMembers[0].values.length === 0) {
        INITIAL_MEMBERS.forEach(n => {
            db.run("INSERT INTO discipulos (nombre) VALUES (?)", [n]);
        });
    }

    // Insertar categorías iniciales del pueblo si no existen
    const existingPueblo = db.exec("SELECT nombre FROM pueblo");
    if (existingPueblo.length === 0 || existingPueblo[0].values.length === 0) {
        PUEBLO_INITIAL.forEach(p => {
            db.run("INSERT INTO pueblo (nombre, cantidad) VALUES (?, ?)", 
                [p.nombre, 0]);
        });
    }

    return db;
}

// ============================================
// Funciones utilitarias
// ============================================

/**
 * Convierte una fecha en formato YYYY-MM-DD a DD/MM/YYYY
 * @param {string} d - Fecha en formato ISO (YYYY-MM-DD)
 * @returns {string} Fecha formateada DD/MM/YYYY
 */
function displayDate(d) {
    if (!d) return '';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
}

// ============================================
// Componentes React
// ============================================

/**
 * Componente para la vista de asistencia del Discipulado
 * Permite registrar la asistencia de cada miembro con estados: Presente, Reportado, Ausencia
 * @param {Object} props - Props del componente (db, date, onDateChange)
 */
function DiscipuladoView({ db, date, onDateChange }) {
    // Estados locales del componente
    const [members, setMembers] = useState([]);              // Lista de miembros
    const [attendance, setAttendance] = useState({});         // Estado de asistencia actual
    const [searchTerm, setSearchTerm] = useState('');         // Término de búsqueda
    const [isAdding, setIsAdding] = useState(false);           // Mostrar formulario de agregar
    const [newName, setNewName] = useState('');               // Nombre nuevo a agregar
    const [editingIndex, setEditingIndex] = useState(null);   // Índice del miembro en edición
    const [editValue, setEditValue] = useState('');           // Valor del nombre en edición

    // Cargar miembros de la base de datos al iniciar o cuando db cambie
    useEffect(() => {
        if (db) {
            const result = db.exec("SELECT nombre FROM discipulos ORDER BY nombre");
            if (result.length > 0) {
                setMembers(result[0].values.map(r => r[0]));
            }
        }
    }, [db]);

    /**
     * Maneja el cambio de estado de asistencia de un miembro
     * @param {string} name - Nombre del miembro
     * @param {string} s - Nuevo estado (presente, reportado, ausente)
     */
    const handleStatus = (name, s) => {
        setAttendance(prev => ({ ...prev, [name]: s }));
    };

    /**
     * Agrega un nuevo miembro al discipulado
     * @param {Event} e - Evento del formulario
     */
    const addNew = (e) => {
        e.preventDefault();
        if (newName.trim() && !members.includes(newName.trim())) {
            try {
                db.run("INSERT INTO discipulos (nombre) VALUES (?)", [newName.trim()]);
                const result = db.exec("SELECT nombre FROM discipulos ORDER BY nombre");
                setMembers(result[0].values.map(r => r[0]));
            } catch (err) { 
                console.log(err); 
            }
            setNewName('');
            setIsAdding(false);
        }
    };

    /**
     * Elimina un miembro del discipulado
     * @param {string} name - Nombre del miembro a eliminar
     */
    const remove = (name) => {
        if (confirm(`¿Eliminar a ${name} de la lista?`)) {
            db.run("DELETE FROM discipulos WHERE nombre = ?", [name]);
            const result = db.exec("SELECT nombre FROM discipulos ORDER BY nombre");
            setMembers(result[0].values.map(r => r[0]));
        }
    };

    /**
     * Guarda los cambios de edición de un miembro
     * @param {number} idx - Índice del miembro en el array
     */
    const saveEdit = (idx) => {
        const val = editValue.trim();
        if (val && val !== members[idx]) {
            db.run("UPDATE discipulos SET nombre = ? WHERE nombre = ?", [val, members[idx]]);
            const oldName = members[idx];
            const result = db.exec("SELECT nombre FROM discipulos ORDER BY nombre");
            setMembers(result[0].values.map(r => r[0]));
            
            // Actualizar también en el estado de asistencia si existe
            if (attendance[oldName]) {
                const newAtt = { ...attendance, [val]: attendance[oldName] };
                delete newAtt[oldName];
                setAttendance(newAtt);
            }
        }
        setEditingIndex(null);
    };

    /**
     * Genera y descarga el reporte de asistencia en PDF
     */
    const downloadPDF = () => {
        const { jsPDF } = window.jspdf;
        const docPdf = new jsPDF();
        const dDate = displayDate(date);
        
        // Título del reporte
        docPdf.setFont("helvetica", "bold");
        docPdf.setTextColor(21, 128, 61);
        docPdf.text("Discipulado Monte Carmelo 3", 105, 20, { align: "center" });
        
        // Fecha del reporte
        docPdf.setFontSize(10);
        docPdf.setTextColor(100);
        docPdf.text(`Reporte de Asistencia: ${dDate}`, 105, 28, { align: "center" });

        // Calcular estadísticas
        const p = Object.values(attendance).filter(v => v === STATUS.PRESENT).length;
        const r = Object.values(attendance).filter(v => v === STATUS.REPORTED).length;

        // Tabla de resumen
        docPdf.autoTable({
            startY: 35,
            head: [['Resumen', 'Cantidad']],
            body: [
                ['Presentes', p], 
                ['Reportados', r], 
                ['Ausentes', members.length - (p+r)], 
                ['Total', members.length]
            ],
            theme: 'grid',
            headStyles: { fillColor: [21, 128, 61] },
            margin: { left: 40, right: 40 }
        });

        // Tabla de asistencia detallada
        docPdf.autoTable({
            startY: docPdf.lastAutoTable.finalY + 10,
            head: [['#', 'Nombre del Hermano(a)', 'Estado']],
            body: members.map((m, i) => [i + 1, m, (attendance[m] || 'AUSENCIA').toUpperCase()]),
            theme: 'striped',
            headStyles: { fillColor: [21, 128, 61] }
        });

        // Descargar archivo
        docPdf.save(`Asistencia_MC3_${dDate.replace(/\//g, '-')}.pdf`);
    };

    // Filtrar miembros por término de búsqueda
    const filtered = members.filter(m => m.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-4">
            {/* Barra de búsqueda y selector de fecha */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2 bg-white p-2 rounded-xl border border-slate-200 flex items-center gap-2 shadow-sm">
                    <div className="relative flex-1">
                        <i data-lucide="search" className="absolute left-3 top-2.5 text-slate-400" size="18"></i>
                        <input 
                            type="text" 
                            placeholder="Buscar en la lista..." 
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                        />
                    </div>
                    <input 
                        type="date" 
                        className="bg-slate-50 px-3 py-2 rounded-lg text-xs font-bold outline-none border border-transparent focus:border-green-500" 
                        value={date} 
                        onChange={e => onDateChange(e.target.value)} 
                    />
                </div>
                
                {/* Tarjetas de estadísticas */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-around items-center text-center shadow-sm">
                    <div>
                        <p className="text-[8px] text-slate-400 font-black uppercase tracking-tighter">Presente</p>
                        <p className="text-xl font-black text-green-600 leading-none">{Object.values(attendance).filter(v => v === STATUS.PRESENT).length}</p>
                    </div>
                    <div className="w-[1px] h-6 bg-slate-100"></div>
                    <div>
                        <p className="text-[8px] text-slate-400 font-black uppercase tracking-tighter">Reporte</p>
                        <p className="text-xl font-black text-amber-500 leading-none">{Object.values(attendance).filter(v => v === STATUS.REPORTED).length}</p>
                    </div>
                    <div className="w-[1px] h-6 bg-slate-100"></div>
                    <div>
                        <p className="text-[8px] text-slate-400 font-black uppercase tracking-tighter">Total</p>
                        <p className="text-xl font-black text-slate-700 leading-none">{members.length}</p>
                    </div>
                </div>
            </div>

            {/* Lista de miembros */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
                    <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Listado de Hermanos</h2>
                    <div className="flex gap-2">
                        <button onClick={downloadPDF} className="bg-yellow-400 text-green-900 px-3 py-1.5 rounded-lg font-black text-[10px] flex items-center gap-1 hover:bg-yellow-300 transition-colors">
                            <i data-lucide="file-down" size="14"></i> PDF
                        </button>
                        <button onClick={() => setIsAdding(!isAdding)} className="text-green-700 font-black text-[10px] flex items-center gap-1 hover:bg-green-100 px-3 py-1 rounded-lg transition-colors">
                            <i data-lucide="user-plus" size="14"></i> AGREGAR
                        </button>
                    </div>
                </div>

                {/* Formulario para agregar nuevo miembro */}
                {isAdding && (
                    <form onSubmit={addNew} className="p-4 bg-green-50 border-b border-slate-200 flex gap-2">
                        <input 
                            autoFocus 
                            className="flex-1 p-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-green-500 outline-none" 
                            placeholder="Nombre del hermano(a)..." 
                            value={newName} 
                            onChange={(e) => setNewName(e.target.value)} 
                        />
                        <button className="bg-green-700 text-white px-5 py-2 rounded-lg font-bold text-xs uppercase shadow-md">Guardar</button>
                    </form>
                )}

                {/* Lista de miembros con botones de asistencia */}
                <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto custom-scroll">
                    {filtered.map((m, i) => {
                        const globalIdx = members.indexOf(m);
                        const isEdit = editingIndex === globalIdx;

                        return (
                            <div key={m} className="p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-center hover:bg-slate-50 transition-colors gap-3">
                                {/* Nombre del miembro */}
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <span className="text-[10px] font-mono text-slate-300 w-5 font-black">{(i+1).toString().padStart(2,'0')}</span>
                                    {isEdit ? (
                                        <div className="flex gap-1 flex-1">
                                            <input 
                                                className="border-2 border-green-500 px-3 py-1 rounded-lg text-sm w-full font-bold outline-none" 
                                                value={editValue} 
                                                onChange={(e) => setEditValue(e.target.value)} 
                                                autoFocus 
                                                onKeyDown={(e) => e.key === 'Enter' && saveEdit(globalIdx)}
                                            />
                                            <button onClick={() => saveEdit(globalIdx)} className="text-green-600 p-2 hover:bg-green-100 rounded-lg">
                                                <i data-lucide="check" size="20"></i>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 group w-full">
                                            <span className="font-bold text-slate-700 text-sm">{m}</span>
                                            <button 
                                                onClick={() => { setEditingIndex(globalIdx); setEditValue(m); }} 
                                                className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-green-600 p-1.5 transition-all"
                                            >
                                                <i data-lucide="pencil" size="14"></i>
                                            </button>
                                            <button 
                                                onClick={() => remove(m)} 
                                                className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 p-1.5 transition-all"
                                            >
                                                <i data-lucide="trash-2" size="14"></i>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Botones de asistencia */}
                                {!isEdit && (
                                    <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
                                        <button 
                                            onClick={() => handleStatus(m, STATUS.PRESENT)} 
                                            className={`flex-1 sm:px-4 py-2 rounded-lg text-[9px] font-black transition-all ${attendance[m] === STATUS.PRESENT ? 'bg-green-600 text-white shadow-md scale-105' : 'text-slate-500 hover:bg-slate-200'}`}
                                        >
                                            PRESENTE
                                        </button>
                                        <button 
                                            onClick={() => handleStatus(m, STATUS.REPORTED)} 
                                            className={`flex-1 sm:px-4 py-2 rounded-lg text-[9px] font-black transition-all ${attendance[m] === STATUS.REPORTED ? 'bg-amber-500 text-white shadow-md scale-105' : 'text-slate-500 hover:bg-slate-200'}`}
                                        >
                                            REPORTE
                                        </button>
                                        <button 
                                            onClick={() => handleStatus(m, STATUS.ABSENT)} 
                                            className={`flex-1 sm:px-4 py-2 rounded-lg text-[9px] font-black transition-all ${(!attendance[m] || attendance[m] === STATUS.ABSENT) ? 'bg-red-500 text-white shadow-md scale-105' : 'text-slate-500 hover:bg-slate-200'}`}
                                        >
                                            AUSENCIA
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

/**
 * Componente para la vista de asistencia del Pueblo
 * Permite registrar la cantidad de personas por categoría (Danza, Cafetería, Pueblo en General)
 * @param {Object} props - Props del componente (db, date, onDateChange, servicio, onServicioChange, grupoServidores, onGrupoChange)
 */
function PuebloView({ db, date, onDateChange, servicio, onServicioChange, grupoServidores, onGrupoChange }) {
    // Estados locales del componente
    const [members, setMembers] = useState([]);              // Lista de categorías
    const [searchTerm, setSearchTerm] = useState('');       // Término de búsqueda
    const [isAdding, setIsAdding] = useState(false);        // Mostrar formulario de agregar
    const [newName, setNewName] = useState({                 // Nueva categoría a agregar
        nombre: '', 
        cantidad: 0 
    });
    const [editingId, setEditingId] = useState(null);        // ID de la categoría en edición
    const [editValue, setEditValue] = useState({});           // Valores de la categoría en edición

    // Cargar categorías de la base de datos al iniciar o cuando db cambie
    useEffect(() => {
        if (db) {
            const result = db.exec("SELECT id, nombre, cantidad FROM pueblo ORDER BY nombre");
            if (result.length > 0) {
                setMembers(result[0].values.map(r => ({
                    id: r[0], 
                    nombre: r[1], 
                    cantidad: r[2]
                })));
            }
        }
    }, [db]);

    /**
     * Actualiza la cantidad de una categoría
     * @param {number} id - ID de la categoría
     * @param {number} delta - Cambio a aplicar (+1 o -1)
     */
    const updateCount = (id, delta) => {
        setMembers(prev => prev.map(m => {
            if (m.id === id) {
                const newVal = Math.max(0, m.cantidad + delta);
                db.run(`UPDATE pueblo SET cantidad = ? WHERE id = ?`, [newVal, id]);
                return { ...m, cantidad: newVal };
            }
            return m;
        }));
    };

    /**
     * Agrega una nueva categoría al pueblo
     * @param {Event} e - Evento del formulario
     */
    const addNew = (e) => {
        e.preventDefault();
        if (newName.nombre.trim()) {
            try {
                db.run("INSERT INTO pueblo (nombre, cantidad) VALUES (?, ?)", 
                    [newName.nombre.trim(), newName.cantidad]);
                const result = db.exec("SELECT id, nombre, cantidad FROM pueblo ORDER BY nombre");
                setMembers(result[0].values.map(r => ({
                    id: r[0], 
                    nombre: r[1], 
                    cantidad: r[2]
                })));
            } catch (err) { 
                console.log(err); 
            }
            setNewName({ nombre: '', cantidad: 0 });
            setIsAdding(false);
        }
    };

    /**
     * Elimina una categoría del pueblo
     * @param {number} id - ID de la categoría
     * @param {string} nombre - Nombre de la categoría
     */
    const remove = (id, nombre) => {
        if (confirm(`¿Eliminar "${nombre}" de la lista?`)) {
            db.run("DELETE FROM pueblo WHERE id = ?", [id]);
            const result = db.exec("SELECT id, nombre, cantidad FROM pueblo ORDER BY nombre");
            setMembers(result[0].values.map(r => ({
                id: r[0], 
                nombre: r[1], 
                cantidad: r[2]
            })));
        }
    };

    /**
     * Guarda los cambios de edición de una categoría
     */
    const saveEdit = () => {
        db.run("UPDATE pueblo SET nombre = ?, cantidad = ? WHERE id = ?", 
            [editValue.nombre, editValue.cantidad, editingId]);
        const result = db.exec("SELECT id, nombre, cantidad FROM pueblo ORDER BY nombre");
        setMembers(result[0].values.map(r => ({
            id: r[0], 
            nombre: r[1], 
            cantidad: r[2]
        })));
        setEditingId(null);
    };

    /**
     * Genera y descarga el reporte de asistencia del pueblo en PDF
     */
    /**
     * Genera y descarga el reporte de asistencia del pueblo en PDF
     * Incluye información del servicio y grupo de servidores seleccionados
     */
    const downloadPDF = () => {
        const { jsPDF } = window.jspdf;
        const docPdf = new jsPDF();
        const dDate = displayDate(date);
        
        // Encabezado del reporte - Título principal
        docPdf.setFont("helvetica", "bold");
        docPdf.setFontSize(16);
        docPdf.setTextColor(0, 0, 0);
        docPdf.text("Reporte de asistencia", 105, 12, { align: "center" });
        
        // Información de la iglesia
        docPdf.setFontSize(10);
        docPdf.setFont("helvetica", "normal");
        docPdf.setTextColor(0, 0, 0);
        docPdf.text("Iglesia de Cristo Restauración Familiar", 105, 18, { align: "center" });
        
        // Mostrar servicio seleccionado o texto por defecto
        const servicioTexto = servicio ? `${servicio} servicio` : "servicio";
        docPdf.text(servicioTexto, 105, 22, { align: "center" });
        
        // Mostrar fecha
        docPdf.text(`Domingo ${dDate}`, 105, 26, { align: "center" });
        
        // Mostrar grupo si está seleccionado
        if (grupoServidores) {
            docPdf.setFontSize(9);
            docPdf.text(`Grupo de Servidores: ${grupoServidores}`, 105, 30, { align: "center" });
            var startY = 34; // Ajustar posición de la tabla si hay grupo
        } else {
            var startY = 32;
        }
        
        // Calcular total de asistencia
        const total = members.reduce((acc, m) => acc + m.cantidad, 0);

        // Tabla de categorías con estilo anterior
        docPdf.autoTable({
            startY: startY,
            head: [['Categoría', 'Cantidad']],
            body: members.map(m => [m.nombre, m.cantidad]),
            theme: 'striped',
            headStyles: { fillColor: [21, 128, 61] },
            margin: { left: 40, right: 40 }
        });

        // Total al final de la tabla
        docPdf.setFontSize(12);
        docPdf.setTextColor(21, 128, 61);
        docPdf.text(`Total: ${total}`, 105, docPdf.lastAutoTable.finalY + 10, { align: "center" });

        // Descargar archivo
        docPdf.save(`Asistencia_Pueblo_${dDate.replace(/\//g, '-')}.pdf`);
    };

    // Filtrar categorías por término de búsqueda
    const filtered = members.filter(m => m.nombre.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-4">
            {/* Barra de búsqueda, selector de fecha, servicio y grupo */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {/* Búsqueda */}
                <div className="md:col-span-2 bg-white p-2 rounded-xl border border-slate-200 flex items-center gap-2 shadow-sm">
                    <div className="relative flex-1">
                        <i data-lucide="search" className="absolute left-3 top-2.5 text-slate-400" size="18"></i>
                        <input 
                            type="text" 
                            placeholder="Buscar..." 
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                        />
                    </div>
                </div>
                
                {/* Fecha */}
                <div className="bg-white p-2 rounded-xl border border-slate-200 flex items-center shadow-sm">
                    <input 
                        type="date" 
                        className="w-full bg-slate-50 px-3 py-2 rounded-lg text-xs font-bold outline-none border border-transparent focus:border-green-500" 
                        value={date} 
                        onChange={e => onDateChange(e.target.value)} 
                    />
                </div>
                
                {/* Selector de Servicio */}
                <div className="bg-white p-2 rounded-xl border border-slate-200 flex items-center shadow-sm">
                    <select 
                        value={servicio} 
                        onChange={e => onServicioChange(e.target.value)}
                        className="w-full bg-slate-50 px-3 py-2 rounded-lg text-xs font-bold outline-none border border-transparent focus:border-green-500"
                    >
                        <option value="">Servicio</option>
                        <option value="Primero">Primero</option>
                        <option value="Segundo">Segundo</option>
                        <option value="Tercer">Tercer</option>
                        <option value="Único">Único</option>
                    </select>
                </div>
                
                {/* Selector de Grupo de Servidores */}
                <div className="bg-white p-2 rounded-xl border border-slate-200 flex items-center shadow-sm">
                    <select 
                        value={grupoServidores} 
                        onChange={e => onGrupoChange(e.target.value)}
                        className="w-full bg-slate-50 px-3 py-2 rounded-lg text-xs font-bold outline-none border border-transparent focus:border-green-500"
                    >
                        <option value="">Grupo</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                    </select>
                </div>
            </div>

            {/* Tarjetas de estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-around items-center text-center shadow-sm">
                    <div>
                        <p className="text-[8px] text-slate-400 font-black uppercase">Categorías</p>
                        <p className="text-xl font-black text-slate-700 leading-none">{members.length}</p>
                    </div>
                    <div className="w-[1px] h-6 bg-slate-100"></div>
                    <div>
                        <p className="text-[8px] text-green-600 font-black uppercase">TOTAL</p>
                        <p className="text-xl font-black text-green-600 leading-none">{members.reduce((acc, m) => acc + m.cantidad, 0)}</p>
                    </div>
                </div>
            </div>

            {/* Lista de categorías */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
                    <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Asistencia RF</h2>
                    <div className="flex gap-2">
                        <button onClick={downloadPDF} className="bg-yellow-400 text-green-900 px-3 py-1.5 rounded-lg font-black text-[10px] flex items-center gap-1 hover:bg-yellow-300 transition-colors">
                            <i data-lucide="file-down" size="14"></i> PDF
                        </button>
                        <button onClick={() => setIsAdding(!isAdding)} className="text-green-700 font-black text-[10px] flex items-center gap-1 hover:bg-green-100 px-3 py-1 rounded-lg transition-colors">
                            <i data-lucide="plus" size="14"></i> AGREGAR
                        </button>
                    </div>
                </div>

                {/* Formulario para agregar nueva categoría */}
                {isAdding && (
                    <form onSubmit={addNew} className="p-4 bg-green-50 border-b border-slate-200 flex gap-2 items-center">
                        <input 
                            autoFocus 
                            className="flex-1 p-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-green-500 outline-none" 
                            placeholder="Nombre de la categoría (ej. Danza, Cafetería, Pueblo en General, Orden,)" 
                            value={newName.nombre} 
                            onChange={(e) => setNewName({...newName, nombre: e.target.value})} 
                        />
                        <div className="flex items-center gap-2 bg-white px-3 rounded-lg border border-slate-200">
                            <span className="text-[10px] font-black text-slate-500 uppercase">Cantidad</span>
                            <input type="number" min="0" className="w-16 text-center font-bold text-sm outline-none" 
                                value={newName.cantidad} onChange={(e) => setNewName({...newName, cantidad: parseInt(e.target.value)||0})} />
                        </div>
                        <button className="bg-green-700 text-white px-5 py-2 rounded-lg font-bold text-xs uppercase shadow-md">Guardar</button>
                    </form>
                )}

                {/* Lista de categorías con controles de cantidad */}
                <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto custom-scroll">
                    {filtered.map((m, i) => (
                        editingId === m.id ? (
                            // Modo edición
                            <div key={m.id} className="p-4 bg-green-50 flex gap-2 items-center">
                                <input className="flex-1 border-2 border-green-500 px-3 py-2 rounded-lg text-sm font-bold outline-none" 
                                    value={editValue.nombre} onChange={(e) => setEditValue({...editValue, nombre: e.target.value})} />
                                <div className="flex items-center gap-2 bg-white px-3 rounded-lg border border-green-500">
                                    <span className="text-[10px] font-black text-green-600 uppercase">Cantidad</span>
                                    <input type="number" min="0" className="w-16 text-center font-bold text-sm outline-none text-green-700" 
                                        value={editValue.cantidad} onChange={(e) => setEditValue({...editValue, cantidad: parseInt(e.target.value)||0})} />
                                </div>
                                <button onClick={saveEdit} className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-black uppercase">GUARDAR</button>
                            </div>
                        ) : (
                            // Modo visualización
                            <div key={m.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-mono text-slate-300 w-5 font-black">{(i+1).toString().padStart(2,'0')}</span>
                                    <span className="font-bold text-slate-700 text-sm">{m.nombre}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    {/* Controles de cantidad con botones +/- */}
                                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                                        <button onClick={() => updateCount(m.id, -1)} className="w-8 h-8 rounded-lg bg-white hover:bg-red-100 text-slate-400 hover:text-red-500 font-bold text-lg shadow-sm transition-all">-</button>
                                        <span className="w-12 text-center font-black text-slate-700 text-lg">{m.cantidad}</span>
                                        <button onClick={() => updateCount(m.id, 1)} className="w-8 h-8 rounded-lg bg-white hover:bg-green-100 text-slate-400 hover:text-green-600 font-bold text-lg shadow-sm transition-all">+</button>
                                    </div>
                                    {/* Botones de acción */}
                                    <div className="flex gap-1">
                                        <button onClick={() => { setEditingId(m.id); setEditValue({...m}); }} className="text-slate-300 hover:text-green-600 p-2">
                                            <i data-lucide="pencil" size="16"></i>
                                        </button>
                                        <button onClick={() => remove(m.id, m.nombre)} className="text-slate-300 hover:text-red-500 p-2">
                                            <i data-lucide="trash-2" size="16"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    ))}
                </div>
            </div>
        </div>
    );
}

/**
 * Componente principal de la aplicación
 * Maneja la navegación entre pestañas y la inicialización de la base de datos
 */
function App() {
    // Estados globales de la aplicación
    const [db, setDb] = useState(null);                // Instancia de la base de datos
    const [activeTab, setActiveTab] = useState('discipulado');  // Pestaña activa
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);  // Fecha actual
    const [loading, setLoading] = useState(true);       // Estado de carga
    const [servicio, setServicio] = useState('');      // Servicio seleccionado (Primero, Segundo, Tercero, Único)
    const [grupoServidores, setGrupoServidores] = useState(''); // Grupo de servidores (1, 2, 3, 4)

    // Inicializar la base de datos al montar el componente
    useEffect(() => {
        initDB().then(database => {
            setDb(database);
            setLoading(false);
        });
    }, []);

    // Actualizar iconos de Lucide cuando cambie el estado de carga o la pestaña
    useEffect(() => {
        if (!loading && window.lucide) window.lucide.createIcons();
    }, [loading, activeTab]);

    // Mostrar pantalla de carga mientras se inicializa la base de datos
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 font-bold text-sm">Cargando base de datos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            {/* Barra de navegación */}
            <nav className="bg-green-700 text-white p-4 sticky top-0 z-50 shadow-md">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <i data-lucide="church" className="bg-white/20 p-2 rounded-lg"></i>
                        <div>
                            <h1 className="font-bold text-lg leading-tight">Iglesia Restauración Familiar</h1>
                            <p className="text-[10px] opacity-90 font-bold uppercase tracking-widest">Sistema de Asistencia</p>
                        </div>
                    </div>
                    {/* Botones de navegación entre pestañas */}
                    <div className="flex gap-1 bg-green-800 p-1 rounded-lg">
                        <button 
                            onClick={() => setActiveTab('discipulado')}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'discipulado' ? 'bg-white text-green-800 shadow' : 'text-white/70 hover:text-white'}`}
                        >
                            Discipulado
                        </button>
                        <button 
                            onClick={() => setActiveTab('pueblo')}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'pueblo' ? 'bg-white text-green-800 shadow' : 'text-white/70 hover:text-white'}`}
                        >
                            Pueblo
                        </button>
                    </div>
                </div>
            </nav>

            {/* Contenido principal - cambia según la pestaña activa */}
            <main className="max-w-6xl mx-auto w-full p-4 flex-1">
                {activeTab === 'discipulado' ? (
                    <DiscipuladoView db={db} date={date} onDateChange={setDate} />
                ) : (
                    <PuebloView db={db} date={date} onDateChange={setDate} servicio={servicio} onServicioChange={setServicio} grupoServidores={grupoServidores} onGrupoChange={setGrupoServidores} />
                )}
            </main>
            
            {/* Pie de página */}
            <footer className="mt-auto text-center text-slate-400 text-[10px] py-6 uppercase tracking-[0.2em] font-bold">
                Iglesia Restauración Familiar • 2026
            </footer>
        </div>
    );
}

// ============================================
// Inicialización de React
// ============================================

// Renderizar la aplicación en el elemento root
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);