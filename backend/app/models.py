from datetime import datetime
from .extensions import db

class WheelItem(db.Model):
    __tablename__ = "wheel_items"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    chance = db.Column(db.Float, nullable=False)
    color = db.Column(db.String(20), nullable=False)

    def __repr__(self):
        return f"<WheelItem {self.name}>"

class SpinLog(db.Model):
    __tablename__ = "spin_logs"

    id = db.Column(db.Integer, primary_key=True)
    item_name = db.Column(db.String)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<SpinLog {self.item_name} at {self.timestamp}>"

class DrinkCounter(db.Model):
    __tablename__ = "drink_counter"

    id = db.Column(db.Integer, primary_key=True)
    count = db.Column(db.Integer, default=0)

    def __repr__(self):
        return f"<DrinkCounter {self.count}>"