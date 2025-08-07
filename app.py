from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
import json
import os
from datetime import datetime, timedelta
from werkzeug.utils import secure_filename
from flask import send_file
from werkzeug.datastructures import FileStorage
import uuid
import mimetypes


app = Flask(__name__)
app.secret_key = 'hera_proposal_2025_emerald_lake_secret'

# Flask-Login setup
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

class User(UserMixin):
    def __init__(self, id, username, password_hash, display_name=None):
        self.id = id
        self.username = username
        self.password_hash = password_hash
        self.display_name = display_name or username

users = {
    'admin': User('admin', 'admin', generate_password_hash('admin123'), 'Vikrant')
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
        {"id": 2, "date": "2025-09-24", "day": 1, "time": "15:15", "activity": "Drive to Banff", "location": "YYC to Canalta Lodge", "notes": "Approx. 1.5-hour scenic drive"},
        {"id": 3, "date": "2025-09-24", "day": 1, "time": "16:15", "activity": "Hotel check-in and unwind", "location": "Canalta Lodge, Banff", "notes": "Relax after travel"},
        {"id": 4, "date": "2025-09-24", "day": 1, "time": "17:45", "activity": "Dinner", "location": "Farm & Fire or Lupo, Banff", "notes": "Reservation recommended"},
        {"id": 5, "date": "2025-09-24", "day": 1, "time": "19:15", "activity": "Relaxation", "location": "Canalta Lodge", "notes": "Use hot tub, fireplace lounge"},
        {"id": 6, "date": "2025-09-25", "day": 2, "time": "08:00", "activity": "Breakfast", "location": "Canalta Lodge or Whitebark Café", "notes": "Casual breakfast, local options"},
        {"id": 7, "date": "2025-09-25", "day": 2, "time": "11:30", "activity": "Ride Banff Gondola and explore summit", "location": "Sulphur Mountain Summit", "notes": "Uplift at 11:30 AM, download at 2:30 PM"},
        {"id": 8, "date": "2025-09-25", "day": 2, "time": "12:30", "activity": "Lunch at summit", "location": "Sky Bistro", "notes": "Reserved at 12:30 PM"},
        {"id": 9, "date": "2025-09-25", "day": 2, "time": "14:00", "activity": "Explore summit boardwalk", "location": "Sulphur Mountain", "notes": "Interpretive signage, scenic views"},
        {"id": 10, "date": "2025-09-25", "day": 2, "time": "15:00", "activity": "Nap or rest break", "location": "Canalta Lodge", "notes": "Recharge"},
        {"id": 11, "date": "2025-09-25", "day": 2, "time": "16:15", "activity": "Spa session", "location": "Cedar + Sage Co", "notes": "60-minute Couples' Massage"},
        {"id": 12, "date": "2025-09-25", "day": 2, "time": "18:00", "activity": "Dinner", "location": "Bear Street Tavern or similar", "notes": "Walk-in possible, reservations good"},
        {"id": 13, "date": "2025-09-25", "day": 2, "time": "19:30", "activity": "Evening at lodge", "location": "Canalta Lodge", "notes": "Optional hot tub or early night"},
        {"id": 14, "date": "2025-09-26", "day": 3, "time": "07:00", "activity": "Drive to Emerald Lake", "location": "Banff to Emerald Lake", "notes": "~1-hour scenic drive"},
        {"id": 15, "date": "2025-09-26", "day": 3, "time": "08:00", "activity": "Proposal + Photoshoot", "location": "Emerald Lake", "notes": "2-hour session with photographer", "isProposal": True},
        {"id": 16, "date": "2025-09-26", "day": 3, "time": "12:00", "activity": "Lunch", "location": "Around Banff", "notes": "Flexible lunch stop"},
        {"id": 17, "date": "2025-09-26", "day": 3, "time": "15:30", "activity": "Distillery Tour", "location": "Park Distillery, Banff", "notes": "Arrive 5–10 mins early for check-in"},
        {"id": 18, "date": "2025-09-26", "day": 3, "time": "18:30", "activity": "Dinner", "location": "1888 Chop House, Fairmont Banff Springs", "notes": "Reservation at 6:30 PM"},
        {"id": 19, "date": "2025-09-26", "day": 3, "time": "20:30", "activity": "Wind down", "location": "Canalta Lodge", "notes": "Relax, hot tub, or fireplace lounge"},
        {"id": 20, "date": "2025-09-27", "day": 4, "time": "08:00", "activity": "Breakfast", "location": "Canalta Lodge", "notes": "Light breakfast to start the day"},
        {"id": 21, "date": "2025-09-27", "day": 4, "time": "12:00", "activity": "Lake Minnewanka Cruise", "location": "Lake Minnewanka", "notes": "Arrive at dock by 11:45 AM"},
        {"id": 22, "date": "2025-09-27", "day": 4, "time": "13:00", "activity": "Lunch", "location": "Minnewanka or Banff", "notes": "Optional café nearby or pack a picnic"},
        {"id": 23, "date": "2025-09-27", "day": 4, "time": "14:00", "activity": "Return & prep for afternoon", "location": "Canalta Lodge", "notes": "Change or rest briefly"},
        {"id": 24, "date": "2025-09-27", "day": 4, "time": "14:30", "activity": "Lake Louise Visit (incl. drive)", "location": "Lake Louise", "notes": "~1 hr drive each way, ~2 hrs at the lake"},
        {"id": 25, "date": "2025-09-27", "day": 4, "time": "19:30", "activity": "Dinner", "location": "The Bison", "notes": "Reservation at 7:30 PM"},
        {"id": 26, "date": "2025-09-27", "day": 4, "time": "20:00", "activity": "Evening rest", "location": "Canalta Lodge", "notes": "Hot tub, fireplace lounge, or early night"},
        {"id": 27, "date": "2025-09-28", "day": 5, "time": "09:00", "activity": "Breakfast", "location": "Canalta Lodge", "notes": "Start slowly after several busy days"},
        {"id": 28, "date": "2025-09-28", "day": 5, "time": "10:00", "activity": "Drive to Peyto Lake", "location": "Banff → Bow Summit (Icefields Pkwy)", "notes": "~75-minute scenic drive (peytolake.ca)"},
        {"id": 29, "date": "2025-09-28", "day": 5, "time": "11:15", "activity": "Short walk to Peyto Viewpoint", "location": "Paved ~1.5 km round-trip", "notes": "Easy walk to iconic viewpoint"},
        {"id": 30, "date": "2025-09-28", "day": 5, "time": "12:00", "activity": "Drive to Field, BC", "location": "Peyto → Field via Trans-Canada Hwy", "notes": "~1-hour drive"},
        {"id": 31, "date": "2025-09-28", "day": 5, "time": "13:15", "activity": "Lunch at Truffle Pigs Bistro", "location": "Field, BC", "notes": "Opens at 11 am—great timing for a relaxed meal"},
        {"id": 32, "date": "2025-09-28", "day": 5, "time": "14:45", "activity": "Drive to Takakkaw Falls", "location": "Field → Yoho Valley Rd turnoff", "notes": "~30 minutes scenic through Kicking Horse Pass"},
        {"id": 33, "date": "2025-09-28", "day": 5, "time": "15:15", "activity": "Visit Takakkaw Falls", "location": "Yoho National Park", "notes": "300 m paved walk to base—easy family-friendly trail"},
        {"id": 34, "date": "2025-09-28", "day": 5, "time": "16:00", "activity": "Return drive to Banff", "location": "Yoho → Banff", "notes": "~60-minute drive back via Trans-Canada Hwy"},
        {"id": 35, "date": "2025-09-28", "day": 5, "time": "17:00", "activity": "Optional rest/spa or nap", "location": "Canalta Lodge", "notes": "Rejuvenate before evening"},
        {"id": 36, "date": "2025-09-28", "day": 5, "time": "18:30", "activity": "Farewell dinner", "location": "Eden, The Bison, or Saltlik", "notes": "Reservation recommended"},
        {"id": 37, "date": "2025-09-28", "day": 5, "time": "20:00", "activity": "Final evening wind-down", "location": "Canalta Lodge", "notes": "Hot tub, fireplace lounge, finalize packing"},
        {"id": 38, "date": "2025-09-29", "day": 6, "time": "08:30", "activity": "Breakfast and packing", "location": "Canalta Lodge", "notes": "Light breakfast included or grab coffee/pastries"},
        {"id": 39, "date": "2025-09-29", "day": 6, "time": "09:30", "activity": "Drive to Calgary International Airport (YYC)", "location": "Banff → YYC", "notes": "~1 hr 45 min drive with traffic buffer"},
        {"id": 40, "date": "2025-09-29", "day": 6, "time": "11:15", "activity": "Return rental car", "location": "Calgary Airport rental desk", "notes": "Budget 20–30 minutes"},
        {"id": 41, "date": "2025-09-29", "day": 6, "time": "11:45", "activity": "Security and boarding", "location": "YYC Departures Terminal", "notes": "Recommended 2 hours before international flight"},
        {"id": 42, "date": "2025-09-29", "day": 6, "time": "13:55", "activity": "Flight departs", "location": "YYC", "notes": "Bon voyage!"}
    ],
    "packing": [
        {"id": 1, "item": "Engagement Ring", "packed": False, "notes": ""},
        {"id": 2, "item": "Travel Documents", "packed": False, "notes": ""},
        {"id": 3, "item": "Clothes", "packed": False, "notes": ""},
        {"id": 4, "item": "Hiking Gear", "packed": False, "notes": ""},
        {"id": 5, "item": "Camera/Tripod", "packed": False, "notes": ""},
        {"id": 6, "item": "Toiletries", "packed": False, "notes": ""},
        {"id": 7, "item": "Daypack", "packed": False, "notes": ""}
    ],
    "files": []
}


