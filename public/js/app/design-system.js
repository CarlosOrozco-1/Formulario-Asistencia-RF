// Referencia visual interactiva para revisar variantes sin usar datos operativos.
const { useEffect, useState } = React;
const {
    Alert,
    Badge,
    Button,
    Card,
    ConfirmDialog,
    Field,
    Select,
    StatusState,
    Toast
} = window.UI;

function DesignSystemReference() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // Actualiza iconos que fueron incorporados por los componentes declarativos.
    useEffect(() => {
        if (window.lucide) window.lucide.createIcons();
    });

    // Retira la notificación de ejemplo para reproducir su comportamiento temporal.
    useEffect(() => {
        if (!toastMessage) return undefined;
        const timeoutId = window.setTimeout(() => setToastMessage(''), 3000);
        return () => window.clearTimeout(timeoutId);
    }, [toastMessage]);

    return (
        <main className="design-reference">
            <header>
                <Badge variant="info">Referencia interna</Badge>
                <h1 className="text-4xl font-black text-slate-900 mt-4">
                    Sistema de diseño de Gestión de Asistencia
                </h1>
                <p className="text-slate-600 mt-3 max-w-2xl">
                    Componentes y reglas visuales disponibles para migrar las pantallas del
                    sistema de forma consistente.
                </p>
            </header>

            {/* Documenta la paleta semántica que reemplaza decisiones aisladas. */}
            <section className="mt-10" aria-labelledby="reference-colors">
                <h2 id="reference-colors" className="text-xl font-black">Color semántico</h2>
                <div className="design-reference__grid">
                    {[
                        ['brand', 'Institucional'],
                        ['success', 'Éxito'],
                        ['warning', 'Advertencia'],
                        ['danger', 'Peligro']
                    ].map(([token, label]) => (
                        <Card key={token} compact>
                            <div className={`design-swatch design-swatch--${token}`} />
                            <p className="font-black mt-3">{label}</p>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Expone variantes y estados deshabilitados de las acciones. */}
            <section className="mt-10" aria-labelledby="reference-actions">
                <h2 id="reference-actions" className="text-xl font-black">Acciones</h2>
                <Card className="mt-4 flex flex-wrap gap-3 items-center">
                    <Button>Acción principal</Button>
                    <Button variant="secondary">Secundaria</Button>
                    <Button variant="ghost">Discreta</Button>
                    <Button variant="danger" onClick={() => setDialogOpen(true)}>
                        Destructiva
                    </Button>
                    <Button disabled>Deshabilitada</Button>
                    <Button loading>Procesando</Button>
                </Card>
            </section>

            {/* Comprueba campos, selector, ayudas y errores asociados. */}
            <section className="mt-10" aria-labelledby="reference-fields">
                <h2 id="reference-fields" className="text-xl font-black">Formularios</h2>
                <Card className="design-reference__grid mt-4">
                    <Field
                        label="Nombre completo"
                        placeholder="Escribe un nombre"
                        hint="Utiliza el nombre con el que se identifica la persona."
                    />
                    <Field
                        label="Correo"
                        value="correo-invalido"
                        error="Ingresa un correo válido."
                        readOnly
                    />
                    <Select label="Rol" defaultValue="user">
                        <option value="user">Usuario</option>
                        <option value="admin">Administrador</option>
                    </Select>
                </Card>
            </section>

            {/* Reúne mensajes persistentes, insignias y notificaciones temporales. */}
            <section className="mt-10" aria-labelledby="reference-feedback">
                <h2 id="reference-feedback" className="text-xl font-black">Feedback</h2>
                <div className="design-reference__grid">
                    <Card className="design-reference__stack">
                        <Alert variant="info">Información para completar la tarea.</Alert>
                        <Alert variant="success">Los cambios fueron guardados.</Alert>
                        <Alert variant="warning">Revisa los datos antes de continuar.</Alert>
                        <Alert variant="danger">La operación no pudo completarse.</Alert>
                    </Card>
                    <Card>
                        <StatusState
                            type="empty"
                            title="Todavía no hay registros"
                            description="Los elementos nuevos aparecerán en este espacio."
                            actions={(
                                <Button size="small" onClick={() => {
                                    setToastMessage('Notificación de ejemplo');
                                }}>
                                    Mostrar notificación
                                </Button>
                            )}
                        />
                    </Card>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                    <Badge>Neutral</Badge>
                    <Badge variant="info">Información</Badge>
                    <Badge variant="success">Activo</Badge>
                    <Badge variant="warning">Pendiente</Badge>
                    <Badge variant="danger">Inactivo</Badge>
                </div>
            </section>

            <ConfirmDialog
                open={dialogOpen}
                title="Confirmar acción destructiva"
                description="Esta referencia permite revisar el diálogo antes de migrarlo."
                confirmLabel="Sí, continuar"
                danger
                onConfirm={() => {
                    setDialogOpen(false);
                    setToastMessage('Acción de ejemplo confirmada');
                }}
                onCancel={() => setDialogOpen(false)}
            />
            <Toast message={toastMessage} />
        </main>
    );
}

// Monta la referencia en una raíz independiente de la SPA operativa.
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<DesignSystemReference />);
