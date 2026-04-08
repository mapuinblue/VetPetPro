# 🐕 VetPetPro - Sistema de Agendamiento Veterinario Canino

**App de escritorio para agendamiento y gestión de servicios en clínicas veterinarias caninas - Completamente funcional y listo para producción.**

Aplicación de escritorio que permite a dueños de mascotas acceder, agendar y gestionar servicios veterinarios, y a las clínicas administrar su operación de manera ágil y centralizada.

## ✨ Características Principales

### 👥 Para Dueños de Mascotas
- ✅ Registro y gestión de múltiples mascotas
- ✅ Búsqueda y filtrado de clínicas y servicios
- ✅ Agendamiento online con disponibilidad en tiempo real
- ✅ Historial clínico completo por mascota
- ✅ Cancelación de citas (mínimo 24h antes)
- ✅ Recordatorios automáticos por email
- ✅ Panel de control personalizado
- ✅ Interfaz profesional y fácil de usar

### 🏥 Para Clínicas Veterinarias
- ✅ Panel administrativo centralizado
- ✅ Gestión de servicios (CRUD completo)
- ✅ Gestión de disponibilidad por profesional
- ✅ Calendario de citas del día
- ✅ Reportes: citas, ingresos, servicios más demandados
- ✅ Estadísticas en tiempo real
- ✅ Notificaciones de nuevas citas

## 🎯 Servicios Disponibles

| Categoría | Servicios |
|-----------|-----------|
| 🏥 **Salud** | Vacunación, desparasitación, radiología, ecografía, laboratorio, esterilización |
| ✨ **Estética** | Peluquería, baño, corte de uñas, limpieza bucal, masajes |
| 🥗 **Nutrición** | Consulta nutricional, planes dietéticos, talleres |
| 🏠 **Guardería** | Pasa día, hotel noche, fin de semana |
| 🪦 **Funeraria** | Servicios funerarios (estructura lista) |

## 🚀 Instalación y Ejecución

### Opción 1: Descargar App Instalable (Recomendado)

