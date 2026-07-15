# Fases de Reestructuración Arquitectónica y UI

## Propósito

Este plan transforma gradualmente la implementación actual en el monolito modular por capas
definido en `docs/arquitectura.md`. Cada fase debe terminar con el sistema ejecutable, verificado
y documentado.

## Reglas de ejecución

- Se implementará una fase a la vez.
- Antes de comenzar una fase se confirmará que la anterior cumple sus criterios de aceptación.
- Cada fase tendrá uno o más commits pequeños con un único propósito.
- No se mezclarán cambios visuales amplios con movimientos estructurales del backend.
- Los endpoints conservarán compatibilidad salvo que la fase indique y documente lo contrario.
- Toda línea de código agregada o modificada seguirá las reglas de `AGENTS.md`.
- Los endpoints modificados se actualizarán en `postman/asistencia_api.json`.
- Los cambios de base de datos incluirán una estrategia segura para datos existentes.

## Estado general

| Fase | Nombre | Estado | Dependencia |
|---|---|---|---|
| 0 | Línea base y definición arquitectónica | Completada | Ninguna |
| 1 | Estabilización crítica | Pendiente | Fase 0 |
| 2 | Contratos HTTP y manejo de errores | Pendiente | Fase 1 |
| 3 | Separación por capas del backend | Pendiente | Fase 2 |
| 4 | Fundamentos del sistema de diseño | Pendiente | Fase 1 |
| 5 | Shell, navegación y sesión del frontend | Pendiente | Fases 2 y 4 |
| 6 | Refactorización de módulos funcionales | Pendiente | Fases 3 y 5 |
| 7 | Responsividad y accesibilidad | Pendiente | Fase 6 |
| 8 | Pruebas y automatización de calidad | Pendiente | Fases 3 a 7 |
| 9 | Seguridad, operación y documentación final | Pendiente | Fase 8 |

## Fase 0: Línea base y definición arquitectónica

### Objetivo

Establecer un punto de restauración y acordar formalmente la arquitectura antes de modificar el
código funcional.

### Entregables

- Commit vacío de línea base previo a los cambios.
- Arquitectura oficial actualizada en `docs/arquitectura.md`.
- Plan incremental en este documento.
- Inventario inicial de riesgos técnicos y de UI.

### Criterios de aceptación

- El repositorio tiene un commit identificable anterior a la reestructuración.
- La arquitectura distingue el estado actual de la estructura objetivo.
- Cada fase futura tiene alcance, entregables y criterios verificables.
- No se ha modificado código funcional.

### Estrategia de commits

- `chore: crear punto de restauracion previo a refactorizacion`
- `docs: definir arquitectura y fases de reestructuracion`

## Fase 1: Estabilización crítica

### Objetivo

Corregir defectos que impiden utilizar de forma confiable la aplicación antes de mover archivos
o rediseñar pantallas.

### Alcance

- Restaurar la identidad del usuario al recargar una sesión con JWT.
- Agregar `GET /api/auth/me` o un contrato equivalente protegido.
- Evitar el estado infinito de carga cuando la sesión no puede restaurarse.
- Corregir la referencia inexistente a `public/styles.css` creando el archivo base.
- Revisar fechas para que “hoy” use la zona horaria de negocio acordada.
- Eliminar errores evidentes de navegación y estados sin salida.
- Actualizar Postman y documentación de autenticación.

### Criterios de aceptación

- Una recarga conserva una sesión válida y muestra al usuario correcto.
- Un token vencido devuelve al login con un mensaje comprensible.
- La aplicación no solicita archivos locales inexistentes.
- Todos los estados de carga terminan en contenido o error recuperable.
- Los flujos de login, logout y recarga cuentan con verificación manual documentada.

### Fuera de alcance

- Reorganización completa de carpetas.
- Rediseño integral de módulos.

## Fase 2: Contratos HTTP y manejo de errores

### Objetivo

Hacer predecible la comunicación entre frontend y backend antes de extraer las capas internas.

### Alcance

- Definir respuestas de éxito y error consistentes.
- Incorporar middleware central de errores y manejo de rutas inexistentes.
- Validar cuerpos, parámetros y filtros de entrada.
- Mejorar el cliente HTTP para comprobar códigos de estado y errores de red.
- Reemplazar recargas forzadas por una transición controlada de sesión.
- Definir códigos HTTP para creación, edición, eliminación y validación.

