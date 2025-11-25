# ☁️ AWS Deployment - Despliegue en la Nube

Guía para despliegue en AWS EC2.

## Documentación Completa

Para la documentación completa de deployment en AWS, ver:
- **[API Deployment Guide](../api/deployment.md)** - Incluye sección completa de AWS EC2

Esta guía cubre:
- Creación de instancia EC2
- Configuración de Security Groups
- Upload de archivos
- Configuración de systemd service
- Monitoreo y mantenimiento

## Quick Reference

### Crear Instancia EC2
- AMI: Ubuntu 24.04 LTS
- Tipo: t2.small (2 vCPU, 2GB RAM)
- Storage: 20GB gp3

### Security Group
- SSH (22) desde tu IP
- Custom TCP (5000) desde 0.0.0.0/0

### Subir Archivos
```bash
scp -i llave.pem -r backend/api ubuntu@<IP>:~/Api-Helen
```

### Iniciar Servicio
```bash
sudo systemctl start helen-api
sudo systemctl status helen-api
```

Ver documentación completa en [API Deployment](../api/deployment.md#despliegue-en-aws-ec2).
