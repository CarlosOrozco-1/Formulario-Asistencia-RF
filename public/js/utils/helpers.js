// Funciones utilitarias compartidas
window.helpers = {
    displayDate: function(d) {
        if (!d) return '';
        const [y, m, day] = d.split('-');
        return `${day}/${m}/${y}`;
    },
    today: function() {
        return new Date().toISOString().split('T')[0];
    }
};
