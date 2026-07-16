# Imagen base ligera de Node.js para la API y la SPA estática.
FROM node:20-alpine

# Trabaja desde la carpeta del servidor para ejecutar el arranque real sin trucos de rutas.
WORKDIR /app/server

# Instala la toolchain mínima para compilar dependencias nativas en Alpine.
RUN apk add --no-cache python3 make g++

# Copia el manifiesto antes del resto del código para aprovechar la cache de Docker.
COPY --chown=node:node server/package.json server/package-lock.json* ./

# Instala solo dependencias de producción con un árbol reproducible.
RUN npm ci --omit=dev

# Copia el código del servidor una vez resueltas las dependencias.
COPY --chown=node:node server/ ./

# Vuelve a la raíz de la aplicación para servir estáticos y datos compartidos.
WORKDIR /app

# Copia el frontend estático al volumen de aplicación que usa Express.
COPY --chown=node:node public/ ./public/

# Prepara el directorio de datos persistentes para la base SQLite.
RUN mkdir -p /app/data && chown -R node:node /app

# Ejecuta la aplicación con un usuario no privilegiado.
USER node

# Expone el puerto HTTP de la API y del frontend estático.
EXPOSE 3000

# Valida salud interna sin depender de herramientas externas del sistema.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:3000/healthz').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Inicia el servidor desde la ubicación real del archivo de entrada.
CMD ["node", "server/index.js"]
