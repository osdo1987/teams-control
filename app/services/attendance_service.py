from app.extensions import db
from app.models.attendance import Attendance
from datetime import datetime

class AttendanceService:
    @staticmethod
    def register_bulk_attendance(group_id, attendance_records):
        """
        Registers attendance for multiple athletes on a specific date.
        attendance_records format: [{'athlete_id': 1, 'date': '2023-10-01', 'status': 'PRESENT', 'notes': ''}, ...]
        """
        for record in attendance_records:
            date_obj = datetime.strptime(record['date'], '%Y-%m-%d').date()
            
            # Check if attendance already exists to update or insert
            attendance = Attendance.query.filter_by(
                athlete_id=record['athlete_id'],
                group_id=group_id,
                date=date_obj
            ).first()

            if attendance:
                attendance.status = record['status']
                attendance.notes = record.get('notes', attendance.notes)
            else:
                attendance = Attendance(
                    athlete_id=record['athlete_id'],
                    group_id=group_id,
                    date=date_obj,
                    status=record['status'],
                    notes=record.get('notes')
                )
                db.session.add(attendance)

        db.session.commit()
        return True, "Bulk attendance registered successfully"

    @staticmethod
    def get_athlete_attendance(athlete_id):
        return Attendance.query.filter_by(athlete_id=athlete_id).order_by(Attendance.date.desc()).all()

    @staticmethod
    def get_group_attendance(group_id):
        return Attendance.query.filter_by(group_id=group_id).order_by(Attendance.date.desc()).all()
