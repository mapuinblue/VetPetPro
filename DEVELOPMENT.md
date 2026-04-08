# GUÍA DE DESARROLLO - VetPetPro

> **Para desarrolladores que colaboran en el proyecto**

## 📋 Contenido Rápido

1. [Arquitectura General](#arquitectura-general)
2. [Estructura del Proyecto](#estructura-del-proyecto)
3. [Flujos Principales](#flujos-principales)
4. [Bases de Datos](#bases-de-datos)
5. [API Endpoints](#api-endpoints)
6. [Componentes Importantes](#componentes-importantes)
7. [Guía de Contribución](#guía-de-contribución)

---

## 🏗️ Arquitectura General

VetPetPro es una aplicación full-stack con:

- **Frontend**: React 18 + Vite (puerto 3001)
- **Backend**: Node.js + Express (puerto 3100)
- **Base de Datos**: SQLite3
- **Desktop**: Electron para aplicación de escritorio

### Flujo de Autenticación

```
Usuario → Login → JWT Token → localStorage
         ↓
    Cada request incluye token en header Authorization
         ↓
Backend verifica token → req.user contiene datos del usuario
```

---

## 📁 Estructura del Proyecto

```
VetPetPro/
├── backend/
│   ├── src/
│   │   ├── controllers/        # Lógica de negocio
│   │   ├── middleware/         # Auth, validación, errores
│   │   ├── routes/             # Definición de rutas
│   │   ├── config/             # DB, variables de entorno
│   │   └── utils/              # JWT, contraseñas, email
│   ├── server.js               # Configuración de Express
│   └── setup-db.js             # Inicializar esquema SQL
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── owner/         # Páginas para dueños
│   │   │   └── clinic/        # Páginas para clínicas
│   │   ├── components/         # Componentes reutilizables
│   │   ├── hooks/              # React hooks personalizados
│   │   ├── services/           # Llamadas a API
│   │   └── App.jsx             # Rutas principales
│   └── index.css               # Estilos Bootstrap
│
└── README.md                   # Este archivo
```

---

## 🔄 Flujos Principales

### 1️⃣ Registro de Usuario

**Descripción**: Crear nueva cuenta (dueño o clínica)

**Flujo**:
```
RegisterPage (frontend)
  ↓
POST /api/auth/register
  ↓
Backend valida email único
Backend hashea contraseña con bcrypt
Backend genera JWT token
  ↓
Frontend guarda token en localStorage
Frontend redirige a dashboard
```

**Archivo clave**: `backend/src/controllers/authController.js::registerUser`

---

### 2️⃣ Crear Servicio (Clínica)

**Descripción**: Una clínica crea un nuevo servicio (ej: Vacunación)

**Datos requeridos**:
- `name`: Nombre del servicio
- `description`: Descripción (opcional)
- `category`: Una de 5 categorías válidas
- `duration`: Duración en minutos (múltiplo de 15)
- `price`: Precio en pesos colombianos

**Categorías válidas**:
- `salud`: Servicios médicos (vacunas, consultas, etc.)
- `estética`: Grooming, baño, corte
- `nutrición`: Dieta y consultorías nutricionales
- `guardería`: Cuidado y entrenamiento
- `funeraria`: Cremación y entierro

**Flujo**:
```
ManageServices.jsx (frontend)
  ↓
POST /api/services
  ↓
Middleware: authenticate (validar token)
Middleware: authorize(['clinic']) (solo clínicas)
  ↓
Backend valida:
  - Campos requeridos ✓
  - Categoría en lista válida ✓
  - clinicId del token ✓
  ↓
INSERT INTO services table
  ↓
Frontend muestra confirmación
```

**Archivos clave**:
- Frontend: `frontend/src/pages/clinic/ManageServices.jsx`
- Backend: `backend/src/controllers/serviceController.js::createService`

---

### 3️⃣ Agendar Cita

**Descripción**: Dueño agenda cita para su mascota en una clínica

**Pasos**:
1. Seleccionar mascota
2. Seleccionar clínica y servicio
3. Elegir fecha y horario disponible
4. Confirmar cita

**Luego**:
- Backend genera slots disponibles basado en:
  - Horarios de clínica (availability table)
  - Duración del servicio
  - Citas ya agendadas
- Frontend muestra solo horarios disponibles

**Flujo de Slots**:
```
GET /api/availability/slots?clinicId=X&serviceId=Y&date=2025-04-10
  ↓
Backend calcula:
1. Horario clínica para ese día (ej: 09:00-17:00)
2. Duración del servicio (ej: 30 minutos)
3. Citas ya agendadas ese día
  ↓
Genera slots libre: ["09:00", "09:30", "10:00", ...]
```

**Archivos clave**:
- Frontend: `frontend/src/pages/owner/BookAppointment.jsx`
- Backend: `backend/src/controllers/availabilityController.js`

---

## 💾 Bases de Datos

### Tabla: `users`
```sql
id (TEXT, PK)
email (TEXT, UNIQUE)
password (TEXT, hasheada)
firstName, lastName
phone
role (owner|clinic|admin)
clinicId (FK a clinics, solo si role=clinic)
isActive (0/1)
createdAt, updatedAt
```

### Tabla: `services`
```sql
id (TEXT, PK)
clinicId (FK)
name, description
category (enum: salud|estética|nutrición|guardería|funeraria)
duration (INTEGER, múltiplo de 15)
price (REAL, en pesos colombianos)
isActive (0/1)
createdAt, updatedAt
```

### Tabla: `appointments`
```sql
id (TEXT, PK)
clinicId, petId, serviceId, ownerId (FK)
appointmentDate (DATE)
appointmentTime (TEXT, formato HH:MM)
status (programada|completada|cancelada|no_asistió)
notes, cancelReason
createdAt, updatedAt
```

### Tabla: `availability`
```sql
id (TEXT, PK)
clinicId (FK)
dayOfWeek (0-6, donde 0=domingo)
startTime (HH:MM, ej: "09:00")
endTime (HH:MM, ej: "17:00")
isActive (0/1)
createdAt, updatedAt
```

---

## 🔌 API Endpoints

### Autenticación
```
POST /api/auth/register      - Registrar usuari
POST /api/auth/login         - Iniciar sesión
GET  /api/auth/profile       - Datos del usuario autenticado
POST /api/auth/request-password-reset - Recuperar contraseña
```

### Servicios
```
GET  /api/services/clinic/:clinicId           - Servicios de una clínica
GET  /api/services/search/:clinicId?category= - Filtrar por categoría
GET  /api/services/:serviceId                 - Detalles de servicio
POST /api/services                            - Crear servicio [AUTH]
PUT  /api/services/:serviceId                 - Actualizar [AUTH]
DELETE /api/services/:serviceId               - Eliminar [AUTH]
```

### Disponibilidad
```
GET /api/availability/schedule/:clinicId           - Horarios de clínica
PUT /api/availability/schedule                     - Guardar horarios [AUTH]
GET /api/availability/slots?clinicId=X&serviceId=Y&date=Z - Slots libres
GET /api/availability/clinic/:clinicId/appointments - Citas del día [AUTH]
```

### Citas
```
GET  /api/appointments                        - Mis citas [AUTH]
GET  /api/appointments/:appointmentId         - Detalles de cita
GET  /api/appointments/clinic/:clinicId       - Citas de clínica [AUTH]
POST /api/appointments                        - Crear cita [AUTH]
DELETE /api/appointments/:appointmentId/cancel - Cancelar cita [AUTH]
PATCH /api/appointments/:appointmentId/status - Cambiar estado [AUTH]
```

---

## 🧩 Componentes Importantes

### Frontend

#### `useUser` Hook
```javascript
const { user, loading } = useUser();
// user: { id, email, firstName, lastName, role, clinicId }
// loading: true mientras obtiene datos
// Sincroniza autenticación cuando hay login/logout
```

#### `ProtectedRoute` Componente
```javascript
<ProtectedRoute requiredRole="clinic">
  <ClinicDashboard />
</ProtectedRoute>
// Valida autenticación y rol automáticamente
// Redirige a login si no autorizado
```

#### `serviceAPI` / `appointmentAPI` / etc.
```javascript
// Llamadas centralizadas a backend
// Incluyen token JWT automáticamente en headers
// Redirigen a login si 401 Unauthorized
```

### Backend

#### Middleware: `authenticate`
```javascript
// Valida JWT token en header Authorization
// Si válido: req.user = { userId, role, clinicId, ... }
// Si inválido: responde con 401
```

#### Middleware: `authorize`
```javascript
// Valida que req.user.role esté en lista de roles permitidos
// Si no: responde con 403 Forbidden
```

---

## ✍️ Guía de Contribución

### Estándares de Código

#### JavaScript/React
- Usar `const` por defecto, `let` solo si necesita reasignación
- Funciones arrow para callbacks
- Comentarios JSDoc para funciones públicas
- Nombres descriptivos: `fetchUserAppointments` no `fetch()`

#### Comentarios
- Explicar EL QUÉ y EL POR QUÉ, no el CÓMO
- Comentarios en bloque `/** */` para funciones
- Ejemplos de uso en comentarios de funciones públicas

#### SQL
- Nombres de columnas en camelCase
- Usar placeholders `?` para parámetros (evitar inyección SQL)
- Incluir índices en búsquedas frecuentes

### Convención de Nombres

| Que       | Convención           | Ejemplo                    |
|-----------|----------------------|----------------------------|
| Función   | camelCase            | `getServicesByClinic()`    |
| Clase     | PascalCase           | `ClinicDashboard`          |
| Constante | UPPER_SNAKE_CASE     | `VALID_CATEGORIES`         |
| Archivo   | PascalCase (React)   | `ManageServices.jsx`       |
| Archivo   | lowercase (Node.js)  | `authController.js`        |
| Variable  | camelCase            | `clinicServices`           |
| DB campo  | camelCase            | `createdAt`                |

### Flujo de Cambios

1. **Crear rama**: `git checkout -b feature/nombre-feature`
2. **Hacer cambios** locales
3. **Testar** cambios
4. **Commit**: Mensajes claros con contexto
5. **Push** a rama
6. **Pull Request** describiendo cambios

### Ejemplo de PR

```
Título: Agregar validación de precio en servicios

Descripción:
- Valida que precio sea > 0 en frontend y backend
- Muestra error claro al usuario si es inválido
- Esto previene servicios con precio 0 o negativo

Cambios:
- ManageServices.jsx: Agregar validación en handleSaveService
- serviceController.js: Agregar validación en backend
- Prueba manual: ✅ OK

Archivos modificados:
- frontend/src/pages/clinic/ManageServices.jsx
- backend/src/controllers/serviceController.js
```

### Testing

Antes de hacer commit, verificar:

- [ ] El navegador no muestra errores en consola
- [ ] El feature funciona localmente
- [ ] No rompe funcionalidad existente
- [ ] Código está comentado y legible
- [ ] Variables tiene nombres descriptivos

---

## 🆘 Troubleshooting

### Error: "Error al crear servicio"

**Causas posibles**:
1. Token inválido o expirado → Hacer login nuevamente
2. clinicId no viene en token → Verificar que generateToken() incluya clinicId
3. Categoría no válida → Verificar que esté en VALID_CATEGORIES
4. Conectividad backend → Verificar que backend esté corriendo en puerto 3100

**Debug**:
```javascript
// En consola del navegador:
localStorage.getItem('token')  // Ver token
// En Network tab: Ver request/response HTTP
```

---

## 📞 Contacto y Preguntas

Si hay dudas sobre el código o arquitectura, revisar:
1. Comentarios en el archivo específico
2. Este documento (DEVELOPMENT.md)
3. Crear issue describiend o la duda