### Criterios de aceptación

- Los endpoints modificados usan el contrato documentado.
- El frontend diferencia validación, falta de permisos, sesión vencida y fallo de conexión.
- Los errores internos no exponen SQL, rutas del servidor ni información sensible.
- La colección Postman cubre respuestas exitosas y errores representativos.

## Fase 3: Separación por capas del backend

### Objetivo

Convertir las rutas actuales en módulos con rutas, controladores, servicios y repositorios
separados, sin cambiar el comportamiento externo.

### Orden sugerido

1. Autenticación.
2. Usuarios.
3. Grupos y miembros como dominio de discipulado.
4. Categorías y registros del pueblo.
5. Asistencias y resumen del dashboard.
6. Generación de PDF.

### Alcance

- Crear una factoría de aplicación Express separada del arranque del servidor.
- Extraer SQL hacia repositorios.
- Extraer reglas y coordinación hacia servicios.
- Mantener controladores enfocados en HTTP.
- Incorporar transacciones al registro múltiple de asistencias.
- Eliminar duplicación entre registro público y protegido del pueblo.
- Definir configuración mediante un módulo validado.

### Criterios de aceptación

- Ninguna ruta contiene SQL o reglas de negocio.
- Los controladores no acceden a `app.locals.db`.
- Los servicios principales pueden probarse con repositorios sustitutos.
- Los contratos HTTP existentes continúan funcionando.
- Las escrituras múltiples son atómicas.

## Fase 4: Fundamentos del sistema de diseño

### Objetivo

Crear una base visual coherente y reutilizable antes de rediseñar los módulos.

### Alcance

- Acordar el nombre institucional y la paleta oficial.
- Definir tokens de color, tipografía, espaciado, radios y sombras.
- Crear estilos globales y foco visible en `public/styles.css`.
- Crear componentes UI para botón, campo, selector, tarjeta e insignia.
- Crear componentes de feedback para carga, vacío, error y notificación.
- Crear diálogo de confirmación para sustituir `confirm`.
- Definir variantes y estados deshabilitados.

### Criterios de aceptación

- Los componentes compartidos tienen una API consistente.
- Los controles pueden utilizarse con teclado y muestran foco visible.
- No se introducen colores o tamaños arbitrarios en las pantallas migradas.
- Existe una página o sección de referencia visual para revisar variantes.

## Fase 5: Shell, navegación y sesión del frontend

### Objetivo

Centralizar las responsabilidades globales de la SPA y establecer una navegación consistente.

### Alcance

- Crear un layout autenticado compartido con encabezado y navegación móvil.
- Centralizar sesión, restauración, logout y permisos.
- Definir rutas válidas y una vista de página no encontrada.
- Agregar breadcrumbs o títulos contextuales a las subvistas.
- Centralizar notificaciones y diálogos.
- Evitar que cada módulo repita encabezados y estados globales.

### Criterios de aceptación

- El botón atrás del navegador refleja correctamente la navegación principal.
- Una URL inválida muestra una salida clara hacia el dashboard.
- El layout presenta usuario, rol y cierre de sesión de manera consistente.
- Los permisos de navegación coinciden con los permisos de la API.

## Fase 6: Refactorización de módulos funcionales

### Objetivo

Migrar cada capacidad a la estructura por módulos y al sistema de diseño sin alterar sus reglas
de negocio.

### Orden sugerido

1. Login.
2. Dashboard.
3. Discipulado.
4. Pueblo.
5. Usuarios.

### Alcance por módulo

- Separar contenedores de datos, hooks y vistas presentacionales.
- Eliminar cadenas repetidas de clases y encabezados duplicados.
- Incorporar estados de carga, vacío, error, éxito y permiso denegado.
- Mantener actualizaciones de estado inmutables.
- Añadir búsqueda, filtros o paginación donde el volumen lo requiera.
- Corregir indicadores del dashboard para que representen correctamente cantidades y registros.

### Criterios de aceptación

- Ningún componente funcional utiliza `fetch` directamente.
- Cada módulo puede evolucionar sin modificar los demás.
- Las operaciones muestran progreso, resultado y opción de recuperación.
- Los datos del dashboard tienen una definición de negocio documentada.

