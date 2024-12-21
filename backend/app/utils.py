from .models import WheelItem
from .extensions import db

def init_default_wheel_items(db):
    """Initialize default wheel items if none exist"""
    if WheelItem.query.count() == 0:
        default_items = [
            {"name": "appel", "chance": 5.0, "color": "#FF0000"},
            {"name": "citroen", "chance": 15.0, "color": "#00FF00"},
            {"name": "graan", "chance": 30.0, "color": "#0000FF"},
            {"name": "appelkers", "chance": 50.0, "color": "#FFFF00"},
            {"name": "mango-passievrucht", "chance": 50.0, "color": "#FFFF00"}
            ,{"name": "vanille", "chance": 50.0, "color": "#FFFF00"}
           , {"name": "kuberdon", "chance": 50.0, "color": "#FFFF00"}

        ]
        
        for item in default_items:
            db_item = WheelItem(**item)
            db.session.add(db_item)
        
        db.session.commit()