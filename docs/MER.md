# Modelo Entidad-Relación (MER) — Teams Control App

## Leyenda de Relaciones

```
1:1  → Uno a uno
1:N  → Uno a muchos
N:M  → Muchos a muchos (tabla intermedia)
```

---

## 1. CLUB (`clubs`)
Club deportivo raíz del sistema.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | PK Integer | Identificador único |
| name | String(100), NOT NULL, UNIQUE | Nombre del club |
| slug | String(100), UNIQUE | Identificador URL-friendly |
| description | Text | Descripción del club |
| sport | String(100) | Deporte principal (default: 'Fútbol') |
| is_active | Boolean | Si el club está activo |
| created_at | DateTime | Fecha de creación |
| subscription_status | String(20) | TRIAL, ACTIVE, INACTIVE, EXPIRED |
| plan_type | String(20) | BASIC, FLEXIBLE |
| subscription_end_date | DateTime | Fin de suscripción |
| primary_color | String(7) | Color hexadecimal para branding |
| logo_url | Text | URL o base64 del logo |
| welcome_message | String(200) | Mensaje personalizado de bienvenida |
| show_features | Boolean | Mostrar lista de funcionalidades |
| role_permissions | JSON | Permisos por rol (TRAINER, ATHLETE) |

**Relaciones:**
- Club **1:N** User → `club_id` FK en `users`
- Club **1:N** Group → `club_id` FK en `groups`
- Club **1:N** Category → `club_id` FK en `categories`
- Club **1:1** ClubLandingPage → `club_id` FK en `club_landing_pages`

---

## 2. USER (`users`)
Usuario del sistema (puede ser ADMIN, TRAINER, ATHLETE o SUPER_ADMIN).

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | PK Integer | Identificador único |
| identification_number | String(30), UNIQUE, NOT NULL | Número de identificación (cédula/DNI) |
| email | String(120) | Email (ya no obligatorio para login) |
| password_hash | String(128), NOT NULL | Hash de contraseña |
| first_name | String(50), NOT NULL | Nombre |
| last_name | String(50), NOT NULL | Apellido |
| role | String(20), NOT NULL | ADMIN, TRAINER, ATHLETE, SUPER_ADMIN |
| club_id | FK Integer → clubs.id | Club al que pertenece |
| phone | String(20) | Teléfono |
| is_active | Boolean | Activo o no |
| created_at | DateTime | Fecha de creación |

**Relaciones:**
- User **N:1** Club → `club_id`
- User **1:1** Athlete → `user_id` FK en `athletes` (si es ATHLETE)
- User **1:1** TrainerProfile → `user_id` FK en `trainer_profiles` (si es TRAINER)
- User **N:M** Group → via `group_trainers` (como entrenador)
- User **1:N** TestSession → `trainer_id` FK en `test_sessions`
- User **1:N** TestResult → `trainer_id` FK en `test_results`
- User **1:N** TrainingPlan → `created_by` FK en `training_plans`

---

## 3. ATHLETE (`athletes`)
Perfil extendido del usuario con rol ATHLETE.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | PK Integer | Identificador único |
| user_id | FK Integer → users.id, UNIQUE, NOT NULL | Usuario asociado |
| birth_date | Date | Fecha de nacimiento |
| phone | String(20) | Teléfono |
| address | String(200) | Dirección |
| photo_url | Text | URL de foto |
| is_active | Boolean | Activo o no |

**Relaciones:**
- Athlete **1:1** User → `user_id`
- Athlete **1:N** Guardian → `athlete_id` FK en `guardians`
- Athlete **1:1** MedicalInfo → `athlete_id` FK en `medical_info`
- Athlete **1:1** AcademicInfo → `athlete_id` FK en `academic_info`
- Athlete **1:N** Attendance → `athlete_id` FK en `attendance`
- Athlete **1:N** Payment → `athlete_id` FK en `payments`
- Athlete **1:N** GroupHistory → `athlete_id` FK en `group_history`
- Athlete **N:M** Group → via `group_athletes` (grupos actuales)
- Athlete **1:N** TestResult → `athlete_id` FK en `test_results`
- Athlete **1:N** TrainingPlanAssignment → `athlete_id` FK en `training_plan_assignments`

