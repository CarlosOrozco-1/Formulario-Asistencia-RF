// Extraemos los hooks necesarios y helpers del ámbito global window
const { useState, useEffect } = React;
const { saveDatabase } = window;

/**
 * Convierte una fecha en formato YYYY-MM-DD a DD/MM/YYYY
 * @param {string} d - Fecha en formato ISO (YYYY-MM-DD)
 * @returns {string} Fecha formateada DD/MM/YYYY
 */
function displayDate(d) {
    // Si la fecha está vacía, devolvemos cadena vacía
    if (!d) return '';
    // Partimos el string por el guión para obtener año, mes y día
    const [y, m, day] = d.split('-');
    // Retornamos en formato legible tradicional
    return `${day}/${m}/${y}`;
}

/**
 * Componente para la vista de asistencia del Pueblo
 * Permite registrar la cantidad de personas por departamentos
 */
window.PuebloView = function({ 
    db, date, onDateChange, servicio, onServicioChange, grupoServidores, onGrupoChange 
}) {
    // Lista de departamentos de la iglesia
    const [members, setMembers] = useState([]);
    // Filtro para buscar departamentos por nombre
    const [searchTerm, setSearchTerm] = useState('');
    // Controla si se despliega el formulario para añadir nuevo departamento
    const [isAdding, setIsAdding] = useState(false);
    // Guarda el estado del nuevo departamento que se va a insertar
    const [newName, setNewName] = useState({
        nombre: '', 
        cantidad: 0 
    });
    // Identificador del departamento que está siendo editado
    const [editingId, setEditingId] = useState(null);
    // Estructura para almacenar temporalmente los cambios del departamento editado
    const [editValue, setEditValue] = useState({});

    // Cargar departamentos de la base de datos al iniciar o cuando cambia db
    useEffect(() => {
        // Si la base de datos ya está disponible
        if (db) {
            // Consultamos todos los departamentos registrados
            const result = db.exec("SELECT id, nombre, cantidad FROM pueblo ORDER BY nombre");
            // Si hay departamentos registrados en la base de datos
            if (result.length > 0) {
                // Actualizamos el estado local en React
                setMembers(result[0].values.map(r => ({
                    id: r[0], 
                    nombre: r[1], 
                    cantidad: r[2]
                })));
            }
        }
    }, [db]);

    /**
     * Actualiza la cantidad de un departamento
     * @param {number} id - ID del departamento
     * @param {number} delta - Cambio a aplicar (+1 o -1)
     */
    const updateCount = (id, delta) => {
        // Recorremos la lista de departamentos modificando la cantidad elegida
        setMembers(prev => prev.map(m => {
            // Si coincide con el ID a actualizar
            if (m.id === id) {
                // Evitamos cantidades negativas utilizando Math.max
                const newVal = Math.max(0, m.cantidad + delta);
                // Actualizamos el registro en la base de datos SQLite
                db.run(`UPDATE pueblo SET cantidad = ? WHERE id = ?`, [newVal, id]);
                // Guardamos los cambios en localStorage
                saveDatabase(db);
                // Retornamos el elemento actualizado en el arreglo de React
                return { ...m, cantidad: newVal };
            }
            // Retornamos el resto de elementos sin cambios
            return m;
        }));
    };

    /**
     * Agrega un nuevo departamento al pueblo
     * @param {Event} e - Evento del formulario
     */
    const addNew = (e) => {
        // Prevenimos la recarga automática del navegador
        e.preventDefault();
        // Validamos que el nombre ingresado no sea vacío
        if (newName.nombre.trim()) {
            try {
                // Insertamos el nuevo departamento en la tabla pueblo
                db.run(
                    "INSERT INTO pueblo (nombre, cantidad) VALUES (?, ?)", 
                    [newName.nombre.trim(), newName.cantidad]
                );
                // Recargamos el listado ordenado de departamentos
                const result = db.exec("SELECT id, nombre, cantidad FROM pueblo ORDER BY nombre");
                // Actualizamos la lista local en React
                setMembers(result[0].values.map(r => ({
                    id: r[0], 
                    nombre: r[1], 
                    cantidad: r[2]
                })));
                // Guardamos el estado actual en localStorage
                saveDatabase(db);
            } catch (err) { 
                console.log(err); 
            }
            // Reiniciamos los campos del formulario
            setNewName({ nombre: '', cantidad: 0 });
            // Ocultamos la caja de formulario para agregar
            setIsAdding(false);
        }
    };

    /**
     * Elimina un departamento del pueblo
     * @param {number} id - ID del departamento
     * @param {string} nombre - Nombre del departamento
     */
    const remove = (id, nombre) => {
        // Solicitamos confirmación del usuario para proceder con el borrado
        if (confirm(`¿Eliminar "${nombre}" de la lista?`)) {
            // Borramos el departamento de la tabla pueblo
            db.run("DELETE FROM pueblo WHERE id = ?", [id]);
            // Recargamos todos los departamentos restantes ordenados
            const result = db.exec("SELECT id, nombre, cantidad FROM pueblo ORDER BY nombre");
            // Actualizamos el estado local en React
            setMembers(result[0].values.map(r => ({
                id: r[0], 
                nombre: r[1], 
                cantidad: r[2]
            })));
            // Guardamos los cambios en localStorage
            saveDatabase(db);
        }
    };

    /**
     * Guarda los cambios de edición de un departamento
     */
    const saveEdit = () => {
        // Actualizamos los campos nombre y cantidad en la tabla pueblo
        db.run(
            "UPDATE pueblo SET nombre = ?, cantidad = ? WHERE id = ?", 
            [editValue.nombre, editValue.cantidad, editingId]
        );
        // Recargamos la lista ordenada de departamentos de la base de datos
        const result = db.exec("SELECT id, nombre, cantidad FROM pueblo ORDER BY nombre");
        // Actualizamos el estado de la lista en React
        setMembers(result[0].values.map(r => ({
            id: r[0], 
            nombre: r[1], 
            cantidad: r[2]
        })));
        // Guardamos los datos actualizados en localStorage
        saveDatabase(db);
        // Desactivamos el modo de edición de departamento
        setEditingId(null);
    };

    /**
     * Genera y descarga el reporte de asistencia del pueblo en PDF
     */
    const downloadPDF = () => {
        // Desestructuramos jsPDF del objeto global window
        const { jsPDF } = window.jspdf;
        // Instanciamos un nuevo documento PDF en orientación vertical
        const docPdf = new jsPDF();
        // Formateamos la fecha seleccionada para mostrarla en el PDF
        const dDate = displayDate(date);
        
        // Configuramos la cabecera del reporte con fuente helvetica negrita
        docPdf.setFont("helvetica", "bold");
        docPdf.setFontSize(16);
        docPdf.setTextColor(0, 0, 0);
        docPdf.text("Reporte de asistencia", 105, 12, { align: "center" });
        
        // Escribimos la información de la iglesia en el reporte
        docPdf.setFontSize(10);
        docPdf.setFont("helvetica", "normal");
        docPdf.setTextColor(0, 0, 0);
        docPdf.text("Iglesia de Cristo Restauración Familiar", 105, 18, { align: "center" });
        
        // Escribimos el nombre del servicio seleccionado (o texto por defecto)
        const servicioTexto = servicio ? `${servicio} servicio` : "servicio";
        docPdf.text(servicioTexto, 105, 22, { align: "center" });
        
        // Agregamos la fecha en el reporte
        docPdf.text(` ${dDate}`, 105, 26, { align: "center" });
        
        // Declaramos la posición vertical inicial para la tabla
        let startY = 32;
        // Si hay un grupo de servidores seleccionado, lo mostramos
        if (grupoServidores) {
            docPdf.setFontSize(9);
            docPdf.text(`Grupo de Servidores: ${grupoServidores}`, 105, 30, { align: "center" });
            // Desplazamos la posición inicial de la tabla para que no se traslape
            startY = 34;
        }
        
        // Sumamos las cantidades de todos los departamentos
        const total = members.reduce((acc, m) => acc + m.cantidad, 0);

        // Generamos la tabla de departamentos usando autoTable
        docPdf.autoTable({
            startY: startY,
            head: [['Departamento', 'Cantidad']],
            body: members.map(m => [m.nombre, m.cantidad]),
            theme: 'striped',
            headStyles: { fillColor: [21, 128, 61] },
            margin: { left: 40, right: 40 }
        });

        // Agregamos el total acumulado al final de la tabla
        docPdf.setFontSize(12);
        docPdf.setTextColor(21, 128, 61);
        docPdf.text(
            `Total: ${total}`, 
            105, docPdf.lastAutoTable.finalY + 10, { align: "center" }
        );

        // Guardamos el PDF con la fecha formateada en el nombre de archivo
        docPdf.save(`Asistencia_Pueblo_${dDate.replace(/\//g, '-')}.pdf`);
    };

    // Filtrar los departamentos según el término ingresado en el buscador
    const filtered = members.filter(
        m => m.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-4">
            {/* Barra de búsqueda, selector de fecha, servicio y grupo */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {/* Caja de Búsqueda */}
                <div 
                    className={
                        "md:col-span-2 bg-white p-2 rounded-xl border " +
                        "border-slate-200 flex items-center gap-2 shadow-sm"
                    }
                >
                    <div className="relative flex-1">
                        <i 
                            data-lucide="search" 
                            className="absolute left-3 top-2.5 text-slate-400" 
                            size="18"
                        ></i>
                        <input 
                            type="text" 
                            placeholder="Buscar..." 
                            className={
                                "w-full pl-10 pr-4 py-2 bg-slate-50 rounded-lg " +
                                "text-sm focus:ring-2 focus:ring-green-500 outline-none"
                            }
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                        />
                    </div>
                </div>
                
                {/* Selector de Fecha */}
                <div className="bg-white p-2 rounded-xl border border-slate-200 flex items-center shadow-sm">
                    <input 
                        type="date" 
                        className={
                            "w-full bg-slate-50 px-3 py-2 rounded-lg text-xs " +
                            "font-bold outline-none border border-transparent " +
                            "focus:border-green-500"
                        }
                        value={date} 
                        onChange={e => onDateChange(e.target.value)} 
                    />
                </div>
                
                {/* Selector de Servicio */}
                <div className="bg-white p-2 rounded-xl border border-slate-200 flex items-center shadow-sm">
                    <select 
                        value={servicio} 
                        onChange={e => onServicioChange(e.target.value)}
                        className={
                            "w-full bg-slate-50 px-3 py-2 rounded-lg text-xs " +
                            "font-bold outline-none border border-transparent " +
                            "focus:border-green-500"
                        }
                    >
                        <option value="">Servicio</option>
                        <option value="Primer">Primer</option>
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
                        className={
                            "w-full bg-slate-50 px-3 py-2 rounded-lg text-xs " +
                            "font-bold outline-none border border-transparent " +
                            "focus:border-green-500"
                        }
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
                <div 
                    className={
                        "bg-white p-3 rounded-xl border border-slate-200 " +
                        "flex justify-around items-center text-center shadow-sm"
                    }
                >
                    <div>
                        <p className="text-[8px] text-slate-400 font-black uppercase">Departamentos</p>
                        <p className="text-xl font-black text-slate-700 leading-none">{members.length}</p>
                    </div>
                    <div className="w-[1px] h-6 bg-slate-100"></div>
                    <div>
                        <p className="text-[8px] text-green-600 font-black uppercase">TOTAL</p>
                        <p className="text-xl font-black text-green-600 leading-none">
                            {members.reduce((acc, m) => acc + m.cantidad, 0)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Lista de departamentos */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div 
                    className={
                        "bg-slate-50 px-5 py-3 border-b border-slate-200 " +
                        "flex justify-between items-center"
                    }
                >
                    <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Asistencia RF
                    </h2>
                    <div className="flex gap-2">
                        <button 
                            onClick={downloadPDF} 
                            className={
                                "bg-yellow-400 text-green-900 px-3 py-1.5 rounded-lg " +
                                "font-black text-[10px] flex items-center gap-1 " +
                                "hover:bg-yellow-300 transition-colors"
                            }
                        >
                            <i data-lucide="file-down" size="14"></i> PDF
                        </button>
                        <button 
                            onClick={() => setIsAdding(!isAdding)} 
                            className={
                                "text-green-700 font-black text-[10px] flex " +
                                "items-center gap-1 hover:bg-green-100 px-3 py-1 " +
                                "rounded-lg transition-colors"
                            }
                        >
                            <i data-lucide="plus" size="14"></i> AGREGAR
                        </button>
                    </div>
                </div>

                {/* Formulario para agregar nuevo departamento */}
                {isAdding && (
                    <form 
                        onSubmit={addNew} 
                        className="p-4 bg-green-50 border-b border-slate-200 flex gap-2 items-center flex-wrap"
                    >
                        <input 
                            autoFocus 
                            className={
                                "flex-1 p-2 rounded-lg border border-slate-300 " +
                                "text-sm focus:ring-2 focus:ring-green-500 outline-none"
                            }
                            placeholder={
                                "Nombre del departamento (ej. Danza, Cafetería, " +
                                "Pueblo en General, Orden)"
                            }
                            value={newName.nombre} 
                            onChange={e => setNewName({...newName, nombre: e.target.value})} 
                        />
                        <div className="flex items-center gap-2 bg-white px-3 rounded-lg border border-slate-200 py-1">
                            <span className="text-[10px] font-black text-slate-500 uppercase">Cantidad</span>
                            <input 
                                type="number" 
                                min="0" 
                                className="w-16 text-center font-bold text-sm outline-none" 
                                value={newName.cantidad} 
                                onChange={
                                    e => setNewName({
                                        ...newName, 
                                        cantidad: parseInt(e.target.value) || 0
                                    })
                                } 
                            />
                        </div>
                        <button 
                            className={
                                "bg-green-700 text-white px-5 py-2 rounded-lg " +
                                "font-bold text-xs uppercase shadow-md"
                            }
                        >
                            Guardar
                        </button>
                    </form>
                )}

                {/* Lista de departamentos con controles de cantidad */}
                <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto custom-scroll">
                    {filtered.map((m, i) => (
                        editingId === m.id ? (
                            // Modo edición de fila
                            <div key={m.id} className="p-4 bg-green-50 flex gap-2 items-center flex-wrap">
                                <input 
                                    className={
                                        "flex-1 border-2 border-green-500 px-3 py-2 " +
                                        "rounded-lg text-sm font-bold outline-none"
                                    }
                                    value={editValue.nombre} 
                                    onChange={e => setEditValue({...editValue, nombre: e.target.value})} 
                                />
                                <div 
                                    className={
                                        "flex items-center gap-2 bg-white px-3 " +
                                        "rounded-lg border border-green-500 py-1"
                                    }
                                >
                                    <span className="text-[10px] font-black text-green-600 uppercase">
                                        Cantidad
                                    </span>
                                    <input 
                                        type="number" 
                                        min="0" 
                                        className="w-16 text-center font-bold text-sm outline-none text-green-700" 
                                        value={editValue.cantidad} 
                                        onChange={
                                            e => setEditValue({
                                                ...editValue, 
                                                cantidad: parseInt(e.target.value) || 0
                                            })
                                        } 
                                    />
                                </div>
                                <button 
                                    onClick={saveEdit} 
                                    className={
                                        "bg-green-600 text-white px-4 py-2 rounded-lg " +
                                        "text-xs font-black uppercase"
                                    }
                                >
                                    GUARDAR
                                </button>
                            </div>
                        ) : (
                            // Modo visualización de fila
                            <div 
                                key={m.id} 
                                className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-mono text-slate-300 w-5 font-black">
                                        {(i+1).toString().padStart(2,'0')}
                                    </span>
                                    <span className="font-bold text-slate-700 text-sm">{m.nombre}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    {/* Controles de cantidad con botones +/- */}
                                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                                        <button 
                                            onClick={() => updateCount(m.id, -1)} 
                                            className={
                                                "w-8 h-8 rounded-lg bg-white hover:bg-red-100 " +
                                                "text-slate-400 hover:text-red-500 font-bold " +
                                                "text-lg shadow-sm transition-all"
                                            }
                                        >
                                            -
                                        </button>
                                        <span className="w-12 text-center font-black text-slate-700 text-lg">
                                            {m.cantidad}
                                        </span>
                                        <button 
                                            onClick={() => updateCount(m.id, 1)} 
                                            className={
                                                "w-8 h-8 rounded-lg bg-white hover:bg-green-100 " +
                                                "text-slate-400 hover:text-green-600 font-bold " +
                                                "text-lg shadow-sm transition-all"
                                            }
                                        >
                                            +
                                        </button>
                                    </div>
                                    {/* Botones de acción */}
                                    <div className="flex gap-1">
                                        <button 
                                            onClick={() => { setEditingId(m.id); setEditValue({...m}); }} 
                                            className="text-slate-300 hover:text-green-600 p-2"
                                        >
                                            <i data-lucide="pencil" size="16"></i>
                                        </button>
                                        <button 
                                            onClick={() => remove(m.id, m.nombre)} 
                                            className="text-slate-300 hover:text-red-500 p-2"
                                        >
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
};
