from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.category import Category
from app.models.user import User
from app.schemas.category_schema import CategorySchema
from app.extensions import db
from app.utils.decorators import role_required

category_bp = Blueprint('categories', __name__)
category_schema = CategorySchema()
categories_schema = CategorySchema(many=True)

@category_bp.route('', methods=['GET'])
@jwt_required()
def get_categories():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role == 'SUPER_ADMIN':
        categories = Category.query.all()
    else:
        categories = Category.query.filter_by(club_id=user.club_id).all()
        
    return jsonify(categories_schema.dump(categories)), 200

@category_bp.route('', methods=['POST'])
@jwt_required()
@role_required(['ADMIN'])
def create_category():
    data = request.get_json()
    new_category = Category(
        name=data['name'],
        club_id=data['club_id']
    )
    db.session.add(new_category)
    db.session.commit()
    return jsonify(category_schema.dump(new_category)), 201

@category_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
@role_required(['ADMIN'])
def delete_category(id):
    category = Category.query.get_or_404(id)
    db.session.delete(category)
    db.session.commit()
    return jsonify({"message": "Categoría eliminada"}), 200
