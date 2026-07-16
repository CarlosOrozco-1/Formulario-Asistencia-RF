# Arquitectura de Gestión de Asistencia

## Estado del documento

Este documento define la arquitectura oficial del proyecto y las reglas que deben respetarse
durante su evolución. La implementación actual se migrará gradualmente hacia esta definición
siguiendo `docs/fases-reestructuracion.md`.

## Decisión arquitectónica

El sistema utiliza un **monolito modular cliente-servidor organizado por capas**.

- **Monolito:** frontend, API y acceso a datos se despliegan como una sola aplicación.
- **Modular:** las capacidades se separan por dominio: autenticación, asistencias,
  discipulado, pueblo y usuarios.
- **Cliente-servidor:** la SPA React consume una API REST proporcionada por Express.
- **Por capas:** presentación, aplicación, dominio e infraestructura tienen responsabilidades
  y dependencias delimitadas.

Esta decisión mantiene una operación sencilla con Docker y SQLite, pero permite probar y
evolucionar cada módulo sin introducir la complejidad operativa de microservicios.

## Situación actual

El backend implementa el monolito modular por capas definido en este documento:

- `server/index.js` inicia el proceso y `server/app.js` compone Express.
- La configuración se valida en `server/config/` y se inyecta en los módulos.
- Cada dominio contiene rutas, controladores, servicios y repositorios.
- El SQL y las transacciones se encuentran exclusivamente en repositorios.
- Los adaptadores técnicos, como PDF, se encuentran en `server/infrastructure/`.

La separación del frontend continúa en evolución:

- Los componentes React todavía mezclan carga de datos, estado, navegación y presentación.
- Existen componentes compartidos en `components/ui` y `components/feedback`.
- El login y los estados globales de sesión ya consumen el sistema de diseño.
- `useSession` y `useNavigation` centralizan identidad, rutas e historial.
- `AppShell` comparte navegación, usuario, rol, contexto y cierre de sesión.
- `FeedbackProvider` concentra notificaciones y confirmaciones.
- Los módulos funcionales ya se reorganizan bajo `public/js/features/`.
- Las tablas y controles compartidos ya tienen una base responsiva para móvil y teclado.
- La navegación principal usa el hash y las subvistas funcionales conservan estado local.

Las siguientes fases completarán las fronteras del frontend sin cambiar el tipo de arquitectura.

```text
┌────────────────────────── Aplicación desplegable ──────────────────────────┐
│                                                                            │
│  Navegador                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ SPA React                                                            │  │
│  │ Presentación → Casos de uso del frontend → Cliente HTTP              │  │
│  └───────────────────────────────┬──────────────────────────────────────┘  │
│                                  │ JSON / HTTPS                            │
│  Servidor Express                ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Rutas → Controladores → Servicios de aplicación → Repositorios       │  │
│  └──────────────────────────────────────────────────┬───────────────────┘  │
│                                                     │                      │
│                                                     ▼                      │
│                                            SQLite / better-sqlite3          │
└────────────────────────────────────────────────────────────────────────────┘
```

## Principios de diseño

1. **Dependencias hacia adentro:** una capa externa puede conocer a una interna, pero una capa
   interna no debe depender de Express, React o SQLite.
2. **Responsabilidad única:** cada archivo debe tener un propósito identificable.
3. **Módulos por dominio:** las funcionalidades se agrupan por capacidad de negocio y no solo
   por tipo técnico.
4. **Contratos explícitos:** los endpoints, validaciones y respuestas de error deben ser
   predecibles y estar documentados.
5. **Reutilización intencional:** únicamente los elementos realmente compartidos se colocan en
   carpetas comunes.
6. **Cambios incrementales:** cada fase debe mantener el sistema ejecutable y conservar los
   contratos públicos salvo que se documente una migración.
7. **Seguridad por defecto:** todo endpoint es protegido salvo los declarados explícitamente
   como públicos.

## Capas del backend

### 1. Rutas

Definen método, URL, middleware y controlador. No contienen SQL ni reglas de negocio.

### 2. Controladores

Traducen HTTP a una operación de aplicación: leen parámetros, invocan servicios y construyen
la respuesta. No conocen detalles de SQLite.

### 3. Servicios de aplicación

Coordinan casos de uso, autorización contextual y reglas de negocio. Reciben dependencias como
repositorios para facilitar las pruebas.

