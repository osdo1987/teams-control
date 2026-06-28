# Guía de Seguridad de Datos en Producción

## ⚠️ REGLAS CRÍTICAS

### NUNCA ejecutes `seed.py` en producción
El script `seed.py` ejecuta `db.drop_all()` que **borra TODOS los datos**. Solo úsalo en desarrollo local.

### Flujo de migraciones SEGURO para producción

#### 1. Antes de cada deploy — BACKUP automático
```bash
# En la VM de Oracle, antes de cada deploy:
pg_dump -U postgres teams_control > backup_$(date +%Y%m%d_%H%M%S).sql
```

#### 2. Deploy seguro (sin perder datos)
```bash
cd ~/teams-control-app
git pull origin main
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
# NO ejecutes seed.py si ya tienes datos reales
```

El `entrypoint.prod.sh` ejecuta automáticamente `flask db upgrade` que es SEGURO — solo aplica migraciones pendientes sin borrar datos.

#### 3. Si necesitas agregar una migración al schema
```bash
# En desarrollo local:
flask db migrate -m "descripcion del cambio"
flask db upgrade

# Luego commit y push:
git add migrations/
git commit -m "migration: descripcion del cambio"
git push origin main

# En producción se aplica automáticamente al hacer deploy
```

#### 4. Si necesitas agregar datos de prueba nuevos
```bash
# SOLO en desarrollo local:
docker exec teams_api python seed.py
```

## 📋 Resumen de scripts

| Script | ¿Cuándo usarlo? | ¿Borra datos? |
|--------|-----------------|----------------|
| `seed.py` | Solo desarrollo local | **SÍ** - borra todo |
| `flask db upgrade` | Producción y desarrollo | **NO** - solo aplica migraciones |
| `pg_dump` | Antes de cada deploy | **NO** - crea backup |
| `seed_safe.py` | Primera vez en producción | **NO** - solo si BD está vacía |

## 🔧 Comandos útiles en producción

```bash
# Ver estado de migraciones
docker exec teams_api_prod python -c "from flask_migrate import current; from app import create_app; app=create_app(); app.app_context().push(); print(current())"

# Verificar que la BD tiene datos
docker exec teams_api_prod python -c "
from app import create_app
from app.models.user import User
from app.models.club import Club
app = create_app()
app.app_context().push()
print(f'Clubes: {Club.query.count()}, Usuarios: {User.query.count()}')
"

# Backup de la BD
pg_dump -U postgres teams_control > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
psql -U postgres teams_control < backup_20260615_230000.sql
```

## 🚨 Si algo sale mal

1. **Si el contenedor no arranca**: revisa logs con `docker logs teams_api_prod`
2. **Si perdiste datos**: restaura el backup más reciente
3. **Si hay error de migración**: ejecuta `flask db upgrade` manualmente
4. **Si necesitas regenerar datos de prueba**: ejecuta `seed.py` SOLO en desarrollo