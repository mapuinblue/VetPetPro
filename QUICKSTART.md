# 🚀 Guía Rápida de Inicio - VetPetPro

## Instalación Rápida (3 pasos)

### Paso 1: Instalar Dependencias y Setup

Desde la raíz del proyecto (`c:\Users\USUARIO\Documents\VetPetPro`):

```powershell
npm run setup
```

Este comando:
- ✅ Instala todas las dependencias (backend + frontend)
- ✅ Inicializa la base de datos SQLite
- ✅ Prepara todo para correr

### Paso 2: Abre PRIMERA Terminal (Backend)

```powershell
npm run dev:backend
```

Deberías ver:
```
╔════════════════════════════════════════╗
║     VetPetPro API Server Running      ║
╠════════════════════════════════════════╣
║ Server: http://localhost:3000
║ Environment: development
║ CORS Origin: http://localhost:3001
╚════════════════════════════════════════╝
```

### Paso 3: Abre SEGUNDA Terminal (Frontend)

En otra terminal PowerShell:

```powershell
npm run dev:frontend
```

Deberías ver:
```
VITE v4.3.9  ready in 234 ms

➜  Local:   http://localhost:3001/
➜  press h to show help
```

## 🌐 Acceda a la Aplicación

Abre tu navegador y ve a:
```
http://localhost:3001
```

## 🔧 Comandos Útiles

```powershell
# Instalar todo de nuevo (si algo falla)
npm install

# Solo backend
npm run dev:backend

# Solo frontend
npm run dev:frontend

# Ambos en paralelo (si tu terminal lo soporta)
npm run dev

# Reinicializar base de datos
npm run setup-db --workspace backend
```

## 📋 Funcionalidades de Prueba

### Como Dueño de Mascota:
1. Regístrate en `/register` (Tipo: Dueño de Mascota)
2. Ve a "Mis Mascotas" y registra tu primer perro
3. Ve a "Servicios" para ver clínicas disponibles
4. Intenta agendar una cita

### Como Clínica:
1. Regístrate en `/register` (Tipo: Clínica Veterinaria)
2. Ve a "Panel de Control"
3. Crea servicios en "Gestionar Servicios"
4. Ve citas en "Gestionar Citas"

## ⚠️ Solución de Problemas

### Puerto 3000 o 3001 ya en uso

**Windows PowerShell:**
```powershell
# Ver qué está usando el puerto
netstat -ano | findstr :3000

# Matar el proceso (reemplaza PID con el número)
taskkill /PID <PID> /F

# Ejemplo:
taskkill /PID 1234 /F
```

### "npm: The term 'npm' is not recognized"

Instala Node.js desde https://nodejs.org

### Error de base de datos

```powershell
cd backend
npm run setup-db
cd ..
```

### Error CORS

Verifica que el frontend está en `http://localhost:3001` exactamente

## 📊 Estructura de la Aplicación

```
VetPetPro/
├── backend/          ← API REST (Node.js/Express)
│   └── data/         ← Base de datos SQLite
├── frontend/         ← React/Vite
└── README.md         ← Documentación completa
```

## 🎨 Personalización

### Cambiar Puerto del Backend
Edita `backend/.env`:
```
PORT=3001
```

### Cambiar Puerto del Frontend
Edita `frontend/vite.config.js`:
```js
server: {
  port: 3002,
  ...
}
```

## 📧 Email de Prueba

El sistema está configurado con Ethereal Email para desarrollo.

Cuando se envíe un email, verás en la terminal del backend:
```
Email sent: Message sent <xyz@ethereal.email>
```

Para ver los emails, ve a: https://ethereal.email

## 🔐 Seguridad

**⚠️ Para Producción:**
- Cambia `JWT_SECRET` en `backend/.env`
- Configura un proveedor de email real
- Cambia `NODE_ENV` a `production`
- Configura HTTPS

## 📱 Responsive Design

La aplicación funciona en:
- ✅ Desktop (1200px+)
- ✅ Tablet (768px-1199px)
- ✅ Mobile (< 768px)

## 🐛 Reportar Problemas

Si encuentras un error:
1. Verifica que ambos servidores están corriendo
2. Abre la consola del navegador (F12)
3. Revisa los logs en ambas terminales

## ✨ Siguientes Pasos

1. Personaliza colores en `frontend/src/styles/index.css`
2. Agrega tu logo en `frontend/src/components/Header.jsx`
3. Configura clínicas en la aplicación
4. Crea servicios veterinarios
5. Invita usuarios

## 📞 Soporte

- Email: info@vetpetpro.com
- Documentación: Revisa `README.md`

---

¡Listo! 🎉 Tu sistema VetPetPro está ejecutándose.
