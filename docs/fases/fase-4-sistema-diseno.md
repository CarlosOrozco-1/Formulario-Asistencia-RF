# Fase 4: Fundamentos del Sistema de Diseño

## Estado

- **Resultado:** completada
- **Commit funcional:** `3acb8b6`
- **Fecha de cierre:** 16 de julio de 2026
- **Dependencia:** Fase 3 completada

## Objetivo

Establecer una base visual coherente y accesible antes de migrar los módulos funcionales. Esta
fase debía eliminar la necesidad de inventar estilos para cada control nuevo, sin mezclar todavía
el rediseño completo del dashboard, discipulado, Pueblo y usuarios.

## Situación anterior

- Las pantallas repetían cadenas extensas de clases para controles equivalentes.
- Botones, campos, cargas y errores tenían variantes definidas dentro de cada componente.
- La interfaz alternaba entre “Iglesia Restauración Familiar” y “Monte Carmelo”.
- Los colores se elegían directamente en las vistas sin una semántica documentada.
- `alert` y `confirm` no contaban con sustitutos propios accesibles.
- No existía un lugar donde revisar componentes y estados sin usar datos reales.

## Identidad visual

Se adoptó **Monte Carmelo** como nombre único porque coincide con la documentación principal y
las reglas del proyecto. La paleta distingue identidad y estados de negocio:

| Uso | Token principal | Valor |
|---|---|---|
| Marca y acción principal | `--color-brand-700` | `#1d4ed8` |
| Texto principal | `--color-ink` | `#0f172a` |
| Éxito | `--color-success` | `#15803d` |
| Advertencia | `--color-warning` | `#b45309` |
| Peligro | `--color-danger` | `#b91c1c` |
| Fondo general | `--color-canvas` | `#f8fafc` |

Los tokens completos viven en `public/styles.css`. Incluyen escalas de marca, superficies,
texto, bordes, tipografía, espaciado, radios, sombras y transiciones.

## Componentes implementados

### Controles y superficies

| Componente | Responsabilidad | Variantes principales |
|---|---|---|
| `Button` | Acciones y progreso | primary, secondary, danger, ghost |
| `Field` | Entrada con etiqueta y validación | normal, error, ayuda, disabled |
| `Select` | Selección accesible | normal, error, ayuda, disabled |
| `Card` | Agrupación de contenido | default, elevated, compact |
| `Badge` | Estado o categoría breve | neutral, info, success, warning, danger |

`Field` y `Select` generan identificadores estables y asocian etiqueta, ayuda y error mediante
`htmlFor`, `aria-describedby` y `aria-invalid`.

### Feedback

- `Alert` comunica información persistente, éxito, advertencia o error.
- `StatusState` representa carga, vacío y error con títulos y acciones recuperables.
- `Toast` anuncia notificaciones temporales mediante una región `aria-live`.
- Los estados globales de restauración de sesión usan `StatusState`.

### Confirmación

`ConfirmDialog` reemplaza la necesidad de crear nuevos usos de `confirm`. El componente:

- utiliza `role="alertdialog"` y nombres accesibles;
- mueve el foco a una acción al abrirse;
- mantiene el foco dentro de las acciones con Tab;
- permite cerrar con Escape o con el fondo cuando no está procesando;
- bloquea temporalmente el desplazamiento del documento;
- diferencia confirmaciones normales y destructivas.

Los usos antiguos de `alert` y `confirm` se migrarán al centralizar notificaciones y diálogos
durante las fases 5 y 6. La fase actual entrega el reemplazo común y evita ampliar la deuda.

## Pantallas migradas

### Login

- Utiliza `Card`, `Field`, `Alert` y `Button`.
- Presenta un único nombre institucional.
- Asocia credenciales con atributos de autocompletado.
- Mantiene el formulario y el error cuando la autenticación falla.
- Usa los tokens de marca sin agregar colores propios en la pantalla.

### Sesión global

La restauración y el fallo recuperable de sesión usan `StatusState` y `Button`. Esto evita que
los estados globales creen una segunda variante visual para las mismas acciones.

## Referencia visual

`public/design-system.html` sirve una página independiente en `/design-system.html`. Permite
revisar:

- colores semánticos;
- botones y estados deshabilitados o en progreso;
- campos, selector, ayuda y error;
- alertas, insignias y estado vacío;
- notificación temporal y diálogo destructivo.

La referencia no usa la API ni datos operativos. Su propósito es revisar variantes antes de
migrar una pantalla y prevenir estilos aislados.

## Organización de archivos

```text
public/
├── design-system.html
├── styles.css
└── js/
    ├── app/
    │   └── design-system.js
    └── components/
        ├── feedback/
        │   ├── alert.js
        │   ├── status-state.js
        │   └── toast.js
        └── ui/
            ├── badge.js
            ├── button.js
            ├── card.js
            ├── confirm-dialog.js
            └── field.js
```

## Verificaciones realizadas

- Análisis de JSX de todos los componentes y pantallas modificadas.
- Revisión de límites de línea y diferencias sin espacios defectuosos.
- Construcción de la imagen Docker con Node.js 20.
- Entrega HTTP de la SPA, hoja de estilos y página de referencia.
- Confirmación de que los endpoints y el backend no cambiaron.

## Riesgos y deuda restante

- Los módulos funcionales todavía utilizan cadenas locales de Tailwind; se migran en Fase 6.
- La navegación y los proveedores globales se centralizan en Fase 5.
- Los usos anteriores de `alert` y `confirm` se retirarán al migrar cada flujo.
- La auditoría completa de contraste, móvil y lectores de pantalla corresponde a Fase 7.
- React y Tailwind continúan cargándose desde CDN hasta evaluar el proceso de compilación.

## Criterios de aceptación alcanzados

- Los componentes comparten una API coherente de variantes y estados.
- Los controles tienen foco visible y operación por teclado.
- El login migrado usa tokens y componentes, sin colores propios.
- Existe una referencia visual interactiva para revisar todas las variantes requeridas.

## Restauración

El estado anterior a esta fase se encuentra en el commit `c22b8e2`. Para inspeccionarlo sin
alterar la rama actual puede usarse:

```bash
git show c22b8e2
```

No se recomienda revertir componentes aislados porque el login, la aplicación, los scripts y la
hoja de estilos comparten el mismo contrato visual.
