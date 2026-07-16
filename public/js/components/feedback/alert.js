// Notificación persistente para información, éxito, advertencia o error.
window.UI = window.UI || {};

window.UI.Alert = function Alert({
    children,
    variant = 'info',
    title,
    className = ''
}) {
    const icons = {
        info: 'info',
        success: 'circle-check',
        warning: 'triangle-alert',
        danger: 'circle-alert'
    };

    return (
        <div
            className={`ui-alert ui-alert--${variant} ${className}`}
            role={variant === 'danger' ? 'alert' : 'status'}
        >
            <i data-lucide={icons[variant] || icons.info} className="w-5 h-5 shrink-0" />
            <div>
                {title && <p className="font-black">{title}</p>}
                <div>{children}</div>
            </div>
        </div>
    );
};
