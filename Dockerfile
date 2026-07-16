# Dockerfile para Gestión de Asistencia
# Etapa 1: Build (no necesitamos build step)
# Etapa 2: Servidor Node.js

FROM node:20-alpine

WORKDIR /app

# Copiar dependencias
COPY server/package.json server/package-lock.json* ./
RUN npm install

# Copiar código del servidor
COPY server/ .

# Copiar frontend estático
COPY public/ ../public/

EXPOSE 3000

CMD ["node", "index.js"]
