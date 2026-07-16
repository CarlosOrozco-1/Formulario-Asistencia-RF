// Icono Lucide renderizado dentro de un contenedor estable administrado por React.
window.UI = window.UI || {};

// Convierte nombres kebab-case del catálogo en claves PascalCase de Lucide.
const obtenerClaveIcono = name => name
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

window.UI.Icon = function Icon({ name, className = '' }) {
    const markup = React.useMemo(() => {
        const icon = window.lucide?.icons?.[obtenerClaveIcono(name)];
        if (!icon) return '';
        const element = window.lucide.createElement(icon);
        return element.outerHTML;
    }, [name]);

    // El SVG vive dentro del span para que ninguna librería reemplace nodos de React.
    return (
        <span
            className={`ui-icon ${className}`}
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: markup }}
        />
    );
};