### 4. Repositorios

Encapsulan consultas, comandos y transacciones de SQLite. Devuelven objetos del dominio y no
respuestas de Express.

### 5. Infraestructura

Contiene conexión a base de datos, generación de PDF, configuración, registro y adaptadores
externos.

El flujo permitido es:

```text
Ruta → Middleware → Controlador → Servicio → Repositorio → SQLite
```

No se permiten dependencias en sentido contrario ni acceso directo a la base de datos desde
rutas, controladores o componentes del frontend.

## Capas del frontend

### 1. Aplicación

Inicializa React y compone los proveedores globales. Los hooks de aplicación restauran la
sesión, resuelven navegación y aplican permisos de presentación.

### 2. Layout y componentes UI

Contiene estructura visual compartida y componentes reutilizables como botones, campos,
tarjetas, diálogos, alertas y estados de carga. `AppShell` recibe rutas e identidad, pero no
conoce endpoints ni reglas internas de los módulos.

### 3. Módulos funcionales

Cada módulo agrupa sus vistas, hooks y lógica de presentación:

- `auth`
- `dashboard`
- `discipulado`
- `pueblo`
- `usuarios`

### 4. Servicios

Centralizan comunicación HTTP, sesión y transformación de respuestas. Ningún componente debe
usar `fetch` directamente.

### 5. Utilidades y configuración

Incluyen funciones puras, constantes y formatos comunes sin dependencias de la interfaz.

El flujo permitido es:

```text
Vista → Hook o caso de uso → Servicio API → API REST
```

## Navegación, sesión y permisos del frontend

- `useSession` es la única fuente de identidad autenticada en React.
- `useNavigation` interpreta el hash y conserva el historial nativo del navegador.
- El catálogo de rutas declara título, icono y roles visibles de cada módulo.
- Ocultar una ruta no sustituye la autorización del backend; la API sigue validando roles.
- Una URL inexistente conserva su dirección y muestra una salida hacia el dashboard.
- Un acceso conocido sin rol suficiente muestra “Acceso restringido”.
- El shell genera desde el mismo catálogo la navegación de escritorio y móvil.
- Los módulos no deben crear encabezados, identidad o controles de logout propios.
- Las notificaciones y confirmaciones se solicitan mediante `FeedbackProvider`.

## Estructura objetivo

La estructura podrá adaptarse durante la implementación, pero debe conservar estas fronteras:

```text
server/
├── index.js
├── app.js
├── config/
├── database/
├── infrastructure/
├── middleware/
├── utils/
└── modules/
    ├── auth/
    │   ├── auth.routes.js
    │   ├── auth.controller.js
    │   ├── auth.service.js
    │   └── auth.repository.js
    ├── asistencias/
    ├── discipulado/
    ├── pueblo/
    └── usuarios/

public/
├── index.html
├── design-system.html
├── styles.css
├── app.js
└── js/
    ├── app/
    ├── components/
    │   ├── layout/
    │   ├── ui/
    │   └── feedback/
    ├── features/
    │   ├── auth/
    │   ├── dashboard/
    │   ├── discipulado/
    │   ├── pueblo/
    │   └── usuarios/
    ├── services/
    ├── config/
    └── utils/
```

La carpeta `features/` ya contiene la separación por capacidades funcionales.
Cada módulo debe dividir su lógica entre carga de datos, estado local y vista presentacional.

## Comunicación y contrato HTTP

La API utiliza JSON y rutas bajo `/api`. Las respuestas exitosas deben emplear códigos HTTP
adecuados y las respuestas de error deben adoptar un contrato común:

```json
{
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Los datos enviados no son válidos",
        "details": []
    }
}
```

El cliente HTTP debe:

- agregar el JWT únicamente a solicitudes protegidas;
- comprobar `response.ok` antes de procesar el cuerpo;
- distinguir errores de validación, autorización, servidor y conexión;
- cerrar la sesión ante un token inválido o expirado;
- permitir cancelar solicitudes cuando una vista deja de estar activa.

Toda modificación de endpoints debe reflejarse en `postman/asistencia_api.json`.
La definición detallada de códigos y validaciones se mantiene en `docs/api-contract.md`.

## Autenticación y autorización

