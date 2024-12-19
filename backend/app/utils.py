from .models import WheelItem
from .extensions import db

def init_default_wheel_items(db):
    """Initialize default wheel items if none exist"""
    if WheelItem.query.count() == 0:
        default_items = [
            {"name": "Grand Prize", "chance": 5.0},
            {"name": "Medium Prize", "chance": 15.0},
            {"name": "Small Prize", "chance": 30.0},
            {"name": "Try Again", "chance": 50.0}
        ]
        
        for item in default_items:
            db_item = WheelItem(**item)
            db.session.add(db_item)
        
        db.session.commit()