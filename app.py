"""
HERA Proposal Planning Dashboard - Final Flask App
Your Excel data with selective enhancements, no unwanted fields
"""

from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
import json
import os
from datetime import datetime, timedelta

app = Flask(__name__)
app.secret_key = 'hera_proposal_2025_emerald_lake_secret'

# Flask-Login setup
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

class User(UserMixin):
    def __init__(self, id, username, password_hash):
        self.id = id
        self.username = username
        self.password_hash = password_hash

users = {
    'admin': User('admin', 'admin', generate_password_hash('admin123'))
}

@login_manager.user_loader
def load_user(user_id):
    return users.get(user_id)

# Your complete HERA data - exactly as requested
HERA_DATA = {
    "main": {
        "tripDates": "9/24/2025 - 9/29/2025",
        "totalBudget": 11691.2,
        "totalSaved": 7511.2,
        "totalRemaining": 4180,
        "proposalDate": "2025-09-26",
        "savingsTimeline": [
            {"amount": 5000, "month": "march"},
            {"amount": 5000, "month": "april"},
            {"amount": 5000, "month": "may"},
            {"amount": 5000, "month": "june"},
            {"amount": 5000, "month": "july"},
            {"amount": 5000, "month": "august"},
            {"amount": 5000, "month": "september"}
        ],
        "tasks": [
            {"id": 1, "task": "Save for Key Expenses", "deadline": "2025-06-01", "status": "In Progress, Behind Schedule", "notes": "Enough for ring, flights, and hotels. ($8,000)"},
            {"id": 2, "task": "Get Family Permissions", "deadline": "2025-08-03", "status": "In Progress, On Schedule", "notes": "All permissions secured before booking major items."},
            {"id": 3, "task": "Book Flights", "deadline": "2025-07-01", "status": "Ahead Schedule, Complete", "notes": "Ensure best deals for travel."},
            {"id": 4, "task": "Reserve Hotels", "deadline": "2025-07-01", "status": "Ahead Schedule, Complete", "notes": "Accommodations finalized."},
            {"id": 5, "task": "Confirm Transportation", "deadline": "2025-07-01", "status": "Complete, Ahead Schedule", "notes": "Rental car booked; gas budget estimated."},
            {"id": 6, "task": "Plan Proposal Details", "deadline": "2025-06-28", "status": "Complete, On Schedule", "notes": "Includes location, timing, and backup plans."},
            {"id": 7, "task": "Confirm Photographer", "deadline": "2025-07-01", "status": "Complete, On Schedule", "notes": "Research local options; book by this date."},
            {"id": 8, "task": "Finalize Daily Itinerary", "deadline": "2025-08-03", "status": "On Schedule, Complete", "notes": "Reflect finalized bookings and activities."},
            {"id": 9, "task": "Reserve Dining", "deadline": "2025-08-01", "status": "On Schedule, In Progress", "notes": "Key reservations for proposal and celebration."},
            {"id": 10, "task": "Pack Essentials", "deadline": "2025-09-28", "status": "Not Started, On Schedule", "notes": "Ensure everything is ready, including the ring."}
        ]
    },
    "budget": [
        {"id": 1, "category": "Ring", "budget": 6400, "saved": 6400, "remaining": 0, "notes": "Custom Made", "status": "Paid", "priority": "critical"},
        {"id": 2, "category": "Flights", "budget": 11.2, "saved": 11.2, "remaining": 0, "notes": "Booked on United", "status": "Paid", "priority": "high"},
        {"id": 3, "category": "Hotels", "budget": 2130, "saved": 0, "remaining": 2130, "notes": "Canalta Lodge, includes breakfast (expedia)\\nconsidering reaching out to hotel for an upgrade", "status": "Outstanding", "priority": "high"},
        {"id": 4, "category": "Transportation", "budget": 450, "saved": 0, "remaining": 450, "notes": "Rental Car (400) + Gas (50) [Alamo]", "status": "Outstanding", "priority": "medium"},
        {"id": 5, "category": "Meals/Dining", "budget": 900, "saved": 0, "remaining": 900, "notes": "9 Meals", "status": "Outstanding", "priority": "medium"},
        {"id": 6, "category": "Photographer", "budget": 1100, "saved": 1100, "remaining": 0, "notes": "Banff Photography", "status": "Paid", "priority": "critical"},
        {"id": 7, "category": "Activities/Excursions", "budget": 400, "saved": 0, "remaining": 400, "notes": "Gondala,", "status": "Outstanding", "priority": "low"},
        {"id": 8, "category": "Miscellaneous", "budget": 300, "saved": 0, "remaining": 300, "notes": "", "status": "Outstanding", "priority": "low"}
    ],
    "ring": {
        "Jeweler": "GWFJ",
        "Ring Style (Inspiration)": "https://sofiazakia.com/products/diamond-tethys-ring",
        "Metal": "Yellow Gold, 18k",
        "Stone(s)": "Lab Grown Diamond, 2.98ct",
        "Engraving": None,
        "Design Approved": "YES, 50% deposit placed",
        "Order Placed": "Yes, 50% deposit placed",
        "Estimated Delivery": None,
        "Delivered": "YES, delivered",
        "Insured": "Yes",
        "Insurance Details": "Jewelers Mutual, $68/year $0 deductible",
        "Status": "Reached out via Instagram, will have to put in request via website\\n -- Process takes about 8-12 weeks for custom orders, (June would be the latest i could order it)\\n\\n3/18 - Emailed to start process, details and diamond selected, deposit placed"
    },
    "family": [
        {"id": 1, "name": "Papa", "status": "Approved", "notes": "Was not an issue, a little confused on timeline"},
        {"id": 2, "name": "Mama", "status": "Approved", "notes": "Not as much of an issue, claimed to have known about it already"},
        {"id": 3, "name": "Shreya", "status": "Approved", "notes": "Seemed fine"},
        {"id": 4, "name": "Gina", "status": "Approved", "notes": "Was happy"},
        {"id": 5, "name": "Grandpa Rhodes", "status": "Approved", "notes": "Was Happy, making jokes"},
        {"id": 6, "name": "Grandma Rhodes", "status": "Approved", "notes": "Was happy, seems very excited"},
        {"id": 7, "name": "Graden", "status": "Not Asked", "notes": "Need to text"}
    ],
    "travel": [
        {"id": 1, "segment": "IAD - DEN", "airline": "United", "flightNumber": "UA419", "departureTime": "8:15 AM", "arrivalTime": "10:03 AM", "duration": "3h 48m", "date": "9/24/2025", "confirmationNumber": "AT9Z8V", "seat": "2E, 2F", "status": "Confirmed"},
        {"id": 2, "segment": "DEN - YYC", "airline": "United", "flightNumber": "UA2459", "departureTime": "11:22 AM", "arrivalTime": "1:53 PM", "duration": "2h 31m", "date": "9/24/2025", "confirmationNumber": "AT9Z8V", "seat": "1E, 1F", "status": "Confirmed"},
        {"id": 3, "segment": "YYC - YYZ", "airline": "United", "flightNumber": "UA750", "departureTime": "1:55 PM", "arrivalTime": "7:04 PM", "duration": "4h 9m", "date": "9/29/2025", "confirmationNumber": "AT9Z8V", "seat": "2E, 2F", "status": "Confirmed"},
        {"id": 4, "segment": "YYZ - DCA", "airline": "United", "flightNumber": "UA2224", "departureTime": "7:50 PM", "arrivalTime": "11:50 PM", "duration": "3h", "date": "9/29/2025", "confirmationNumber": "AT9Z8V", "seat": "2E, 2F", "status": "Confirmed"},
        {"id": 5, "segment": "Hotel - Canalta Lodge", "provider": "Canalta Lodge", "address": "545 Banff Ave #1B5, Banff, AB T1L 1B5, Canada", "phone": "403-762-2112", "checkIn": "4:00 PM", "checkOut": "11:00 AM", "confirmationNumber": "73022774416687", "roomType": "King Room w/ Balcony", "status": "Confirmed"},
        {"id": 6, "segment": "Rental Car - Alamo", "provider": "Alamo", "location": "YYC", "pickupDate": "2025-09-24", "confirmationNumber": "#1785932383", "carType": "Intermediate SUV\\nToyota RAV4 or similar", "status": "Confirmed"}
    ],
    "itinerary": [
        {"id": 1, "time": "2:00 PM", "activity": "Arrival at Calgary Airport", "location": "YYC", "notes": "Pick up rental car"},
        {"id": 2, "time": "15:15–16:15", "activity": "Drive to Banff", "location": "YYC to Canalta Lodge", "notes": "Approx. 1.5-hour scenic drive"},
        {"id": 3, "time": "16:15–17:45", "activity": "Hotel check-in and unwind", "location": "Canalta Lodge, Banff", "notes": "Relax after travel"},
        {"id": 4, "time": "17:45–19:15", "activity": "Dinner", "location": "Farm & Fire or Lupo, Banff", "notes": "Reservation recommended"},
        {"id": 5, "time": "19:15–20:00", "activity": "Relaxation", "location": "Canalta Lodge", "notes": "Use hot tub, fireplace lounge"},
        {"id": 6, "time": "08:00–09:00", "activity": "Breakfast", "location": "Canalta Lodge or Whitebark Café", "notes": "Casual breakfast, local options"},
        {"id": 7, "time": "11:30–12:30", "activity": "Ride Banff Gondola and explore summit", "location": "Sulphur Mountain Summit", "notes": "Uplift at 11:30 AM, download at 2:30 PM"},
        {"id": 8, "time": "12:30–14:00", "activity": "Lunch at summit", "location": "Sky Bistro", "notes": "Reserved at 12:30 PM"},
        {"id": 9, "time": "14:00–14:30", "activity": "Explore summit boardwalk", "location": "Sulphur Mountain", "notes": "Interpretive signage, scenic views"},
        {"id": 10, "time": "15:00–15:45", "activity": "Nap or rest break", "location": "Canalta Lodge", "notes": "Recharge"},
        {"id": 11, "time": "16:15–17:15", "activity": "Spa session", "location": "Cedar + Sage Co", "notes": "60-minute Couples' Massage"},
        {"id": 12, "time": "18:00–19:30", "activity": "Dinner", "location": "Bear Street Tavern or similar", "notes": "Walk-in possible, reservations good"},
        {"id": 13, "time": "19:30+", "activity": "Evening at lodge", "location": "Canalta Lodge", "notes": "Optional hot tub or early night"},
        {"id": 14, "time": "7:00 AM", "activity": "Drive to Emerald Lake", "location": "Banff to Emerald Lake", "notes": "~1-hour scenic drive"},
        {"id": 15, "time": "08:00–10:00", "activity": "Proposal + Photoshoot", "location": "Emerald Lake", "notes": "2-hour session with photographer", "isProposal": True},
        {"id": 16, "time": "12:00–13:00", "activity": "Lunch", "location": "Around Banff", "notes": "Flexible lunch stop"},
        {"id": 17, "time": "15:30–16:30", "activity": "Distillery Tour", "location": "Park Distillery, Banff", "notes": "Arrive 5–10 mins early for check-in"},
        {"id": 18, "time": "18:30–20:30", "activity": "Dinner", "location": "1888 Chop House, Fairmont Banff Springs", "notes": "Reservation at 6:30 PM"},
        {"id": 19, "time": "20:30+", "activity": "Wind down", "location": "Canalta Lodge", "notes": "Relax, hot tub, or fireplace lounge"},
        {"id": 20, "time": "08:00–09:00", "activity": "Breakfast", "location": "Canalta Lodge", "notes": "Light breakfast to start the day"},
        {"id": 21, "time": "12:00–13:00", "activity": "Lake Minnewanka Cruise", "location": "Lake Minnewanka", "notes": "Arrive at dock by 11:45 AM"},
        {"id": 22, "time": "13:00–14:00", "activity": "Lunch", "location": "Minnewanka or Banff", "notes": "Optional café nearby or pack a picnic"},
        {"id": 23, "time": "14:00–14:30", "activity": "Return & prep for afternoon", "location": "Canalta Lodge", "notes": "Change or rest briefly"},
        {"id": 24, "time": "14:30–18:30", "activity": "Lake Louise Visit (incl. drive)", "location": "Lake Louise", "notes": "~1 hr drive each way, ~2 hrs at the lake"},
        {"id": 25, "time": "19:30–21:00", "activity": "Dinner", "location": "The Bison", "notes": "Reservation at 7:30 PM"},
        {"id": 26, "time": "20:00+", "activity": "Evening rest", "location": "Canalta Lodge", "notes": "Hot tub, fireplace lounge, or early night"},
        {"id": 27, "time": "09:00–10:00", "activity": "Breakfast", "location": "Canalta Lodge", "notes": "Start slowly after several busy days"},
        {"id": 28, "time": "10:00–11:15", "activity": "Drive to Peyto Lake", "location": "Banff → Bow Summit (Icefields Pkwy)", "notes": "~75-minute scenic drive (peytolake.ca)"},
        {"id": 29, "time": "11:15–12:00", "activity": "Short walk to Peyto Viewpoint", "location": "Paved ~1.5 km round-trip", "notes": "Easy walk to iconic viewpoint"},
        {"id": 30, "time": "12:00–13:15", "activity": "Drive to Field, BC", "location": "Peyto → Field via Trans-Canada Hwy", "notes": "~1-hour drive"},
        {"id": 31, "time": "13:15–14:45", "activity": "Lunch at Truffle Pigs Bistro", "location": "Field, BC", "notes": "Opens at 11 am—great timing for a relaxed meal"},
        {"id": 32, "time": "14:45–15:15", "activity": "Drive to Takakkaw Falls", "location": "Field → Yoho Valley Rd turnoff", "notes": "~30 minutes scenic through Kicking Horse Pass"},
        {"id": 33, "time": "15:15–16:00", "activity": "Visit Takakkaw Falls", "location": "Yoho National Park", "notes": "300 m paved walk to base—easy family-friendly trail"},
        {"id": 34, "time": "16:00–17:00", "activity": "Return drive to Banff", "location": "Yoho → Banff", "notes": "~60-minute drive back via Trans-Canada Hwy"},
        {"id": 35, "time": "17:00–18:30", "activity": "Optional rest/spa or nap", "location": "Canalta Lodge", "notes": "Rejuvenate before evening"},
        {"id": 36, "time": "18:30–20:00", "activity": "Farewell dinner", "location": "Eden, The Bison, or Saltlik", "notes": "Reservation recommended"},
        {"id": 37, "time": "20:00+", "activity": "Final evening wind-down", "location": "Canalta Lodge", "notes": "Hot tub, fireplace lounge, finalize packing"},
        {"id": 38, "time": "08:30–09:30", "activity": "Breakfast and packing", "location": "Canalta Lodge", "notes": "Light breakfast included or grab coffee/pastries"},
        {"id": 39, "time": "09:30–11:15", "activity": "Drive to Calgary International Airport (YYC)", "location": "Banff → YYC", "notes": "~1 hr 45 min drive with traffic buffer"},
        {"id": 40, "time": "11:15–11:45", "activity": "Return rental car", "location": "Calgary Airport rental desk", "notes": "Budget 20–30 minutes"},
        {"id": 41, "time": "11:45–13:55", "activity": "Security and boarding", "location": "YYC Departures Terminal", "notes": "Recommended 2 hours before international flight"},
        {"id": 42, "time": "13:55", "activity": "Flight departs", "location": "YYC", "notes": "Bon voyage!"}
    ],
    "packing": [
        {"id": 1, "item": "Engagement Ring", "packed": False, "notes": ""},
        {"id": 2, "item": "Travel Documents", "packed": False, "notes": ""},
        {"id": 3, "item": "Clothes", "packed": False, "notes": ""},
        {"id": 4, "item": "Hiking Gear", "packed": False, "notes": ""},
        {"id": 5, "item": "Camera/Tripod", "packed": False, "notes": ""},
        {"id": 6, "item": "Toiletries", "packed": False, "notes": ""},
        {"id": 7, "item": "Daypack", "packed": False, "notes": ""}
    ]
}

