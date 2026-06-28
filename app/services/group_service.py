from app.extensions import db
from app.models.group import Group, GroupHistory
from app.models.athlete import Athlete
from app.models.user import User
from app.exceptions import NotFoundError, ValidationError, ConflictError


class GroupService:
    """Service for Group-related business logic."""

    @staticmethod
    def get_groups(club_id=None, user_role=None, user=None, include_inactive=False):
        """Get groups filtered by role and club."""
        from app.models.group import Group

        if user_role == 'SUPER_ADMIN':
            if include_inactive:
                return Group.query.all()
            return Group.query.filter(Group.status != 'INACTIVE').all()

        if user_role == 'TRAINER' and user:
            # Trainers only see groups they're assigned to
            return [g for g in user.trainer_groups if include_inactive or g.status != 'INACTIVE']

        # ADMIN or other roles scoped to club
        query = Group.query.filter_by(club_id=club_id)
        if not include_inactive:
            query = query.filter(Group.status != 'INACTIVE')
        return query.all()

    @staticmethod
    def create_group(data):
        """Create a new group with trainer assignment."""
        trainer_ids = data.get('trainer_ids', [])
        if not trainer_ids:
            raise ValidationError("Debe asignar al menos un entrenador al grupo")

        # Verify trainers exist and have TRAINER role
        trainers = User.query.filter(
            User.id.in_(trainer_ids), User.role == 'TRAINER'
        ).all()
        if len(trainers) != len(trainer_ids):
            raise ValidationError(
                "Uno o más entrenadores no fueron encontrados o no tienen rol TRAINER"
            )

        group = Group(
            name=data['name'],
            club_id=data['club_id'],
            category_id=data.get('category_id'),
            description=data.get('description'),
            max_capacity=data.get('max_capacity'),
            schedule=data.get('schedule'),
            schedule_days=data.get('schedule_days'),
            schedule_start_time=data.get('schedule_start_time'),
            schedule_end_time=data.get('schedule_end_time'),
            schedule_blocks=data.get('schedule_blocks'),
            training_location=data.get('training_location'),
            level=data.get('level'),
            season=data.get('season'),
            monthly_fee=data.get('monthly_fee')
        )

        # Assign trainers
        for trainer in trainers:
            group.trainers.append(trainer)

        db.session.add(group)
        db.session.commit()
        return group

    @staticmethod
    def update_group(group_id, data):
        """Update group fields and optionally trainers."""
        group = Group.query.get(group_id)
        if not group:
            raise NotFoundError(f"Group with id {group_id} not found")

        simple_fields = [
            'name', 'schedule', 'club_id', 'category_id', 'description',
            'max_capacity', 'schedule_days', 'schedule_start_time', 'schedule_end_time',
            'schedule_blocks', 'training_location', 'status', 'level', 'season', 'monthly_fee'
        ]
        for field in simple_fields:
            if field in data:
                setattr(group, field, data[field])

        # Update trainers if provided
        if 'trainer_ids' in data:
            trainer_ids = data['trainer_ids']
            if not trainer_ids:
                raise ValidationError("Debe asignar al menos un entrenador al grupo")
            trainers = User.query.filter(
                User.id.in_(trainer_ids), User.role == 'TRAINER'
            ).all()
            if len(trainers) != len(trainer_ids):
                raise ValidationError("Uno o más entrenadores no fueron encontrados")
            group.trainers = trainers

        db.session.commit()
        return group

    @staticmethod
    def assign_athlete_to_group(athlete_id, group_id):
        """Assign an athlete to a group with history tracking."""
        if not athlete_id or not group_id:
            raise ValidationError("athlete_id and group_id are required")

        athlete = Athlete.query.get(athlete_id)
        group = Group.query.get(group_id)

        if not athlete or not group:
            raise NotFoundError("Athlete or Group not found")

        # Check if already in group
        if group in athlete.current_groups:
            raise ConflictError("Athlete already in this group")

        # Record history
        history = GroupHistory(
            athlete_id=athlete_id,
            group_id=group_id,
            action="JOINED"
        )
        db.session.add(history)

        # Add to association
        group.athletes.append(athlete)
        db.session.commit()
        return True, "Athlete assigned successfully"

    @staticmethod
    def get_group_athletes(group_id):
        """Get all athletes in a group."""
        group = Group.query.get(group_id)
        if not group:
            raise NotFoundError(f"Group with id {group_id} not found")
        return group.athletes

    @staticmethod
    def change_athlete_group(athlete_id, old_group_id, new_group_id):
        """Move an athlete from one group to another."""
        if not athlete_id or not old_group_id or not new_group_id:
            raise ValidationError("athlete_id, old_group_id and new_group_id are required")

        athlete = Athlete.query.get(athlete_id)
        old_group = Group.query.get(old_group_id)
        new_group = Group.query.get(new_group_id)

        if not athlete or not old_group or not new_group:
            raise NotFoundError("Athlete or one of the Groups not found")

        # Check if athlete is in old group
        if old_group not in athlete.current_groups:
            raise ValidationError("Athlete is not in the old group")

        if new_group in athlete.current_groups:
            raise ConflictError("Athlete is already in the new group")

        # Record LEFT history for old group
        left_history = GroupHistory(
            athlete_id=athlete_id,
            group_id=old_group_id,
            action="LEFT"
        )
        old_group.athletes.remove(athlete)

        # Record JOINED history for new group
        join_history = GroupHistory(
            athlete_id=athlete_id,
            group_id=new_group_id,
            action="JOINED"
        )
        new_group.athletes.append(athlete)

        db.session.add(left_history)
        db.session.add(join_history)
        db.session.commit()
        return True, "Athlete changed group successfully"

    @staticmethod
    def delete_group(group_id):
        """Soft delete a group (mark as INACTIVE)."""
        group = Group.query.get(group_id)
        if not group:
            raise NotFoundError("Group not found")

        group.status = 'INACTIVE'
        db.session.commit()
        return True, "Group deactivated successfully"

    @staticmethod
    def reactivate_group(group_id):
        """Reactivate a soft-deleted group."""
        group = Group.query.get(group_id)
        if not group:
            raise NotFoundError("Group not found")

        group.status = 'ACTIVE'
        db.session.commit()
        return True, "Group reactivated successfully"