// Proveedor global para notificaciones temporales y decisiones de confirmación.
const FeedbackContext = React.createContext(null);
const { ConfirmDialog, Toast } = window.UI;

window.useFeedback = function useFeedback() {
    const context = React.useContext(FeedbackContext);
    if (!context) throw new Error('useFeedback requiere FeedbackProvider');
    return context;
};

window.FeedbackProvider = function FeedbackProvider({ children }) {
    const [toast, setToast] = React.useState(null);
    const [confirmation, setConfirmation] = React.useState(null);

    // Retira cada notificación después de un intervalo uniforme para toda la aplicación.
    React.useEffect(() => {
        if (!toast) return undefined;
        const timeoutId = window.setTimeout(() => setToast(null), 4000);
        return () => window.clearTimeout(timeoutId);
    }, [toast]);

    const notify = React.useCallback((message, options = {}) => {
        setToast({ message, variant: options.variant || 'info' });
    }, []);

    // Devuelve una promesa para conservar flujos secuenciales sin usar confirm nativo.
    const confirmAction = React.useCallback(options => new Promise(resolve => {
        setConfirmation({
            title: options.title || 'Confirmar acción',
            description: options.description,
            confirmLabel: options.confirmLabel || 'Confirmar',
            danger: Boolean(options.danger),
            resolve
        });
    }), []);

    const closeConfirmation = result => {
        confirmation?.resolve(result);
        setConfirmation(null);
    };

    const value = React.useMemo(() => ({
        notify,
        confirm: confirmAction
    }), [notify, confirmAction]);

    return (
        <FeedbackContext.Provider value={value}>
            {children}
            <Toast
                message={toast?.message}
                variant={toast?.variant}
                onClose={() => setToast(null)}
            />
            <ConfirmDialog
                open={Boolean(confirmation)}
                title={confirmation?.title}
                description={confirmation?.description}
                confirmLabel={confirmation?.confirmLabel}
                danger={confirmation?.danger}
                onConfirm={() => closeConfirmation(true)}
                onCancel={() => closeConfirmation(false)}
            />
        </FeedbackContext.Provider>
    );
};
