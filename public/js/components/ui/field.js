// Campos compartidos con etiqueta y mensajes accesibles asociados al control.
window.UI = window.UI || {};

// Construye identificadores estables para ayuda y validación del campo.
const obtenerAtributosCampo = ({ id, generatedId, hint, error }) => {
    const inputId = id || generatedId;
    const describedBy = [
        hint ? `${inputId}-hint` : '',
        error ? `${inputId}-error` : ''
    ].filter(Boolean).join(' ') || undefined;
    return { inputId, describedBy };
};

window.UI.Field = function Field({
    id,
    label,
    hint,
    error,
    className = '',
    ...props
}) {
    const generatedId = React.useId();
    const { inputId, describedBy } = obtenerAtributosCampo({
        id,
        generatedId,
        hint,
        error
    });

    return (
        <div className={`ui-field ${error ? 'ui-field--error' : ''} ${className}`}>
            <label className="ui-field__label" htmlFor={inputId}>{label}</label>
            <input
                id={inputId}
                className="ui-field__control"
                aria-invalid={Boolean(error)}
                aria-describedby={describedBy}
                {...props}
            />
            {hint && <p id={`${inputId}-hint`} className="ui-field__hint">{hint}</p>}
            {error && <p id={`${inputId}-error`} className="ui-field__error">{error}</p>}
        </div>
    );
};

window.UI.Select = function Select({
    id,
    label,
    hint,
    error,
    children,
    className = '',
    ...props
}) {
    const generatedId = React.useId();
    const { inputId, describedBy } = obtenerAtributosCampo({
        id,
        generatedId,
        hint,
        error
    });

    return (
        <div className={`ui-field ${error ? 'ui-field--error' : ''} ${className}`}>
            <label className="ui-field__label" htmlFor={inputId}>{label}</label>
            <select
                id={inputId}
                className="ui-field__control"
                aria-invalid={Boolean(error)}
                aria-describedby={describedBy}
                {...props}
            >
                {children}
            </select>
            {hint && <p id={`${inputId}-hint`} className="ui-field__hint">{hint}</p>}
            {error && <p id={`${inputId}-error`} className="ui-field__error">{error}</p>}
        </div>
    );
};
