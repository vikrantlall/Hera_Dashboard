from flask_login import UserMixin
from datetime import datetime
from database import db

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)

class Budget(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(100), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='Outstanding')
    notes = db.Column(db.Text)
    emoji = db.Column(db.String(10))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Ring(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    jeweler = db.Column(db.String(100))
    stone = db.Column(db.String(200))
    metal = db.Column(db.String(100))
    style_inspiration = db.Column(db.String(500))
    insurance = db.Column(db.String(100))
    status = db.Column(db.String(50))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Family(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(20), nullable=False, default='Pending')
    reaction = db.Column(db.Text)
    conversation_date = db.Column(db.Date)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Travel(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(50), nullable=False)  # Flight, Hotel, etc.
    description = db.Column(db.String(500))
    confirmation_code = db.Column(db.String(50))
    date_from = db.Column(db.Date)
    date_to = db.Column(db.Date)
    time_from = db.Column(db.Time)
    time_to = db.Column(db.Time)
    location_from = db.Column(db.String(200))
    location_to = db.Column(db.String(200))
    status = db.Column(db.String(50))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Itinerary(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    day = db.Column(db.Integer, nullable=False)
    date = db.Column(db.Date)
    start_time = db.Column(db.Time)
    end_time = db.Column(db.Time)
    activity = db.Column(db.String(500), nullable=False)
    location = db.Column(db.String(200))
    category = db.Column(db.String(100))
    priority = db.Column(db.String(20), default='Medium')
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Packing(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(100), nullable=False)
    item = db.Column(db.String(200), nullable=False)
    priority = db.Column(db.String(20), default='Medium')
    packed = db.Column(db.Boolean, default=False)
    notes = db.Column(db.Text)
    emoji = db.Column(db.String(10))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)