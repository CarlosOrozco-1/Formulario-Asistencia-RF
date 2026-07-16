// Notificación temporal anunciada por lectores de pantalla sin interrumpir el flujo.
window.UI = window.UI || {};

window.UI.Toast = function Toast({ message }) {
    if (!message) return null;

    return (
        <div className="ui-toast-region" aria-live="polite" aria-atomic="true">
            <div className="ui-toast" role="status">{message}</div>
        </div>
    );
};
