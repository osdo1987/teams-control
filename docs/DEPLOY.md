# Guía de Despliegue — Teams Control App

## 📋 Requisitos

- Servidor Ubuntu con Docker y Docker Compose instalados
- Acceso SSH a la VM
- Dominio configurado apuntando al servidor
- Nginx Proxy Manager (o similar) para el reverse proxy

---

## 🚀 Primer despliegue

```bash
# 1. Clonar el repositorio
git clone https://github.com/osdo1987/teams-control.git
cd teams-control

# 2. Crear archivo .env con las variables de producción
cat > .env << EOF
DATABASE_URL=postgresql://usuario:password@IP_DB_VM:5432/teams_control
JWT_SECRET_KEY=tu-secret-key-seguro
EOF

# 3. Construir y levantar contenedores
docker-compose -f docker-compose.prod.yml up -d --build

# 4. Sembrar datos iniciales
docker exec teams_api_prod python seed.py
```

---

## 🔄 Despliegue de actualizaciones

```bash
# 1. Ir al directorio del proyecto
cd ~/teams-control-app

# 2. Bajar contenedores
docker-compose -f docker-compose.prod.yml down

# 3. Actualizar código
git pull origin main

# 4. Reconstruir y levantar
docker-compose -f docker-compose.prod.yml up -d --build

# 5. Verificar logs
docker logs -f teams_api_prod
```

---

## 🗄️ Gestión de la base de datos

### ⚠️ IMPORTANTE: No usar Flask-Migrate

Este proyecto **NO usa migraciones** (`flask db init / migrate / upgrade`). La estructura de tablas se sincroniza ejecutando `seed.py` o directamente con `db.create_all()`.

> **Nota:** La base de datos PostgreSQL está en una VM separada (no en contenedor). No la toques con comandos de Docker.

**Para regenerar toda la base de datos desde la API:**

```bash
docker exec teams_api_prod python seed.py
```

Esto borra todas las tablas y las recrea con datos de prueba.

### Conexión a la BD

La conexión se define en la variable `DATABASE_URL` del archivo `.env`:

```
DATABASE_URL=postgresql://usuario:password@IP_DB_VM:5432/teams_control
```

### Si hay errores de tablas (sin perder datos de producción)

```bash
# Solo recrea la estructura si faltan tablas (sin borrar datos)
docker exec teams_api_prod python -c "
from app import create_app, db
app = create_app()
with app.app_context():
    db.create_all()
    print('Tablas faltantes creadas exitosamente')
"
```

> ⚠️ **db.create_all()** solo crea las tablas que NO existen. No borra ni modifica las existentes. Si necesitas agregar una columna nueva, modifica el modelo Python y ejecuta esto.

### Solo para datos de prueba (seed)

```bash
docker exec teams_api_prod python seed.py
```

> ⚠️ Esto borra TODOS los datos existentes y los reemplaza con datos de prueba.

---

## 🐳 Comandos útiles

```bash
# Ver logs de la API
docker logs -f teams_api_prod

# Ver logs del frontend
docker logs -f teams_frontend_prod

# Ver estado de los contenedores
docker ps

# Acceder al shell del contenedor
docker exec -it teams_api_prod bash

# Ejecutar un comando Python
docker exec teams_api_prod python -c "print('hola')"

# Reiniciar solo la API (sin perder datos)
docker restart teams_api_prod

# Reconstruir solo la API
docker-compose -f docker-compose.prod.yml up -d --build api
```

---

## 📦 Arquitectura de producción

```
                      ┌─────────────────────┐
                      │   Nginx Gateway      │
                      │   (puerto 80)        │
                      │   VM de aplicaciones │
                      └────────┬────────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
            ┌───────▼───────┐    ┌────────▼────────┐
            │ Frontend      │    │ API (Gunicorn)  │
            │ (Nginx:80)    │    │ (Python:5000)   │
            │ (contenedor)  │    │ (contenedor)    │
            └───────────────┘    └────────┬────────┘
                                          │
                                          │ (conexión TCP vía DATABASE_URL)
                                          │
                               ┌──────────▼──────────┐
                               │  PostgreSQL:5432      │
                               │  VM de base de datos  │
                               └─────────────────────┘
```

**Notas:**
- La API y el Frontend corren como contenedores Docker en la **VM de aplicaciones**.
- PostgreSQL corre en una **VM separada** (base de datos). No está en contenedor Docker.
- La conexión se hace por red TCP usando la variable `DATABASE_URL`.
- El Nginx Gateway (`osdosoft_gateway`) enruta el tráfico externo a cada servicio según el dominio.

---

## ⚠️ Errores comunes y soluciones

### Error: `relation "test_templates" does not exist`

**Causa:** La base de datos está vacía o no se ejecutó el seed.

**Solución:**
```bash
docker exec teams_api_prod python seed.py
```

### Error: `Path doesn't exist: migrations`

**Causa:** Se intentó ejecutar `flask db upgrade` sin haber inicializado migraciones.

**Solución:** No uses Flask-Migrate en producción. Ejecuta `seed.py` en su lugar.

### Error: Credenciales inválidas al hacer login

**Causa:** Se está intentando ingresar con email. El login requiere el **número de identificación**.

**Solución:** Usa el documento de identidad, no el correo electrónico.

### Error: Contenedor no encontrado (`teams_api_prod` no existe)

**Causa:** Se ejecutó `docker-compose up -d` (desarrollo) en lugar de `docker-compose -f docker-compose.prod.yml up -d` (producción).

**Solución:**
```bash
# Primero baja el entorno de desarrollo
docker-compose down

# Luego levanta el de producción
docker-compose -f docker-compose.prod.yml up -d
```

### Error después de modificar modelos

Si agregas o modificas columnas en los modelos Python, debes regenerar el seed:

```bash
docker exec teams_api_prod python seed.py
```

Esto recreará las tablas con la nueva estructura y los datos de prueba.

---

## 🔐 Variables de entorno requeridas

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | Conexión a PostgreSQL | `postgresql://postgres:pass@db:5432/teams_control` |
| `JWT_SECRET_KEY` | Clave secreta para JWT | `cambiar-por-clave-segura` |

Estas variables se cargan desde el archivo `.env` o se pasan directamente en `docker-compose.prod.yml`.

---

## 📝 Notas importantes

- El proyecto **no depende de Flask-Migrate**.
- Los modelos se sincronizan automáticamente con `db.create_all()`.
- Para cambios en la estructura de la base de datos, se usa `seed.py` que ejecuta `db.drop_all()` + `db.create_all()`.
- No olvides usar **siempre** el flag `-f docker-compose.prod.yml` en producción.
- Los datos de prueba incluyen 4 clubes colombianos con atletas, pagos y asistencias.