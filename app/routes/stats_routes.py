from flask import Blueprint, jsonify, request
from app.models.club import Club
from app.models.user import User
from app.models.payment import Payment
from app.models.attendance import Attendance
from app.models.test import TestResult, TestTemplate
from app.models.athlete import Athlete
from app.utils.decorators import role_required
from sqlalchemy import func
from app.extensions import db
from datetime import datetime, timedelta
from flask_jwt_extended import jwt_required, get_jwt_identity

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

    # Financial Projection in COP
    # BASIC: 120.000, PRO: 280.000, UNLIMITED: 600.000, FLEXIBLE: 500 per athlete
    plan_prices = {"BASIC": 120000, "PRO": 280000, "UNLIMITED": 600000}
    projected_revenue = 0
    active_subscriptions = 0
    expired_subscriptions = 0
    
    for club in clubs:
        if club.subscription_status in ['ACTIVE', 'TRIAL']:
            active_subscriptions += 1
            if club.subscription_status == 'ACTIVE':
                if club.plan_type == 'FLEXIBLE':
                    athlete_count = User.query.filter_by(club_id=club.id, role='ATHLETE').count()
                    projected_revenue += (athlete_count * 1000)
                else:
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


@stats_bp.route('/dashboard', methods=['GET'])
@jwt_required()
@role_required(['ADMIN', 'TRAINER'])
def get_dashboard_stats():
    """
    Get dashboard stats for the admin panel (attendance, payments, tests summary).
    """
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    club_id = user.club_id if user.role != 'SUPER_ADMIN' else None

    today = datetime.utcnow().date()
    month_start = today.replace(day=1)

    # Weekly attendance (last 7 days)
    week_dates = [(today - timedelta(days=i)) for i in range(6, -1, -1)]
    weekly_attendance = []
    for d in week_dates:
        base = Attendance.query.filter(Attendance.date == d)
        if club_id:
            base = base.join(Athlete, Attendance.athlete_id == Athlete.id).filter(Athlete.user.has(club_id=club_id))
        total = base.count()
        present = base.filter(Attendance.status == 'PRESENT').count()
        absent = base.filter(Attendance.status == 'ABSENT').count()
        excused = base.filter(Attendance.status == 'EXCUSED').count()
        weekly_attendance.append({
            "date": d.isoformat(),
            "total": total,
            "present": present,
            "absent": absent,
            "excused": excused,
            "present_pct": round((present / total * 100), 1) if total > 0 else 0
        })

    # Payment distribution for current month
    payment_query = Payment.query.filter(
        Payment.payment_date >= month_start
    )
    if club_id:
        payment_query = payment_query.join(Payment.athlete).filter(Athlete.user.has(club_id=club_id))
    payments_this_month = payment_query.all()
    paid_count = sum(1 for p in payments_this_month if p.status == 'PAID')
    pending_count = sum(1 for p in payments_this_month if p.status == 'PENDING')
    overdue_count = sum(1 for p in payments_this_month if p.status == 'OVERDUE')
    total_paid = sum(float(p.amount) for p in payments_this_month if p.status == 'PAID')

    # Tests summary (recent results)
    test_query = TestResult.query
    if club_id:
        test_query = test_query.join(TestResult.athlete).filter(Athlete.user.has(club_id=club_id))
    recent_tests_count = test_query.filter(TestResult.test_date >= month_start).count()
    total_tests_count = test_query.count()
    athletes_tested = test_query.with_entities(TestResult.athlete_id).distinct().count()

    # Monthly revenue trend (last 6 months)
    revenue_trend = []
    for i in range(5, -1, -1):
        m_start = (today.replace(day=1) - timedelta(days=i * 30)).replace(day=1)
        m_end = (m_start + timedelta(days=32)).replace(day=1)
        m_payments = Payment.query.filter(
            Payment.payment_date >= m_start, Payment.payment_date < m_end
        )
        if club_id:
            m_payments = m_payments.join(Payment.athlete).filter(Athlete.user.has(club_id=club_id))
        m_total = sum(float(p.amount) for p in m_payments.all() if p.status == 'PAID')
        revenue_trend.append({
            "month": m_start.strftime('%Y-%m'),
            "month_label": m_start.strftime('%b %Y'),
            "revenue": round(m_total, 2)
        })

    # Athletes per group
    from app.models.group import Group as GroupModel, group_athletes as ga_table
    groups_query = GroupModel.query
    if club_id:
        groups_query = groups_query.filter_by(club_id=club_id)
    all_groups = groups_query.all()
    athletes_per_group = []
    for g in all_groups:
        count = db.session.query(ga_table.c.athlete_id).filter(ga_table.c.group_id == g.id).count()
        athletes_per_group.append({"group": g.name, "count": count})
    # Athletes without group
    if club_id:
        athletes_no_group = Athlete.query.filter(
            ~Athlete.id.in_(db.session.query(ga_table.c.athlete_id)),
            Athlete.user.has(club_id=club_id)
        ).count()
    else:
        athletes_no_group = Athlete.query.filter(
            ~Athlete.id.in_(db.session.query(ga_table.c.athlete_id))
        ).count()
    if athletes_no_group > 0:
        athletes_per_group.append({"group": "Sin grupo", "count": athletes_no_group})

    # Attendance monthly trend (last 6 months)
    attendance_trend = []
    for i in range(5, -1, -1):
        m_start = (today.replace(day=1) - timedelta(days=i * 30)).replace(day=1)
        m_end = (m_start + timedelta(days=32)).replace(day=1)
        m_att = Attendance.query.filter(
            Attendance.date >= m_start, Attendance.date < m_end
        )
        if club_id:
            m_att = m_att.join(Athlete, Attendance.athlete_id == Athlete.id).filter(Athlete.user.has(club_id=club_id))
        m_total_att = m_att.count()
        m_present_att = m_att.filter(Attendance.status == 'PRESENT').count()
        attendance_trend.append({
            "month": m_start.strftime('%Y-%m'),
            "month_label": m_start.strftime('%b %Y'),
            "total": m_total_att,
            "present": m_present_att,
            "pct": round((m_present_att / m_total_att * 100), 1) if m_total_att > 0 else 0
        })

    return jsonify({
        "attendance": {
            "weekly": weekly_attendance,
            "trend": attendance_trend
        },
        "payments": {
            "paid": paid_count,
            "pending": pending_count,
            "overdue": overdue_count,
            "total_paid": round(total_paid, 2),
            "revenue_trend": revenue_trend
        },
        "tests": {
            "recent_count": recent_tests_count,
            "total_count": total_tests_count,
            "athletes_tested": athletes_tested
        },
        "groups": athletes_per_group
    }), 200
