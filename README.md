# AbacusAI GUI

## 🐳 Comandos Docker

### Crear una red
```bash
docker network create mi-red
```

### Construir y Publicar la Imagen
```powershell
$registryUrl = "localhost:8082/repository/my-docker-hosted"
docker stop contenedor-gui; docker rm contenedor-gui;
docker build -t img-abacusai-gui .
docker tag img-abacusai-gui $registryUrl/img-abacusai-gui:v2.1
# docker run -d -p 8080:80 --name contenedor-gui --network mi_red img-abacusai-gui
docker push $registryUrl/img-abacusai-gui:v2.1
```

### Desplegar en el Servidor
```bash
#!/bin/bash
registry_url="2d3e-2803-a3e0-1592-ed50-5843-57bf-5927-69fc.ngrok-free.app/repository/my-docker-hosted"
# docker login "2d3e-2803-a3e0-1592-ed50-5843-57bf-5927-69fc.ngrok-free.app"
docker stop contenedor-gui; docker rm contenedor-gui
docker pull "$registry_url/img-abacusai-gui:v2.1"
docker tag "$registry_url/img-abacusai-gui:v2.1" img-abacusai-gui:v2.1
docker run -d -p 8080:80 --name contenedor-gui --network mi_red img-abacusai-gui:v2.1
```

### Comandos de Mantenimiento
```bash
# Ver logs del contenedor
docker logs contenedor-gui

# Acceder al shell del contenedor
docker exec -it contenedor-gui bash
```
