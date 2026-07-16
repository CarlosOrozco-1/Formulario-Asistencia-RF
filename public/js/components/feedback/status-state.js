// Estado reutilizable para carga, contenido vacío y errores recuperables.
window.UI = window.UI || {};

window.UI.StatusState = function StatusState({
    type = 'empty',
    title,
    description,
    actions,
    fullPage = false
}) {
    const icons = {
        empty: 'inbox',
        error: 'circle-alert'
    };
    const role = type === 'error' ? 'alert' : 'status';

    return (
        <div className={`ui-status ${fullPage ? 'ui-status--page' : ''}`} role={role}>
            {/* La carga usa movimiento; los otros estados utilizan un símbolo descriptivo. */}
            {type === 'loading' ? (
                <span className="ui-spinner" aria-hidden="true" />
            ) : (
                <i data-lucide={icons[type] || icons.empty} className="ui-status__icon" />
            )}
            <h2 className="ui-status__title">{title}</h2>
            {description && <p className="ui-status__description">{description}</p>}
            {actions && <div className="ui-status__actions">{actions}</div>}
        </div>
    );
};
