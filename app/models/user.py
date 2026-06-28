from app.extensions import db, bcrypt
from datetime import datetime

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    identification_number = db.Column(db.String(30), unique=True, nullable=False)
    document_type = db.Column(db.String(20), nullable=True)  # TIPO_DOCUMENTO_IDENTIDAD
    email = db.Column(db.String(120), nullable=True)
    password_hash = db.Column(db.String(128), nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)  # PRIMER_APELLIDO
    second_last_name = db.Column(db.String(50), nullable=True)  # SEGUNDO_APELLIDO
    gender = db.Column(db.String(20), nullable=True)  # GENERO
    blood_type = db.Column(db.String(5), nullable=True)  # RH
    birth_city = db.Column(db.String(100), nullable=True)  # CIUDAD_NACIMIENTO
    birth_country = db.Column(db.String(100), nullable=True)  # PAIS_NACIMIENTO
    role = db.Column(db.String(20), nullable=False)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=True)
    phone = db.Column(db.String(20), nullable=True)  # WHATSAPP
    fixed_phone = db.Column(db.String(20), nullable=True)  # TELEFONO_FIJO
    address = db.Column(db.String(200), nullable=True)  # DIRECCION_RESIDENCIA
    neighborhood = db.Column(db.String(100), nullable=True)  # BARRIO
    insurance = db.Column(db.String(100), nullable=True)  # SEGURO
    uniforms = db.Column(db.String(200), nullable=True)  # UNIFORMES
    start_date = db.Column(db.Date, nullable=True)  # FECHA_INICIO
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    athlete_profile = db.relationship('Athlete', backref='user', uselist=False)
    trainer_profile = db.relationship('TrainerProfile', backref='user', uselist=False)

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    def __repr__(self):
        full_name = f"{self.first_name} {self.last_name}"
        if self.second_last_name:
            full_name += f" {self.second_last_name}"
        return f'<User {self.identification_number} - {full_name}>'