def get_file_type(filename):
    """Determine file type based on extension"""
    if not filename:
        return 'other'

    ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''

    if ext in ['jpg', 'jpeg', 'png', 'gif', 'webp']:
        return 'image'
    elif ext == 'pdf':
        return 'pdf'
    elif ext in ['doc', 'docx']:
        return 'document'
    elif ext in ['xls', 'xlsx']:
        return 'spreadsheet'
    elif ext == 'txt':
        return 'text'
    elif ext == 'zip':
        return 'archive'
    else:
        return 'other'


def format_file_size(size_bytes):
    """Format file size in human readable format"""
    if size_bytes == 0:
        return "0 B"
    size_names = ["B", "KB", "MB", "GB", "TB"]
    import math
    i = int(math.floor(math.log(size_bytes, 1024)))
    p = math.pow(1024, i)
    s = round(size_bytes / p, 2)
    return f"{s} {size_names[i]}"


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

    # Calculate task completion stats
    completed_tasks = [t for t in HERA_DATA['main']['tasks'] if 'Complete' in t['status']]
    total_tasks = len(HERA_DATA['main']['tasks'])
    task_progress = (len(completed_tasks) / total_tasks * 100) if total_tasks > 0 else 0

    # Family approval stats
    approved_family = len([f for f in HERA_DATA['family'] if f['status'] == 'Approved'])
    total_family = len(HERA_DATA['family'])

    # Packing progress
    packed_items = len([p for p in HERA_DATA['packing'] if p['packed']])
    total_items = len(HERA_DATA['packing'])

    return render_template('dashboard.html',
                         days_until=days_until,
                         budget_stats=budget_stats,
                         approved_family=approved_family,
                         total_family=total_family,
                         packed_items=packed_items,
                         total_items=total_items,
                         completed_tasks=completed_tasks,
                         total_tasks=total_tasks,
                         task_progress=task_progress,
                         top_budget_items=HERA_DATA['budget'][:5],
                         HERA_DATA=HERA_DATA)

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
    # Check for ring images in uploads folder
    ring_images = []
    ring_upload_path = os.path.join('static', 'uploads', 'ring')
    if os.path.exists(ring_upload_path):
        ring_images = [f for f in os.listdir(ring_upload_path)
                       if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif'))]

    return render_template('ring.html',
                           ring=HERA_DATA['ring'],
                           ring_images=ring_images)


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
    """Travel details page with organized data"""
    # Separate travel data by type
    outbound_flights = [t for t in HERA_DATA['travel'] if
                        'IAD - DEN' in t.get('segment', '') or 'DEN - YYC' in t.get('segment', '')]
    return_flights = [t for t in HERA_DATA['travel'] if
                      'YYC - YYZ' in t.get('segment', '') or 'YYZ - DCA' in t.get('segment', '')]
    hotels = [t for t in HERA_DATA['travel'] if 'Hotel' in t.get('segment', '')]
    ground_transport = [t for t in HERA_DATA['travel'] if 'Rental Car' in t.get('segment', '')]

    return render_template('travel.html',
                           outbound_flights=outbound_flights,
                           return_flights=return_flights,
                           hotels=hotels,
                           ground_transport=ground_transport,
                           travel_data=HERA_DATA['travel'])

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
    """Packing list page with categories"""
    packed_count = len([p for p in HERA_DATA['packing'] if p['packed']])

    # Add default category to items that don't have one
    for item in HERA_DATA['packing']:
        if 'category' not in item:
            # Assign categories based on item names
            item_lower = item['item'].lower()
            if any(word in item_lower for word in ['ring', 'documents', 'passport']):
                item['category'] = 'Essential'
            elif any(word in item_lower for word in ['camera', 'tripod', 'gear']):
                item['category'] = 'Equipment'
            elif any(word in item_lower for word in ['clothes', 'hiking']):
                item['category'] = 'Clothing'
            elif any(word in item_lower for word in ['toiletries']):
                item['category'] = 'Personal Care'
            else:
                item['category'] = 'General'

    # Get unique categories
    categories = list(set([item.get('category', 'General') for item in HERA_DATA['packing']]))
    if not categories:
        categories = ['General']

    return render_template('packing.html',
                           packing_items=HERA_DATA['packing'],
                           packed_count=packed_count,
                           total_count=len(HERA_DATA['packing']),
                           categories=categories)

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


@app.route('/api/ring/upload-photos', methods=['POST'])
@login_required
def upload_ring_photos():
    """Handle ring photo uploads"""
    try:
        # Check if files were sent
        if 'photos' not in request.files:
            return jsonify({'success': False, 'error': 'No photos provided'})

        files = request.files.getlist('photos')
        if not files or files[0].filename == '':
            return jsonify({'success': False, 'error': 'No photos selected'})

        # Create upload directory if it doesn't exist
        upload_dir = os.path.join(app.static_folder, 'uploads', 'ring')
        os.makedirs(upload_dir, exist_ok=True)

        uploaded_files = []
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

        for file in files:
            # Validate file type
            if not file.filename:
                continue

            file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
            if file_ext not in allowed_extensions:
                continue

            # Generate safe filename with timestamp to avoid conflicts
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            random_id = str(uuid.uuid4())[:8]
            safe_filename = f"ring_{timestamp}_{random_id}.{file_ext}"

            # Save file
            file_path = os.path.join(upload_dir, safe_filename)
            file.save(file_path)
            uploaded_files.append(safe_filename)

        if not uploaded_files:
            return jsonify({'success': False, 'error': 'No valid image files were uploaded'})

        return jsonify({
            'success': True,
            'message': f'{len(uploaded_files)} photos uploaded successfully',
            'files': uploaded_files
        })

    except Exception as e:
        print(f"Upload error: {e}")  # For debugging
        return jsonify({'success': False, 'error': f'Upload failed: {str(e)}'})


@app.route('/api/ring/delete-photo/<filename>', methods=['DELETE'])
@login_required
def delete_ring_photo(filename):
    """Delete a ring photo"""
    try:
        # Validate filename to prevent directory traversal
        safe_filename = secure_filename(filename)
        if safe_filename != filename:
            return jsonify({'success': False, 'error': 'Invalid filename'})

        # Construct file path
        file_path = os.path.join(app.static_folder, 'uploads', 'ring', safe_filename)

        # Check if file exists and delete it
        if os.path.exists(file_path):
            os.remove(file_path)
            return jsonify({'success': True, 'message': 'Photo deleted successfully'})
        else:
            return jsonify({'success': False, 'error': 'Photo not found'})

    except Exception as e:
        print(f"Delete error: {e}")  # For debugging
        return jsonify({'success': False, 'error': f'Delete failed: {str(e)}'})


# Optional: Add route to get ring photo list (for refreshing without page reload)
@app.route('/api/ring/photos', methods=['GET'])
@login_required
def get_ring_photos():
    """Get list of ring photos"""
    try:
        ring_upload_path = os.path.join(app.static_folder, 'uploads', 'ring')
        if not os.path.exists(ring_upload_path):
            return jsonify({'success': True, 'photos': []})

        photos = [f for f in os.listdir(ring_upload_path)
                  if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp'))]

        return jsonify({'success': True, 'photos': photos})

    except Exception as e:
        print(f"Get photos error: {e}")
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


@app.route('/api/budget/add', methods=['POST'])
@login_required
def add_budget_item():
    """Add new budget item"""
    try:
        data = request.get_json()

        # Generate new ID
        max_id = max([item['id'] for item in HERA_DATA['budget']], default=0)
        new_item = {
            'id': max_id + 1,
            'category': data['category'],
            'budget': float(data['budget_amount']),
            'saved': float(data['budget_saved']),
            'remaining': float(data['budget_amount']) - float(data['budget_saved']),
            'notes': data.get('notes', ''),
            'status': data['status'],
            'priority': data.get('priority', 'medium')
        }

        HERA_DATA['budget'].append(new_item)
        save_data()

        return jsonify({'success': True, 'budget_item': new_item})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route('/api/budget/update', methods=['POST'])
@login_required
def update_budget_item():
    """Update existing budget item"""
    try:
        data = request.get_json()
        item_id = int(data['id'])

        item = next((item for item in HERA_DATA['budget'] if item['id'] == item_id), None)
        if not item:
            return jsonify({'success': False, 'error': 'Item not found'})

        # Update item
        item['category'] = data['category']
        item['budget'] = float(data['budget_amount'])
        item['saved'] = float(data['budget_saved'])
        item['remaining'] = item['budget'] - item['saved']
        item['notes'] = data.get('notes', '')
        item['status'] = data['status']
        item['priority'] = data.get('priority', 'medium')

        save_data()
        return jsonify({'success': True, 'budget_item': item})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route('/api/budget/delete/<int:item_id>', methods=['DELETE'])
@login_required
def delete_budget_item(item_id):
    """Delete budget item"""
    try:
        HERA_DATA['budget'] = [item for item in HERA_DATA['budget'] if item['id'] != item_id]
        save_data()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


# FAMILY CRUD OPERATIONS
@app.route('/api/family/update', methods=['POST'])
@login_required
def update_family_member():
    """Update family member details"""
    try:
        data = request.get_json()
        member_id = int(data['id'])
        field = data['field']
        value = data['value']

        member = next((m for m in HERA_DATA['family'] if m['id'] == member_id), None)
        if not member:
            return jsonify({'success': False, 'error': 'Member not found'})

        member[field] = value
        save_data()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


# PACKING CRUD OPERATIONS
@app.route('/api/packing/add', methods=['POST'])
@login_required
def add_packing_item():
    """Add new packing item"""
    try:
        data = request.get_json()

        # Generate new ID
        max_id = max([item['id'] for item in HERA_DATA['packing']], default=0)
        new_item = {
            'id': max_id + 1,
            'item': data['item_name'],
            'category': data.get('category', 'General'),
            'packed': data.get('packed', False),
            'notes': data.get('notes', ''),
            'quantity': int(data.get('quantity', 1)),
            'priority': data.get('priority', 'medium')
        }

        HERA_DATA['packing'].append(new_item)
        save_data()

        return jsonify({'success': True, 'packing_item': new_item})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route('/api/packing/update', methods=['POST'])
@login_required
def update_packing_item():
    """Update packing item"""
    try:
        data = request.get_json()
        item_id = int(data['id'])
        field = data['field']
        value = data['value']

        item = next((item for item in HERA_DATA['packing'] if item['id'] == item_id), None)
        if not item:
            return jsonify({'success': False, 'error': 'Item not found'})

        item[field] = value
        save_data()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route('/api/packing/delete/<int:item_id>', methods=['DELETE'])
@login_required
def delete_packing_item(item_id):
    """Delete packing item"""
    try:
        HERA_DATA['packing'] = [item for item in HERA_DATA['packing'] if item['id'] != item_id]
        save_data()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


# RING UPDATE OPERATIONS
@app.route('/api/ring/update', methods=['POST'])
@login_required
def update_ring():
    """Update ring details"""
    try:
        data = request.get_json()
        field = data['field']
        value = data['value']

        # Map template field names to data keys
        field_mapping = {
            'jeweler': 'Jeweler',
            'metal': 'Metal',
            'stone': 'Stone(s)',
            'delivered': 'Delivered',
            'insured': 'Insured',
            'insurance_details': 'Insurance Details'
        }

        actual_field = field_mapping.get(field, field)
        HERA_DATA['ring'][actual_field] = value
        save_data()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


# ITINERARY CRUD OPERATIONS
@app.route('/api/itinerary/add', methods=['POST'])
@login_required
def add_itinerary_item():
    """Add new itinerary activity - ENHANCED"""
    try:
        data = request.get_json()

        # Generate new ID
        max_id = max([item['id'] for item in HERA_DATA['itinerary']], default=0)
        new_item = {
            'id': max_id + 1,
            'day': int(data.get('day', 1)),  # ADD this line
            'time': data['time'],
            'activity': data['activity'],
            'location': data.get('location', ''),  # Make optional
            'notes': data.get('notes', ''),
            'isProposal': data.get('isProposal', False),
            'completed': False  # ADD this line
        }

        HERA_DATA['itinerary'].append(new_item)
        save_data()

        return jsonify({'success': True, 'itinerary_item': new_item})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route('/api/itinerary/update', methods=['POST'])
@login_required
def update_itinerary_item():
    """Update itinerary activity - ENHANCED"""
    try:
        data = request.get_json()
        item_id = int(data['id'])

        item = next((item for item in HERA_DATA['itinerary'] if item['id'] == item_id), None)
        if not item:
            return jsonify({'success': False, 'error': 'Item not found'})

        # Handle single field updates (inline editing)
        if 'field' in data and 'value' in data:
            field = data['field']
            value = data['value']
            item[field] = value
        else:
            # Handle full item updates (modal editing) - ADD this block
            allowed_fields = ['day', 'time', 'activity', 'location', 'notes', 'isProposal']
            for field in allowed_fields:
                if field in data:
                    item[field] = data[field]

        save_data()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route('/api/itinerary/delete/<int:item_id>', methods=['DELETE'])
@login_required
def delete_itinerary_item(item_id):
    """Delete itinerary activity"""
    try:
        HERA_DATA['itinerary'] = [item for item in HERA_DATA['itinerary'] if item['id'] != item_id]
        save_data()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route('/api/itinerary/<int:item_id>/complete', methods=['POST'])
@login_required
def toggle_itinerary_complete(item_id):
    """Toggle itinerary activity completion status - MISSING ENDPOINT"""
    try:
        data = request.get_json()
        completed = data.get('completed', False)

        item = next((item for item in HERA_DATA['itinerary'] if item['id'] == item_id), None)
        if not item:
            return jsonify({'success': False, 'error': 'Item not found'})

        item['completed'] = completed
        save_data()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route('/files')
@login_required
def files():
    """Files management page"""
    files_data = HERA_DATA.get('files', [])

    # Calculate statistics
    total_size = sum(file.get('size_bytes', 0) for file in files_data)
    total_size_formatted = format_file_size(total_size)

    # Get unique categories
    categories = list(set(file.get('category', 'other') for file in files_data))

    # Count recent uploads (last 7 days)
    recent_count = 0
    week_ago = datetime.now() - timedelta(days=7)
    for file in files_data:
        if file.get('upload_date'):
            upload_date = datetime.fromisoformat(file['upload_date'].replace('Z', '+00:00'))
            if upload_date > week_ago:
                recent_count += 1

    # Count files by category
    category_counts = {
        'travel_docs_count': len([f for f in files_data if f.get('category') == 'travel']),
        'reservations_count': len([f for f in files_data if f.get('category') == 'reservations']),
        'photos_count': len([f for f in files_data if f.get('category') == 'photos']),
        'documents_count': len([f for f in files_data if f.get('category') == 'documents']),
        'other_count': len([f for f in files_data if f.get('category') == 'other']),
    }

    return render_template('files.html',
                           files=files_data,
                           total_size=total_size_formatted,
                           categories=categories,
                           recent_count=recent_count,
                           **category_counts)


@app.route('/api/files/upload', methods=['POST'])
@login_required
def upload_files():
    """Handle file uploads"""
    try:
        # Check if files were sent
        if 'files' not in request.files:
            return jsonify({'success': False, 'error': 'No files provided'})

        files = request.files.getlist('files')
        categories = request.form.getlist('categories')
        notes_list = request.form.getlist('notes')

        if not files or files[0].filename == '':
            return jsonify({'success': False, 'error': 'No files selected'})

        # Create upload directory if it doesn't exist
        upload_dir = os.path.join(app.static_folder, 'uploads', 'files')
        os.makedirs(upload_dir, exist_ok=True)

        uploaded_files = []
        allowed_extensions = {
            'pdf', 'doc', 'docx', 'txt', 'zip', 'xlsx', 'xls',
            'jpg', 'jpeg', 'png', 'gif', 'webp'
        }

        for i, file in enumerate(files):
            if not file.filename:
                continue

            # Validate file type
            file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
            if file_ext not in allowed_extensions:
                continue

            # Generate safe filename with timestamp to avoid conflicts
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            random_id = str(uuid.uuid4())[:8]
            safe_filename = f"file_{timestamp}_{random_id}.{file_ext}"

            # Save file
            file_path = os.path.join(upload_dir, safe_filename)
            file.save(file_path)

            # Get file info
            file_size = os.path.getsize(file_path)
            file_type = get_file_type(file.filename)

            # Create file record
            file_record = {
                'id': len(HERA_DATA['files']) + len(uploaded_files) + 1,
                'filename': safe_filename,
                'original_name': file.filename,
                'size': format_file_size(file_size),
                'size_bytes': file_size,
                'type': file_type,
                'category': categories[i] if i < len(categories) else 'other',
                'notes': notes_list[i] if i < len(notes_list) else '',
                'upload_date': datetime.now().isoformat(),
                'mimetype': file.mimetype
            }

            uploaded_files.append(file_record)

        if not uploaded_files:
            return jsonify({'success': False, 'error': 'No valid files were uploaded'})

        # Add to HERA_DATA and save
        HERA_DATA['files'].extend(uploaded_files)
        save_data()

        return jsonify({
            'success': True,
            'message': f'{len(uploaded_files)} files uploaded successfully',
            'uploaded_count': len(uploaded_files),
            'files': uploaded_files
        })

    except Exception as e:
        print(f"Upload error: {e}")  # For debugging
        return jsonify({'success': False, 'error': f'Upload failed: {str(e)}'})


@app.route('/api/files/download/<filename>')
@login_required
def download_file(filename):
    """Download a file"""
    try:
        # Validate filename to prevent directory traversal
        safe_filename = secure_filename(filename)
        if safe_filename != filename:
            return jsonify({'error': 'Invalid filename'}), 400

        file_path = os.path.join(app.static_folder, 'uploads', 'files', safe_filename)

        if not os.path.exists(file_path):
            return jsonify({'error': 'File not found'}), 404

        # Get original filename from database
        file_record = next((f for f in HERA_DATA['files'] if f['filename'] == filename), None)
        download_name = file_record['original_name'] if file_record else filename

        return send_file(file_path, as_attachment=True, download_name=download_name)

    except Exception as e:
        print(f"Download error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/files/delete/<int:file_id>', methods=['DELETE'])
@login_required
def delete_file(file_id):
    """Delete a file"""
    try:
        # Find file record
        file_record = next((f for f in HERA_DATA['files'] if f['id'] == file_id), None)
        if not file_record:
            return jsonify({'success': False, 'error': 'File not found'})

        # Delete physical file
        file_path = os.path.join(app.static_folder, 'uploads', 'files', file_record['filename'])
        if os.path.exists(file_path):
            os.remove(file_path)

        # Remove from data
        HERA_DATA['files'] = [f for f in HERA_DATA['files'] if f['id'] != file_id]
        save_data()

        return jsonify({'success': True, 'message': 'File deleted successfully'})

    except Exception as e:
        print(f"Delete error: {e}")
        return jsonify({'success': False, 'error': str(e)})


@app.route('/api/files/update/<int:file_id>', methods=['POST'])
@login_required
def update_file(file_id):
    """Update file details"""
    try:
        data = request.get_json()

        # Find file record
        file_record = next((f for f in HERA_DATA['files'] if f['id'] == file_id), None)
        if not file_record:
            return jsonify({'success': False, 'error': 'File not found'})

        # Update fields
        if 'name' in data:
            file_record['original_name'] = data['name']
        if 'category' in data:
            file_record['category'] = data['category']
        if 'notes' in data:
            file_record['notes'] = data['notes']

        file_record['updated_date'] = datetime.now().isoformat()
        save_data()

        return jsonify({
            'success': True,
            'message': 'File updated successfully',
            'file': {
                'name': file_record['original_name'],
                'category': file_record['category'],
                'notes': file_record.get('notes', '')
            }
        })

    except Exception as e:
        print(f"Update error: {e}")
        return jsonify({'success': False, 'error': str(e)})


@app.route('/api/tasks/<int:task_id>/toggle', methods=['POST'])
@login_required
def toggle_task_status(task_id):
    """Toggle task completion status"""
    try:
        data = request.get_json()
        completed = data.get('completed', False)

        # Find task in main.tasks
        task = next((t for t in HERA_DATA['main']['tasks'] if t['id'] == task_id), None)
        if not task:
            return jsonify({'success': False, 'error': 'Task not found'})

        # Update task status based on completion
        if completed:
            if 'Complete' not in task['status']:
                task['status'] = 'Complete, On Schedule'
        else:
            if 'Complete' in task['status']:
                task['status'] = 'In Progress, On Schedule'

        save_data()
        return jsonify({
            'success': True,
            'status': task['status'],
            'completed': completed
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route('/api/tasks/<int:task_id>/update', methods=['POST'])
@login_required
def update_task(task_id):
    """Update task details"""
    try:
        data = request.get_json()

        # Find task in main.tasks
        task = next((t for t in HERA_DATA['main']['tasks'] if t['id'] == task_id), None)
        if not task:
            return jsonify({'success': False, 'error': 'Task not found'})

        # Update task fields
        if 'task' in data:
            task['task'] = data['task']
        if 'deadline' in data:
            task['deadline'] = data['deadline']
        if 'status' in data:
            task['status'] = data['status']
        if 'notes' in data:
            task['notes'] = data['notes']

        save_data()
        return jsonify({
            'success': True,
            'task': {
                'task': task['task'],
                'deadline': task['deadline'],
                'status': task['status'],
                'notes': task['notes']
            }
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route('/api/tasks/add', methods=['POST'])
@login_required
def add_task():
    """Add new task"""
    try:
        data = request.get_json()

        # Generate new ID
        max_id = max([t['id'] for t in HERA_DATA['main']['tasks']], default=0)
        new_task = {
            'id': max_id + 1,
            'task': data['task'],
            'deadline': data['deadline'],
            'status': data.get('status', 'Not Started'),
            'notes': data.get('notes', '')
        }

        HERA_DATA['main']['tasks'].append(new_task)
        save_data()

        return jsonify({'success': True, 'task': new_task})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route('/api/tasks/<int:task_id>/delete', methods=['DELETE'])
@login_required
def delete_task(task_id):
    """Delete task"""
    try:
        # Remove task from main.tasks
        HERA_DATA['main']['tasks'] = [t for t in HERA_DATA['main']['tasks'] if t['id'] != task_id]
        save_data()

        return jsonify({'success': True})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route('/api/dashboard/data', methods=['GET'])
@login_required
def get_dashboard_data():
    """Get dashboard data for refresh"""
    try:
        budget_stats = calculate_budget_stats()
        days_until = calculate_days_until_proposal()

        # Count completed tasks
        completed_tasks = len([t for t in HERA_DATA['main']['tasks'] if 'Complete' in t['status']])
        total_tasks = len(HERA_DATA['main']['tasks'])

        # Family stats
        approved_family = len([f for f in HERA_DATA['family'] if f['status'] == 'Approved'])
        total_family = len(HERA_DATA['family'])

        # Packing stats
        packed_items = len([p for p in HERA_DATA['packing'] if p['packed']])
        total_packing = len(HERA_DATA['packing'])

        return jsonify({
            'success': True,
            'data': HERA_DATA,
            'stats': {
                'budget': budget_stats,
                'days_until': days_until,
                'tasks': {'completed': completed_tasks, 'total': total_tasks},
                'family': {'approved': approved_family, 'total': total_family},
                'packing': {'packed': packed_items, 'total': total_packing}
            }
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route('/api/files', methods=['GET'])
@login_required
def get_files():
    """Get list of files with optional filtering"""
    try:
        category = request.args.get('category')
        search = request.args.get('search', '').lower()

        files_data = HERA_DATA.get('files', [])

        # Apply filters
        if category and category != 'all':
            files_data = [f for f in files_data if f.get('category') == category]

        if search:
            files_data = [f for f in files_data
                          if search in f.get('original_name', '').lower()
                          or search in f.get('category', '').lower()]

        return jsonify({'success': True, 'files': files_data})

    except Exception as e:
        print(f"Get files error: {e}")
        return jsonify({'success': False, 'error': str(e)})


if __name__ == '__main__':
    # Load existing data if available
    load_data()

    print("=" * 60)
    print("🎯 HERA Proposal Planning Dashboard - Railway Ready")
    print("=" * 60)
    print("✅ All 42 itinerary activities loaded")
    print("✅ All Excel data preserved with integrity")
    print("✅ Full CRUD operations available")
    print("✅ Real-time updates and persistence")

    print(f"\n📊 Your Complete Data:")
    print(f"  💰 Budget Items: {len(HERA_DATA['budget'])}")
    print(f"  👨‍👩‍👧‍👦 Family Members: {len(HERA_DATA['family'])}")
    print(f"  ✈️ Travel Segments: {len(HERA_DATA['travel'])}")
    print(f"  📅 Itinerary Activities: {len(HERA_DATA['itinerary'])}")
    print(f"  🎒 Packing Items: {len(HERA_DATA['packing'])}")

    # Railway deployment configuration
    port = int(os.environ.get('PORT', 5000))
    debug_mode = os.environ.get('FLASK_ENV') != 'production'

    print(f"\n🚀 Starting server on port {port}")
    print(f"🔧 Debug mode: {debug_mode}")

    # Find the proposal activity
    proposal_activity = next((item for item in HERA_DATA['itinerary'] if item.get('isProposal')), None)
    if proposal_activity:
        print(f"\n💍 THE BIG MOMENT:")
        print(f"   {proposal_activity['time']} - {proposal_activity['activity']}")
        print(f"   Location: {proposal_activity['location']}")

    print(f"\n🎉 Days until proposal: {calculate_days_until_proposal()}")
    print("=" * 60)

    try:
        app.run(debug=debug_mode, host='0.0.0.0', port=port)
    except KeyboardInterrupt:
        print("\n\n👋 Server stopped. Your data is saved in hera_data.json")
    except Exception as e:
        print(f"\n❌ Error starting server: {e}")