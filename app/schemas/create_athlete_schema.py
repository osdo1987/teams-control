from marshmallow import Schema, fields, validate, validates_schema, ValidationError


class CreateUserSchema(Schema):
    """Schema for validating user data when creating an athlete."""
    identification_number = fields.String(required=True, validate=validate.Length(min=1))
    document_type = fields.String(allow_none=True)
    email = fields.Email(allow_none=True)
    password = fields.String(
        required=True,
        validate=validate.Length(min=6),
        error_messages={"required": "Password is required"}
    )
    first_name = fields.String(required=True, validate=validate.Length(min=1))
    last_name = fields.String(required=True, validate=validate.Length(min=1))
    second_last_name = fields.String(allow_none=True)
    gender = fields.String(allow_none=True)
    blood_type = fields.String(allow_none=True)
    role = fields.String(
        required=True,
        validate=validate.OneOf(['SUPER_ADMIN', 'ADMIN', 'TRAINER', 'ATHLETE'])
    )
    club_id = fields.Integer(required=True)
    phone = fields.String(allow_none=True)
    fixed_phone = fields.String(allow_none=True)
    address = fields.String(allow_none=True)
    neighborhood = fields.String(allow_none=True)
    insurance = fields.String(allow_none=True)
    uniforms = fields.String(allow_none=True)
    start_date = fields.Date(allow_none=True)


class CreateAthleteSchema(Schema):
    """Schema for validating athlete creation request body."""
    user = fields.Nested(CreateUserSchema, required=True)
    athlete = fields.Dict(keys=fields.String(), values=fields.Raw(), required=True)
    group_id = fields.Integer(allow_none=True, load_default=None)

    @validates_schema
    def validate_athlete_fields(self, data, **kwargs):
        """Validate that athlete data contains expected fields."""
        athlete = data.get('athlete', {})
        allowed = {
            'birth_date', 'birth_city', 'birth_country', 'phone',
            'fixed_phone', 'address', 'neighborhood', 'insurance',
            'uniforms', 'start_date', 'eps', 'physical_diseases',
            'medical_diseases', 'allergies', 'physical_disability'
        }
        for key in athlete:
            if key not in allowed:
                raise ValidationError(f"Unexpected field in athlete: {key}", field_name="athlete")


class UpdateAthleteSchema(Schema):
    """Schema for validating athlete update request body."""
    user = fields.Dict(keys=fields.String(), values=fields.Raw(), allow_none=True)
    athlete = fields.Dict(keys=fields.String(), values=fields.Raw(), allow_none=True)
    group_id = fields.Integer(allow_none=True, load_default=None)
    medical_info = fields.Dict(keys=fields.String(), values=fields.Raw(), allow_none=True)
    academic_info = fields.Dict(keys=fields.String(), values=fields.Raw(), allow_none=True)
    guardian = fields.Dict(keys=fields.String(), values=fields.Raw(), allow_none=True)