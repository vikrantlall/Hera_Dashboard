from datetime import datetime
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from database import db
import os

class User(UserMixin, db.Model):
    """User model for authentication"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check if provided password matches hash"""
        return check_password_hash(self.password_hash, password)
    
    def __repr__(self):
        return f'<User {self.username}>'


class Budget(db.Model):
    """Budget tracking model"""
    __tablename__ = 'budgets'
    
    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(100), nullable=False, index=True)
    amount = db.Column(db.Float, nullable=False, default=0.0)
    saved = db.Column(db.Float, nullable=False, default=0.0)
    status = db.Column(db.String(20), default='Outstanding')  # Outstanding, Paid
    notes = db.Column(db.Text)
    priority = db.Column(db.String(20), default='Medium')  # Low, Medium, High, Critical
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    @property
    def remaining(self):
        """Calculate remaining amount to save"""
        return max(0, self.amount - self.saved)
    
    @property
    def progress_percentage(self):
        """Calculate savings progress as percentage"""
        if self.amount == 0:
            return 100 if self.saved > 0 else 0
        return min(round((self.saved / self.amount) * 100, 2), 100)
    
    @property
    def is_complete(self):
        """Check if budget item is fully saved"""
        return self.saved >= self.amount
    
    def to_dict(self):
        """Convert to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'category': self.category,
            'amount': self.amount,
            'saved': self.saved,
            'remaining': self.remaining,
            'status': self.status,
            'notes': self.notes,
            'priority': self.priority,
            'progress_percentage': self.progress_percentage,
            'is_complete': self.is_complete,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<Budget {self.category}: ${self.amount}>'


class Family(db.Model):
    """Family member approval tracking"""
    __tablename__ = 'family'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, index=True)
    relationship = db.Column(db.String(50))
    status = db.Column(db.String(20), default='Pending')  # Pending, Approved, Declined
    conversation_date = db.Column(db.Date)
    reaction = db.Column(db.String(20))  # Positive, Neutral, Negative
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    @property
    def is_approved(self):
        """Check if family member has approved"""
        return self.status == 'Approved'
    
    @property
    def days_since_conversation(self):
        """Calculate days since conversation"""
        if self.conversation_date:
            return (datetime.now().date() - self.conversation_date).days
        return None
    
    def to_dict(self):
        """Convert to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'name': self.name,
            'relationship': self.relationship,
            'status': self.status,
            'conversation_date': self.conversation_date.isoformat() if self.conversation_date else None,
            'reaction': self.reaction,
            'notes': self.notes,
            'is_approved': self.is_approved,
            'days_since_conversation': self.days_since_conversation,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<Family {self.name} ({self.relationship}): {self.status}>'


