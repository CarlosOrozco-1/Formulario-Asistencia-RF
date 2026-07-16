// Diálogo accesible para confirmar acciones que requieren una decisión explícita.
window.UI = window.UI || {};

window.UI.ConfirmDialog = function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    danger = false,
    loading = false,
    onConfirm,
    onCancel
}) {
    const confirmRef = React.useRef(null);
    const titleId = React.useId();
    const descriptionId = React.useId();

    // Gestiona foco, tecla Escape y bloqueo del fondo mientras el diálogo está abierto.
    React.useEffect(() => {
        if (!open) return undefined;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        confirmRef.current?.focus();
        const handleKeyDown = event => {
            if (event.key === 'Escape' && !loading) onCancel();
            // Conserva el foco entre las acciones disponibles mientras se decide.
            if (event.key === 'Tab') {
                const controls = document.querySelectorAll(
                    '.ui-dialog button:not(:disabled)'
                );
                const firstControl = controls[0];
                const lastControl = controls[controls.length - 1];
                if (event.shiftKey && document.activeElement === firstControl) {
                    event.preventDefault();
                    lastControl?.focus();
                } else if (!event.shiftKey && document.activeElement === lastControl) {
                    event.preventDefault();
                    firstControl?.focus();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [open, loading, onCancel]);

    if (!open) return null;
    const { Button } = window.UI;

    return (
        <div className="ui-dialog__backdrop" onMouseDown={event => {
            if (event.target === event.currentTarget && !loading) onCancel();
        }}>
            <section
                className="ui-dialog"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
            >
                <h2 id={titleId} className="ui-dialog__title">{title}</h2>
                <p id={descriptionId} className="ui-dialog__description">
                    {description}
                </p>
                <div className="ui-dialog__actions">
                    <Button variant="secondary" disabled={loading} onClick={onCancel}>
                        {cancelLabel}
                    </Button>
                    <Button
                        ref={confirmRef}
                        variant={danger ? 'danger' : 'primary'}
                        loading={loading}
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </Button>
                </div>
            </section>
        </div>
    );
};
