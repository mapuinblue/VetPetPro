# 🚀 Guía de Despliegue - VetPetPro en Producción

Esta guía cubre todas las opciones para desplegar VetPetPro en producción.

## 📋 Pre-requisitos

- Dominio propio (ej: vetpetpro.com)
- Servidor o plataforma de hosting
- Certificado SSL (Let's Encrypt es gratis)
- Variables de entorno configuradas

## 🎯 Checklist de Seguridad

Antes de desplegar, asegúrate de:

- [ ] Cambiar `JWT_SECRET` a valor fuerte aleatorio
- [ ] Configurar `NODE_ENV=production`
- [ ] Usar email real (SendGrid, Mailgun, AWS SES)
- [ ] HTTPS/SSL activo
- [ ] CORS configurado correctamente
- [ ] Rate limiting implementado
- [ ] Backups automáticos
- [ ] Logs de error configurados

## 🌍 Opción 1: Netlify + Railway (Recomendado para Principiantes)

### Ventajas
- ✅ Gratis para empezar
- ✅ Fácil de configurar
- ✅ Escalable automáticamente
- ✅ Actualizaciones sin downtime

### Paso 1: Preparar Frontend para Netlify

```bash
npm run build --workspace frontend
```

### Paso 2: Subir a Netlify

1. Ve a https://netlify.com
2. Conecta tu repositorio GitHub
3. Configura build:
   - Build command: `npm run build --workspace frontend`
   - Publish directory: `frontend/dist`

### Paso 3: Desplegar Backend en Railway

1. Ve a https://railway.app
2. Crea nuevo proyecto
3. Conecta tu repo GitHub
4. Agrega variables de entorno:

```
NODE_ENV=production
JWT_SECRET=tu-clave-super-secreta-aleatoria-aqui-XXXX
CORS_ORIGIN=https://tudominio.netlify.app
DB_PATH=/data/vetpetpro.db
```

5. Railway automáticamente detectará Node.js y iniciará el servidor

### Paso 4: Conectar Frontend con Backend

En Netlify, agrega variable de entorno:
```
VITE_API_URL=https://tu-railway-app.up.railway.app/api
```

## 🖥️ Opción 2: VPS Linux (DigitalOcean/Linode/AWS)

### Pasos de Instalación

```bash
# 1. SSH en tu servidor
ssh usuario@tu-servidor.com

# 2. Actualizar sistema
sudo apt update && sudo apt upgrade -y

# 3. Instalar Node.js
curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs npm -y

# 4. Instalar PM2 (mantiene app activa)
sudo npm install -g pm2

# 5. Instalar Nginx (reverse proxy)
sudo apt install nginx -y

# 6. Clonar proyecto
cd /home/usuario
git clone https://github.com/tu-usuario/vetpetpro.git
cd vetpetpro

# 7. Instalar dependencias
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 8. Inicializar BD
npm run setup-db --workspace backend
npm run seed --workspace backend

# 9. Build frontend
npm run build --workspace frontend
```

### Configurar Variables de Entorno

```bash
# backend/.env
cat > backend/.env << EOF
PORT=3100
NODE_ENV=production
JWT_SECRET=$(openssl rand -base64 32)
DB_PATH=/home/usuario/vetpetpro/data/vetpetpro.db
CORS_ORIGIN=https://tudominio.com
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=tu-api-key-de-sendgrid
EMAIL_FROM=noreply@tudominio.com
FRONTEND_URL=https://tudominio.com
EOF
```

### Iniciar Aplicación con PM2

```bash
# Iniciar backend
pm2 start "npm start --workspace backend" --name "vetpetpro-api"

# Build de frontend con servidor estático
pm2 start "python3 -m http.server 3000 --directory /home/usuario/vetpetpro/frontend/dist" --name "vetpetpro-web"

# Guardar configuración
pm2 save

# Configurar para iniciar en boot
pm2 startup
pm2 save
```

### Configurar Nginx como Reverse Proxy

```bash
# Crear configuración Nginx
sudo nano /etc/nginx/sites-available/vetpetpro
```

Pegar esto:

```nginx
upstream backend {
    server localhost:3100;
}

upstream frontend {
    server localhost:3000;
}

server {
    listen 80;
    server_name tudominio.com www.tudominio.com;
    
    # Redirigir HTTP a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tudominio.com www.tudominio.com;

    # SSL (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tudominio.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API Backend
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Habilitar sitio:
```bash
sudo ln -s /etc/nginx/sites-available/vetpetpro /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuración
sudo systemctl restart nginx
```

### Instalar SSL con Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
```

### Monitorar Aplicación

```bash
# Ver estado
pm2 status

# Ver logs en tiempo real
pm2 logs vetpetpro-api

# Reiniciar aplicación
pm2 restart vetpetpro-api

# Ver recursos
pm2 monit
```

## 🐳 Opción 3: Docker (Recomendado para Equipos)

### Crear `Dockerfile` Backend

```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Instalar dependencias del sistema
RUN apk add --no-cache sqlite

# Copiar package.json
COPY backend/package*.json ./

# Instalar dependencias
RUN npm install --production

# Copiar código
COPY backend . .

# Crear directorio de datos
RUN mkdir -p data

EXPOSE 3100

CMD ["npm", "start"]
```

### Crear `Dockerfile` Frontend

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Crear `nginx.conf`

```nginx
server {
    listen 80;
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }
    location /api/ {
        proxy_pass http://backend:3100;
    }
}
```

### Crear `docker-compose.yml`

```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    container_name: vetpetpro-api
    environment:
      NODE_ENV: production
      PORT: 3100
      JWT_SECRET: ${JWT_SECRET}
      DB_PATH: /data/vetpetpro.db
      CORS_ORIGIN: ${CORS_ORIGIN}
      SENDGRID_API_KEY: ${SENDGRID_API_KEY}
    ports:
      - "3100:3100"
    volumes:
      - ./data:/data
    restart: unless-stopped

  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
    container_name: vetpetpro-web
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: vetpetpro-nginx
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - /etc/letsencrypt:/etc/letsencrypt
    depends_on:
      - backend
      - frontend
    restart: unless-stopped
```

### Ejecutar Docker

```bash
# Crear archivo .env
cat > .env << EOF
JWT_SECRET=$(openssl rand -base64 32)
CORS_ORIGIN=https://tudominio.com
SENDGRID_API_KEY=tu-api-key
EOF

# Iniciar contenedores
docker-compose up -d

# Ver logs
docker-compose logs -f backend

# Parar contenedores
docker-compose down
```

## 📧 Configurar Email Real (SendGrid)

### 1. Registrarse en SendGrid

Ve a https://sendgrid.com (gratis hasta 100 emails/día)

### 2. Obtener API Key

- Dashboard → Settings → API Keys
- Copiar la clave

### 3. Configurar Backend

```bash
# backend/.env
SENDGRID_API_KEY=SG.xxxxxxxxxxx
EMAIL_SERVICE=sendgrid
EMAIL_FROM=noreply@tudominio.com
```

### 4. Actualizar Código Email

Editar `backend/src/utils/email.js`:

```javascript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendEmail = async (to, subject, html) => {
  try {
    const msg = {
      to,
      from: process.env.EMAIL_FROM,
      subject,
      html
    };
    await sgMail.send(msg);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};
```

## 🔄 Configurar Backups Automáticos

### En VPS Linux

```bash
# Crear script de backup
cat > /home/usuario/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/usuario/backups"
mkdir -p $BACKUP_DIR
sqlite3 /home/usuario/vetpetpro/data/vetpetpro.db ".backup $BACKUP_DIR/vetpetpro_$(date +%Y%m%d_%H%M%S).db"
echo "Backup completado"
EOF

chmod +x /home/usuario/backup.sh

# Programar con cron (diario a las 2:00 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /home/usuario/backup.sh") | crontab -
```

### Enviar Backups a S3/Dropbox

```bash
# Instalar AWS CLI
sudo apt install awscli -y

# Configurar AWS
aws configure

# Script de backup a S3
cat > /home/usuario/backup-s3.sh << 'EOF'
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
sqlite3 /home/usuario/vetpetpro/data/vetpetpro.db ".backup /tmp/vetpetpro_$TIMESTAMP.db"
aws s3 cp /tmp/vetpetpro_$TIMESTAMP.db s3://tu-bucket-backups/
rm /tmp/vetpetpro_$TIMESTAMP.db
EOF

chmod +x /home/usuario/backup-s3.sh
```

## 📊 Monitoreo y Logs

### Configurar Sentry para Error Tracking

```bash
npm install --save @sentry/node @sentry/tracing
```

En `backend/server.js`:

```javascript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

## 🔒 Firewall y Seguridad

### Configurar Firewall en VPS

```bash
# Habilitar UFW
sudo ufw enable

# Permitir puertos
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS
sudo ufw allow 3100/tcp   # Backend (solo local)

# Ver estado
sudo ufw status
```

## 📞 Soporte y Troubleshooting

### Aplicación no inicia

```bash
pm2 logs vetpetpro-api --lines 100
```

### Database locked

```bash
# Reiniciar aplicación
pm2 restart vetpetpro-api
```

### CORS errors

Verifica que `CORS_ORIGIN` en `backend/.env` coincide con tu dominio:
```
CORS_ORIGIN=https://tudominio.com
```

### Email no envía

Verifica configuración de SendGrid:
- API Key correcta
- Dominio de "from" verificado en SendGrid

---

**¿Necesitas ayuda? Crea un issue en GitHub o contacta a info@vetpetpro.com** 📞