class Travel(db.Model):
    """Travel arrangements tracking"""
    __tablename__ = 'travel'
    
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(50), nullable=False, index=True)  # Flight, Hotel, Car, Transport, Other
    provider = db.Column(db.String(200))
    details = db.Column(db.Text)
    confirmation = db.Column(db.String(100))
    date = db.Column(db.Date, index=True)
    departure_time = db.Column(db.Time)
    arrival_time = db.Column(db.Time)
    cost = db.Column(db.Float, default=0.0)
    status = db.Column(db.String(20), default='Confirmed')  # Pending, Confirmed, Cancelled
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    @property
    def is_upcoming(self):
        """Check if travel is upcoming"""
        if self.date:
            return self.date >= datetime.now().date()
        return False
    
    @property
    def days_until(self):
        """Calculate days until travel"""
        if self.date:
            delta = self.date - datetime.now().date()
            return delta.days if delta.days >= 0 else None
        return None
    
    def to_dict(self):
        """Convert to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'type': self.type,
            'provider': self.provider,
            'details': self.details,
            'confirmation': self.confirmation,
            'date': self.date.isoformat() if self.date else None,
            'departure_time': self.departure_time.isoformat() if self.departure_time else None,
            'arrival_time': self.arrival_time.isoformat() if self.arrival_time else None,
            'cost': self.cost,
            'status': self.status,
            'notes': self.notes,
            'is_upcoming': self.is_upcoming,
            'days_until': self.days_until,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<Travel {self.type} on {self.date}: {self.provider}>'


class Itinerary(db.Model):
    """Wedding itinerary tracking"""
    __tablename__ = 'itinerary'
    
    id = db.Column(db.Integer, primary_key=True)
    day = db.Column(db.Integer, nullable=False, index=True)
    date = db.Column(db.Date)
    time = db.Column(db.Time)
    activity = db.Column(db.String(500), nullable=False)
    location = db.Column(db.String(200))
    completed = db.Column(db.Boolean, default=False)
    is_proposal = db.Column(db.Boolean, default=False)
    notes = db.Column(db.Text)
    priority = db.Column(db.String(20), default='Medium')  # Low, Medium, High, Critical
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    @property
    def is_critical(self):
        """Check if activity is critical"""
        return self.priority == 'Critical' or self.is_proposal
    
    @property
    def status(self):
        """Get activity status"""
        if self.completed:
            return 'Completed'
        elif self.date and self.date < datetime.now().date():
            return 'Overdue'
        else:
            return 'Pending'
    
    def to_dict(self):
        """Convert to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'day': self.day,
            'date': self.date.isoformat() if self.date else None,
            'time': self.time.isoformat() if self.time else None,
            'activity': self.activity,
            'location': self.location,
            'completed': self.completed,
            'is_proposal': self.is_proposal,
            'notes': self.notes,
            'priority': self.priority,
            'is_critical': self.is_critical,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<Itinerary Day {self.day}: {self.activity}>'


class Packing(db.Model):
    """Packing list tracking"""
    __tablename__ = 'packing'
    
    id = db.Column(db.Integer, primary_key=True)
    item = db.Column(db.String(200), nullable=False)
    packed = db.Column(db.Boolean, default=False)
    category = db.Column(db.String(100), index=True)
    notes = db.Column(db.Text)
    quantity = db.Column(db.Integer, default=1)
    priority = db.Column(db.String(20), default='Medium')  # Low, Medium, High, Critical
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    @property
    def is_critical(self):
        """Check if item is critical"""
        return self.priority == 'Critical' or 'ring' in self.item.lower()
    
    def to_dict(self):
        """Convert to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'item': self.item,
            'packed': self.packed,
            'category': self.category,
            'notes': self.notes,
            'quantity': self.quantity,
            'priority': self.priority,
            'is_critical': self.is_critical,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<Packing {self.item} ({self.category}): {"✓" if self.packed else "✗"}>'


class Ring(db.Model):
    """Engagement ring tracking"""
    __tablename__ = 'ring'
    
    id = db.Column(db.Integer, primary_key=True)
    jeweler = db.Column(db.String(200))
    stone = db.Column(db.String(500))
    metal = db.Column(db.String(100))
    style_inspiration = db.Column(db.Text)
    insurance = db.Column(db.String(200))
    status = db.Column(db.String(50), default='Researching')  # Researching, Designing, Ordered, Complete
    cost = db.Column(db.Float, default=0.0)
    deposit_paid = db.Column(db.Float, default=0.0)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    @property
    def balance_due(self):
        """Calculate remaining balance"""
        return max(0, self.cost - self.deposit_paid)
    
    @property
    def is_paid_off(self):
        """Check if ring is fully paid"""
        return self.deposit_paid >= self.cost if self.cost > 0 else False
    
    def to_dict(self):
        """Convert to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'jeweler': self.jeweler,
            'stone': self.stone,
            'metal': self.metal,
            'style_inspiration': self.style_inspiration,
            'insurance': self.insurance,
            'status': self.status,
            'cost': self.cost,
            'deposit_paid': self.deposit_paid,
            'balance_due': self.balance_due,
            'is_paid_off': self.is_paid_off,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<Ring {self.jeweler}: {self.status}>'


