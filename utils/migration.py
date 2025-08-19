#!/usr/bin/env python3
"""
JSON to SQLAlchemy migration utilities for HERA Dashboard
Migrates data from hera_data.json to SQLAlchemy database
"""

import os
import sys
import json
from datetime import datetime, date, time
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask
from database import db, init_db, reset_database
from models import User, Budget, Family, Travel, Itinerary, Packing, Ring, File

class DataMigrator:
    """Handle migration from JSON to SQLAlchemy database"""
    
    def __init__(self, json_path='hera_data.json'):
        """Initialize migrator with JSON file path"""
        self.json_path = Path(json_path)
        self.data = None
        self.stats = {
            'budget': 0,
            'family': 0,
            'travel': 0,
            'itinerary': 0,
            'packing': 0,
            'ring': 0,
            'files': 0,
            'errors': []
        }
    
    def load_json_data(self):
        """Load data from JSON file"""
        if not self.json_path.exists():
            raise FileNotFoundError(f"JSON file not found: {self.json_path}")
        
        print(f"📂 Loading data from {self.json_path}...")
        with open(self.json_path, 'r') as f:
            self.data = json.load(f)
        
        print(f"✅ Loaded JSON data successfully")
        return self.data
    
    def parse_date(self, date_str):
        """Parse date string to date object"""
        if not date_str:
            return None
        
        # Try different date formats
        formats = [
            '%Y-%m-%d',
            '%m/%d/%Y',
            '%m/%d/%y',
            '%d/%m/%Y',
            '%Y/%m/%d'
        ]
        
        for fmt in formats:
            try:
                return datetime.strptime(date_str, fmt).date()
            except (ValueError, TypeError):
                continue
        
        return None
    
    def parse_time(self, time_str):
        """Parse time string to time object"""
        if not time_str:
            return None
        
        # Try different time formats
        formats = [
            '%H:%M:%S',
            '%H:%M',
            '%I:%M %p',
            '%I:%M%p'
        ]
        
        for fmt in formats:
            try:
                return datetime.strptime(time_str, fmt).time()
            except (ValueError, TypeError):
                continue
        
        return None
    
    def parse_float(self, value, default=0.0):
        """Safely parse float value"""
        if value is None:
            return default
        
        try:
            # Remove currency symbols and commas
            if isinstance(value, str):
                value = value.replace('$', '').replace(',', '').strip()
            return float(value)
        except (ValueError, TypeError):
            return default
    
    def parse_bool(self, value, default=False):
        """Parse boolean value"""
        if value is None:
            return default
        
        if isinstance(value, bool):
            return value
        
        if isinstance(value, str):
            return value.lower() in ('true', 'yes', '1', 'y', 't')
        
        return bool(value)
    
    def migrate_budget(self):
        """Migrate budget data"""
        if 'budget' not in self.data:
            print("⚠️  No budget data found")
            return
        
        print("\n💰 Migrating budget data...")
        
        for item in self.data['budget']:
            try:
                budget = Budget(
                    category=item.get('category', 'Unknown'),
                    amount=self.parse_float(item.get('amount')),
                    saved=self.parse_float(item.get('saved')),
                    status=item.get('status', 'Outstanding'),
                    notes=item.get('notes'),
                    priority=item.get('priority', 'Medium')
                )
                db.session.add(budget)
                self.stats['budget'] += 1
            except Exception as e:
                self.stats['errors'].append(f"Budget: {e}")
    
    def migrate_family(self):
        """Migrate family approval data"""
        if 'family' not in self.data:
            print("⚠️  No family data found")
            return
        
        print("\n👨‍👩‍👧‍👦 Migrating family data...")
        
        for member in self.data['family']:
            try:
                family = Family(
                    name=member.get('name', 'Unknown'),
                    relationship=member.get('relationship'),
                    status=member.get('status', 'Pending'),
                    conversation_date=self.parse_date(member.get('conversation_date')),
                    reaction=member.get('reaction'),
                    notes=member.get('notes')
                )
                db.session.add(family)
                self.stats['family'] += 1
            except Exception as e:
                self.stats['errors'].append(f"Family: {e}")
    
    def migrate_travel(self):
        """Migrate travel arrangements"""
        if 'travel' not in self.data:
            print("⚠️  No travel data found")
            return
        
        print("\n✈️ Migrating travel data...")
        
        for item in self.data['travel']:
            try:
                travel = Travel(
                    type=item.get('type', 'Unknown'),
                    provider=item.get('provider'),
                    details=item.get('details'),
                    confirmation=item.get('confirmation'),
                    date=self.parse_date(item.get('date')),
                    departure_time=self.parse_time(item.get('departure_time')),
                    arrival_time=self.parse_time(item.get('arrival_time')),
                    cost=self.parse_float(item.get('cost')),
                    status=item.get('status', 'Pending'),
                    notes=item.get('notes')
                )
                db.session.add(travel)
                self.stats['travel'] += 1
            except Exception as e:
                self.stats['errors'].append(f"Travel: {e}")
    
    def migrate_itinerary(self):
        """Migrate itinerary data"""
        if 'itinerary' not in self.data:
            print("⚠️  No itinerary data found")
            return
        
        print("\n📅 Migrating itinerary data...")
        
        for item in self.data['itinerary']:
            try:
                # Check if activity contains proposal keywords
                activity_text = item.get('activity', '').upper()
                is_proposal = 'PROPOSAL' in activity_text or 'PROPOSE' in activity_text
                
                itinerary = Itinerary(
                    day=int(item.get('day', 1)),
                    date=self.parse_date(item.get('date')),
                    time=self.parse_time(item.get('time')),
                    activity=item.get('activity', 'Unknown'),
                    location=item.get('location'),
                    completed=self.parse_bool(item.get('completed')),
                    is_proposal=is_proposal or self.parse_bool(item.get('is_proposal')),
                    notes=item.get('notes'),
                    priority=item.get('priority', 'Medium')
                )
                db.session.add(itinerary)
                self.stats['itinerary'] += 1
            except Exception as e:
                self.stats['errors'].append(f"Itinerary: {e}")
    
    def migrate_packing(self):
        """Migrate packing list"""
        if 'packing' not in self.data:
            print("⚠️  No packing data found")
            return
        
        print("\n🎒 Migrating packing data...")
        
        for item in self.data['packing']:
            try:
                # Check if item is critical (ring-related)
                item_text = item.get('item', '').lower()
                is_ring_related = 'ring' in item_text
                
                packing = Packing(
                    item=item.get('item', 'Unknown'),
                    packed=self.parse_bool(item.get('packed')),
                    category=item.get('category', 'General'),
                    notes=item.get('notes'),
                    quantity=int(item.get('quantity', 1)),
                    priority=item.get('priority', 'Critical' if is_ring_related else 'Medium')
                )
                db.session.add(packing)
                self.stats['packing'] += 1
            except Exception as e:
                self.stats['errors'].append(f"Packing: {e}")
    
    def migrate_ring(self):
        """Migrate ring details"""
        if 'ring' not in self.data:
            print("⚠️  No ring data found")
            return
        
        print("\n💍 Migrating ring data...")
        
        # Ring data might be a single object or array
        ring_data = self.data['ring']
        if not isinstance(ring_data, list):
            ring_data = [ring_data]
        
        for item in ring_data:
            try:
                ring = Ring(
                    jeweler=item.get('jeweler'),
                    stone=item.get('stone'),
                    metal=item.get('metal'),
                    style_inspiration=item.get('style_inspiration'),
                    insurance=item.get('insurance'),
                    status=item.get('status', 'Researching'),
                    cost=self.parse_float(item.get('cost')),
                    deposit_paid=self.parse_float(item.get('deposit_paid')),
                    notes=item.get('notes')
                )
                db.session.add(ring)
                self.stats['ring'] += 1
            except Exception as e:
                self.stats['errors'].append(f"Ring: {e}")
    
    def migrate_files(self):
        """Migrate file references"""
        if 'files' not in self.data:
            print("⚠️  No files data found")
            return
        
        print("\n📁 Migrating files data...")
        
        for item in self.data['files']:
            try:
                # Extract file extension
                filename = item.get('filename', item.get('original_name', ''))
                file_ext = os.path.splitext(filename)[1] if filename else ''
                
                # Parse size string like "27.4 KB" to bytes
                size_str = item.get('size', '0 B')
                if isinstance(size_str, str):
                    size = size_str  # Keep as string since model expects string
                else:
                    size = str(size_str) + ' B'
                
                file_obj = File(
                    filename=item.get('filename', 'unknown'),
                    original_name=item.get('original_name', filename),
                    size=size,
                    type=item.get('type', file_ext),
                    category=item.get('category', 'General'),
                    notes=item.get('notes'),
                    mimetype=item.get('mimetype'),
                    upload_path=item.get('upload_path', item.get('path'))
                )
                db.session.add(file_obj)
                self.stats['files'] += 1
            except Exception as e:
                self.stats['errors'].append(f"File: {e}")
    
    def create_default_user(self):
        """Create default admin user if none exists"""
        existing_user = User.query.filter_by(username='admin').first()
        if not existing_user:
            print("\n👤 Creating default admin user...")
            user = User()
            user.username = 'admin'
            user.set_password('admin123')
            db.session.add(user)
            print("✅ Default user created (username: admin, password: admin123)")
    
    def run_migration(self, app):
        """Run the complete migration process"""
        print("\n" + "="*60)
        print("🚀 Starting JSON to SQLAlchemy Migration")
        print("="*60)
        
        try:
            # Load JSON data
            self.load_json_data()
            
            with app.app_context():
                # Create default user
                self.create_default_user()
                
                # Run migrations for each model
                self.migrate_budget()
                self.migrate_family()
                self.migrate_travel()
                self.migrate_itinerary()
                self.migrate_packing()
                self.migrate_ring()
                self.migrate_files()
                
                # Commit all changes
                db.session.commit()
                
                # Print statistics
                print("\n" + "="*60)
                print("📊 Migration Statistics:")
                print("="*60)
                print(f"   Budget items: {self.stats['budget']}")
                print(f"   Family members: {self.stats['family']}")
                print(f"   Travel arrangements: {self.stats['travel']}")
                print(f"   Itinerary items: {self.stats['itinerary']}")
                print(f"   Packing items: {self.stats['packing']}")
                print(f"   Ring details: {self.stats['ring']}")
                print(f"   Files: {self.stats['files']}")
                
                if self.stats['errors']:
                    print(f"\n⚠️  Errors encountered: {len(self.stats['errors'])}")
                    for error in self.stats['errors'][:5]:  # Show first 5 errors
                        print(f"   - {error}")
                
                print("\n✅ Migration completed successfully!")
                
        except Exception as e:
            print(f"\n❌ Migration failed: {e}")
            db.session.rollback()
            raise