---

## 4. TRAINER PROFILE (`trainer_profiles`)
Perfil extendido del usuario con rol TRAINER.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | PK Integer | Identificador único |
| user_id | FK Integer → users.id, UNIQUE, NOT NULL | Usuario asociado |
| birth_date | Date | Fecha de nacimiento |
| gender | String(20) | Masculino, Femenino, Otro |
| address | String(200) | Dirección |
| city | String(100) | Ciudad |
| state | String(100) | Departamento/Estado |
| emergency_contact_name | String(100) | Contacto de emergencia |
| emergency_contact_phone | String(20) | Teléfono de emergencia |
| profile_photo_url | String(300) | URL de foto |
| bank_name | String(100) | Banco |
| bank_account_number | String(50) | Número de cuenta |
| bank_account_type | String(30) | Ahorros, Corriente |
| salary | Numeric(12,2) | Salario |
| payment_frequency | String(30) | Mensual, Quincenal, Semanal |
| tax_id | String(30) | NIT/RUT |
| education_level | String(50) | Bachiller, Técnico, Profesional, Posgrado |
| institution | String(150) | Institución educativa |
| degree_title | String(150) | Título obtenido |
| graduation_year | Integer | Año de graduación |
| certifications | Text | Certificaciones (JSON o texto) |
| specialization | String(150) | Especialización deportiva |
| years_of_experience | Integer | Años de experiencia |
| previous_clubs | Text | Clubes anteriores |
| bio | Text | Biografía profesional |
| hire_date | Date | Fecha de contratación |
| contract_type | String(50) | Tiempo completo, Medio tiempo, Contrato |
| status | String(20) | ACTIVE, INACTIVE, ON_LEAVE |
| created_at | DateTime | Fecha de creación |
| updated_at | DateTime | Fecha de actualización |

**Relaciones:**
- TrainerProfile **1:1** User → `user_id`

---

## 5. GROUP (`groups`)
Grupo de entrenamiento.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | PK Integer | Identificador único |
| name | String(100), NOT NULL | Nombre del grupo |
| club_id | FK Integer → clubs.id, NOT NULL | Club al que pertenece |
| category_id | FK Integer → categories.id | Categoría del grupo |
| description | Text | Descripción |
| max_capacity | Integer | Capacidad máxima |
| schedule | String(200) | Resumen: "Lun-Mie-Vie 5PM" |
| schedule_days | String(100) | "Lunes, Miércoles, Viernes" |
| schedule_start_time | String(10) | "17:00" |
| schedule_end_time | String(10) | "19:00" |
| schedule_blocks | Text | JSON con múltiples bloques horarios |
| training_location | String(150) | Ubicación (cancha, gimnasio, etc.) |
| status | String(20) | ACTIVE, INACTIVE, FULL |
| level | String(30) | Principiante, Intermedio, Avanzado, Competitivo |
| season | String(50) | "2026 - Primer Semestre" |
| monthly_fee | Numeric(10,2) | Cuota mensual |
| created_at | DateTime | Creación |
| updated_at | DateTime | Actualización |

**Relaciones:**
- Group **N:1** Club → `club_id`
- Group **N:1** Category → `category_id`
- Group **N:M** User (Trainer) → via `group_trainers`
- Group **N:M** Athlete → via `group_athletes`
- Group **1:N** Attendance → `group_id` FK en `attendance`
- Group **1:N** GroupHistory → `group_id` FK en `group_history`
- Group **1:N** TrainingPlanAssignment → `group_id` FK en `training_plan_assignments`

---