#### Para Windows 10/11
1. Ve a la [sección de Releases](https://github.com/mapuinblue/vetpetpro/releases)
2. Descarga `VetPetPro-Setup.exe` (instalador) o `VetPetPro.exe` (portable)
3. Ejecuta el archivo
4. Sigue las instrucciones del instalador
5. ¡Listo! La app abra automáticamente

#### Para macOS
1. Ve a la [sección de Releases](https://github.com/tuusuario/vetpetpro/releases)
2. Descarga `VetPetPro.dmg`
3. Abre el archivo `.dmg`
4. Arrastra VetPetPro a la carpeta Aplicaciones
5. Ejecuta desde Aplicaciones

#### Para Linux
1. Ve a la [sección de Releases](https://github.com/tuusuario/vetpetpro/releases)
2. Descarga `VetPetPro.AppImage` (más fácil) o `VetPetPro.deb`
   - **AppImage:** Dale permisos de ejecución y ejecuta
   - **DEB:** Ejecuta `sudo apt install ./VetPetPro.deb`

---

### Opción 2: Ejecutar desde Código Fuente

Si prefieres compilar y ejecutar desde el código:

#### Requisitos
- **Node.js** v18+ ([Descargar](https://nodejs.org))
- **npm** v9+
- Windows 10/11, macOS o Linux
- **Git** (opcional, para clonar)

#### Paso 1: Clonar o Descargar Proyecto

```bash
# Opción A: Clonar si tienes Git
git clone https://github.com/tuusuario/vetpetpro.git
cd VetPetPro

# Opción B: O descarga el ZIP y extrae
```

#### Paso 2: Instalar Dependencias

```bash
npm install
```

Esto instalará todas las dependencias del backend, frontend y Electron.

#### Paso 3: Inicializar Base de Datos (Primera vez sólo)

```bash
npm run setup-db
npm run seed
```

Esto crea:
- ✅ Base de datos SQLite (`data/vetpetpro.db`)
- ✅ Tablas del sistema
- ✅ Datos de prueba (2 clínicas, 15 servicios, 2 usuarios)

#### Paso 4: Ejecutar la App

**Opción A - Automático (Recomendado)**
```bash
npm start
```

Esto automáticamente:
1. ✅ Inicia el backend (puerto 3100)
2. ✅ Inicia el frontend (puerto 3001)
3. ✅ Abre la ventana de escritorio após 5 segundos

**Opción B - Manual (Desarrollo avanzado)**

Terminal 1 - Backend:
```bash
npm run dev:backend
```

Terminal 2 - Frontend:
```bash
npm run dev:frontend
```

Terminal 3 - Electron:
```bash
npm run electron
```

#### Paso 5: ¡Listo!

La app abrirá automáticamente. Ahora puedes:

**Credenciales de Prueba:**

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Dueño | `dueño@example.com` | `password123` |
| Clínica | `clinic@example.com` | `password123` |

O registrate como nuevo usuario.

---

### Compilar tu Propia Versión Instalable

Si hiciste cambios y quieres crear un instalable:

```bash
npm run build:electron
```

Esto genera en la carpeta `dist/`:
- **Windows:** `VetPetPro-Setup.exe` y `VetPetPro.exe`
- **macOS:** `VetPetPro.dmg`
- **Linux:** `VetPetPro.AppImage` y `.deb`

## 📁 Estructura del Proyecto

```
VetPetPro/
├── electron/
│   ├── main.js               ← Ventana de la app
│   └── preload.js            ← Seguridad
├── backend/
│   ├── src/
│   │   ├── controllers/      ← Lógica de negocio
│   │   ├── routes/           ← Endpoints API
│   │   ├── middleware/       ← Autenticación
│   │   ├── utils/            ← Email, JWT, validación
│   │   └── config/           ← Base de datos
│   ├── data/vetpetpro.db     ← SQLite
│   ├── server.js
│   ├── setup-db.js           ← Inicializador BD
│   └── seed.js               ← Datos de prueba
├── frontend/
│   ├── src/
│   │   ├── pages/            ← Pantallas
│   │   ├── components/       ← Componentes React
│   │   ├── services/         ← API client
│   │   ├── hooks/            ← Custom hooks
│   │   └── styles/           ← CSS global
│   └── vite.config.js
├── package.json              ← Scripts principales
├── start-app.js              ← Inicializador
├── QUICKSTART.md             ← Guía rápida
├── DEPLOYMENT.md             ← Guía de despliegue
└── README.md                 ← Este archivo
```

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
npm start                    # Inicia toda la app (backend + frontend + electron)
npm run dev:backend         # Solo backend
npm run dev:frontend        # Solo frontend
npm run electron            # Solo electron (si están corriendo backend/frontend)

# Compilación
npm run build:all           # Compila backend y frontend
npm run build:electron      # Crea instalables (NPM start)

# Base de datos
npm run setup-db            # Crea esquema de BD
npm run seed                # Carga datos de prueba
```

## 🎨 Integrando el Logo

Para usar el logo personalizado en la app:

### 1. Guardar el Logo en Assets

Copia el archivo de logo `icon.png` a:
```
c:\Users\USUARIO\Documents\VetPetPro\assets\icon.png
```

El logo será usado automáticamente como:
- ✅ Icono de la ventana Electron
- ✅ Logo en la barra de navegación
- ✅ Icono en el instalador de Windows/Mac

### 2. Guardar Logo en Frontend (Opcional)

Si deseas mostrar el logo en la web también:

Copia el logo a:
```
c:\Users\USUARIO\Documents\VetPetPro\frontend\public\vetpetpro-logo.png
```

### 3. Actualizar Compilación

Cuando compiles la app instalable, el logo se incluye automáticamente:

```bash
npm run build:electron
```

**Formatos soportados:**
- `icon.png` - Recomendado (multiplataforma)
- `icon.ico` - Para Windows
- `icon.icns` - Para macOS

## 📈 Roadmap Futuro

- [ ] Integración de pagos online
- [ ] Notificaciones por WhatsApp
- [ ] Mobile app nativa
- [ ] Teleconsultas de video
- [ ] Integración con laboratorios
- [ ] Sistema de subscripción para clínicas
- [ ] Analytics avanzados
- [ ] Sincronización en la nube

## 🐛 Solución de Problemas

### "Port 3100 already in use"
```bash
# Windows
taskkill /PID <PID> /F

# macOS/Linux
kill -9 <PID>
```

### "Cannot find module"
```bash
npm install
```

### "Database error"
```bash
npm run setup-db
npm run seed
```

## 👥 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crear rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo licencia MIT - Ver archivo LICENSE para detalles.

## 📞 Contacto

- Email: mapuinblue@gmail.com
- Teléfono: +57 318 6269284

## 🙏 Agradecimientos

- **Electron** - Framework para apps de escritorio
- **React** - Framework de UI
- **Express.js** - Framework backend
- **SQLite** - Base de datos
- **Vite** - Build tool
- **Electron Builder** - Empaquetador

---

**Última actualización:** Abril 2026
**Versión:** 1.0.0
**Plataformas:** Windows, macOS, Linux
