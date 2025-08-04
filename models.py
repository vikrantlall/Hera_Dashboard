from flask_login import UserMixin
from datetime import datetime, date, time

# Note: db will be imported from app.py when this module is imported by app.py
db = None


class User(UserMixin):
    def __init__(self):
        from app import db as database
        global db
        db = database

        self.id = db.Column(db.Integer, primary_key=True)
        self.username = db.Column(db.String(80), unique=True, nullable=False)
        self.password_hash = db.Column(db.String(120), nullable=False)
        self.created_at = db.Column(db.DateTime, default=datetime.utcnow)


# We need to define the models differently to avoid circular imports
def init_models(database):
    global db
    db = database

    class User(UserMixin, db.Model):
        id = db.Column(db.Integer, primary_key=True)
        username = db.Column(db.String(80), unique=True, nullable=False)
        password_hash = db.Column(db.String(120), nullable=False)
        created_at = db.Column(db.DateTime, default=datetime.utcnow)

    class Budget(db.Model):
        id = db.Column(db.Integer, primary_key=True)
        category = db.Column(db.String(100), nullable=False)
        amount = db.Column(db.Float, nullable=False, default=0.0)
        saved = db.Column(db.Float, nullable=False, default=0.0)
        status = db.Column(db.String(20), default='Outstanding')  # Outstanding, Paid
        notes = db.Column(db.Text)
        created_at = db.Column(db.DateTime, default=datetime.utcnow)
        updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

        @property
        def remaining(self):
            return self.amount - self.saved

        @property
        def progress_percentage(self):
            if self.amount == 0:
                return 0
            return min((self.saved / self.amount) * 100, 100)

    class Ring(db.Model):
        id = db.Column(db.Integer, primary_key=True)
        jeweler = db.Column(db.String(200))
        stone = db.Column(db.String(500))
        metal = db.Column(db.String(100))
        style_inspiration = db.Column(db.Text)
        insurance = db.Column(db.String(200))
        status = db.Column(db.String(50), default='In Progress')
        notes = db.Column(db.Text)
        cost = db.Column(db.Float, default=0.0)
        deposit_paid = db.Column(db.Float, default=0.0)
        created_at = db.Column(db.DateTime, default=datetime.utcnow)
        updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    class Family(db.Model):
        id = db.Column(db.Integer, primary_key=True)
        name = db.Column(db.String(100), nullable=False)
        relationship = db.Column(db.String(50))
        status = db.Column(db.String(20), default='Pending')  # Pending, Approved, Declined
        conversation_date = db.Column(db.Date)
        reaction = db.Column(db.String(20))  # Positive, Neutral, Negative
        notes = db.Column(db.Text)
        created_at = db.Column(db.DateTime, default=datetime.utcnow)
        updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    class Travel(db.Model):
        id = db.Column(db.Integer, primary_key=True)
        type = db.Column(db.String(50), nullable=False)  # Flight, Hotel, Car
        provider = db.Column(db.String(200))
        details = db.Column(db.Text)
        confirmation = db.Column(db.String(100))
        date = db.Column(db.Date)
        departure_time = db.Column(db.Time)
        arrival_time = db.Column(db.Time)
        seats = db.Column(db.String(50))
        cost = db.Column(db.Float, default=0.0)
        status = db.Column(db.String(20), default='Confirmed')
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
        priority = db.Column(db.String(20), default='Medium')  # Low, Medium, High, Critical
        notes = db.Column(db.Text)
        completed = db.Column(db.Boolean, default=False)
        created_at = db.Column(db.DateTime, default=datetime.utcnow)
        updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

        @property
        def is_proposal(self):
            return 'PROPOSAL' in self.activity.upper()

        @property
        def time_range(self):
            if self.start_time and self.end_time:
                return f"{self.start_time.strftime('%H:%M')}–{self.end_time.strftime('%H:%M')}"
            elif self.start_time:
                return self.start_time.strftime('%H:%M')
            return None

    class Packing(db.Model):
        id = db.Column(db.Integer, primary_key=True)
        category = db.Column(db.String(100), nullable=False)
        item = db.Column(db.String(200), nullable=False)
        priority = db.Column(db.String(20), default='Medium')  # Low, Medium, High, Critical
        packed = db.Column(db.Boolean, default=False)
        notes = db.Column(db.Text)
        quantity = db.Column(db.Integer, default=1)
        created_at = db.Column(db.DateTime, default=datetime.utcnow)
        updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

        @property
        def is_critical(self):
            return self.priority == 'Critical' or 'ring' in self.item.lower()

    return User, Budget, Ring, Family, Travel, Itinerary, Packing