# Data persistence functions
def save_data():
    """Save current data to JSON file"""
    with open('hera_data.json', 'w') as f:
        json.dump(HERA_DATA, f, indent=2)

def load_data():
    """Load data from JSON file if it exists"""
    global HERA_DATA
    if os.path.exists('hera_data.json'):
        with open('hera_data.json', 'r') as f:
            HERA_DATA = json.load(f)

def calculate_days_until_proposal():
    """Calculate days until proposal"""
    proposal_date = datetime(2025, 9, 26)  # September 26, 2025
    today = datetime.now()
    delta = proposal_date - today
    return max(0, delta.days)

def calculate_budget_stats():
    """Calculate budget statistics"""
    total_budget = sum(item['budget'] for item in HERA_DATA['budget'])
    total_saved = sum(item['saved'] for item in HERA_DATA['budget'])
    total_remaining = total_budget - total_saved
    budget_progress = (total_saved / total_budget) * 100 if total_budget > 0 else 0

    return {
        'total_budget': total_budget,
        'total_saved': total_saved,
        'total_remaining': total_remaining,
        'budget_progress': budget_progress
    }

# Routes
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        user = users.get(username)

        if user and check_password_hash(user.password_hash, password):
            login_user(user)
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid username or password')

    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/')
@app.route('/dashboard')
@login_required
def dashboard():
    """Main dashboard with all key metrics"""
    days_until = calculate_days_until_proposal()
    budget_stats = calculate_budget_stats()

    # Family approval stats
    approved_family = len([f for f in HERA_DATA['family'] if f['status'] == 'Approved'])
    total_family = len(HERA_DATA['family'])
    family_progress = (approved_family / total_family) * 100 if total_family > 0 else 0

    # Packing progress
    packed_items = len([p for p in HERA_DATA['packing'] if p['packed']])
    total_items = len(HERA_DATA['packing'])
    packing_progress = (packed_items / total_items) * 100 if total_items > 0 else 0

    return render_template('dashboard.html',
                         days_until=days_until,
                         budget_stats=budget_stats,
                         # Individual budget variables for template compatibility
                         budget_progress=budget_stats['budget_progress'],
                         total_budget=budget_stats['total_budget'],
                         total_saved=budget_stats['total_saved'],
                         total_remaining=budget_stats['total_remaining'],
                         approved_family=approved_family,
                         total_family=total_family,
                         family_progress=family_progress,
                         packed_items=packed_items,
                         total_items=total_items,
                         packing_progress=packing_progress,
                         top_budget_items=HERA_DATA['budget'][:5])

