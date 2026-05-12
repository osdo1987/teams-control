from flask import Blueprint, jsonify
from app.models.club import Club
from app.models.user import User
from app.models.payment import Payment
from app.utils.decorators import role_required
from sqlalchemy import func
from app.extensions import db

stats_bp = Blueprint('stats', __name__)

@stats_bp.route('/global', methods=['GET'])
@role_required(['SUPER_ADMIN'])
def get_global_stats():
    """
    Get Global System Statistics (Super Admin Only)
    """
    # Club stats
    total_clubs = Club.query.count()
    
    # User stats
    total_users = User.query.count()
    admins = User.query.filter_by(role='ADMIN').count()
    trainers = User.query.filter_by(role='TRAINER').count()
    athletes = User.query.filter_by(role='ATHLETE').count()
    
    # Payment stats
    total_payments_amount = db.session.query(func.sum(Payment.amount)).scalar() or 0
    total_payments_count = Payment.query.count()
    
    # Recent Clubs
    recent_clubs = Club.query.order_by(Club.created_at.desc()).limit(5).all()
    recent_clubs_data = []
    for club in recent_clubs:
        recent_clubs_data.append({
            "id": club.id,
            "name": club.name,
            "created_at": club.created_at.isoformat()
        })

    # Club stats with user distribution
    clubs = Club.query.all()
    clubs_distribution = []
    for club in clubs:
        clubs_distribution.append({
            "id": club.id,
            "name": club.name,
            "sport": club.sport,
            "admins": User.query.filter_by(club_id=club.id, role='ADMIN').count(),
            "trainers": User.query.filter_by(club_id=club.id, role='TRAINER').count(),
            "athletes": User.query.filter_by(club_id=club.id, role='ATHLETE').count(),
            "total": User.query.filter_by(club_id=club.id).count(),
            "subscription_status": club.subscription_status,
            "plan_type": club.plan_type
        })

    # Financial Projection based on active plans
    # BASIC: 30, PRO: 70, UNLIMITED: 150
    plan_prices = {"BASIC": 30, "PRO": 70, "UNLIMITED": 150}
    projected_revenue = 0
    active_subscriptions = 0
    expired_subscriptions = 0
    
    for club in clubs:
        if club.subscription_status in ['ACTIVE', 'TRIAL']:
            active_subscriptions += 1
            if club.subscription_status == 'ACTIVE':
                projected_revenue += plan_prices.get(club.plan_type, 0)
        else:
            expired_subscriptions += 1

    return jsonify({
        "clubs": {
            "total": total_clubs,
            "recent": recent_clubs_data,
            "distribution": clubs_distribution,
            "subscriptions": {
                "active": active_subscriptions,
                "expired": expired_subscriptions,
                "projected_revenue": projected_revenue
            }
        },
        "users": {
            "total": total_users,
            "admins": admins,
            "trainers": trainers,
            "athletes": athletes
        },
        "payments": {
            "total_amount": float(total_payments_amount),
            "total_count": total_payments_count
        }
    }), 200
