# 📋 Cómo usar el Perfil del Atleta

## 🎯 Funcionalidades Disponibles

### 1. **VISUALIZAR** (Automático)
Al abrir el perfil (`/athlete/profile`), el sistema muestra automáticamente:

#### **Tarjeta Principal (Izquierda)**
- Nombre completo del atleta
- Foto o iniciales
- Grupo y club
- Edad, grado académico
- Colegio
- Horario y ubicación de entrenamiento
- Cédula y teléfono
- Dirección y email

#### **Tarjeta de Atributos (Derecha)**
- Gráfico radar con habilidades físicas
- Velocidad, Resistencia, Fuerza, Agilidad

#### **Tarjeta de Acudientes**
- Lista de padres/madres registrados
- Teléfonos de contacto
- Relación (Padre/Madre/Tío/Abuelo)

#### **Métricas Globales**
- Porcentaje de asistencia
- Racha de días consecutivos
- Total de tests realizados
- Tendencia de rendimiento

#### **Parámetros Físicos**
- Barras de progreso con valores
- Código de colores por categoría

#### **Estado Vital**
- Tipo de sangre
- Contacto de emergencia
- Alergias (si las hay)
- Enfermedades (si las hay)

#### **Pestañas Inferiores**
- **[01] ASISTENCIA**: Historial de entrenamientos
- **[02] TESORERÍA**: Pagos realizados/pendientes
- **[03] LABORATORIO**: Tests físicos realizados
- **[04] HISTORIAL**: Movimientos entre grupos
- **[05] MISIÓN**: Plan de entrenamiento activo

---

### 2. **EDITAR** (Por secciones)

Para editar la información, debes agregar botones de edición en el frontend. Actualmente el código tiene la lógica lista pero necesitas agregar los botones.

#### **Ejemplo: Agregar botón de edición en la tarjeta principal**

Agrega este código después de cada sección que quieras hacer editable:

```jsx
{/* Botón para editar información académica */}
{editingSection !== 'academic' && (
    <button 
        onClick={() => startEditing('academic')}
        style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            padding: '4px 8px',
            background: 'rgba(0,255,255,0.2)',
            border: '1px solid #00ffff',
            borderRadius: '4px',
            color: '#00ffff',
            fontSize: '0.75rem',
            cursor: 'pointer'
        }}
    >
        ✏️ EDITAR
    </button>
)}
```

#### **Secciones editables disponibles:**

1. **Información Académica** (`startEditing('academic')`)
   - Colegio
   - Grado
   - Nivel académico

2. **Información Personal** (`startEditing('personal')`)
   - Teléfono
   - Dirección
   - Email
   - Cédula

3. **Información Médica** (`startEditing('medical')`)
   - Tipo de sangre
   - Alergias
   - Enfermedades
   - Contacto de emergencia

4. **Datos de Padres** (`startEditing('guardian')`)
   - Nombre del padre
   - Teléfono del padre
   - Dirección del padre
   - Nombre de la madre
   - Teléfono de la madre
   - Dirección de la madre

---

### 3. **GUARDAR** (Automático)

Una vez que hagas clic en "EDITAR":

1. **Se abre el formulario** con los datos actuales
2. **Modificas los campos** que necesites
3. **Haces clic en "GUARDAR"**
4. **El sistema**:
   - Valida los datos
   - Envía al backend (`PUT /athletes/profile`)
   - Actualiza la base de datos
   - Recarga el perfil automáticamente
   - Muestra mensaje de éxito: "✅ Perfil actualizado correctamente"

Si hay error, muestra: "❌ Error al guardar cambios"

---

## 🔧 Para activar la edición completa

Necesitas modificar el archivo `frontend/src/pages/athlete/AthleteProfile.jsx` y agregar botones de edición.

### **Paso 1: Agregar botones en las secciones**

Busca las secciones que quieres hacer editables y agrega el botón. Por ejemplo, en la sección del colegio (línea ~580):

