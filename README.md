# 🎓 Sistema de Gestión de Prácticas y Tesis - UNT

Sistema web completo para la gestión de prácticas preprofesionales y tesis de la **Universidad Nacional de Trujillo**.

![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=nodedotjs)
![NestJS](https://img.shields.io/badge/NestJS-10.3-E0234E?logo=nestjs)
![Next.js](https://img.shields.io/badge/Next.js-14.2-000000?logo=nextdotjs)
![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-✓-2496ED?logo=docker)

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Stack Tecnológico](#-stack-tecnológico)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación Rápida](#-instalación-rápida)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Configuración](#-configuración)
- [Módulos del Sistema](#-módulos-del-sistema)
- [Base de Datos](#-base-de-datos)
- [API Endpoints](#-api-endpoints)
- [Despliegue](#-despliegue)
- [Pruebas](#-pruebas)
- [Credenciales de Acceso](#-credenciales-de-acceso)
- [Solución de Problemas](#-solución-de-problemas)

---

## ✨ Características

### 🔐 Autenticación y Roles
- Login con JWT (JSON Web Tokens)
- 5 roles: Admin, Coordinador, Asesor, Estudiante, Empresa
- Control de acceso basado en roles (RBAC)
- Registro de usuarios con validación

### 💼 Gestión de Prácticas
- Registro de ofertas de práctica por empresas
- Postulación de estudiantes
- Asignación de asesores académicos
- Seguimiento de horas cumplidas
- Evaluación de prácticas (aprobado/desaprobado)
- Informes de estudiante y asesor

### 📚 Gestión de Tesis
- Registro de proyectos de tesis
- Asignación de asesor principal y jurados
- Control de avances (capítulos, artículos, informes)
- Registro de actas de sustentación
- Seguimiento de estados (propuesta → desarrollo → sustentación → culminado)

### 📊 Dashboard y Reportes
- Dashboard con métricas en tiempo real
- Gráficos interactivos (barras, pastel, líneas)
- Estadísticas de prácticas, tesis y empresas
- Indicadores de rendimiento
- Reportes exportables a PDF
- Historial de reportes generados

### 👥 Gestión de Entidades
- CRUD completo de estudiantes con expediente
- CRUD de empresas con convenios
- Gestión de asesores y especialidades
- Administración de usuarios del sistema

---

## 🛠 Stack Tecnológico

### Frontend
| Tecnología | Versión | Uso |
|-----------|---------|-----|
| Next.js | 14.2 | Framework React con App Router |
| React | 18.3 | Biblioteca UI |
| TypeScript | 5.4 | Tipado estático |
| Tailwind CSS | 3.4 | Estilos utilitarios |
| shadcn/ui | - | Componentes UI reutilizables |
| React Query | 5.40 | Manejo de estado del servidor |
| React Hook Form | 7.51 | Manejo de formularios |
| Zod | 3.23 | Validación de esquemas |
| Recharts | 2.12 | Gráficos y visualizaciones |
| Axios | 1.7 | Cliente HTTP |
| date-fns | 3.6 | Formateo de fechas |
| Sonner | 1.5 | Notificaciones toast |
| Lucide React | 0.379 | Iconos |

### Backend
| Tecnología | Versión | Uso |
|-----------|---------|-----|
| NestJS | 10.3 | Framework backend modular |
| Prisma | 5.8 | ORM para PostgreSQL |
| PostgreSQL | 16 | Base de datos relacional |
| Passport | 0.7 | Autenticación |
| JWT | 10.2 | Tokens de acceso |
| bcrypt | 5.1 | Hash de contraseñas |
| Puppeteer | 21.6 | Generación de PDFs |
| class-validator | 0.14 | Validación de DTOs |
| Swagger | 7.2 | Documentación de API |

### DevOps
| Tecnología | Uso |
|-----------|-----|
| Docker | Contenedores |
| Docker Compose | Orquestación local |
| GitHub Actions | CI/CD |
| Vercel | Despliegue Frontend |
| Cloudflare | Despliegue Backend |

---

## 📦 Requisitos Previos

### Opción A: Con Docker (Recomendado)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) 20.10+
- [Docker Compose](https://docs.docker.com/compose/) 2.0+
- 4GB RAM disponible
- 10GB espacio en disco

### Opción B: Sin Docker
- [Node.js](https://nodejs.org/) 20 LTS
- [PostgreSQL](https://www.postgresql.org/download/) 16+
- [npm](https://www.npmjs.com/) 10+
- [Git](https://git-scm.com/) 2.40+

---

## 🚀 Instalación Rápida

### 🐳 Con Docker (La más fácil)

```bash
# 1. Clonar el repositorio
git clone https://github.com/unt/sistema-practicas-tesis.git
cd sistema-practicas-tesis

# 2. Configurar variables de entorno
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# 3. Levantar todos los servicios
docker-compose up -d

# 4. Ver los logs
docker-compose logs -f

# 5. Acceder al sistema
# Frontend: http://localhost:3000
# Backend:  http://localhost:3001/api
```

### 💻 Sin Docker (Desarrollo)

#### Backend

**Windows (PowerShell):**
```powershell
cd backend

# Ejecutar script de inicio automático
.\iniciar.ps1
```

**Linux/Mac:**
```bash
cd backend

# Dar permisos al script
chmod +x iniciar.sh

# Ejecutar
./iniciar.sh
```

**Manual (todos los SO):**
```bash
cd backend

# Instalar dependencias
npm install

# Configurar entorno
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL

# Generar Prisma Client
npx prisma generate

# Crear base de datos y migraciones
npx prisma migrate dev --name init

# Insertar datos de prueba
npx ts-node prisma/seed.ts

# Iniciar servidor
npm run start:dev
```

#### Frontend

```bash
cd frontend

# Instalar dependencias
npm install --legacy-peer-deps

# Configurar entorno
cp .env.local.example .env.local

# Iniciar desarrollo
npm run dev
```

---

## 📁 Estructura del Proyecto

```
sistema-unt/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Modelo de datos
│   │   └── seed.ts                # Datos iniciales
│   ├── src/
│   │   ├── main.ts                # Punto de entrada
│   │   ├── app.module.ts          # Módulo principal
│   │   ├── auth/                  # Autenticación JWT
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── strategies/        # JWT y Local
│   │   │   └── guards/            # Auth y Roles
│   │   ├── users/                 # Gestión de usuarios
│   │   ├── estudiantes/           # CRUD estudiantes
│   │   ├── asesores/              # CRUD asesores
│   │   ├── empresas/              # Empresas y convenios
│   │   ├── ofertas/               # Ofertas y postulaciones
│   │   ├── seguimiento/           # Seguimiento prácticas
│   │   ├── tesis/                 # Tesis y avances
│   │   ├── dashboard/             # Estadísticas
│   │   ├── reportes/              # PDFs con Puppeteer
│   │   ├── prisma/               # Servicio Prisma global
│   │   ├── common/               # Decorators, filters
│   │   └── config/               # Configuración
│   ├── test/                     # Pruebas e2e
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # Login y Register
│   │   ├── dashboard/            # Dashboard principal
│   │   ├── practicas/            # Gestión de prácticas
│   │   ├── tesis/                # Gestión de tesis
│   │   ├── estudiantes/          # Lista de estudiantes
│   │   ├── empresas/             # Lista de empresas
│   │   ├── usuarios/             # Administración
│   │   ├── reportes/             # Generación PDFs
│   │   ├── layout.tsx            # Layout principal
│   │   └── globals.css           # Estilos globales
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── layouts/              # Sidebar y Header
│   │   ├── shared/               # DataTable, FileUpload, etc
│   │   └── forms/                # Formularios reutilizables
│   ├── lib/
│   │   ├── api/                  # Cliente HTTP y endpoints
│   │   ├── hooks/                # Custom hooks
│   │   ├── utils/                # Utilidades
│   │   └── types/                # Tipos TypeScript
│   ├── public/                   # Archivos estáticos
│   ├── .env.local.example
│   ├── Dockerfile
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── docker-compose.yml            # Orquestación Docker
├── .github/workflows/            # CI/CD
│   └── ci-cd.yml
└── README.md
```

---

## ⚙️ Configuración

### Variables de Entorno Backend (.env)

```env
# Base de datos PostgreSQL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sistema_unt?schema=public"

# JWT para autenticación
JWT_SECRET="tu-secreto-jwt-super-seguro-2024-cambiar-en-produccion"
JWT_EXPIRATION="24h"

# Puerto del servidor
PORT=3001

# Entorno (development/production)
NODE_ENV="development"

# URL del frontend (para CORS)
FRONTEND_URL="http://localhost:3000"
```

### Variables de Entorno Frontend (.env.local)

```env
# URL de la API backend
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Nombre de la aplicación
NEXT_PUBLIC_APP_NAME=Sistema UNT
```

---

## 📚 Módulos del Sistema

### 1. Autenticación y Usuarios
- **Login**: `POST /api/auth/login`
- **Register**: `POST /api/auth/register`
- **CRUD Usuarios**: `GET/POST/PUT/DELETE /api/users`
- **Asignar Roles**: `POST /api/users/:id/roles/:roleName`

### 2. Prácticas Preprofesionales
- **Ofertas**: `GET/POST/PUT/DELETE /api/ofertas`
- **Postulaciones**: `GET/POST /api/ofertas/:id/postulaciones`
- **Asignar Asesor**: `POST /api/ofertas/postulaciones/:id/asignar-asesor`
- **Seguimiento**: `GET/POST/PUT /api/seguimiento`
- **Evaluar**: `PUT /api/seguimiento/:id/evaluar`

### 3. Tesis
- **CRUD Tesis**: `GET/POST/PUT /api/tesis`
- **Avances**: `GET/POST /api/tesis/:id/avances`
- **Jurados**: `POST/DELETE /api/tesis/:id/jurados`
- **Actas**: `POST /api/tesis/:id/acta`

### 4. Dashboard
- **Resumen**: `GET /api/dashboard/resumen`
- **Completo**: `GET /api/dashboard/completo`
- **Estadísticas**: `GET /api/dashboard/practicas|tesis|empresas`
- **Indicadores**: `GET /api/dashboard/indicadores`

### 5. Reportes PDF
- **Generar**: `POST /api/reportes/practicas|tesis|empresas`
- **Historial**: `GET /api/reportes/historial`
- **Descargar**: `GET /api/reportes/:id/descargar`

---

## 🗄️ Base de Datos

### Diagrama Entidad-Relación

```mermaid
erDiagram
    ROL ||--o{ USUARIO_ROL : tiene
    USUARIO ||--o{ USUARIO_ROL : tiene
    USUARIO ||--o| ESTUDIANTE : es
    USUARIO ||--o| ASESOR : es
    USUARIO ||--o{ REPORTE : genera
    ESCUELA ||--o{ ESTUDIANTE : pertenece
    ESCUELA ||--o{ ASESOR : pertenece
    ESTUDIANTE ||--o{ POSTULACION : realiza
    ESTUDIANTE ||--o{ TESIS : desarrolla
    EMPRESA ||--o{ OFERTA_PRACTICA : publica
    EMPRESA ||--o{ CONVENIO : firma
    OFERTA_PRACTICA ||--o{ POSTULACION : recibe
    ASESOR ||--o{ ASESOR_POSTULACION : asigna
    ASESOR ||--o{ TESIS : asesora
    ASESOR ||--o{ JURADO_TESIS : es_jurado
    POSTULACION ||--o| SEGUIMIENTO_PRACTICA : tiene
    POSTULACION ||--o| ASESOR_POSTULACION : tiene
    TESIS ||--o{ JURADO_TESIS : evalua
    TESIS ||--o{ AVANCE_TESIS : contiene
    TESIS ||--o| ACTA_SUSTENTACION : tiene
```

### Entidades Principales (19 tablas)

| Tabla | Descripción | Registros Seed |
|-------|-------------|----------------|
| `rol` | Roles del sistema | 5 |
| `usuario` | Usuarios del sistema | 29 |
| `usuario_rol` | Asignación de roles | 29 |
| `escuela` | Escuelas académicas | 8 |
| `estudiante` | Datos de estudiantes | 15 |
| `asesor` | Datos de asesores | 6 |
| `empresa` | Empresas registradas | 7 |
| `convenio` | Convenios marco/específicos | 5 |
| `oferta_practica` | Ofertas de práctica | 10 |
| `postulacion` | Postulaciones | 11 |
| `asesor_postulacion` | Asignación asesor-práctica | 6 |
| `seguimiento_practica` | Seguimiento horas | 5 |
| `tesis` | Proyectos de tesis | 6 |
| `jurado_tesis` | Jurados de tesis | 9 |
| `avance_tesis` | Avances de tesis | 12 |
| `acta_sustentacion` | Actas de sustentación | 1 |
| `reporte` | Reportes generados | 3 |

---

## 🚢 Despliegue

### Frontend en Vercel

1. Conectar repositorio en [Vercel](https://vercel.com)
2. Configurar:
   - Framework: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
3. Variables de entorno:
   - `NEXT_PUBLIC_API_URL`: URL del backend en producción

### Backend en Cloudflare/Railway

1. **Cloudflare Workers**:
   ```bash
   npx wrangler login
   npx wrangler deploy
   ```

2. **Railway** (alternativa más simple):
   - Conectar repositorio en [Railway](https://railway.app)
   - Configurar `DATABASE_URL` con PostgreSQL provisionado
   - Deploy automático

### Base de Datos

- **Desarrollo**: PostgreSQL local o Docker
- **Producción**: 
  - [Railway PostgreSQL](https://railway.app)
  - [Supabase](https://supabase.com)
  - [Neon](https://neon.tech)

---

## 🧪 Pruebas

### Backend

```bash
cd backend

# Pruebas unitarias
npm test

# Pruebas e2e
npm run test:e2e

# Cobertura
npm run test:cov
```

### Frontend

```bash
cd frontend

# Pruebas unitarias
npm test

# Pruebas e2e
npm run test:e2e
```

---

## 🔑 Credenciales de Acceso

### Datos de Prueba (Seed)

| Rol | Email | Contraseña | Descripción |
|-----|-------|------------|-------------|
| 🔴 Admin | `admin@unitru.edu.pe` | `Admin123@` | Acceso completo al sistema |
| 🔵 Coordinador | `coordinador.sistemas@unitru.edu.pe` | `Coord123@` | Gestión de facultad |
| 🟣 Asesor | `juan.garcia@unitru.edu.pe` | `Asesor123@` | Asesoría de prácticas/tesis |
| 🟢 Estudiante | `carlos.lopez@unitru.edu.pe` | `Estu123@` | Postulación y seguimiento |
| 🟠 Empresa | `rrhh@techcorp.com` | `Empresa123@` | Publicación de ofertas |

### Datos de Ejemplo Incluidos

- **8 Escuelas** en 4 facultades
- **15 Estudiantes** con diferentes ciclos
- **6 Asesores** con especialidades
- **7 Empresas** (4 con convenio activo)
- **10 Ofertas** de práctica (presencial/remota/híbrida)
- **11 Postulaciones** en diferentes estados
- **6 Tesis** en todas las fases



---

## 📊 Comandos Útiles

### Docker
```bash
# Iniciar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f backend

# Reiniciar un servicio
docker-compose restart backend

# Detener todo
docker-compose down

# Eliminar volúmenes (reset BD)
docker-compose down -v
```

### Prisma
```bash
# Abrir Prisma Studio (visualizar BD)
npx prisma studio

# Resetear base de datos
npx prisma migrate reset

# Ver estado de migraciones
npx prisma migrate status

# Formatear schema
npx prisma format
```

### npm
```bash
# Backend
npm run start:dev      # Desarrollo con hot-reload
npm run build          # Compilar TypeScript
npm run start:prod     # Producción
npm run prisma:seed    # Insertar datos de prueba
npm run prisma:studio  # Abrir Prisma Studio

# Frontend
npm run dev            # Desarrollo
npm run build          # Build producción
npm start              # Iniciar producción
```

---