## 6. CATEGORY (`categories`)
Categoría para clasificar grupos.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | PK Integer | Identificador único |
| name | String(100), NOT NULL | Nombre de la categoría |
| club_id | FK Integer → clubs.id, NOT NULL | Club al que pertenece |
| is_active | Boolean | Activa o no |

**Relaciones:**
- Category **N:1** Club → `club_id`
- Category **1:N** Group → `category_id` FK en `groups`

---

## 7. GUARDIAN (`guardians`)
Acudiente o responsable de un atleta.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | PK Integer | Identificador único |
| athlete_id | FK Integer → athletes.id, NOT NULL | Atleta asociado |
| name | String(100), NOT NULL | Nombre del acudiente |
| relationship | String(50) | Parentesco |
| phone | String(20) | Teléfono |
| email | String(120) | Correo |

**Relaciones:**
- Guardian **N:1** Athlete → `athlete_id`

---

## 8. MEDICAL INFO (`medical_info`)
Información médica del atleta (1:1).

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | PK Integer | Identificador único |
| athlete_id | FK Integer → athletes.id, UNIQUE, NOT NULL | Atleta |
| blood_type | String(5) | Tipo de sangre |
| allergies | Text | Alergias |
| conditions | Text | Condiciones médicas |
| emergency_contact | String(100) | Contacto de emergencia |

**Relaciones:**
- MedicalInfo **1:1** Athlete → `athlete_id`

---

## 9. ACADEMIC INFO (`academic_info`)
Información académica del atleta (1:1).

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | PK Integer | Identificador único |
| athlete_id | FK Integer → athletes.id, UNIQUE, NOT NULL | Atleta |
| school_name | String(100) | Nombre del colegio |
| grade | String(20) | Grado/Curso |

**Relaciones:**
- AcademicInfo **1:1** Athlete → `athlete_id`

---

## 10. ATTENDANCE (`attendance`)
Registro de asistencia de un atleta a un grupo en una fecha.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | PK Integer | Identificador único |
| athlete_id | FK Integer → athletes.id, NOT NULL | Atleta |
| group_id | FK Integer → groups.id, NOT NULL | Grupo |
| date | Date | Fecha de la sesión |
| status | String(20), NOT NULL | PRESENT, ABSENT, EXCUSED |
| notes | Text | Notas adicionales |

**Relaciones:**
- Attendance **N:1** Athlete → `athlete_id`
- Attendance **N:1** Group → `group_id`

---

## 11. PAYMENT (`payments`)
Pago realizado por un atleta.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | PK Integer | Identificador único |
| athlete_id | FK Integer → athletes.id, NOT NULL | Atleta |
| amount | Numeric(10,2), NOT NULL | Monto |
| payment_date | DateTime | Fecha del pago |
| due_date | Date | Fecha de vencimiento |
| status | String(20), NOT NULL | PAID, PENDING, OVERDUE |
| payment_method | String(50) | Método de pago |
| description | String(200) | Descripción |

**Relaciones:**
- Payment **N:1** Athlete → `athlete_id`

---

## 12. GROUP HISTORY (`group_history`)
Historial de movimientos de un atleta entre grupos.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | PK Integer | Identificador único |
| athlete_id | FK Integer → athletes.id, NOT NULL | Atleta |
| group_id | FK Integer → groups.id, NOT NULL | Grupo |
| action | String(20) | JOINED, LEFT, CHANGED |
| date | DateTime | Fecha del movimiento |

**Relaciones:**
- GroupHistory **N:1** Athlete → `athlete_id`
- GroupHistory **N:1** Group → `group_id`

---

## 13. TABLAS INTERMEDIAS (N:M)

### group_trainers
Asigna entrenadores (Users) a grupos.

| Columna | Tipo |
|---------|------|
| group_id | FK Integer → groups.id, PK compuesta |
| user_id | FK Integer → users.id, PK compuesta |

