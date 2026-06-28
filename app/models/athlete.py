from app.extensions import db
from datetime import datetime

class Athlete(db.Model):
    __tablename__ = 'athletes'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    birth_date = db.Column(db.Date)  # FECHA_NACIMIENTO
    birth_city = db.Column(db.String(100), nullable=True)  # CIUDAD_NACIMIENTO
    birth_country = db.Column(db.String(100), nullable=True)  # PAIS_NACIMIENTO
    phone = db.Column(db.String(20))  # WHATSAPP
    fixed_phone = db.Column(db.String(20), nullable=True)  # TELEFONO_FIJO
    address = db.Column(db.String(200))  # DIRECCION_RESIDENCIA
    neighborhood = db.Column(db.String(100), nullable=True)  # BARRIO
    insurance = db.Column(db.String(100), nullable=True)  # SEGURO
    uniforms = db.Column(db.String(200), nullable=True)  # UNIFORMES
    start_date = db.Column(db.Date, nullable=True)  # FECHA_INICIO
    eps = db.Column(db.String(100), nullable=True)  # EPS_NOMBRE
    physical_diseases = db.Column(db.Text, nullable=True)  # ENFERMEDADES_FISICAS
    medical_diseases = db.Column(db.Text, nullable=True)  # ENFERMEDADES_MEDICAS
    allergies = db.Column(db.Text, nullable=True)  # ALERGIAS
    physical_disability = db.Column(db.Text, nullable=True)  # INCAPACIDAD_FISICA
    photo_url = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationships
    guardians = db.relationship('Guardian', backref='athlete', lazy=True)
    medical_info = db.relationship('MedicalInfo', backref='athlete', uselist=False)
    academic_info = db.relationship('AcademicInfo', backref='athlete', uselist=False)
    attendance = db.relationship('Attendance', backref='athlete', lazy=True)
    payments = db.relationship('Payment', backref='athlete', lazy=True)
    group_history = db.relationship('GroupHistory', backref='athlete', lazy=True)

class Guardian(db.Model):
    __tablename__ = 'guardians'
    id = db.Column(db.Integer, primary_key=True)
    athlete_id = db.Column(db.Integer, db.ForeignKey('athletes.id'), nullable=False)
    # Datos del padre
    father_first_last_name = db.Column(db.String(50), nullable=True)  # DATOS_PADRE_PRIMER_APELLIDO
    father_second_last_name = db.Column(db.String(50), nullable=True)  # DATOS_PADRE_SEGUNDO_APELLIDO
    father_first_name = db.Column(db.String(50), nullable=True)  # DATOS_PADRE_NOMBRES
    father_home_address = db.Column(db.String(200), nullable=True)  # DIRECCION_RESIDENCIA_PADRE
    father_work_address = db.Column(db.String(200), nullable=True)  # DIRECCION_TRABAJO_PADRE
    father_phone = db.Column(db.String(20), nullable=True)  # WHATSAPP_PADRE
    # Datos de la madre
    mother_first_last_name = db.Column(db.String(50), nullable=True)  # DATOS_MADRE_PRIMER_APELLIDO
    mother_second_last_name = db.Column(db.String(50), nullable=True)  # DATOS_MADRE_SEGUNDO_APELLIDO
    mother_first_name = db.Column(db.String(50), nullable=True)  # DATOS_MADRE_NOMBRES
    mother_home_address = db.Column(db.String(200), nullable=True)  # DIRECCION_RESIDENCIA_MADRE
    mother_work_address = db.Column(db.String(200), nullable=True)  # DIRECCION_TRABAJO_MADRE
    mother_phone = db.Column(db.String(20), nullable=True)  # WHATSAPP_MADRE
    # Acudiente
    name = db.Column(db.String(100), nullable=False)  # ACUDIENTE_NOMBRE
    relationship = db.Column(db.String(50))  # ACUDIENTE_PARENTESCO
    phone = db.Column(db.String(20))  # ACUDIENTE_WHATSAPP
    email = db.Column(db.String(120))

class MedicalInfo(db.Model):
    __tablename__ = 'medical_info'
    id = db.Column(db.Integer, primary_key=True)
    athlete_id = db.Column(db.Integer, db.ForeignKey('athletes.id'), unique=True, nullable=False)
    blood_type = db.Column(db.String(5))  # RH
    allergies = db.Column(db.Text)  # ALERGIAS
    conditions = db.Column(db.Text)  # ENFERMEDADES_FISICAS + ENFERMEDADES_MEDICAS
    physical_diseases = db.Column(db.Text, nullable=True)  # ENFERMEDADES_FISICAS
    medical_diseases = db.Column(db.Text, nullable=True)  # ENFERMEDADES_MEDICAS
    physical_disability = db.Column(db.Text, nullable=True)  # INCAPACIDAD_FISICA
    emergency_contact = db.Column(db.String(100))  # EMERGENCIA_NOMBRE
    emergency_phone = db.Column(db.String(20), nullable=True)  # EMERGENCIA_WHATSAPP
    emergency_relationship = db.Column(db.String(50), nullable=True)  # EMERGENCIA_PARENTESCO
    emergency_alternate = db.Column(db.String(100), nullable=True)  # EMERGENCIA_CONTACTO_ALTERNATIVO

class AcademicInfo(db.Model):
    __tablename__ = 'academic_info'
    id = db.Column(db.Integer, primary_key=True)
    athlete_id = db.Column(db.Integer, db.ForeignKey('athletes.id'), unique=True, nullable=False)
    school_name = db.Column(db.String(100))  # NOMBRE_INSTITUCION_EDUCATIVA
    grade = db.Column(db.String(20))  # GRADO_SEMESTRE
    academic_level = db.Column(db.String(50), nullable=True)  # INSTITUCION_NIVEL_ACADEMICO_ACTUAL