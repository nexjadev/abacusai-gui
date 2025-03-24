# AbacusAI GUI

## 🐳 Comandos Docker

### Construir y Publicar la Imagen
```bash
# Construir la imagen
docker build -t multimindai-gui:v1.4 .

# Etiquetar la imagen
docker tag multimindai-gui:v1.4 javiervq/multimindaigui:v1.4

# Publicar la imagen en Docker Hub
docker push javiervq/multimindaigui:v1.4
```

### Desplegar en el Servidor
```bash
# Obtener la última versión de la imagen
docker pull javiervq/multimindaigui:v1.4

# Detener y eliminar el contenedor existente
docker stop contenedor-gui
docker rm contenedor-gui

# Ejecutar el nuevo contenedor
docker run -d \
  -p 80:80 \
  -p 443:443 \
  --name contenedor-gui \
  --network mi_red \
  -v /etc/letsencrypt:/etc/letsencrypt:ro \
  javiervq/multimindaigui:v1.4
```

### Comandos de Mantenimiento
```bash
# Eliminar una imagen
docker rmi javiervq/multimindaigui:v1.4

# Ver logs del contenedor
docker logs contenedor-gui

# Acceder al shell del contenedor
docker exec -it contenedor-gui bash
```
docker login -u javiervq
