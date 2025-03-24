# AbacusAI GUI

## 🐳 Comandos Docker

### Construir y Publicar la Imagen
```bash
# Compilar en modo prod
npm run build

# Construir la imagen
docker build -t multimindai-gui:v1.7 .

# Etiquetar la imagen
docker tag multimindai-gui:v1.7 javiervq/multimindaigui:v1.7

# Publicar la imagen en Docker Hub
docker push javiervq/multimindaigui:v1.7
```

### Desplegar en el Servidor
```bash
# Obtener la última versión de la imagen
docker pull javiervq/multimindaigui:v1.7

# Detener y eliminar el contenedor existente
docker stop contenedor-gui
docker rm contenedor-gui

# Ejecutar el nuevo contenedorF
docker run -d \
  -p 80:80 \
  -p 443:443 \
  --name contenedor-gui \
  --network mi_red \
  -v /etc/letsencrypt:/etc/letsencrypt:ro \
  javiervq/multimindaigui:v1.7
```

### Comandos de Mantenimiento
```bash
# Eliminar una imagen
docker rmi javiervq/multimindaigui:v1.7

# Ver logs del contenedor
docker logs contenedor-gui

# Acceder al shell del contenedor
docker exec -it contenedor-gui bash
```