def create_app():
    """Create Flask application for migration"""
    from flask import Flask
    from dotenv import load_dotenv
    
    load_dotenv()
    
    app = Flask(__name__)
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key')
    
    # Initialize database
    init_db(app)
    
    return app

def main():
    """Main migration function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Migrate JSON data to SQLAlchemy database')
    parser.add_argument('--json-file', default='hera_data.json', help='Path to JSON file')
    parser.add_argument('--reset', action='store_true', help='Reset database before migration')
    parser.add_argument('--dry-run', action='store_true', help='Test migration without committing')
    
    args = parser.parse_args()
    
    # Create Flask app
    app = create_app()
    
    # Reset database if requested
    if args.reset:
        confirm = input("\n⚠️  WARNING: Reset will delete all existing data! Continue? (yes/no): ")
        if confirm.lower() == 'yes':
            with app.app_context():
                reset_database(app)
        else:
            print("Migration cancelled.")
            return
    
    # Run migration
    migrator = DataMigrator(args.json_file)
    
    try:
        if args.dry_run:
            print("\n🧪 Running in DRY RUN mode (no changes will be saved)")
            migrator.load_json_data()
            print("✅ JSON file loaded successfully")
            print(f"   Found {len(migrator.data)} data sections")
            for key in migrator.data:
                if isinstance(migrator.data[key], list):
                    print(f"   - {key}: {len(migrator.data[key])} items")
                else:
                    print(f"   - {key}: 1 item")
        else:
            migrator.run_migration(app)
    
    except FileNotFoundError as e:
        print(f"\n❌ Error: {e}")
        print(f"   Make sure {args.json_file} exists in the current directory")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()