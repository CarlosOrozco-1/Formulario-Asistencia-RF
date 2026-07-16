# Fase 6: Refactorización de Módulos Funcionales

## Estado

- **Resultado:** completada
- **Dependencias:** Fases 3 y 5 completadas
- **Alcance:** login, dashboard, discipulado, pueblo y usuarios

## Objetivo

Separar las capacidades funcionales del frontend en módulos explícitos para que cada pantalla
controle su propia carga de datos, su estado local y su render presentacional sin mezclar esas
responsabilidades en un único archivo.

## Criterio arquitectónico

La fase consolida la frontera definida para el frontend:

```text
Vista → Hook o caso de uso → Servicio API → API REST
```

La aplicación raíz sigue siendo el orquestador global, pero cada módulo funcional ya vive en
`public/js/features/` y expone un componente de entrada con responsabilidad acotada.

## Cambios realizados

- `public/js/features/auth/login-page.js` concentra el acceso al sistema en un módulo propio.
- `public/js/features/dashboard/dashboard-page.js` separa carga de resumen, tarjetas y accesos.
- `public/js/features/discipulado/discipulado-page.js` agrupa el flujo de grupos, miembros,
  asistencia e historial bajo una página funcional independiente.
- `public/js/features/pueblo/pueblo-page.js` separa categorías, asistencia y reportes.
- `public/js/features/usuarios/usuarios-page.js` encapsula el CRUD administrativo de usuarios.
- `public/index.html` carga los módulos desde `features/` en vez de los componentes antiguos.
- `server/modules/asistencias/asistencias.repository.js` expone métricas de tablero explícitas.
- `docs/api-contract.md` documenta `registrosHoy`, `personasHoy` y `personasPorTipo`.

## Definición del dashboard

El tablero usa ahora dos conceptos distintos:

- `registrosHoy`: número de filas registradas para la fecha consultada.
- `personasHoy`: número de personas representadas por esos registros.

Para el resumen por tipo:

- `discipulado` cuenta miembros individuales.
- `pueblo` suma la columna `cantidad`.

La definición evita interpretar un registro de Pueblo como si fuera una sola persona cuando en
realidad puede representar varias.

## Verificación realizada

- Revisión de los nuevos módulos bajo `public/js/features/`.
- Revisión del contrato de resumen del dashboard en el backend.
- Actualización de la documentación de arquitectura y del contrato HTTP.
- Actualización de la colección Postman para reflejar las nuevas métricas.

## Salida de fase

La siguiente fase puede concentrarse en responsividad y accesibilidad sin volver a tocar la
separación lógica de los módulos.