## Fase 7: Responsividad y accesibilidad

### Objetivo

Garantizar que todos los flujos sean utilizables en móvil, escritorio, teclado y tecnologías de
asistencia.

### Alcance

- Convertir tablas extensas en contenedores desplazables o tarjetas móviles.
- Asegurar objetivos táctiles de tamaño suficiente.
- Asociar etiquetas y campos mediante `id` y `htmlFor`.
- Agregar nombres accesibles a botones de icono.
- Anunciar errores, éxitos y cargas con regiones apropiadas.
- Revisar contraste, orden de foco y navegación por teclado.
- Respetar preferencias de reducción de movimiento.

### Criterios de aceptación

- No existe desplazamiento horizontal de página en anchos móviles acordados.
- Los flujos críticos pueden completarse únicamente con teclado.
- Las tablas conservan contexto y acciones en móvil.
- Una auditoría de accesibilidad no presenta errores críticos conocidos.

## Fase 8: Pruebas y automatización de calidad

### Objetivo

Proteger los comportamientos críticos y las fronteras arquitectónicas contra regresiones.

### Alcance

- Seleccionar y configurar herramientas de pruebas compatibles con el proyecto.
- Agregar pruebas unitarias para servicios y utilidades.
- Agregar pruebas de integración para repositorios y endpoints.
- Agregar pruebas de los flujos login, asistencia y permisos.
- Incorporar lint, formato y comprobaciones automáticas.
- Configurar integración continua para ejecutar las verificaciones.

### Criterios de aceptación

- Una instalación limpia puede ejecutar todas las verificaciones con comandos documentados.
- Los flujos de autenticación y registro de asistencia tienen cobertura automatizada.
- Una regresión en las reglas de dependencia o contratos impide integrar el cambio.
- Las pruebas no dependen de la base de datos de producción.

## Fase 9: Seguridad, operación y documentación final

### Objetivo

Preparar la arquitectura corregida para una operación mantenible y una exposición segura.

### Alcance

- Restringir CORS y configurar cabeceras de seguridad.
- Incorporar límites de solicitudes en endpoints públicos y autenticación.
- Validar secretos, configuración y política de contraseñas.
- Definir respaldo, restauración y migración de SQLite.
- Agregar logging estructurado y manejo de apagado seguro.
- Revisar Docker, health checks y persistencia de volúmenes.
- Actualizar README, arquitectura, esquema y colección Postman.

### Criterios de aceptación

- No existen secretos predeterminados aceptables para producción.
- El endpoint público tiene controles básicos contra abuso.
- El procedimiento de respaldo y restauración está probado y documentado.
- El contenedor expone una comprobación de salud útil.
- La documentación refleja la implementación real.

## Inventario inicial de riesgos

| Prioridad | Riesgo | Fase responsable |
|---|---|---|
| Crítica | Recargar con JWT deja la aplicación en carga permanente | 1 |
| Alta | El cliente HTTP no comprueba correctamente errores HTTP | 2 |
| Alta | Rutas Express mezclan HTTP, negocio y SQL | 3 |
| Alta | Registro público con validación y protección insuficientes | 2 y 9 |
| Alta | Registro múltiple de asistencia sin transacción explícita | 3 |
| Media | `styles.css` se solicita pero no existe | 1 |
| Media | Componentes y clases visuales están duplicados | 4 a 6 |
| Media | Tablas se desbordan en pantallas pequeñas | 7 |
| Media | Controles de icono carecen de nombre accesible | 7 |
| Media | Identidad visual inconsistente | 4 |
| Media | Fechas basadas implícitamente en UTC | 1 y 3 |
| Baja | README e historial no coinciden con el estado actual | 9 |

## Definición de terminado para cada fase

Una fase se considera terminada cuando:

1. Todos sus criterios de aceptación están comprobados.
2. No quedan errores conocidos de prioridad crítica introducidos por la fase.
3. Las pruebas y verificaciones disponibles pasan.
4. La documentación y Postman están actualizados cuando aplica.
5. `git status` solo contiene cambios intencionales.
6. Los commits describen claramente el propósito de los cambios.
7. El estado de esta tabla se actualiza antes de iniciar la fase siguiente.
