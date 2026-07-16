// Superficie compartida para agrupar contenido relacionado.
window.UI = window.UI || {};

window.UI.Card = function Card({
    children,
    variant = 'default',
    compact = false,
    as: Component = 'div',
    className = '',
    ...props
}) {
    // Permite variar elevación y densidad sin repetir clases en las pantallas.
    const classes = [
        'ui-card',
        variant !== 'default' ? `ui-card--${variant}` : '',
        compact ? 'ui-card--compact' : '',
        className
    ].filter(Boolean).join(' ');
    return <Component className={classes} {...props}>{children}</Component>;
};
