from app.extensions import db
from app.models.group import Group, GroupHistory
from app.models.athlete import Athlete
from app.models.relations import group_athletes

class GroupService:
    @staticmethod
    def assign_athlete_to_group(athlete_id, group_id):
        athlete = Athlete.query.get(athlete_id)
        group = Group.query.get(group_id)
        
        if not athlete or not group:
            return False, "Athlete or Group not found"

        # Check if already in group
        if group in athlete.current_groups:
            return False, "Athlete already in this group"

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
        group = Group.query.get(group_id)
        return group.athletes if group else []

    @staticmethod
    def change_athlete_group(athlete_id, old_group_id, new_group_id):
        athlete = Athlete.query.get(athlete_id)
        old_group = Group.query.get(old_group_id)
        new_group = Group.query.get(new_group_id)
        
        if not athlete or not old_group or not new_group:
            return False, "Athlete or one of the Groups not found"

        # Check if athlete is in old group
        if old_group not in athlete.current_groups:
            return False, "Athlete is not in the old group"
            
        if new_group in athlete.current_groups:
            return False, "Athlete is already in the new group"

        # Record LEFT history for old group
        left_history = GroupHistory(
            athlete_id=athlete_id,
            group_id=old_group_id,
            action="LEFT"
        )
        # Remove from old
        old_group.athletes.remove(athlete)
        
        # Record JOINED history for new group
        join_history = GroupHistory(
            athlete_id=athlete_id,
            group_id=new_group_id,
            action="JOINED"
        )
        # Add to new
        new_group.athletes.append(athlete)
        
        db.session.add(left_history)
        db.session.add(join_history)
        db.session.commit()
        return True, "Athlete changed group successfully"
