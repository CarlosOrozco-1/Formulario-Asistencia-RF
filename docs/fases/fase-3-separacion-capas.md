# Fase 3: Separación por Capas del Backend

## Estado

- **Resultado:** completada
- **Commit funcional:** `51dad02`
- **Fecha de cierre:** 15 de julio de 2026
- **Dependencia:** Fase 2 completada

## Objetivo

Completar la arquitectura de monolito modular por capas sin modificar las URLs ni los contratos
que ya consumía el frontend. La fase debía separar HTTP, reglas de aplicación y persistencia,
además de garantizar que el guardado de una lista de asistencia fuera atómico.

## Situación anterior

- `server/index.js` configuraba Express, conectaba SQLite, definía una ruta y abría el puerto.
- Las rutas validaban entradas, aplicaban reglas de negocio y ejecutaban SQL.
- La base de datos se compartía implícitamente mediante `app.locals.db`.
- El registro público y protegido de Pueblo duplicaba reglas y consultas.
- Guardar la asistencia de discipulado eliminaba y creaba registros con muchas solicitudes.
- Un fallo intermedio podía dejar una fecha con información parcial.
- La configuración se consultaba directamente desde distintos módulos.

## Arquitectura implementada

El backend mantiene un único despliegue, organizado por dominio y por capas:

```text
Ruta → Controlador → Servicio → Repositorio → SQLite
```

| Capa | Responsabilidad |
|---|---|
| Ruta | Declara método, URL y middleware |
| Controlador | Adapta la solicitud y la respuesta HTTP |
| Servicio | Valida y coordina el caso de uso |
| Repositorio | Ejecuta consultas, comandos y transacciones SQLite |

Los módulos actuales son `auth`, `usuarios`, `discipulado`, `pueblo` y `asistencias`.
Discipulado agrupa grupos y miembros porque ambas capacidades pertenecen al mismo dominio.

## Decisiones tomadas

### Factoría de aplicación

`server/app.js` exporta `crearApp({ db, config })`. La composición puede utilizar una base de
datos temporal durante pruebas sin abrir un puerto ni alterar la base operativa. `server/index.js`
queda limitado a cargar el entorno, construir infraestructura e iniciar el proceso.

### Dependencias explícitas

La conexión y configuración se entregan al construir cada módulo. Las rutas y los controladores
ya no conocen `app.locals.db`; los servicios reciben repositorios sustituibles y no dependen de
Express ni de `better-sqlite3`.

### Módulo Pueblo compartido

`POST /api/publico/pueblo/asistencia` y `POST /api/pueblo/asistencia` utilizan el mismo servicio
y repositorio. Solo cambia el montaje de seguridad en la factoría de Express. Esto evita que las
reglas públicas y protegidas diverjan.

### Asistencia grupal atómica

Se agregó:

```http
PUT /api/asistencias/grupos/:grupoId
```

El cuerpo contiene `fecha` y una lista con `miembro_id` y `estado`. El servicio verifica que:

- el grupo esté activo;
- no existan identificadores duplicados;
- los estados pertenezcan al catálogo permitido;
- la lista represente exactamente a los miembros activos del grupo.

El repositorio elimina la fotografía anterior e inserta la nueva dentro de una transacción. Si
alguna escritura falla, SQLite revierte toda la operación. El frontend sustituyó sus múltiples
solicitudes por una sola llamada a este endpoint.

### Configuración e infraestructura

- `server/config/index.js` valida `JWT_SECRET`, puerto y zona horaria de negocio.
- El middleware JWT recibe el secreto como dependencia.
- El cálculo del día del dashboard recibe la zona horaria configurada.
- El adaptador PDF se ubicó en `server/infrastructure/pdf.js`.

## Compatibilidad conservada

- Las rutas anteriores continúan disponibles.
- Los cuerpos exitosos y el contrato uniforme de errores se mantienen.
- La autenticación y los permisos conservan el comportamiento de la Fase 2.
- La colección Postman conserva sus solicitudes y agrega la operación grupal.
- El esquema SQLite no requiere migración en esta fase.

## Archivos principales

- `server/app.js`
- `server/config/index.js`
- `server/modules/auth/`
- `server/modules/asistencias/`
- `server/modules/discipulado/`
- `server/modules/pueblo/`
- `server/modules/usuarios/`
- `server/infrastructure/pdf.js`
- `public/js/services/api.js`
- `public/js/components/discipulado.js`
- `postman/asistencia_api.json`

## Verificaciones realizadas

- Sintaxis de todos los archivos JavaScript del backend.
- Análisis del JSX modificado.
- Parseo completo de la colección Postman.
- Validación de autenticación, autorización y contratos HTTP existentes.
- Reemplazo completo de asistencia y repetición sin registros duplicados.
- Rechazo de listas incompletas, miembros duplicados y grupos inexistentes.
- Construcción y ejecución en Docker con Node.js 20.

## Riesgos y deuda restante

- El frontend aún concentra estado, navegación y presentación en componentes extensos.
- Los reportes PDF están delimitados como infraestructura, pero todavía no tienen endpoint.
- Las pruebas continúan como verificaciones externas hasta su automatización en la Fase 8.
- Los diálogos nativos y la inconsistencia visual se atienden desde la Fase 4.

## Criterios de aceptación alcanzados

- Ninguna ruta contiene SQL o reglas de negocio.
- Ningún controlador accede a la base de datos.
- Los servicios reciben repositorios sustituibles.
- Los contratos HTTP existentes se conservan.
- El guardado múltiple de discipulado es atómico.

## Restauración

El estado anterior a esta fase se encuentra en el commit `68154ec`. Para inspeccionarlo sin
alterar la rama actual puede usarse:

```bash
git show 68154ec
```

No se recomienda revertir archivos aislados porque la composición, los módulos y el cliente de
asistencia dependen conjuntamente del nuevo flujo.
