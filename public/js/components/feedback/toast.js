// Notificación temporal anunciada por lectores de pantalla sin interrumpir el flujo.
window.UI = window.UI || {};

window.UI.Toast = function Toast({ message, variant = 'info', onClose }) {
    if (!message) return null;
    const { Icon } = window.UI;

    const icons = {
        info: 'info',
        success: 'circle-check',
        warning: 'triangle-alert',
        danger: 'circle-alert'
    };

    return (
        <div className="ui-toast-region" aria-live="polite" aria-atomic="true">
            <div
                className={`ui-toast ui-toast--${variant}`}
                role={variant === 'danger' ? 'alert' : 'status'}
            >
                <Icon name={icons[variant] || icons.info} className="w-5 h-5 shrink-0" />
                <span>{message}</span>
                {onClose && (
                    <button type="button" onClick={onClose} aria-label="Cerrar notificación">
                        <Icon name="x" className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
};
