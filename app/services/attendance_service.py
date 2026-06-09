from app.extensions import db
from app.models.attendance import Attendance
from datetime import datetime, timedelta
from sqlalchemy import func, extract

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

    @staticmethod
    def check_attendance_taken(group_id, date_str):
        """Check if attendance has already been taken for a group on a specific date."""
        date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
        records = Attendance.query.filter_by(group_id=group_id, date=date_obj).count()
        athletes_with_attendance = (
            db.session.query(Attendance.athlete_id)
            .filter_by(group_id=group_id, date=date_obj)
            .distinct()
            .count()
        )
        return {
            "taken": records > 0,
            "count": athletes_with_attendance,
            "date": date_str
        }

    @staticmethod
    def get_group_attendance_range(group_id, start_date, end_date):
        """Get attendance records for a group within a date range."""
        start_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
        end_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
        return (
            Attendance.query
            .filter(
                Attendance.group_id == group_id,
                Attendance.date >= start_obj,
                Attendance.date <= end_obj
            )
            .order_by(Attendance.date.desc(), Attendance.athlete_id)
            .all()
        )

    @staticmethod
    def get_group_attendance_stats(group_id, start_date=None, end_date=None):
        """Get attendance statistics for a group within a date range."""
        from app.models.group import Group
        from app.models.athlete import Athlete

        # Get total athletes in the group (many-to-many via group_athletes)
        group = Group.query.get(group_id)
        if not group:
            return {
                "total_athletes": 0, "total_sessions": 0,
                "present_count": 0, "absent_count": 0,
                "justified_count": 0, "attendance_rate": 0,
                "daily_stats": [], "athlete_stats": []
            }
        total_athletes = len(group.athletes)
        if total_athletes == 0:
            return {
                "total_athletes": 0,
                "total_sessions": 0,
                "present_count": 0,
                "absent_count": 0,
                "justified_count": 0,
                "attendance_rate": 0,
                "daily_stats": [],
                "athlete_stats": []
            }

        query = Attendance.query.filter_by(group_id=group_id)

        if start_date:
            start_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
            query = query.filter(Attendance.date >= start_obj)
        if end_date:
            end_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
            query = query.filter(Attendance.date <= end_obj)

        records = query.all()

        # Overall counts
        present_count = sum(1 for r in records if r.status == 'PRESENT')
        absent_count = sum(1 for r in records if r.status == 'ABSENT')
        justified_count = sum(1 for r in records if r.status in ('JUSTIFIED', 'EXCUSED'))
        total_records = len(records)

        # Unique session dates
        session_dates = sorted(set(r.date.isoformat() for r in records))
        total_sessions = len(session_dates)

        # Attendance rate
        max_possible = total_athletes * total_sessions if total_sessions > 0 else 1
        attendance_rate = round((present_count / max_possible * 100), 1) if max_possible > 0 else 0

        # Daily stats (per date)
        daily_stats = []
        for date_str in session_dates:
            day_records = [r for r in records if r.date.isoformat() == date_str]
            day_present = sum(1 for r in day_records if r.status == 'PRESENT')
            day_absent = sum(1 for r in day_records if r.status == 'ABSENT')
            day_justified = sum(1 for r in day_records if r.status in ('JUSTIFIED', 'EXCUSED'))
            day_total = len(day_records)
            day_rate = round((day_present / total_athletes * 100), 1) if total_athletes > 0 else 0

            daily_stats.append({
                "date": date_str,
                "present": day_present,
                "absent": day_absent,
                "justified": day_justified,
                "total": day_total,
                "rate": day_rate
            })

        # Per-athlete stats
        athlete_stats = []
        athlete_ids = set(r.athlete_id for r in records)
        for aid in athlete_ids:
            athlete_records = [r for r in records if r.athlete_id == aid]
            a_present = sum(1 for r in athlete_records if r.status == 'PRESENT')
            a_absent = sum(1 for r in athlete_records if r.status == 'ABSENT')
            a_justified = sum(1 for r in athlete_records if r.status in ('JUSTIFIED', 'EXCUSED'))
            a_total = len(athlete_records)
            a_rate = round((a_present / a_total * 100), 1) if a_total > 0 else 0

            # Get athlete name
            athlete = Athlete.query.get(aid)
            name = ""
            if athlete and athlete.user:
                name = f"{athlete.user.first_name or ''} {athlete.user.last_name or ''}".strip()

            athlete_stats.append({
                "athlete_id": aid,
                "name": name or f"Atleta #{aid}",
                "present": a_present,
                "absent": a_absent,
                "justified": a_justified,
                "total": a_total,
                "rate": a_rate
            })

        # Sort athlete stats by name
        athlete_stats.sort(key=lambda x: x['name'])

        return {
            "total_athletes": total_athletes,
            "total_sessions": total_sessions,
            "present_count": present_count,
            "absent_count": absent_count,
            "justified_count": justified_count,
            "attendance_rate": attendance_rate,
            "daily_stats": daily_stats,
            "athlete_stats": athlete_stats
        }
