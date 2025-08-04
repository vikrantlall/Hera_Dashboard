import pandas as pd
from datetime import datetime, date, time
from models import Budget, Ring, Family, Travel, Itinerary, Packing
import re

def parse_currency(value):
    """Parse currency string to float"""
    if pd.isna(value) or value == '':
        return 0.0
    
    # Remove currency symbols and commas
    clean_value = str(value).replace('$', '').replace(',', '').strip()
    try:
        return float(clean_value)
    except (ValueError, TypeError):
        return 0.0

def parse_date(date_str):
    """Parse date string to date object"""
    if pd.isna(date_str) or date_str == '':
        return None
    
    try:
        # Try different date formats
        date_formats = ['%m/%d/%Y', '%Y-%m-%d', '%B %d, %Y']
        for fmt in date_formats:
            try:
                return datetime.strptime(str(date_str), fmt).date()
            except ValueError:
                continue
        return None
    except:
        return None

def parse_time(time_str):
    """Parse time string to time object"""
    if pd.isna(time_str) or time_str == '':
        return None
    
    try:
        # Handle time formats like "08:00", "8:00 AM", etc.
        time_str = str(time_str).strip()
        if ':' in time_str:
            parts = time_str.replace(' AM', '').replace(' PM', '').split(':')
            hour = int(parts[0])
            minute = int(parts[1]) if len(parts) > 1 else 0
            
            # Handle PM times
            if 'PM' in time_str and hour != 12:
                hour += 12
            elif 'AM' in time_str and hour == 12:
                hour = 0
                
            return time(hour, minute)
    except:
        return None

def import_excel_data(excel_path, db):
    """Import data from Excel file to database"""
    try:
        # Read all sheets
        excel_file = pd.ExcelFile(excel_path)
        
        # Import Budget data
        if 'Budget' in excel_file.sheet_names:
            budget_df = pd.read_excel(excel_path, sheet_name='Budget', skiprows=2)
            budget_df = budget_df.dropna(subset=['Category'])
            
            for _, row in budget_df.iterrows():
                if row['Category'] and row['Category'] != 'Total':
                    budget_item = Budget(
                        category=str(row['Category']),
                        amount=parse_currency(row.get('Budget', 0)),
                        status='Paid' if parse_currency(row.get('Saved', 0)) >= parse_currency(row.get('Budget', 0)) else 'Outstanding',
                        notes=str(row.get('Notes', '')) if pd.notna(row.get('Notes')) else '',
                        emoji=get_budget_emoji(str(row['Category']))
                    )
                    db.session.add(budget_item)
        
        # Import Ring data (create single record with default values)
        ring_data = Ring(
            jeweler='GWFJ',
            stone='2.98ct Lab Grown Diamond',
            metal='18k Yellow Gold',
            style_inspiration='Sofia Zakia inspiration',
            insurance='Jewelers Mutual',
            status='Delivered',
            notes='Custom made engagement ring'
        )
        db.session.add(ring_data)
        
        # Import Family permissions
        if 'Permissions' in excel_file.sheet_names:
            family_df = pd.read_excel(excel_path, sheet_name='Permissions', skiprows=2)
            family_df = family_df.dropna(subset=['Family Member'])
            
            for _, row in family_df.iterrows():
                family_member = Family(
                    name=str(row['Family Member']),
                    status='Approved' if row.get('Status') == 'Approved' else 'Pending',
                    reaction=str(row.get('Notes', '')) if pd.notna(row.get('Notes')) else '',
                    notes=str(row.get('Notes', '')) if pd.notna(row.get('Notes')) else ''
                )
                db.session.add(family_member)
        
        # Import Travel data (default flight and hotel info)
        travel_items = [
            {
                'type': 'Flight',
                'description': 'IAD → DEN → YYC → YYZ → DCA',
                'confirmation_code': 'UNITED123',
                'date_from': date(2025, 9, 24),
                'date_to': date(2025, 9, 29),
                'location_from': 'Washington DC (IAD)',
                'location_to': 'Calgary (YYC)',
                'status': 'Confirmed'
            },
            {
                'type': 'Hotel',
                'description': 'Canalta Lodge - King Room w/ Balcony',
                'confirmation_code': 'AT9Z8V',
                'date_from': date(2025, 9, 24),
                'date_to': date(2025, 9, 29),
                'location_from': 'Banff, AB',
                'location_to': 'Banff, AB',
                'status': 'Confirmed'
            }
        ]
        
        for item in travel_items:
            travel = Travel(**item)
            db.session.add(travel)
        
        # Import Itinerary data
        if 'Itinerary' in excel_file.sheet_names:
            itinerary_df = pd.read_excel(excel_path, sheet_name='Itinerary')
            
            # Process itinerary data if available
            day_counter = 1
            for _, row in itinerary_df.iterrows():
                if pd.notna(row.get('Activity', '')):
                    activity = Itinerary(
                        day=day_counter,
                        date=date(2025, 9, 23 + day_counter),
                        activity=str(row.get('Activity', '')),
                        location=str(row.get('Location', '')) if pd.notna(row.get('Location')) else '',
                        category=str(row.get('Category', 'General')) if pd.notna(row.get('Category')) else 'General',
                        priority='High' if 'PROPOSAL' in str(row.get('Activity', '')).upper() else 'Medium'
                    )
                    db.session.add(activity)
                    day_counter += 1
        else:
            # Add sample proposal activity
            proposal_activity = Itinerary(
                day=3,
                date=date(2025, 9, 26),
                start_time=time(8, 0),
                end_time=time(10, 0),
                activity='PROPOSAL + PHOTOSHOOT at Emerald Lake',
                location='Emerald Lake, Banff',
                category='Proposal',
                priority='Critical'
            )
            db.session.add(proposal_activity)
        
        # Import Packing data
        packing_items = [
            {'category': 'Engagement Ring', 'item': 'Engagement Ring', 'priority': 'Critical', 'emoji': '💍'},
            {'category': 'Travel Documents', 'item': 'Passports & Travel Documents', 'priority': 'Critical', 'emoji': '📄'},
            {'category': 'Clothes', 'item': 'Weather-appropriate clothing', 'priority': 'High', 'emoji': '👔'},
            {'category': 'Hiking Gear', 'item': 'Hiking boots and outdoor gear', 'priority': 'High', 'emoji': '🥾'},
            {'category': 'Camera/Tripod', 'item': 'Photography equipment', 'priority': 'High', 'emoji': '📸'},
            {'category': 'Toiletries', 'item': 'Personal care items', 'priority': 'Medium', 'emoji': '🧴'},
            {'category': 'Daypack', 'item': 'Day adventure gear', 'priority': 'Medium', 'emoji': '🎒'},
            {'category': 'Miscellaneous', 'item': 'Emergency items', 'priority': 'Low', 'emoji': '📋'}
        ]
        
        for item in packing_items:
            packing = Packing(**item)
            db.session.add(packing)
        
        db.session.commit()
        return True
        
    except Exception as e:
        print(f"Error importing Excel data: {e}")
        db.session.rollback()
        return False

def get_budget_emoji(category):
    """Get emoji for budget category"""
    emoji_map = {
        'Ring': '💍',
        'Flights': '✈️',
        'Hotels': '🏨',
        'Transportation': '🚗',
        'Meals': '🍽️',
        'Photographer': '📸',
        'Activities': '🎯',
        'Miscellaneous': '📋'
    }
    
    for key, emoji in emoji_map.items():
        if key.lower() in category.lower():
            return emoji
    
    return '💰'