class File(db.Model):
    """File storage tracking"""
    __tablename__ = 'files'
    
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    original_name = db.Column(db.String(255), nullable=False)
    size = db.Column(db.Integer)  # Size in bytes
    type = db.Column(db.String(50))  # Extension
    category = db.Column(db.String(100), index=True)
    notes = db.Column(db.Text)
    mimetype = db.Column(db.String(100))
    upload_path = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    @property
    def size_formatted(self):
        """Format file size in human-readable format"""
        if not self.size:
            return 'Unknown'
        
        for unit in ['B', 'KB', 'MB', 'GB']:
            if self.size < 1024.0:
                return f"{self.size:.2f} {unit}"
            self.size /= 1024.0
        return f"{self.size:.2f} TB"
    
    @property
    def is_image(self):
        """Check if file is an image"""
        image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'}
        return self.type.lower() in image_extensions if self.type else False
    
    @property
    def is_document(self):
        """Check if file is a document"""
        doc_extensions = {'.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'}
        return self.type.lower() in doc_extensions if self.type else False
    
    @property
    def file_exists(self):
        """Check if physical file exists"""
        if self.upload_path:
            return os.path.exists(self.upload_path)
        return False
    
    def to_dict(self):
        """Convert to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'filename': self.filename,
            'original_name': self.original_name,
            'size': self.size,
            'size_formatted': self.size_formatted,
            'type': self.type,
            'category': self.category,
            'notes': self.notes,
            'mimetype': self.mimetype,
            'upload_path': self.upload_path,
            'is_image': self.is_image,
            'is_document': self.is_document,
            'file_exists': self.file_exists,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<File {self.original_name} ({self.type})>'


# Create statistics helper class
class Statistics:
    """Helper class for computing statistics across models"""
    
    @staticmethod
    def get_budget_stats():
        """Get budget statistics"""
        budgets = Budget.query.all()
        total_amount = sum(b.amount for b in budgets)
        total_saved = sum(b.saved for b in budgets)
        total_remaining = sum(b.remaining for b in budgets)
        
        return {
            'total_amount': total_amount,
            'total_saved': total_saved,
            'total_remaining': total_remaining,
            'progress_percentage': (total_saved / total_amount * 100) if total_amount > 0 else 0,
            'item_count': len(budgets),
            'completed_count': sum(1 for b in budgets if b.is_complete)
        }
    
    @staticmethod
    def get_family_stats():
        """Get family approval statistics"""
        family_members = Family.query.all()
        approved = sum(1 for f in family_members if f.status == 'Approved')
        pending = sum(1 for f in family_members if f.status == 'Pending')
        declined = sum(1 for f in family_members if f.status == 'Declined')
        
        return {
            'total': len(family_members),
            'approved': approved,
            'pending': pending,
            'declined': declined,
            'approval_rate': (approved / len(family_members) * 100) if family_members else 0
        }
    
    @staticmethod
    def get_packing_stats():
        """Get packing progress statistics"""
        items = Packing.query.all()
        packed = sum(1 for i in items if i.packed)
        critical = sum(1 for i in items if i.is_critical)
        
        return {
            'total_items': len(items),
            'packed_items': packed,
            'unpacked_items': len(items) - packed,
            'critical_items': critical,
            'progress_percentage': (packed / len(items) * 100) if items else 0
        }
    
    @staticmethod
    def get_itinerary_stats():
        """Get itinerary completion statistics"""
        activities = Itinerary.query.all()
        completed = sum(1 for a in activities if a.completed)
        overdue = sum(1 for a in activities if a.status == 'Overdue')
        
        return {
            'total_activities': len(activities),
            'completed': completed,
            'pending': len(activities) - completed,
            'overdue': overdue,
            'completion_rate': (completed / len(activities) * 100) if activities else 0
        }