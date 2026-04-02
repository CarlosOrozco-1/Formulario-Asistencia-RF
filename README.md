# Sistema de Asistencia - Monte Carmelo

Sistema de registro de asistencia para reuniones del discipulado y asistencia del pueblo.

## Características

- **Discipulado**: Registro de hermanos con estados (Presente/Reportado/Ausencia)
- **Pueblo**: Registro por categorías (Danza, Cafetería, Pueblo en General)
- **PDF**: Generación de reportes en PDF para compartir
- **Base de datos local**: Los datos se guardan en el navegador

## Estructura del Proyecto

```
/Asistencia-Discipulado
├── index.html      # Estructura HTML y carga de librerías
├── styles.css      # Estilos personalizados
├── app.js          # Lógica de la aplicación (React + SQLite)
├── README.md       # Descripción del proyecto
└── AGENTS.md       # Reglas de desarrollo
```

## Uso

1. Abre `index.html` en un navegador
2. Selecciona la pestaña (Discipulado o Pueblo)
3. Agrega miembros y registra asistencia
4. Click en "PDF" para generar el reporte

## Compartir en GitHub Pages

1. Crea un repositorio público en GitHub
2. Sube los archivos (index.html, styles.css, app.js, README.md, AGENTS.md)
3. Ve a Settings > Pages
4. Selecciona la rama `main` y guarda
5. Comparte el enlace

## Requisitos

- Navegador moderno (Chrome, Firefox, Safari, Edge)
- Conexión a internet (para cargar librerías CDN)

## Tecnologías usadas

- React 18 (UI)
- Tailwind CSS (estilos)
- SQL.js (base de datos SQLite en navegador)
- jsPDF + autoTable (generación de PDF)
- Lucide (iconos)

---

Monte Carmelo - 2026
