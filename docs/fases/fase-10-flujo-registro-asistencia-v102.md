# Fase 10: Flujo de registro de asistencia v1.0.2

## Objetivo

Reducir fricción y errores en el registro de asistencia autenticado, sin abrir la administración
de catálogos ni alterar los contratos existentes.

## Contexto

La versión actual ya tiene backend modular, documentación, pruebas y operación estable. La
siguiente mejora se concentra en la experiencia de captura: menos pasos, más contexto visible y
mejor prevención de errores antes de enviar una solicitud.

## Mejoras propuestas

### 1. Flujo guiado por pasos

- Paso 1: elegir módulo.
- Paso 2: elegir grupo o categoría.
- Paso 3: capturar fecha y datos de asistencia.
- Paso 4: revisar confirmación.
- Paso 5: guardar.

### 2. Contexto persistente

- Recordar el último grupo o categoría usada.
- Mantener la fecha del día por defecto.
- Sugerir el tipo de registro más frecuente por módulo.

### 3. Confirmación previa al guardado

- Mostrar un resumen antes de enviar.
- Resaltar campos sensibles como cantidad, estado y fecha.
- Permitir corregir antes de confirmar.

### 4. Validación temprana

- Validar cantidad, fechas y campos obligatorios en pantalla.
- Mostrar errores antes del envío al backend.
- Evitar llamadas innecesarias cuando el formulario ya es inválido.

### 5. Captura continua

- Mantener el contexto luego de guardar.
- Permitir registrar otro elemento sin regresar al inicio.
- Reducir interrupciones en sesiones largas de captura.

### 6. Historial reciente

- Mostrar los últimos registros del mismo contexto.
- Ayudar a detectar duplicados o patrones anómalos.
- Dar visibilidad inmediata al resultado de la captura.

## Casos de uso que cubre esta fase

- Registrar asistencia de Discipulado con menos pasos.
- Registrar asistencia de Pueblo con menos clics.
- Confirmar antes de guardar.
- Detectar error de captura antes del envío.
- Repetir registros en modo continuo.

## Fuera de alcance

- Abrir registros sin sesión.
- Crear o editar categorías, grupos o miembros desde el flujo nuevo.
- Cambiar la estructura principal de la base de datos.
- Introducir nuevos endpoints públicos.

## Riesgo técnico

La mejora debe respetar la arquitectura actual: el backend sigue protegido por JWT y el cambio
debe concentrarse principalmente en la UI y en ajustes menores de contrato si fueran necesarios.

## Criterio para subir versión

Si la implementación mantiene compatibilidad con API y base de datos, corresponde una versión
de parche dentro de `1.0.x`.

- `1.0.1` o `1.0.2`: mejoras de flujo, UX, validación o documentación.
- `1.1.0`: cambios que agregan comportamiento visible nuevo sin romper compatibilidad.
- `2.0.0`: cambios incompatibles en contratos, estructura de datos o navegación principal.
