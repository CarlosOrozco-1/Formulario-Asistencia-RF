# Fase 5: Shell, Navegación y Sesión del Frontend

## Estado

- **Resultado:** completada
- **Commit funcional:** pendiente de registrar
- **Fecha de cierre:** 16 de julio de 2026
- **Dependencias:** Fases 2 y 4 completadas

## Objetivo

Centralizar las responsabilidades globales de la SPA para que identidad, navegación, permisos,
contexto y feedback no se repitan dentro de cada módulo funcional. La fase debía conservar el
historial real del navegador y ofrecer una salida explícita para rutas inválidas.

## Situación anterior

- `public/app.js` almacenaba token, usuario, restauración, errores y navegación en un componente.
- Las rutas válidas eran una lista de cadenas sin título, icono ni permisos declarados.
- Una URL desconocida se reemplazaba silenciosamente por el dashboard.
- Dashboard, discipulado, Pueblo y usuarios repetían encabezado, identidad y botón para volver.
- La navegación móvil no tenía una estructura propia.
- Los módulos utilizaban `alert` y `confirm` directamente.
- Lucide reemplazaba nodos del DOM después del renderizado de React.

## Arquitectura implementada

```text
FeedbackProvider
└── App
    ├── useSession
    ├── useNavigation
    └── AppShell
        └── Módulo funcional actual
```

La aplicación raíz decide únicamente entre login, restauración, error de sesión o contenido
autenticado. Cada responsabilidad global tiene ahora un archivo y una API identificables.

## Sesión centralizada

`public/js/app/session.js` expone `useSession`. El hook administra:

- token e identidad confirmada;
- restauración mediante `GET /api/auth/me`;
- estados `anonymous`, `restoring`, `error` y `authenticated`;
- reintento ante un fallo temporal de conexión;
- sincronización con el evento `sesion-expirada` del cliente HTTP;
- login y logout sin dejar una URL protegida en la barra actual.

El componente raíz dejó de combinar indicadores booleanos de sesión. Consume un estado único y
acciones explícitas del hook.

## Navegación y permisos

`public/js/app/navigation.js` define un catálogo con:

| Ruta | Título | Rol visible |
|---|---|---|
| `#dashboard` | Inicio | Cualquier usuario autenticado |
| `#discipulado` | Discipulado | Cualquier usuario autenticado |
| `#pueblo` | Pueblo | Cualquier usuario autenticado |
| `#usuarios` | Usuarios | Administrador |

`useNavigation` escucha `hashchange`, por lo que los botones Atrás y Adelante del navegador
actualizan el módulo principal sin lógica especial. Una ruta desconocida muestra “Página no
encontrada” y conserva la dirección para facilitar diagnóstico. Una ruta conocida sin el rol
requerido muestra “Acceso restringido”.

La restricción visual no reemplaza la seguridad: el middleware y las rutas del backend continúan
siendo la autoridad para aceptar o rechazar operaciones administrativas.

## Shell compartido

`public/js/components/layout/app-shell.js` reúne:

- nombre general del producto;
- navegación principal de escritorio;
- navegación inferior para móvil;
- nombre y rol del usuario;
- cierre de sesión;
- breadcrumbs y título de contexto;
- área común para el módulo activo.

Las dos navegaciones se generan desde la misma lista filtrada por rol. Los encabezados repetidos
se retiraron de dashboard, discipulado, Pueblo y usuarios.

## Feedback centralizado

`FeedbackProvider` ofrece `useFeedback()` con dos operaciones:

```text
notify(message, options)
confirm(options) → Promise<boolean>
```

Las operaciones de discipulado, Pueblo y usuarios ahora utilizan notificaciones semánticas de
éxito, advertencia o peligro. Las eliminaciones y desactivaciones esperan una promesa del diálogo
compartido. No quedan usos de `window.alert` ni `window.confirm` en los módulos.

## Integración React/Lucide

La prueba real de navegación detectó `NotFoundError: removeChild` después de cambiar varias
rutas. La causa era `lucide.createIcons()`, que reemplazaba elementos creados por React y rompía
su referencia interna del DOM.

Se creó `UI.Icon`, que genera el SVG dentro de un contenedor estable administrado por React. Se
migraron todos los iconos y se eliminó la mutación global. Además de estabilizar rutas, los
iconos agregados por subvistas y notificaciones aparecen sin requerir un render del componente
raíz.

## Archivos principales

- `public/app.js`
- `public/js/app/session.js`
- `public/js/app/navigation.js`
- `public/js/app/feedback-provider.js`
- `public/js/components/layout/app-shell.js`
- `public/js/components/ui/icon.js`
- `public/js/components/feedback/toast.js`
- `public/js/components/dashboard.js`
- `public/js/components/discipulado.js`
- `public/js/components/pueblo.js`
- `public/js/components/usuarios.js`
- `public/styles.css`

## Verificaciones realizadas

- Análisis de JSX de todos los archivos modificados y nuevos.
- Comprobación de referencias locales declaradas en HTML.
- Login y restauración de identidad en navegador real.
- Navegación entre módulos y retorno mediante historial.
- Presentación de ruta inexistente sin redirección silenciosa.
- Visibilidad de Usuarios para administrador y ocultamiento para usuario regular.
- Renderizado móvil del shell y navegación inferior.
- Confirmaciones y notificaciones sin APIs nativas del navegador.
- Ausencia de mutaciones Lucide y errores de reconciliación React.
- Construcción y ejecución mediante Docker con Node.js 20.

## Riesgos y deuda restante

- Las subvistas internas de cada módulo todavía usan estado local; se reorganizan en Fase 6.
- Los módulos conservan cadenas extensas de Tailwind y componentes presentacionales grandes.
- Las tablas requieren una revisión móvil completa en Fase 7.
- La automatización permanente de estas verificaciones corresponde a Fase 8.
- Babel y Tailwind desde CDN continúan pendientes de una decisión de compilación.

## Criterios de aceptación alcanzados

- Atrás y Adelante reflejan correctamente la navegación entre módulos principales.
- Las URLs inválidas ofrecen una acción clara hacia el dashboard.
- El shell presenta identidad, rol y logout de forma consistente.
- La navegación visible utiliza los mismos roles declarados para la API.

## Restauración

El estado anterior a esta fase se encuentra en el commit `2632474`. Para inspeccionarlo sin
alterar la rama actual puede usarse:

```bash
git show 2632474
```

No se recomienda revertir archivos aislados porque sesión, rutas, shell, feedback e iconos forman
un único flujo de aplicación.
