// Extraemos los hooks necesarios, constantes y helpers del ámbito global window
const { useState, useEffect } = React;
const { STATUS, saveDatabase } = window;

/**
 * Convierte una fecha en formato YYYY-MM-DD a DD/MM/YYYY
 * @param {string} d - Fecha en formato ISO (YYYY-MM-DD)
 * @returns {string} Fecha formateada DD/MM/YYYY
 */
function displayDate(d) {
    // Si la fecha es inválida, devolvemos cadena vacía
    if (!d) return '';
    // Separamos el string en componentes año, mes y día
    const [y, m, day] = d.split('-');
    // Retornamos el formato estructurado para presentación
    return `${day}/${m}/${y}`;
}

/**
 * Componente para la vista de asistencia del Discipulado
 * Permite registrar la asistencia de cada miembro con estados: Presente, Reportado, Ausencia
 * @param {Object} props - Props del componente (db, date, onDateChange)
 */
window.DiscipuladoView = function({ db, date, onDateChange }) {
    // Lista de miembros recuperados
    const [members, setMembers] = useState([]);
    // Estado de asistencia mapeado por nombre
    const [attendance, setAttendance] = useState({});
    // Filtro de texto para búsqueda de miembros
    const [searchTerm, setSearchTerm] = useState('');
    // Control de visibilidad del formulario para agregar hermano
    const [isAdding, setIsAdding] = useState(false);
    // Campo de texto del nuevo hermano a registrar
    const [newName, setNewName] = useState('');
    // Índice del miembro que está siendo editado actualmente
    const [editingIndex, setEditingIndex] = useState(null);
    // Nuevo valor asignado al miembro durante su edición
    const [editValue, setEditValue] = useState('');
    // Almacena el índice del elemento que se está arrastrando en la lista
    const [draggedIndex, setDraggedIndex] = useState(null);
    // Filtros de estado seleccionados para el listado y reportes
    const [selectedStates, setSelectedStates] = useState({
        [STATUS.PRESENT]: true,
        [STATUS.REPORTED]: true,
        [STATUS.ABSENT]: true
    });

    // Efecto para procesar y renderizar los iconos de Lucide al actualizar el listado
    useEffect(() => {
        // Si la librería Lucide está cargada en la ventana
        if (window.lucide) {
            // Un pequeño retardo asegura que React haya completado la inserción en el DOM
            const timer = setTimeout(() => {
                window.lucide.createIcons();
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [members, searchTerm, isAdding, editingIndex, draggedIndex]);

    // Cargar miembros y asistencia de la base de datos al iniciar o cambiar db/date
    useEffect(() => {
        // Si la base de datos ya está inicializada
        if (db) {
            // Obtenemos los nombres ordenados por su columna de orden y por nombre de forma secundaria
            const result = db.exec("SELECT nombre FROM discipulos ORDER BY orden ASC, nombre ASC");
            // Si hay registros de miembros, actualizamos el estado
            if (result.length > 0) {
                setMembers(result[0].values.map(r => r[0]));
            }

            // Recuperamos el estado de asistencia guardado para la fecha seleccionada
            const attResult = db.exec(`
                SELECT d.nombre, a.estado 
                FROM asistencia_discipulado a
                JOIN discipulos d ON a.discipulo_id = d.id
                WHERE a.fecha = ?
            `, [date]);
            
            // Estructura temporal para rellenar la asistencia
            const newAtt = {};
            // Si existen registros de asistencia para el día de hoy, los mapeamos
            if (attResult.length > 0) {
                attResult[0].values.forEach(row => {
                    newAtt[row[0]] = row[1];
                });
            }
            // Actualizamos la asistencia en el estado de React
            setAttendance(newAtt);
        }
    }, [db, date]);

    /**
     * Maneja el cambio de estado de asistencia de un miembro y lo guarda en la DB
     * @param {string} name - Nombre del miembro
     * @param {string} s - Nuevo estado (presente, reportado, ausente)
     */
    const handleStatus = (name, s) => {
        // Actualizamos localmente el estado de asistencia en React
        setAttendance(prev => ({ ...prev, [name]: s }));
        
        // Consultamos el ID del discípulo correspondiente en la base de datos
        const res = db.exec("SELECT id FROM discipulos WHERE nombre = ?", [name]);
        // Si el discípulo existe en la base de datos
        if (res.length > 0) {
            // Guardamos el ID del discípulo obtenido
            const discipuloId = res[0].values[0][0];
            // Verificamos si ya hay un registro de asistencia para este discípulo en esta fecha
            const check = db.exec(
                "SELECT id FROM asistencia_discipulado WHERE discipulo_id = ? AND fecha = ?", 
                [discipuloId, date]
            );
            
            // Si ya existe registro de asistencia para esa fecha
            if (check.length > 0) {
                // Actualizamos el estado existente en la base de datos
                db.run(
                    "UPDATE asistencia_discipulado SET estado = ? WHERE id = ?", 
                    [s, check[0].values[0][0]]
                );
            } else {
                // Si no existe, creamos un nuevo registro de asistencia
                db.run(
                    "INSERT INTO asistencia_discipulado (discipulo_id, fecha, estado) " +
                    "VALUES (?, ?, ?)", 
                    [discipuloId, date, s]
                );
            }
            // Persistimos los cambios en localStorage
            saveDatabase(db);
        }
    };

    /**
     * Agrega un nuevo miembro al discipulado
     * @param {Event} e - Evento del formulario
     */
    const addNew = (e) => {
        // Prevenimos el comportamiento por defecto de recarga de formulario
        e.preventDefault();
        // Si el nombre no está vacío y no está duplicado en la lista actual
        if (newName.trim() && !members.includes(newName.trim())) {
            try {
                // Buscamos el orden máximo actual en la tabla para posicionar al nuevo al final
                const maxRes = db.exec("SELECT MAX(orden) FROM discipulos");
                // Calculamos el siguiente índice de orden a asignar
                const nextOrder = (maxRes.length > 0 && maxRes[0].values[0][0] !== null) 
                    ? maxRes[0].values[0][0] + 1 : 0;
                // Insertamos el nuevo discípulo en la base de datos asignando el orden correspondiente
                db.run(
                    "INSERT INTO discipulos (nombre, orden) VALUES (?, ?)", 
                    [newName.trim(), nextOrder]
                );
                // Volvemos a leer todos los discípulos ordenados correctamente
                const result = db.exec(
                    "SELECT nombre FROM discipulos ORDER BY orden ASC, nombre ASC"
                );
                // Actualizamos el estado con la lista ordenada
                setMembers(result[0].values.map(r => r[0]));
                // Guardamos los cambios en localStorage
                saveDatabase(db);
            } catch (err) { 
                console.log(err); 
            }
            // Limpiamos el campo de entrada de texto
            setNewName('');
            // Ocultamos el formulario de inserción
            setIsAdding(false);
        }
    };

    /**
     * Elimina un miembro del discipulado
     * @param {string} name - Nombre del miembro a eliminar
     */
    const remove = (name) => {
        // Pedimos confirmación al usuario antes de eliminar el registro
        if (confirm(`¿Eliminar a ${name} de la lista?`)) {
            // Eliminamos al discípulo de la base de datos
            db.run("DELETE FROM discipulos WHERE nombre = ?", [name]);
            // Recargamos el listado ordenado de discípulos
            const result = db.exec("SELECT nombre FROM discipulos ORDER BY orden ASC, nombre ASC");
            // Actualizamos la lista en React
            setMembers(result[0].values.map(r => r[0]));
            // Guardamos los cambios en localStorage
            saveDatabase(db);
        }
    };

    /**
     * Guarda los cambios de edición de un miembro
     * @param {number} idx - Índice del miembro en el array
     */
    const saveEdit = (idx) => {
        // Eliminamos espacios al inicio y final del nuevo nombre
        const val = editValue.trim();
        // Si el valor editado es válido y cambió respecto al original
        if (val && val !== members[idx]) {
            // Actualizamos el nombre en la tabla de discípulos
            db.run("UPDATE discipulos SET nombre = ? WHERE nombre = ?", [val, members[idx]]);
            // Guardamos el nombre viejo para actualizar la asistencia en memoria
            const oldName = members[idx];
            // Recargamos la lista ordenada de discípulos
            const result = db.exec("SELECT nombre FROM discipulos ORDER BY orden ASC, nombre ASC");
            // Actualizamos la lista en React
            setMembers(result[0].values.map(r => r[0]));
            
            // Si el miembro tenía estado en la asistencia actual, lo transferimos al nuevo nombre
            if (attendance[oldName]) {
                const newAtt = { ...attendance, [val]: attendance[oldName] };
                delete newAtt[oldName];
                setAttendance(newAtt);
            }
            // Guardamos la base de datos en localStorage
            saveDatabase(db);
        }
        // Desactivamos el modo de edición limpiando el índice
        setEditingIndex(null);
    };

    /**
     * Permite reordenar a un discípulo desplazándolo hacia arriba o abajo en el listado
     * @param {string} name - Nombre del discípulo a mover
     * @param {string} direction - Dirección del movimiento ('up' o 'down')
     */
    const moveMember = (name, direction) => {
        // Encontramos el índice actual del miembro en la lista completa
        const idx = members.indexOf(name);
        // Si no se encuentra el miembro, cancelamos la operación
        if (idx === -1) return;

        // Clonamos la lista completa de miembros para realizar el intercambio en memoria
        const newMembers = [...members];
        
        // Si el movimiento es hacia arriba y no es el primer elemento
        if (direction === 'up' && idx > 0) {
            // Intercambiamos el miembro con el anterior
            const temp = newMembers[idx];
            newMembers[idx] = newMembers[idx - 1];
            newMembers[idx - 1] = temp;
        // Si el movimiento es hacia abajo y no es el último elemento
        } else if (direction === 'down' && idx < newMembers.length - 1) {
            // Intercambiamos el miembro con el siguiente
            const temp = newMembers[idx];
            newMembers[idx] = newMembers[idx + 1];
            newMembers[idx + 1] = temp;
        } else {
            // Si el movimiento no es válido, salimos de la función
            return;
        }

        // Actualizamos de forma secuencial la columna orden en la base de datos para cada miembro
        newMembers.forEach((mName, index) => {
            // Guardamos el nuevo valor de orden basado en el índice de la lista actualizada
            db.run("UPDATE discipulos SET orden = ? WHERE nombre = ?", [index, mName]);
        });

        // Sincronizamos y persistimos el estado actual de la base de datos en localStorage
        saveDatabase(db);
        // Actualizamos el estado de miembros en React para refrescar la interfaz
        setMembers(newMembers);
    };

    /**
     * Inicia el arrastre de un elemento de la lista
     * @param {DragEvent} e - Evento de arrastre
     * @param {number} idx - Índice del elemento arrastrado
     */
    const handleDragStart = (e, idx) => {
        setDraggedIndex(idx);
        e.dataTransfer.effectAllowed = "move";
    };

    /**
     * Controla cuando un elemento se arrastra sobre otro y realiza el reordenamiento visual
     * @param {DragEvent} e - Evento de arrastre
     * @param {number} idx - Índice del elemento destino
     */
    const handleDragOver = (e, idx) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === idx) return;

        // Clonamos la lista de miembros para reordenar en memoria
        const newMembers = [...members];
        const draggedItem = newMembers[draggedIndex];
        
        // Removemos el elemento de su posición anterior e insertamos en la nueva
        newMembers.splice(draggedIndex, 1);
        newMembers.splice(idx, 0, draggedItem);
        
        setDraggedIndex(idx);
        setMembers(newMembers);
    };

    /**
     * Finaliza el arrastre persistiendo el nuevo orden de los miembros en la base de datos
     */
    const handleDragEnd = () => {
        if (draggedIndex === null) return;

        // Actualizamos secuencialmente el orden en la base de datos
        members.forEach((mName, index) => {
            db.run("UPDATE discipulos SET orden = ? WHERE nombre = ?", [index, mName]);
        });

        // Guardamos los cambios y limpiamos el índice de arrastre
        saveDatabase(db);
        setDraggedIndex(null);
    };

    /**
     * Ordena automáticamente los discípulos de forma alfabética (A-Z o Z-A) y guarda el orden
     * @param {string} order - Dirección de ordenamiento ('asc' o 'desc')
     */
    const sortAlphabetically = (order) => {
        // Clonamos la lista actual de miembros
        const sorted = [...members];
        
        // Ordenamos el array según la dirección indicada
        if (order === 'asc') {
            sorted.sort((a, b) => a.localeCompare(b));
        } else {
            sorted.sort((a, b) => b.localeCompare(a));
        }

        // Guardamos de forma secuencial la columna orden en la base de datos
        sorted.forEach((mName, index) => {
            db.run("UPDATE discipulos SET orden = ? WHERE nombre = ?", [index, mName]);
        });

        // Persistimos la base de datos en localStorage
        saveDatabase(db);
        // Actualizamos el listado de miembros en la interfaz
        setMembers(sorted);
    };

    /**
     * Alterna filtros de estado (Presentes, Reportados, Ausentes)
     * @param {string} state - Estado a alternar
     */
    const toggleStateFilter = (state) => {
        // Invertimos la selección del filtro de estado correspondiente
        setSelectedStates(prev => ({
            ...prev,
            [state]: !prev[state]
        }));
    };

    /**
     * Genera y descarga el reporte de asistencia en PDF basado en filtros seleccionados
     */
    const downloadPDFFiltered = () => {
        // Desestructuramos jsPDF de la ventana global
        const { jsPDF } = window.jspdf;
        // Creamos una nueva instancia de documento PDF
        const docPdf = new jsPDF();
        // Formateamos la fecha seleccionada para mostrarla en el reporte
        const dDate = displayDate(date);
        
        // Filtramos la lista de hermanos que coincidan con los checkboxes activos
        const filteredByState = members.filter(m => {
            const state = attendance[m];
            if (state === STATUS.PRESENT) return selectedStates[STATUS.PRESENT];
            if (state === STATUS.REPORTED) return selectedStates[STATUS.REPORTED];
            return selectedStates[STATUS.ABSENT];
        });
        
        // Calculamos la cantidad de presentes filtrados
        const p = filteredByState.filter(m => attendance[m] === STATUS.PRESENT).length;
        // Calculamos la cantidad de reportados filtrados
        const r = filteredByState.filter(m => attendance[m] === STATUS.REPORTED).length;
        // Calculamos la cantidad de ausentes o sin estado definido
        const a = filteredByState.filter(
            m => !attendance[m] || attendance[m] === STATUS.ABSENT
        ).length;
        
        // Configuramos la fuente a negrita para el encabezado principal
        docPdf.setFont("helvetica", "bold");
        // Color verde característico para el título del reporte
        docPdf.setTextColor(21, 128, 61);
        // Escribimos el título del reporte centrado en el documento PDF
        docPdf.text(
            "Discipulado Monte Carmelo - Reporte Asistencia", 
            105, 15, { align: "center" }
        );
        
        // Ajustamos tamaño y color de fuente para el subtítulo de la fecha
        docPdf.setFontSize(9);
        docPdf.setTextColor(100);
        docPdf.text(`Reporte de Asistencia: ${dDate}`, 105, 21, { align: "center" });
        
        // Inicializamos los filtros activos aplicados para mostrarlos en el PDF
        const filtrosAplicados = [];
        if (selectedStates[STATUS.PRESENT]) filtrosAplicados.push('Presentes');
        if (selectedStates[STATUS.REPORTED]) filtrosAplicados.push('Reportados');
        if (selectedStates[STATUS.ABSENT]) filtrosAplicados.push('Ausentes');
        
        // Cambiamos tamaño de fuente del bloque informativo
        docPdf.setFontSize(8);
        docPdf.setTextColor(100);
        // Generamos el texto con los filtros activos y la cantidad total filtrada
        const filterText = `Filtros: ${filtrosAplicados.join(', ')} | Total: ` +
                           `${filteredByState.length}`;
        // Escribimos el subtítulo con los filtros centrados en el reporte PDF
        docPdf.text(filterText, 105, 26, { align: "center" });

        // Generamos la tabla resumen con las cantidades por cada estado
        docPdf.autoTable({
            startY: 31,
            head: [['Estado', 'Cantidad']],
            body: [
                ...(selectedStates[STATUS.PRESENT] ? [['Presentes', p]] : []),
                ...(selectedStates[STATUS.REPORTED] ? [['Reportados', r]] : []),
                ...(selectedStates[STATUS.ABSENT] ? [['Ausentes', a]] : []),
                ['TOTAL', filteredByState.length]
            ],
            theme: 'grid',
            headStyles: { fillColor: [21, 128, 61] },
            margin: { left: 40, right: 40 }
        });

        // Clasificamos a los miembros por estado de asistencia para el reporte
        const presentesMembers = filteredByState.filter(m => attendance[m] === STATUS.PRESENT);
        // Clasificamos a los miembros reportados
        const reportadosMembers = filteredByState.filter(m => attendance[m] === STATUS.REPORTED);
        // Clasificamos a los miembros ausentes o sin estado asignado
        const ausentesMembers = filteredByState.filter(
            m => !attendance[m] || attendance[m] === STATUS.ABSENT
        );

        // Obtenemos el límite vertical de la página para controlar saltos manuales
        const pageHeight = docPdf.internal.pageSize.getHeight();
        // Inicializamos la coordenada vertical para dibujar el primer bloque de tablas
        let currentY = docPdf.lastAutoTable.finalY + 8;

        // Validamos si existen miembros presentes para generar su respectiva sección
        if (presentesMembers.length > 0) {
            // Verificamos si hay suficiente espacio en la página actual para el título
            if (currentY + 25 > pageHeight) {
                // Añadimos una nueva página para evitar que el contenido quede cortado
                docPdf.addPage();
                // Reiniciamos la coordenada vertical al inicio de la nueva página
                currentY = 15;
            }
            // Cambiamos el estilo de fuente a negrita para el título de la sección
            docPdf.setFont("helvetica", "bold");
            // Ajustamos el tamaño del título de la sección de presentes
            docPdf.setFontSize(11);
            // Definimos el color verde representativo para los miembros presentes
            docPdf.setTextColor(21, 128, 61);
            // Dibujamos el título identificador de la sección
            docPdf.text("Hermanos Presentes", 15, currentY);
            // Desplazamos la posición vertical para separar el título de la tabla
            currentY += 4;

            // Generamos la tabla con el listado específico de hermanos presentes
            docPdf.autoTable({
                // Indicamos dónde debe comenzar la tabla
                startY: currentY,
                // Encabezados descriptivos del listado
                head: [['#', 'Nombre']],
                // Mapeamos los nombres y generamos su numeración secuencial
                body: presentesMembers.map((m, idx) => [idx + 1, m]),
                // Aplicamos el tema a rayas para facilitar la lectura visual
                theme: 'striped',
                // Coloreamos el fondo de la cabecera de la tabla con el tono verde
                headStyles: { fillColor: [21, 128, 61] },
                // Ajustamos el tamaño del texto interno para una visualización correcta
                styles: { fontSize: 9 }
            });
            // Actualizamos la coordenada vertical con la posición final de la tabla
            currentY = docPdf.lastAutoTable.finalY + 8;
        }

        // Validamos si existen miembros reportados para generar su respectiva sección
        if (reportadosMembers.length > 0) {
            // Verificamos si hay suficiente espacio en la página actual para el título
            if (currentY + 25 > pageHeight) {
                // Añadimos una nueva página para evitar que el contenido quede cortado
                docPdf.addPage();
                // Reiniciamos la coordenada vertical al inicio de la nueva página
                currentY = 15;
            }
            // Cambiamos el estilo de fuente a negrita para el título de la sección
            docPdf.setFont("helvetica", "bold");
            // Ajustamos el tamaño del título de la sección de reportados
            docPdf.setFontSize(11);
            // Definimos un color ámbar/marrón oscuro adecuado para la legibilidad
            docPdf.setTextColor(180, 83, 9);
            // Dibujamos el título identificador de la sección
            docPdf.text("Hermanos con Reporte", 15, currentY);
            // Desplazamos la posición vertical para separar el título de la tabla
            currentY += 4;

            // Generamos la tabla con el listado específico de hermanos reportados
            docPdf.autoTable({
                // Indicamos dónde debe comenzar la tabla
                startY: currentY,
                // Encabezados descriptivos del listado
                head: [['#', 'Nombre']],
                // Mapeamos los nombres y generamos su numeración secuencial
                body: reportadosMembers.map((m, idx) => [idx + 1, m]),
                // Aplicamos el tema a rayas para facilitar la lectura visual
                theme: 'striped',
                // Coloreamos el fondo de la cabecera con un tono ámbar oscuro
                headStyles: { fillColor: [180, 83, 9] },
                // Ajustamos el tamaño del texto interno para una visualización correcta
                styles: { fontSize: 9 }
            });
            // Actualizamos la coordenada vertical con la posición final de la tabla
            currentY = docPdf.lastAutoTable.finalY + 8;
        }

        // Validamos si existen miembros ausentes para generar su respectiva sección
        if (ausentesMembers.length > 0) {
            // Verificamos si hay suficiente espacio en la página actual para el título
            if (currentY + 25 > pageHeight) {
                // Añadimos una nueva página para evitar que el contenido quede cortado
                docPdf.addPage();
                // Reiniciamos la coordenada vertical al inicio de la nueva página
                currentY = 15;
            }
            // Cambiamos el estilo de fuente a negrita para el título de la sección
            docPdf.setFont("helvetica", "bold");
            // Ajustamos el tamaño del título de la sección de ausentes
            docPdf.setFontSize(11);
            // Definimos un color rojo oscuro para identificar visualmente a los ausentes
            docPdf.setTextColor(185, 28, 28);
            // Dibujamos el título identificador de la sección
            docPdf.text("Hermanos Ausentes", 15, currentY);
            // Desplazamos la posición vertical para separar el título de la tabla
            currentY += 4;

            // Generamos la tabla con el listado específico de hermanos ausentes
            docPdf.autoTable({
                // Indicamos dónde debe comenzar la tabla
                startY: currentY,
                // Encabezados descriptivos del listado
                head: [['#', 'Nombre']],
                // Mapeamos los nombres y generamos su numeración secuencial
                body: ausentesMembers.map((m, idx) => [idx + 1, m]),
                // Aplicamos el tema a rayas para facilitar la lectura visual
                theme: 'striped',
                // Coloreamos el fondo de la cabecera con un tono rojo oscuro
                headStyles: { fillColor: [185, 28, 28] },
                // Ajustamos el tamaño del texto interno para una visualización correcta
                styles: { fontSize: 9 }
            });
        }

        // Descargamos el archivo PDF con formato de fecha en el nombre
        docPdf.save(`Asistencia_MC3_${dDate.replace(/\//g, '-')}_Filtrado.pdf`);
    };

    // Filtramos los miembros por término de búsqueda y por estados seleccionados
    const filtered = members.filter(m => {
        // Comparamos el nombre en minúsculas con la barra de búsqueda
        const matchesSearch = m.toLowerCase().includes(searchTerm.toLowerCase());
        // Verificamos el estado de asistencia actual del discípulo
        const state = attendance[m];
        // Comprobamos si el estado coincide con alguno de los filtros activos
        const matchesState = 
            (state === STATUS.PRESENT && selectedStates[STATUS.PRESENT]) ||
            (state === STATUS.REPORTED && selectedStates[STATUS.REPORTED]) ||
            ((!state || state === STATUS.ABSENT) && selectedStates[STATUS.ABSENT]);
        
        // Retornamos verdadero si coincide con la búsqueda y el filtro de estado
        return matchesSearch && matchesState;
    });

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
                        <p className="text-xl font-black text-green-600 leading-none">
                            {Object.values(attendance).filter(v => v === STATUS.PRESENT).length}
                        </p>
                    </div>
                    <div className="w-[1px] h-6 bg-slate-100"></div>
                    <div>
                        <p className="text-[8px] text-slate-400 font-black uppercase tracking-tighter">Reporte</p>
                        <p className="text-xl font-black text-amber-500 leading-none">
                            {Object.values(attendance).filter(v => v === STATUS.REPORTED).length}
                        </p>
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
                <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center flex-wrap gap-2">
                    <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Listado de Hermanos</h2>
                    <div className="flex gap-2 flex-wrap">
                        {/* Controles de filtro de estado */}
                        <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-lg flex-wrap">
                            <label className="flex items-center gap-1 cursor-pointer hover:bg-slate-200 px-2 py-1 rounded transition-colors">
                                <input 
                                    type="checkbox" 
                                    checked={selectedStates[STATUS.PRESENT]} 
                                    onChange={() => toggleStateFilter(STATUS.PRESENT)}
                                    className="w-4 h-4 cursor-pointer"
                                />
                                <span className="text-[9px] font-bold text-green-700">Presentes</span>
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer hover:bg-slate-200 px-2 py-1 rounded transition-colors">
                                <input 
                                    type="checkbox" 
                                    checked={selectedStates[STATUS.REPORTED]} 
                                    onChange={() => toggleStateFilter(STATUS.REPORTED)}
                                    className="w-4 h-4 cursor-pointer"
                                />
                                <span className="text-[9px] font-bold text-amber-700">Reportados</span>
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer hover:bg-slate-200 px-2 py-1 rounded transition-colors">
                                <input 
                                    type="checkbox" 
                                    checked={selectedStates[STATUS.ABSENT]} 
                                    onChange={() => toggleStateFilter(STATUS.ABSENT)}
                                    className="w-4 h-4 cursor-pointer"
                                />
                                <span className="text-[9px] font-bold text-red-700">Ausentes</span>
                            </label>
                        </div>
                        {/* Botón de descarga de PDF con filtros */}
                        <button 
                            onClick={downloadPDFFiltered} 
                            className="bg-yellow-400 text-green-900 px-3 py-1.5 rounded-lg font-black text-[10px] flex items-center gap-1 hover:bg-yellow-300 transition-colors"
                        >
                            <i data-lucide="file-down" size="14"></i> PDF Filtrado
                        </button>
                        {/* Botón Ordenar A-Z */}
                        <button 
                            onClick={() => sortAlphabetically('asc')} 
                            className={
                                "text-slate-600 hover:text-green-700 font-black " +
                                "text-[10px] flex items-center gap-0.5 hover:bg-slate-200 " +
                                "px-2.5 py-1 rounded-lg transition-colors"
                            }
                            title="Ordenar Alfabéticamente (A-Z)"
                        >
                            <i data-lucide="sort-asc" size="14"></i> A-Z
                        </button>
                        {/* Botón Ordenar Z-A */}
                        <button 
                            onClick={() => sortAlphabetically('desc')} 
                            className={
                                "text-slate-600 hover:text-green-700 font-black " +
                                "text-[10px] flex items-center gap-0.5 hover:bg-slate-200 " +
                                "px-2.5 py-1 rounded-lg transition-colors"
                            }
                            title="Ordenar Alfabéticamente (Z-A)"
                        >
                            <i data-lucide="sort-desc" size="14"></i> Z-A
                        </button>
                        {/* Botón de agregar */}
                        <button 
                            onClick={() => setIsAdding(!isAdding)} 
                            className="text-green-700 font-black text-[10px] flex items-center gap-1 hover:bg-green-100 px-3 py-1 rounded-lg transition-colors"
                        >
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
                            <div 
                                key={m} 
                                draggable={!isEdit}
                                onDragStart={(e) => handleDragStart(e, globalIdx)}
                                onDragOver={(e) => handleDragOver(e, globalIdx)}
                                onDragEnd={handleDragEnd}
                                className={
                                    "p-3 sm:p-4 flex flex-col sm:flex-row justify-between " +
                                    "items-center hover:bg-slate-50 transition-colors gap-3 " +
                                    (draggedIndex === globalIdx ? "opacity-45 bg-slate-100" : "")
                                }
                            >
                                {/* Nombre del miembro */}
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <i 
                                        data-lucide="grip-vertical" 
                                        className="text-slate-300 cursor-grab active:cursor-grabbing hover:text-slate-500 transition-colors" 
                                        size="16"
                                        title="Arrastrar para ordenar"
                                    ></i>
                                    <span className="text-[10px] font-mono text-slate-300 w-5 font-black">
                                        {(i+1).toString().padStart(2,'0')}
                                    </span>
                                    {isEdit ? (
                                        <div className="flex gap-1 flex-1">
                                            <input 
                                                className="border-2 border-green-500 px-3 py-1 rounded-lg text-sm w-full font-bold outline-none" 
                                                value={editValue} 
                                                onChange={(e) => setEditValue(e.target.value)} 
                                                autoFocus 
                                                onKeyDown={(e) => e.key === 'Enter' && saveEdit(globalIdx)}
                                            />
                                            <button 
                                                onClick={() => saveEdit(globalIdx)} 
                                                className="text-green-600 p-2 hover:bg-green-100 rounded-lg"
                                            >
                                                <i data-lucide="check" size="20"></i>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 w-full">
                                            <span className="font-bold text-slate-700 text-sm">{m}</span>
                                            {/* Botón para mover arriba en la lista */}
                                            <button 
                                                onClick={() => moveMember(m, 'up')} 
                                                className={
                                                    "text-slate-400 hover:text-green-600 " +
                                                    "p-1 hover:bg-slate-100 rounded transition-all"
                                                }
                                                title="Mover arriba"
                                            >
                                                <i data-lucide="arrow-up" size="14"></i>
                                            </button>
                                            {/* Botón para mover abajo en la lista */}
                                            <button 
                                                onClick={() => moveMember(m, 'down')} 
                                                className={
                                                    "text-slate-400 hover:text-green-600 " +
                                                    "p-1 hover:bg-slate-100 rounded transition-all"
                                                }
                                                title="Mover abajo"
                                            >
                                                <i data-lucide="arrow-down" size="14"></i>
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    setEditingIndex(globalIdx);
                                                    setEditValue(m);
                                                }} 
                                                className={
                                                    "text-slate-400 hover:text-green-600 " +
                                                    "p-1 hover:bg-slate-100 rounded transition-all"
                                                }
                                                title="Editar nombre"
                                            >
                                                <i data-lucide="pencil" size="14"></i>
                                            </button>
                                            <button 
                                                onClick={() => remove(m)} 
                                                className={
                                                    "text-slate-400 hover:text-red-500 " +
                                                    "p-1 hover:bg-slate-100 rounded transition-all"
                                                }
                                                title="Eliminar miembro"
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
};
