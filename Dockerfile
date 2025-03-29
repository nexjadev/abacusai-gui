# Etapa de construcción
FROM node:18-alpine as build-stage

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar los archivos de dependencias
COPY package*.json ./

# Instalar dependencias con la bandera --force para asegurar la instalación correcta de rollup
RUN npm install --force
RUN npm install @rollup/rollup-linux-x64-musl --force

# Copiar el resto de los archivos del proyecto
COPY . .

# Compilar la aplicación
RUN npm run build

# Etapa de producción
FROM nginx:stable-alpine as production-stage

# Copiar la configuración personalizada de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los archivos compilados desde la etapa de construcción
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Exponer el puerto 80
EXPOSE 80

# Iniciar nginx
CMD ["nginx", "-g", "daemon off;"]
