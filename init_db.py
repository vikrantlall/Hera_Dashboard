#!/usr/bin/env python3
"""
Database initialization script for HERA Dashboard
Supports both SQLite (development) and PostgreSQL (production)
"""

import os
import sys
from datetime import datetime, date, time
from flask import Flask
from dotenv import load_dotenv

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
load_dotenv()

from database import db, init_db, create_tables, reset_database, DatabaseConfig
from models import User, Budget, Family, Travel, Itinerary, Packing, Ring, File

def create_app():
    """Create Flask application for database initialization"""
    app = Flask(__name__)
    
    # Basic Flask configuration
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # Initialize database
    init_db(app)
    
    return app

def create_sample_data():
    """Create sample data for testing"""
    print("\n📝 Creating sample data...")
    
    try:
        # Create a test user
        user = User()
        user.username = 'admin'
        user.set_password('admin123')
        db.session.add(user)
        
        # Sample Budget items
        budget_items = [
            {'category': 'Venue', 'amount': 15000, 'saved': 5000, 'status': 'Outstanding', 'priority': 'Critical'},
            {'category': 'Catering', 'amount': 8000, 'saved': 3000, 'status': 'Outstanding', 'priority': 'High'},
            {'category': 'Photography', 'amount': 3500, 'saved': 3500, 'status': 'Paid', 'priority': 'High'},
            {'category': 'Flowers', 'amount': 2000, 'saved': 500, 'status': 'Outstanding', 'priority': 'Medium'},
            {'category': 'Music/DJ', 'amount': 1500, 'saved': 0, 'status': 'Outstanding', 'priority': 'Medium'},
        ]
        
        for item in budget_items:
            budget = Budget(**item)
            db.session.add(budget)
        
        # Sample Family members
        family_members = [
            {'name': 'Mom', 'relationship': 'Mother', 'status': 'Approved', 'reaction': 'Positive'},
            {'name': 'Dad', 'relationship': 'Father', 'status': 'Approved', 'reaction': 'Positive'},
            {'name': 'Sister Sarah', 'relationship': 'Sister', 'status': 'Approved', 'reaction': 'Positive'},
            {'name': 'Brother Mike', 'relationship': 'Brother', 'status': 'Pending', 'reaction': None},
            {'name': 'Grandma Rose', 'relationship': 'Grandmother', 'status': 'Pending', 'reaction': None},
        ]
        
        for member in family_members:
            family = Family(**member)
            if member['status'] == 'Approved':
                family.conversation_date = date.today()
            db.session.add(family)
        
        # Sample Travel arrangements
        travel_items = [
            {
                'type': 'Flight',
                'provider': 'United Airlines',
                'details': 'SFO to JFK - Direct',
                'confirmation': 'UA123456',
                'date': date(2025, 6, 15),
                'departure_time': time(10, 30),
                'arrival_time': time(19, 15),
                'cost': 450,
                'status': 'Confirmed'
            },
            {
                'type': 'Hotel',
                'provider': 'Marriott Downtown',
                'details': 'King Suite - 3 nights',
                'confirmation': 'MAR789012',
                'date': date(2025, 6, 15),
                'cost': 600,
                'status': 'Confirmed'
            },
        ]
        
        for item in travel_items:
            travel = Travel(**item)
            db.session.add(travel)
        
        # Sample Itinerary
        itinerary_items = [
            {'day': 1, 'activity': 'Welcome Dinner', 'location': 'Grand Hotel', 'priority': 'High'},
            {'day': 2, 'activity': 'Wedding Ceremony', 'location': 'Rose Garden', 'priority': 'Critical'},
            {'day': 2, 'activity': 'THE PROPOSAL', 'location': 'Secret Garden', 'is_proposal': True, 'priority': 'Critical'},
            {'day': 2, 'activity': 'Reception', 'location': 'Grand Ballroom', 'priority': 'Critical'},
            {'day': 3, 'activity': 'Farewell Brunch', 'location': 'Terrace Cafe', 'priority': 'Medium'},
        ]
        
        for idx, item in enumerate(itinerary_items):
            itinerary = Itinerary(**item)
            itinerary.date = date(2025, 6, 15 + item['day'] - 1)
            itinerary.time = time(10 + idx * 2, 0)
            db.session.add(itinerary)
        
        # Sample Packing items
        packing_items = [
            {'item': 'Wedding Ring', 'category': 'Essential', 'priority': 'Critical', 'packed': False},
            {'item': 'Suit', 'category': 'Clothing', 'priority': 'Critical', 'packed': False},
            {'item': 'Dress Shoes', 'category': 'Clothing', 'priority': 'High', 'packed': False},
            {'item': 'Camera', 'category': 'Electronics', 'priority': 'Medium', 'packed': True},
            {'item': 'Chargers', 'category': 'Electronics', 'priority': 'High', 'packed': False},
            {'item': 'Toiletries', 'category': 'Personal', 'priority': 'Medium', 'packed': False},
        ]
        
        for item in packing_items:
            packing = Packing(**item)
            db.session.add(packing)
        
        # Sample Ring details
        ring = Ring(
            jeweler='Tiffany & Co.',
            stone='2.5ct Round Brilliant Diamond, VS1, F Color',
            metal='Platinum',
            style_inspiration='Classic solitaire with pave band',
            insurance='Jewelers Mutual',
            status='Ordered',
            cost=25000,
            deposit_paid=10000,
            notes='Custom engraving: "Forever Yours"'
        )
        db.session.add(ring)
        
        # Commit all changes
        db.session.commit()
        print("✅ Sample data created successfully!")
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error creating sample data: {e}")
        raise

def main():
    """Main initialization function"""
    print("\n" + "="*60)
    print("🎉 HERA Dashboard Database Initialization")
    print("="*60)
    
    # Create Flask app
    app = create_app()
    
    # Display database configuration within app context
    with app.app_context():
        db_uri = DatabaseConfig.get_database_uri()
        print(f"\n📊 Database Configuration:")
        print(f"   Type: {'PostgreSQL' if 'postgresql' in db_uri else 'SQLite'}")
        print(f"   URI: {db_uri}")
    
    # Ask user for action
    print("\n🔧 Select an action:")
    print("   1. Create tables (preserves existing data)")
    print("   2. Reset database (drops all data and recreates)")
    print("   3. Create tables with sample data")
    print("   4. Exit")
    
    choice = input("\nEnter your choice (1-4): ").strip()
    
    with app.app_context():
        if choice == '1':
            print("\n🔨 Creating database tables...")
            create_tables(app)
            
        elif choice == '2':
            confirm = input("\n⚠️  WARNING: This will delete all existing data! Continue? (yes/no): ").strip().lower()
            if confirm == 'yes':
                print("\n🔄 Resetting database...")
                reset_database(app)
            else:
                print("❌ Reset cancelled.")
                
        elif choice == '3':
            print("\n🔨 Creating database tables with sample data...")
            reset_database(app)
            create_sample_data()
            
        elif choice == '4':
            print("👋 Exiting...")
            return
            
        else:
            print("❌ Invalid choice!")
            return
    
    print("\n✨ Database initialization complete!")
    print("="*60)

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Initialization cancelled by user.")
    except Exception as e:
        import traceback
        print(f"\n❌ Fatal error: {e}")
        traceback.print_exc()
        sys.exit(1)