@app.route('/budget')
@login_required
def budget():
    """Budget management page"""
    budget_stats = calculate_budget_stats()
    return render_template('budget.html',
                         budget_items=HERA_DATA['budget'],
                         budget_stats=budget_stats)

@app.route('/ring')
@login_required
def ring():
    """Ring showcase page"""
    return render_template('ring.html', ring=HERA_DATA['ring'])

@app.route('/family')
@login_required
def family():
    """Family permissions page"""
    approved_count = len([f for f in HERA_DATA['family'] if f['status'] == 'Approved'])
    return render_template('family.html',
                         family_members=HERA_DATA['family'],
                         approved_count=approved_count,
                         total_count=len(HERA_DATA['family']))

@app.route('/travel')
@login_required
def travel():
    """Travel details page"""
    return render_template('travel.html', travel_data=HERA_DATA['travel'])

@app.route('/itinerary')
@login_required
def itinerary():
    """Itinerary page with all 42 activities"""
    return render_template('itinerary.html',
                         itinerary_items=HERA_DATA['itinerary'],
                         total_activities=len(HERA_DATA['itinerary']))

@app.route('/packing')
@login_required
def packing():
    """Packing list page"""
    packed_count = len([p for p in HERA_DATA['packing'] if p['packed']])
    return render_template('packing.html',
                         packing_items=HERA_DATA['packing'],
                         packed_count=packed_count,
                         total_count=len(HERA_DATA['packing']))