### group_athletes
Asigna atletas actuales a grupos.

| Columna | Tipo |
|---------|------|
| group_id | FK Integer → groups.id, PK compuesta |
| athlete_id | FK Integer → athletes.id, PK compuesta |

---

## 14. TRAINING PLAN (`training_plans`)
Plan de entrenamiento.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | PK Integer | Identificador único |
| name | String(150), NOT NULL | Nombre del plan |
| description | Text | Descripción |
| club_id | FK Integer → clubs.id, NOT NULL | Club al que pertenece |
| created_by | FK Integer → users.id, NOT NULL | Creador (trainer) |
| is_active | Boolean | Activo o no |
| created_at | DateTime | Creación |
| updated_at | DateTime | Actualización |

**Relaciones:**
- TrainingPlan **N:1** Club → `club_id`
- TrainingPlan **N:1** User → `created_by`
- TrainingPlan **1:N** TrainingCycle → `plan_id` FK en `training_cycles`
- TrainingPlan **1:N** TrainingPlanAssignment → `plan_id` FK en `training_plan_assignments`

---

## 15. TRAINING CYCLE (`training_cycles`)
Ciclo dentro de un plan de entrenamiento.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | PK Integer | Identificador único |
| plan_id | FK Integer → training_plans.id, NOT NULL | Plan padre |
| name | String(150), NOT NULL | Nombre del ciclo |
| description | Text | Descripción |
| order | Integer, NOT NULL, default=1 | Orden dentro del plan |

**Relaciones:**
- TrainingCycle **N:1** TrainingPlan → `plan_id`
- TrainingCycle **1:N** TrainingSession → `cycle_id` FK en `training_sessions`

---

## 16. TRAINING SESSION (`training_sessions`)
Sesión dentro de un ciclo de entrenamiento.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | PK Integer | Identificador único |
| cycle_id | FK Integer → training_cycles.id, NOT NULL | Ciclo padre |
| name | String(150), NOT NULL | Nombre de la sesión |
| notes | Text | Notas |
| order | Integer, NOT NULL, default=1 | Orden dentro del ciclo |

**Relaciones:**
- TrainingSession **N:1** TrainingCycle → `cycle_id`
- TrainingSession **1:N** TrainingExercise → `session_id` FK en `training_exercises`

---

## 17. TRAINING EXERCISE (`training_exercises`)
Ejercicio dentro de una sesión de entrenamiento.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | PK Integer | Identificador único |
| session_id | FK Integer → training_sessions.id, NOT NULL | Sesión padre |
| exercise_name | String(150), NOT NULL | Nombre del ejercicio |
| sets | Integer, default=1 | Series |
| reps | String(50) | Repeticiones |
| weight | String(50) | Peso |
| duration_seconds | Integer | Duración en segundos |
| rest_seconds | Integer | Descanso en segundos |
| notes | Text | Notas |
| order | Integer, default=1 | Orden dentro de la sesión |

**Relaciones:**
- TrainingExercise **N:1** TrainingSession → `session_id`

---

## 18. TRAINING PLAN ASSIGNMENT (`training_plan_assignments`)
Asignación de un plan de entrenamiento a un grupo o atleta.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | PK Integer | Identificador único |
| plan_id | FK Integer → training_plans.id, NOT NULL | Plan asignado |
| group_id | FK Integer → groups.id | Grupo destino (opcional) |
| athlete_id | FK Integer → athletes.id | Atleta destino (opcional) |
| start_date | Date, NOT NULL | Fecha de inicio |
| end_date | Date, NOT NULL | Fecha de fin |
| status | String(20), NOT NULL | ACTIVE, COMPLETED, CANCELLED |
| assigned_at | DateTime | Fecha de asignación |

**Relaciones:**
- TrainingPlanAssignment **N:1** TrainingPlan → `plan_id`
- TrainingPlanAssignment **N:1** Group → `group_id`
- TrainingPlanAssignment **N:1** Athlete → `athlete_id`

