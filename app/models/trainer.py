from app.extensions import db
from datetime import datetime

class TrainerProfile(db.Model):
    """Perfil extendido para entrenadores con datos personales, de pago y educación."""
    __tablename__ = 'trainer_profiles'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    
    # --- Datos Personales ---
    birth_date = db.Column(db.Date, nullable=True)
    gender = db.Column(db.String(20), nullable=True)  # Masculino, Femenino, Otro
    address = db.Column(db.String(200), nullable=True)
    city = db.Column(db.String(100), nullable=True)
    state = db.Column(db.String(100), nullable=True)
    emergency_contact_name = db.Column(db.String(100), nullable=True)
    emergency_contact_phone = db.Column(db.String(20), nullable=True)
    profile_photo_url = db.Column(db.String(300), nullable=True)
    
    # --- Datos de Pago ---
    bank_name = db.Column(db.String(100), nullable=True)
    bank_account_number = db.Column(db.String(50), nullable=True)
    bank_account_type = db.Column(db.String(30), nullable=True)  # Ahorros, Corriente
    salary = db.Column(db.Numeric(12, 2), nullable=True)
    payment_frequency = db.Column(db.String(30), nullable=True)  # Mensual, Quincenal, Semanal
    tax_id = db.Column(db.String(30), nullable=True)  # NIT o RUT
    
    # --- Datos de Educación ---
    education_level = db.Column(db.String(50), nullable=True)  # Bachiller, Técnico, Profesional, Posgrado
    institution = db.Column(db.String(150), nullable=True)
    degree_title = db.Column(db.String(150), nullable=True)
    graduation_year = db.Column(db.Integer, nullable=True)
    certifications = db.Column(db.Text, nullable=True)  # Certificaciones deportivas (JSON o texto libre)
    specialization = db.Column(db.String(150), nullable=True)  # Especialización deportiva
    
    # --- Experiencia ---
    years_of_experience = db.Column(db.Integer, nullable=True)
    previous_clubs = db.Column(db.Text, nullable=True)  # Clubes anteriores
    bio = db.Column(db.Text, nullable=True)  # Biografía o resumen profesional
    
    # --- Metadata ---
    hire_date = db.Column(db.Date, nullable=True)
    contract_type = db.Column(db.String(50), nullable=True)  # Tiempo completo, Medio tiempo, Contrato
    status = db.Column(db.String(20), default='ACTIVE')  # ACTIVE, INACTIVE, ON_LEAVE
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<TrainerProfile user_id={self.user_id}>'
