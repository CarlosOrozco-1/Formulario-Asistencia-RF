// Insignia semántica para estados y etiquetas breves.
window.UI = window.UI || {};

window.UI.Badge = function Badge({
    children,
    variant = 'neutral',
    className = '',
    ...props
}) {
    return (
        <span className={`ui-badge ui-badge--${variant} ${className}`} {...props}>
            {children}
        </span>
    );
};