# API Routes for CRUD operations
@app.route('/api/budget/<int:item_id>/toggle', methods=['POST'])
@login_required
def toggle_budget_status(item_id):
    """Toggle budget item payment status"""
    try:
        item = next((item for item in HERA_DATA['budget'] if item['id'] == item_id), None)
        if not item:
            return jsonify({'success': False, 'error': 'Item not found'})

        item['status'] = 'Paid' if item['status'] == 'Outstanding' else 'Outstanding'
        if item['status'] == 'Paid':
            item['saved'] = item['budget']
            item['remaining'] = 0
        else:
            item['saved'] = 0
            item['remaining'] = item['budget']

        save_data()
        return jsonify({'success': True, 'status': item['status']})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/packing/<int:item_id>/toggle', methods=['POST'])
@login_required
def toggle_packing_status(item_id):
    """Toggle packing item status"""
    try:
        item = next((item for item in HERA_DATA['packing'] if item['id'] == item_id), None)
        if not item:
            return jsonify({'success': False, 'error': 'Item not found'})

        item['packed'] = not item['packed']
        save_data()
        return jsonify({'success': True, 'packed': item['packed']})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/family/<int:member_id>/toggle', methods=['POST'])
@login_required
def toggle_family_status(member_id):
    """Toggle family member approval status"""
    try:
        member = next((m for m in HERA_DATA['family'] if m['id'] == member_id), None)
        if not member:
            return jsonify({'success': False, 'error': 'Member not found'})

        # Cycle through: Not Asked -> Pending -> Approved
        status_cycle = ['Not Asked', 'Pending', 'Approved']
        current_index = status_cycle.index(member['status']) if member['status'] in status_cycle else 0
        next_index = (current_index + 1) % len(status_cycle)
        member['status'] = status_cycle[next_index]

        save_data()
        return jsonify({'success': True, 'status': member['status']})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/refresh_data', methods=['POST'])