---

## 19. TEST TEMPLATE (`test_templates`)
Plantilla para pruebas físicas/deportivas.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | PK Integer | Identificador único |
| name | String(150), NOT NULL | Nombre del test |
| description | Text | Descripción |
| category | String(50), NOT NULL | Categoría del test |
| unit | String(50), NOT NULL | Unidad de medida |
| higher_is_better | Boolean, default=true | Mayor valor = mejor |
| club_id | FK Integer → clubs.id | Club propietario |
| created_by | FK Integer → users.id | Creador |
| is_predefined | Boolean | Predefinido por el sistema |
| created_at | DateTime | Creación |
| updated_at | DateTime | Actualización |

**Relaciones:**
- TestTemplate **N:1** Club → `club_id`
- TestTemplate **N:1** User → `created_by`
- TestTemplate **1:N** TestResult → `template_id` FK en `test_results`

---

## 20. TEST SESSION (`test_sessions`)
Sesión de evaluación donde se toman múltiples resultados.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | PK Integer | Identificador único |
| name | String(150) | Nombre de la sesión |
| club_id | FK Integer → clubs.id | Club |
| trainer_id | FK Integer → users.id | Entrenador que evaluó |
| session_date | Date, NOT NULL | Fecha de la sesión |
| notes | Text | Notas |
| created_at | DateTime | Creación |

**Relaciones:**
- TestSession **N:1** Club → `club_id`
- TestSession **N:1** User → `trainer_id`
- TestSession **1:N** TestResult → `session_id` FK en `test_results`

---

## 21. TEST RESULT (`test_results`)
Resultado individual de un test para un atleta.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | PK Integer | Identificador único |
| template_id | FK Integer → test_templates.id, NOT NULL | Plantilla del test |
| athlete_id | FK Integer → athletes.id, NOT NULL | Atleta evaluado |
| trainer_id | FK Integer → users.id | Entrenador que registró |
| session_id | FK Integer → test_sessions.id | Sesión de evaluación |
| value | Numeric(12,2), NOT NULL | Valor obtenido |
| notes | Text | Notas |
| test_date | Date, NOT NULL | Fecha del test |
| created_at | DateTime | Creación |

**Relaciones:**
- TestResult **N:1** TestTemplate → `template_id`
- TestResult **N:1** Athlete → `athlete_id`
- TestResult **N:1** User → `trainer_id`
- TestResult **N:1** TestSession → `session_id`

---

## 22. CLUB LANDING PAGE (`club_landing_pages`)
Página de aterrizaje personalizada del club (1:1).

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | PK Integer | Identificador único |
| club_id | FK Integer → clubs.id, UNIQUE, NOT NULL | Club |
| is_active | Boolean | Activa o no |
| hero_title | String(200) | Título del héroe |
| hero_subtitle | String(300) | Subtítulo |
| banner_url | Text | URL del banner |
| cta_text | String(100) | Texto del botón CTA |
| cta_link | String(200) | Enlace del CTA |
| about_title | String(200) | Título "Sobre nosotros" |
| about_text | Text | Contenido "Sobre nosotros" |
| about_image_url | Text | Imagen "Sobre nosotros" |
| features_title | String(200) | Título de servicios |
| features | JSON | Array de {icon, title, description} |
| gallery_title | String(200) | Título de galería |
| gallery_images | JSON | Array de {url, caption} |
| contact_email | String(120) | Email de contacto |
| contact_phone | String(30) | Teléfono de contacto |
| address | String(300) | Dirección |
| social_facebook | String(300) | URL Facebook |
| social_instagram | String(300) | URL Instagram |
| social_whatsapp | String(300) | URL WhatsApp |
| social_twitter | String(300) | URL Twitter/X |
| social_youtube | String(300) | URL YouTube |
| show_login_in_hero | Boolean | Mostrar login en héroe |
| show_about | Boolean | Mostrar sección Sobre |
| show_features | Boolean | Mostrar sección Servicios |
| show_gallery | Boolean | Mostrar Galería |
| show_contact | Boolean | Mostrar Contacto |
| show_footer_social | Boolean | Mostrar redes en footer |
| show_registration | Boolean | Mostrar enlace de registro |
| footer_text | String(500) | Texto personalizado del footer |
| created_at | DateTime | Creación |
| updated_at | DateTime | Actualización |