1. El usuario inicia sesión mediante `POST /api/auth/login`.
2. El servidor verifica credenciales y entrega un JWT con vigencia limitada.
3. La SPA restaura la sesión mediante `GET /api/auth/me` o un mecanismo equivalente validado
   por el servidor.
4. El middleware autentica el token y adjunta la identidad a la solicitud.
5. Los servicios o middleware de autorización verifican el rol requerido.

Guardar un token no implica que la sesión sea válida. La identidad siempre debe confirmarse
con el servidor al iniciar la aplicación.

## Endpoints públicos

Los únicos endpoints sin autenticación deben aparecer en una lista explícita. Actualmente son:

| Método | Endpoint | Propósito |
|---|---|---|
| `POST` | `/api/auth/login` | Iniciar sesión |
| `POST` | `/api/publico/pueblo/asistencia` | Registrar asistencia pública |

El registro público debe incorporar validación, límites de entrada y medidas contra abuso antes
de considerarse listo para exposición en Internet.

## Persistencia y transacciones

- SQLite es la fuente de verdad y se accede exclusivamente mediante repositorios.
- Las relaciones conservan claves foráneas y los identificadores son autoincrementales.
- Las operaciones que escriben varios registros deben usar una transacción.
- Las fechas de negocio deben tratarse con una zona horaria definida y no depender implícitamente
  de UTC.
- Los cambios de esquema deben ser reproducibles y contar con una estrategia de migración.

## Arquitectura de UI

La interfaz emplea un sistema de diseño pequeño basado en Tailwind y estilos propios:

- tokens de color, tipografía, espaciado, bordes y sombras en `public/styles.css`;
- componentes con variantes consistentes en `public/js/components/ui/`;
- feedback y estados en `public/js/components/feedback/`;
- layout común para módulos autenticados;
- diseño mobile-first;
- estados definidos para carga, vacío, error, éxito y permisos insuficientes;
- foco visible, navegación por teclado y nombres accesibles;
- notificaciones y diálogos propios en lugar de `alert` y `confirm`.

La identidad visual usa “Gestión de Asistencia” como nombre general, sin asociar el producto a
una organización específica. El azul `#1d4ed8` identifica acciones y marca; verde, ámbar y rojo
se reservan para éxito, advertencia y peligro. La referencia interactiva se sirve en
`/design-system.html` y no consume información operativa.

## Pruebas y calidad

La arquitectura debe poder verificarse mediante:

- pruebas unitarias de servicios y utilidades;
- pruebas de integración de repositorios y endpoints;
- pruebas de componentes y flujos críticos del frontend;
- validación manual o automatizada de accesibilidad y responsividad;
- comprobación de sintaxis, formato y límites de dependencias en integración continua.

## Tecnologías

| Responsabilidad | Tecnología actual | Decisión |
|---|---|---|
| Servidor HTTP | Node.js + Express | Se mantiene |
| Persistencia | SQLite + better-sqlite3 | Se mantiene |
| Autenticación | JWT + bcryptjs | Se corrige y fortalece |
| Interfaz | React 18 + JSX | Se mantiene inicialmente |
| Compilación | Babel Standalone | Se evaluará en una fase posterior |
| Estilos | Tailwind CSS + CSS | Se formaliza como sistema de diseño |
| Iconos | Lucide | Se mantiene |
| PDF | jsPDF + autoTable | Se encapsula como infraestructura |
| Despliegue | Docker Compose | Se mantiene |

## Decisiones descartadas

- **Microservicios:** añaden despliegues, red y consistencia distribuida sin aportar valor al
  tamaño actual del sistema.
- **MVC clásico:** no representa con precisión la SPA React ni la división cliente-servidor.
- **Acceso SQL desde rutas:** es rápido al inicio, pero acopla HTTP, negocio y persistencia.
- **Estado global para todo:** se conservará estado local por módulo y solo se compartirá sesión,
  navegación y notificaciones globales.

## Gobierno de la arquitectura

- Este documento es la fuente principal para decisiones estructurales.
- `docs/fases-reestructuracion.md` define el orden de implementación.
- `docs/refactorizacion.md` conserva el historial anterior y no sustituye este plan.
- Una excepción a estas reglas debe documentar motivo, alcance y alternativa considerada.
- Cada fase debe actualizar documentación y colección Postman cuando corresponda.
