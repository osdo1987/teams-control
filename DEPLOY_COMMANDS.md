# Comandos de Deploy en Producción

## 📋 Comandos Actualizados

### **Deploy Normal (con datos de demo)**
```bash
# 1. Backup de seguridad (RECOMENDADO)
pg_dump -U postgres teams_control > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Deploy completo
git pull origin main && docker-compose -f docker-compose.prod.yml down && docker-compose -f docker-compose.prod.yml up -d --build && docker exec teams_api_prod python seed_demo.py
```

### **Limpiar Producción y mantener solo demo**
```bash
# Opción A: Limpiar otros clubes, mantener Fútbol Elite Academy
docker exec teams_api_prod python clean_prod_keep_demo.py

# Opción B: Limpiar TODA la base de datos (incluyendo demo)
docker exec teams_api_prod python clean_test_data.py
```

### **Reiniciar con datos de demo desde cero**
```bash
# 1. Backup
pg_dump -U postgres teams_control > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Limpiar todo
docker exec teams_api_prod python clean_test_data.py

# 3. Crear datos de demo
docker exec teams_api_prod python seed_demo.py
```

## 🔄 Flujo de Trabajo Recomendado

### **Primer Deploy en Producción**
```bash
# 1. Clonar repositorio
git clone https://github.com/osdo1987/teams-control.git
cd teams-control

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 3. Deploy inicial
docker-compose -f docker-compose.prod.yml up -d --build

# 4. Esperar 10 segundos
sleep 10

# 5. Aplicar migraciones (automático en entrypoint.prod.sh)
# docker exec teams_api_prod flask db upgrade

# 6. Crear super admin (si es necesario)
# docker exec teams_api_prod python -c "from app import create_app; from app.models.user import User; app = create_app(); app.app_context().push(); u = User(email='super@admin.com', identification_number='0000000001', first_name='Super', last_name='Admin', role='SUPER_ADMIN'); u.set_password('super123'); from app import db; db.session.add(u); db.session.commit()"

# 7. Crear datos de demo
docker exec teams_api_prod python seed_demo.py
```

### **Deploy con Datos Reales de Clientes**
```bash
# 1. Backup OBLIGATORIO
pg_dump -U postgres teams_control > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Deploy
git pull origin main
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build

# 3. Esperar
sleep 10

# 4. NO ejecutar seed_demo.py - tus datos de clientes están seguros
# Las migraciones se aplican automáticamente
```

### **Actualizar Demo sin Borrar Datos de Clientes**
```bash
# 1. Backup
pg_dump -U postgres teams_control > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Deploy
git pull origin main
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build

# 3. Limpiar clubes de demo anteriores (si existen)
docker exec teams_api_prod python clean_prod_keep_demo.py

# 4. Crear nuevo demo
docker exec teams_api_prod python seed_demo.py
```

## 📊 Scripts Disponibles

| Script | Propósito | ¿Borra datos? | Uso |
|--------|-----------|---------------|-----|
| `seed_demo.py` | Crear datos de demo | ❌ No | Deploy en producción |
| `clean_prod_keep_demo.py` | Limpiar otros clubes | ✅ Solo otros clubes | Mantener demo, borrar resto |
| `clean_test_data.py` | Limpiar TODO | ✅ Sí | Desarrollo/testing |

## 🔐 Credenciales de Demo

Después de ejecutar `seed_demo.py`:

- **Super Admin**: `super@admin.com` / `super123`
- **Admin**: `admin@futbolelite.com` / `admin123`
- **Entrenadores**: 
  - `entrenador1@futbolelite.com` / `trainer123`
  - `entrenador2@futbolelite.com` / `trainer123`
  - `entrenador3@futbolelite.com` / `trainer123`
- **Atletas**: `[nombre].[apellido]@futbolelite.com` / `athlete123`

## ⚠️ Notas Importantes

1. **SIEMPRE hacer backup** antes de deploy en producción
2. `seed_demo.py` es seguro en producción - no borra datos existentes
3. `clean_prod_keep_demo.py` mantiene el club "Fútbol Elite Academy"
4. Las migraciones se aplican automáticamente en `entrypoint.prod.sh`
5. El super admin se preserva en todas las operaciones de limpieza

## 🚨 Comandos de Emergencia

### **Restaurar backup**
```bash
psql -U postgres teams_control < backup_20260619_230000.sql
```

### **Ver estado de la base de datos**
```bash
docker exec teams_api_prod python -c "
from app import create_app
from app.models.user import User
from app.models.club import Club
app = create_app()
app.app_context().push()
print(f'Clubes: {Club.query.count()}, Usuarios: {User.query.count()}')
"
```

### **Ver logs del contenedor**
```bash
docker logs teams_api_prod
docker logs -f teams_api_prod  # Seguir logs en tiempo real
```

## 📝 Ejemplo de Deploy Completo

```bash
#!/bin/bash
# deploy.sh - Script de deploy automatizado

echo "🚀 Iniciando deploy..."

# 1. Backup
echo "📦 Creando backup..."
pg_dump -U postgres teams_control > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Pull de cambios
echo "📥 Actualizando código..."
git pull origin main

# 3. Reiniciar contenedores
echo "🔄 Reiniciando servicios..."
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build

# 4. Esperar a que esté listo
echo "⏳ Esperando servicios..."
sleep 15

# 5. Verificar que está corriendo
echo "🔍 Verificando estado..."
docker ps | grep teams_api_prod

# 6. Crear/actualizar datos de demo
echo "🌱 Creando datos de demo..."
docker exec teams_api_prod python seed_demo.py

echo "✅ Deploy completado!"
echo "🌐 Accede en: http://tu-dominio.com"
```

## 🔧 Configuración de docker-compose.prod.yml

Asegúrate de que tu archivo `docker-compose.prod.yml` tenga:

```yaml
services:
  api:
    container_name: teams_api_prod
    environment:
      - DATABASE_URL=postgresql://${DB_USER:-postgres}:${DB_PASSWORD:-postgres}@db:5432/${DB_NAME:-teams_control}
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
      - FLASK_ENV=production
    volumes:
      - .:/app
    ports:
      - "5000:5000"
    depends_on:
      - db
```

## 📚 Recursos Adicionales

- **Documentación de Flask-Migrate**: https://flask-migrate.readthedocs.io/
- **Docker Compose**: https://docs.docker.com/compose/
- **PostgreSQL Backup**: https://www.postgresql.org/docs/current/backup.html