```jsx
{schoolName !== '—' && (
    <div style={{ width: '100%', marginTop: '8px', padding: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid #1f2937', position: 'relative' }}>
        {/* AGREGAR ESTE BOTÓN */}
        {editingSection !== 'academic' && (
            <button 
                onClick={() => startEditing('academic')}
                style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    padding: '4px 8px',
                    background: 'rgba(0,255,255,0.2)',
                    border: '1px solid #00ffff',
                    borderRadius: '4px',
                    color: '#00ffff',
                    fontSize: '0.625rem',
                    cursor: 'pointer'
                }}
            >
                ✏️
            </button>
        )}
        
        <p style={{ color: '#6b7280', fontSize: '0.625rem', marginBottom: '4px' }}>COLEGIO</p>
        <p style={{ color: '#22d3ee', fontSize: '0.875rem', fontWeight: 700 }}>{schoolName}</p>
    </div>
)}
```

### **Paso 2: Agregar el formulario de edición**

Después de cada sección, agrega el formulario condicional:

```jsx
{editingSection === 'academic' && (
    <div style={{ width: '100%', marginTop: '8px', padding: '12px', background: 'rgba(0,0,0,0.5)', borderRadius: '8px', border: '2px solid #a78bfa' }}>
        <p style={{ color: '#a78bfa', fontSize: '0.75rem', fontWeight: 700, marginBottom: '8px' }}>EDITAR INFORMACIÓN ACADÉMICA</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
                type="text"
                placeholder="Nombre del colegio"
                value={editForm.school_name}
                onChange={(e) => setEditForm({ ...editForm, school_name: e.target.value })}
                style={{ padding: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid #374151', borderRadius: '4px', color: 'white', fontSize: '0.875rem' }}
            />
            <input
                type="text"
                placeholder="Grado"
                value={editForm.grade}
                onChange={(e) => setEditForm({ ...editForm, grade: e.target.value })}
                style={{ padding: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid #374151', borderRadius: '4px', color: 'white', fontSize: '0.875rem' }}
            />
            <select
                value={editForm.academic_level}
                onChange={(e) => setEditForm({ ...editForm, academic_level: e.target.value })}
                style={{ padding: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid #374151', borderRadius: '4px', color: 'white', fontSize: '0.875rem' }}
            >
                <option value="">Seleccionar...</option>
                <option value="Primaria">Primaria</option>
                <option value="Secundaria">Secundaria</option>
                <option value="Bachillerato">Bachillerato</option>
            </select>
            <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                    onClick={saveProfile} 
                    disabled={saving}
                    style={{ flex: 1, padding: '8px', background: '#22c55e', border: 'none', borderRadius: '4px', color: 'white', fontWeight: 700, cursor: 'pointer' }}
                >
                    {saving ? 'GUARDANDO...' : 'GUARDAR'}
                </button>
                <button 
                    onClick={cancelEditing}
                    style={{ flex: 1, padding: '8px', background: '#ef4444', border: 'none', borderRadius: '4px', color: 'white', fontWeight: 700, cursor: 'pointer' }}
                >
                    CANCELAR
                </button>
            </div>
        </div>
    </div>
)}
```

---

## 📊 Resumen

### **Estado Actual:**
- ✅ **Visualización**: Funciona automáticamente
- ✅ **Backend**: Listo para guardar/editar
- ✅ **API**: Endpoint funcionando
- ⚠️ **Frontend**: Falta agregar botones de edición

### **Para activar edición:**
1. Agrega botones "✏️" en las secciones
2. Agrega formularios condicionales
3. El sistema ya tiene la lógica de guardado

### **Campos editables:**
- 13 campos de usuario
- 12 campos de atleta
- 10 campos médicos
- 3 campos académicos
- 12 campos de padres

**Total: 50 campos editables** desde el perfil del atleta.