@login_required
def refresh_data():
    """Refresh data (reload from JSON file)"""
    try:
        load_data()
        return jsonify({'success': True, 'message': 'Data refreshed successfully'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/export_json')
@login_required
def export_json():
    """Export current data as JSON file"""
    try:
        save_data()
        flash('Data exported successfully to hera_data.json')
        return redirect(url_for('dashboard'))
    except Exception as e:
        flash(f'Export error: {str(e)}')
        return redirect(url_for('dashboard'))

# Keep the existing export_csv_route for template compatibility
@app.route('/export_csv')
@login_required
def export_csv_route():
    """Export data - redirects to JSON export"""
    return redirect(url_for('export_json'))

if __name__ == '__main__':
    # Load existing data if available
    load_data()

    print("=" * 60)
    print("🎯 HERA Proposal Planning Dashboard - Complete Edition")
    print("=" * 60)
    print("✅ All 42 itinerary activities loaded")
    print("✅ All Excel data preserved with integrity")
    print("✅ Selective enhancements (budget priority kept, family priority removed)")
    print("✅ Full CRUD operations available")
    print("✅ Real-time updates and persistence")

    print(f"\n📊 Your Complete Data:")
    print(f"  💰 Budget Items: {len(HERA_DATA['budget'])}")
    print(f"  👨‍👩‍👧‍👦 Family Members: {len(HERA_DATA['family'])}")
    print(f"  ✈️ Travel Segments: {len(HERA_DATA['travel'])}")
    print(f"  📅 Itinerary Activities: {len(HERA_DATA['itinerary'])}")
    print(f"  🎒 Packing Items: {len(HERA_DATA['packing'])}")

    # Find the proposal activity
    proposal_activity = next((item for item in HERA_DATA['itinerary'] if item.get('isProposal')), None)
    if proposal_activity:
        print(f"\n💍 THE BIG MOMENT:")
        print(f"   {proposal_activity['time']} - {proposal_activity['activity']}")
        print(f"   Location: {proposal_activity['location']}")

    print(f"\n🔗 Access Information:")
    print(f"  URL: http://localhost:5000")
    print(f"  Username: admin")
    print(f"  Password: admin123")

    print(f"\n🎉 Days until proposal: {calculate_days_until_proposal()}")
    print("=" * 60)

    try:
        app.run(debug=True, host='0.0.0.0', port=5000)
    except KeyboardInterrupt:
        print("\n\n👋 Server stopped. Your data is saved in hera_data.json")
    except Exception as e:
        print(f"\n❌ Error starting server: {e}")