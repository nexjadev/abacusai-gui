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
docker tag img-abacusai-gui $registryUrl/img-abacusai-gui:v1.10
# docker run -d -p 8080:80 --name contenedor-gui --network mi_red img-abacusai-gui
docker push $registryUrl/img-abacusai-gui:v1.10
```

### Desplegar en el Servidor
```bash
#!/bin/bash
registry_url="7306-2803-a3e0-1592-ed50-99be-26e-fb5a-335b.ngrok-free.app/repository/my-docker-hosted"
docker stop contenedor-gui; docker rm contenedor-gui
docker pull "$registry_url/img-abacusai-gui:v1.10"
docker tag "$registry_url/img-abacusai-gui:v1.10" img-abacusai-gui:v1.10
docker run -d -p 8080:80 --name contenedor-gui --network mi_red img-abacusai-gui:v1.10
```

### Comandos de Mantenimiento
```bash
# Ver logs del contenedor
docker logs contenedor-gui

# Acceder al shell del contenedor
docker exec -it contenedor-gui bash
```