**Relaciones:**
- ClubLandingPage **1:1** Club → `club_id`

---

## Diagrama de Relaciones (Texto)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLUB                         │
│  (clubs)                                          │
└───┬──────────┬──────────┬──────────┬──────────────┘
    │          │          │          │
    │ 1:N      │ 1:N      │ 1:N      │ 1:1
    ▼          ▼          ▼          ▼
 ┌──────┐ ┌────────┐ ┌──────────┐ ┌──────────────┐
 │ USER │ │ GROUP  │ │CATEGORY  │ │ClubLandingPage│
 └──┬───┘ └───┬────┘ └──────────┘ └──────────────┘
    │        │
    │1:1     │ N:M (group_trainers)
    ├────────┤
    │        │
 ┌──▼──┐  ┌──▼──┐
 │ATHLETE│  │TRAINER│
 │       │  │PROFILE│
 └──┬───┘  └──────┘
    │
    ├──1:N──→ GUARDIAN
    ├──1:1──→ MEDICAL_INFO
    ├──1:1──→ ACADEMIC_INFO
    ├──1:N──→ ATTENDANCE (──N:1──→ GROUP)
    ├──1:N──→ PAYMENT
    ├──1:N──→ GROUP_HISTORY (──N:1──→ GROUP)
    ├──N:M──→ GROUP (vía group_athletes)
    ├──1:N──→ TEST_RESULT (──N:1──→ TEST_TEMPLATE)
    │                       └──N:1──→ TEST_SESSION
    └──1:N──→ TRAINING_PLAN_ASSIGNMENT
              (──N:1──→ TRAINING_PLAN ──1:N──→ TRAINING_CYCLE
                        ──1:N──→ TRAINING_SESSION ──1:N──→ TRAINING_EXERCISE)
```

---

## Resumen de Entidades

| # | Entidad | Tabla | Tipo |
|---|---------|-------|------|
| 1 | Club | clubs | Principal |
| 2 | User | users | Principal |
| 3 | Athlete | athletes | Extensión (1:1 User) |
| 4 | TrainerProfile | trainer_profiles | Extensión (1:1 User) |
| 5 | Group | groups | Principal |
| 6 | Category | categories | Catálogo |
| 7 | Guardian | guardians | Detalle (N:1 Athlete) |
| 8 | MedicalInfo | medical_info | Detalle (1:1 Athlete) |
| 9 | AcademicInfo | academic_info | Detalle (1:1 Athlete) |
| 10 | Attendance | attendance | Transaccional |
| 11 | Payment | payments | Transaccional |
| 12 | GroupHistory | group_history | Historial |
| 13 | TrainingPlan | training_plans | Principal |
| 14 | TrainingCycle | training_cycles | Jerárquico (1:N Plan) |
| 15 | TrainingSession | training_sessions | Jerárquico (1:N Cycle) |
| 16 | TrainingExercise | training_exercises | Jerárquico (1:N Session) |
| 17 | TrainingPlanAssignment | training_plan_assignments | Asignación |
| 18 | TestTemplate | test_templates | Principal |
| 19 | TestSession | test_sessions | Transaccional |
| 20 | TestResult | test_results | Transaccional |
| 21 | ClubLandingPage | club_landing_pages | Extensión (1:1 Club) |
| — | group_trainers | group_trainers | Asociativa N:M |
| — | group_athletes | group_athletes | Asociativa N:M |