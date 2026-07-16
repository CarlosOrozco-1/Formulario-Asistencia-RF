// Botón compartido con variantes, tamaños y estado de carga consistentes.
window.UI = window.UI || {};

window.UI.Button = React.forwardRef(function Button({
    children,
    variant = 'primary',
    size = 'medium',
    fullWidth = false,
    loading = false,
    className = '',
    disabled = false,
    type = 'button',
    ...props
}, ref) {
    // Compone únicamente variantes reconocidas por la API del sistema de diseño.
    const classes = [
        'ui-button',
        `ui-button--${variant}`,
        size !== 'medium' ? `ui-button--${size}` : '',
        fullWidth ? 'ui-button--full' : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <button
            ref={ref}
            type={type}
            className={classes}
            disabled={disabled || loading}
            aria-busy={loading}
            {...props}
        >
            {/* Conserva una etiqueta comprensible mientras la acción está en proceso. */}
            {loading && <span className="ui-button__spinner" aria-hidden="true" />}
            {children}
        </button>
    );
});
