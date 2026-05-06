from app.extensions import db
from app.models.payment import Payment

class PaymentService:
    @staticmethod
    def register_payment(data):
        payment = Payment(
            athlete_id=data['athlete_id'],
            amount=data['amount'],
            status=data.get('status', 'PAID'),
            payment_method=data.get('payment_method'),
            description=data.get('description'),
            due_date=data.get('due_date')
        )
        db.session.add(payment)
        db.session.commit()
        return payment

    @staticmethod
    def get_athlete_payments(athlete_id):
        return Payment.query.filter_by(athlete_id=athlete_id).order_by(Payment.payment_date.desc()).all()

    @staticmethod
    def update_payment_status(payment_id, status):
        payment = Payment.query.get(payment_id)
        if not payment:
            return None
        payment.status = status
        db.session.commit()
        return payment
