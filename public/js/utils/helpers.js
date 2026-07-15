// Funciones utilitarias compartidas
window.helpers = {
    displayDate: function(d) {
        if (!d) return '';
        const [y, m, day] = d.split('-');
        return `${day}/${m}/${y}`;
    },
    today: function() {
        // Usa la fecha institucional para evitar cambios de día provocados por conversiones UTC.
        return new Intl.DateTimeFormat('fr-CA', {
            timeZone: window.CONFIG.TIME_ZONE,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(new Date());
    }
};
