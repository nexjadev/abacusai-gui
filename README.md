# ChatLLM GUI

## 🐳 Comandos Docker

### Crear una red
```bash
docker network create mi-red
```

### Construir y Publicar la Imagen
```powershell
$registryUrl = "4acc-2803-a3e0-1593-aa0-1cdc-5bea-abaa-378e.ngrok-free.app/repository/my-docker-hosted"
docker stop contenedor-gui; docker rm contenedor-gui;
docker build -t img-chatllm-gui .
docker tag img-chatllm-gui $registryUrl/img-chatllm-gui:v4.1
# docker run -d -p 8080:80 --name contenedor-gui --network mi_red img-chatllm-gui
docker push $registryUrl/img-chatllm-gui:v4.1
```

### Desplegar en el Servidor
```bash
#!/bin/bash
registry_url="4acc-2803-a3e0-1593-aa0-1cdc-5bea-abaa-378e.ngrok-free.app/repository/my-docker-hosted"
docker login "4acc-2803-a3e0-1593-aa0-1cdc-5bea-abaa-378e.ngrok-free.app"
docker stop contenedor-gui; docker rm contenedor-gui
docker pull "$registry_url/img-chatllm-gui:v4.1"
docker tag "$registry_url/img-chatllm-gui:v4.1" img-chatllm-gui:v4.1
docker run -d -p 8080:80 --name contenedor-gui --network mi_red img-chatllm-gui:v4.1
docker logout
```

### Comandos de Mantenimiento
```bash
# Ver logs del contenedor
docker logs contenedor-gui

# Acceder al shell del contenedor
docker exec -it contenedor-gui bash
```
