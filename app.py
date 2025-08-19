from flask import Flask, render_template, request, jsonify, redirect, url_for, flash, session, send_file
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from werkzeug.datastructures import FileStorage
from datetime import datetime, timedelta, date, time
from sqlalchemy import desc, asc, and_, or_, func
from dotenv import load_dotenv
import json
import os
import uuid
import random
import mimetypes
import math

# Load environment variables
load_dotenv()

# Import database and models
from database import db, init_db, create_tables, DatabaseConfig
from models import User, Budget, Family, Travel, Itinerary, Packing, Ring, File, Statistics

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'hera_proposal_2025_emerald_lake_secret')

# Initialize database
init_db(app)

# Flask-Login setup
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    """Load user from database"""
    return User.query.get(int(user_id))

# Utility functions
def get_file_type(filename):
    """Determine file type based on extension"""
    if not filename:
        return 'other'
    
    ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
    
    if ext in ['jpg', 'jpeg', 'png', 'gif', 'webp']:
        return 'image'
    elif ext in ['mov', 'mp4', 'avi', 'mkv', 'webm']:
        return 'video'
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
    i = int(math.floor(math.log(size_bytes, 1024)))
    p = math.pow(1024, i)
    s = round(size_bytes / p, 2)
    return f"{s} {size_names[i]}"

def calculate_days_until_proposal():
    """Calculate days until proposal"""
    proposal_date = datetime(2025, 9, 26)  # September 26, 2025
    today = datetime.now()
    delta = proposal_date - today
    return max(0, delta.days)

def calculate_budget_stats():
    """Calculate budget statistics from database"""
    budgets = Budget.query.all()
    total_budget = sum(b.amount for b in budgets)
    total_saved = sum(b.saved for b in budgets)
    total_remaining = sum(b.remaining for b in budgets)
    budget_progress = (total_saved / total_budget * 100) if total_budget > 0 else 0
    
    return {
        'total_budget': total_budget,
        'total_saved': total_saved,
        'total_remaining': total_remaining,
        'budget_progress': budget_progress
    }

# Authentication Routes
@app.route('/login', methods=['GET', 'POST'])
def login():
    """Login page with decoy redirect"""
    if request.method == 'POST':
        username = request.form['username'].strip().lower()
        password = request.form['password'].strip()
        
        # REAL CREDENTIALS - Access to HERA proposal dashboard
        if username == 'admin':
            user = User.query.filter_by(username='admin').first()
            if not user:
                # Create default admin user if doesn't exist
                user = User()
                user.username = 'admin'
                user.set_password('admin123')
                db.session.add(user)
                db.session.commit()
            
            if user.check_password(password):
                login_user(user)
                session['hera_access'] = True
                return redirect(url_for('dashboard'))
        
        # FAKE CREDENTIALS - Redirect to harmless games (the decoy)
        elif username == 'demo' and password == 'test123':
            session['games_access'] = True
            session.pop('hera_access', None)  # Clear any HERA access
            return redirect(url_for('games'))
        
        # ANY OTHER CREDENTIALS - Show error and stay on login
        flash('Invalid username or password')
        return render_template('login.html', show_error=True)
    
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    """Logout and clear session"""
    logout_user()
    session.clear()
    return redirect(url_for('login'))

# Main Dashboard
@app.route('/')
@app.route('/dashboard')
@login_required
def dashboard():
    """Main dashboard with all key metrics from database"""
    if not session.get('hera_access'):
        logout_user()
        session.clear()
        flash('Session expired. Please log in again.')
        return redirect(url_for('login'))
    
    # Calculate metrics from database
    days_until = calculate_days_until_proposal()
    budget_stats = calculate_budget_stats()
    
    # Get tasks data (stored in a JSON field or separate table if needed)
    # For now, we'll use static data for tasks
    tasks = [
        {"id": 1, "task": "Save for Key Expenses", "deadline": "2025-06-01", "status": "In Progress", "notes": "Enough for ring, flights, and hotels. ($8,000)"},
        {"id": 2, "task": "Get Family Permissions", "deadline": "2025-08-03", "status": "In Progress", "notes": "All permissions secured before booking major items."},
        {"id": 3, "task": "Book Flights", "deadline": "2025-07-01", "status": "Complete", "notes": "Ensure best deals for travel."},
        {"id": 4, "task": "Reserve Hotels", "deadline": "2025-07-01", "status": "Complete", "notes": "Accommodations finalized."},
        {"id": 5, "task": "Confirm Transportation", "deadline": "2025-07-01", "status": "Complete", "notes": "Rental car booked; gas budget estimated."},
        {"id": 6, "task": "Plan Proposal Details", "deadline": "2025-06-28", "status": "Complete", "notes": "Includes location, timing, and backup plans."},
        {"id": 7, "task": "Confirm Photographer", "deadline": "2025-07-01", "status": "Complete", "notes": "Research local options; book by this date."},
        {"id": 8, "task": "Finalize Daily Itinerary", "deadline": "2025-08-03", "status": "Complete", "notes": "Reflect finalized bookings and activities."},
        {"id": 9, "task": "Reserve Dining", "deadline": "2025-08-01", "status": "In Progress", "notes": "Key reservations for proposal and celebration."},
        {"id": 10, "task": "Pack Essentials", "deadline": "2025-09-28", "status": "Not Started", "notes": "Ensure everything is ready, including the ring."}
    ]
    
    completed_tasks = [t for t in tasks if 'Complete' in t['status']]
    total_tasks = len(tasks)
    task_progress = (len(completed_tasks) / total_tasks * 100) if total_tasks > 0 else 0
    
    # Family approval stats from database
    family_members = Family.query.all()
    approved_family = len([f for f in family_members if f.status == 'Approved'])
    total_family = len(family_members)
    
    # Packing progress from database
    packing_items = Packing.query.all()
    packed_items = len([p for p in packing_items if p.packed])
    total_items = len(packing_items)
    
    # Get top budget items from database
    top_budget_items = Budget.query.order_by(desc(Budget.amount)).limit(5).all()
    
    # Pass individual variables instead of HERA_DATA
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
                         top_budget_items=top_budget_items,
                         tasks=tasks,
                         family_members=family_members,
                         packing_items=packing_items,
                         budget_items=Budget.query.all())

# Games (Decoy) Route
@app.route('/games')
def games():
    """Personal Break Dashboard - Cover story for wrong credentials"""
    if not session.get('games_access'):
        return redirect(url_for('login'))
    
    game_stats = {
        'high_scores': {
            'snake': random.randint(850, 2340),
            'memory': random.randint(12, 28),
            'clicker': random.randint(15600, 89400),
            'puzzle': random.randint(4200, 18900)
        },
        'total_plays': random.randint(156, 892),
        'time_played': f'{random.randint(12, 47)}h {random.randint(15, 59)}m'
    }
    
    return render_template('games.html', stats=game_stats)

# Budget Routes
@app.route('/budget')
@login_required
def budget():
    """Budget management page with SQLAlchemy data"""
    budget_items = Budget.query.order_by(desc(Budget.priority), desc(Budget.amount)).all()
    budget_stats = calculate_budget_stats()
    
    return render_template('budget.html',
                         budget_items=budget_items,
                         budget_stats=budget_stats)

@app.route('/api/budget/<int:item_id>/toggle', methods=['POST'])
@login_required
def toggle_budget_status(item_id):
    """Toggle budget item payment status"""
    try:
        item = Budget.query.get(item_id)
        if not item:
            return jsonify({'success': False, 'error': 'Item not found'})
        
        item.status = 'Paid' if item.status == 'Outstanding' else 'Outstanding'
        if item.status == 'Paid':
            item.saved = item.amount
        else:
            item.saved = 0
        
        db.session.commit()
        return jsonify({'success': True, 'status': item.status})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/budget/add', methods=['POST'])
@login_required
def add_budget_item():
    """Add new budget item to database"""
    try:
        data = request.get_json()
        
        budget_item = Budget(
            category=data['category'],
            amount=float(data['budget_amount']),
            saved=float(data['budget_saved']),
            notes=data.get('notes', ''),
            status=data['status'],
            priority=data.get('priority', 'Medium')
        )
        
        db.session.add(budget_item)
        db.session.commit()
        
        return jsonify({'success': True, 'budget_item': budget_item.to_dict()})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/budget/update', methods=['POST'])
@login_required
def update_budget_item():
    """Update existing budget item in database"""
    try:
        data = request.get_json()
        item_id = int(data['id'])
        
        item = Budget.query.get(item_id)
        if not item:
            return jsonify({'success': False, 'error': 'Item not found'})
        
        item.category = data['category']
        item.amount = float(data['budget_amount'])
        item.saved = float(data['budget_saved'])
        item.notes = data.get('notes', '')
        item.status = data['status']
        item.priority = data.get('priority', 'Medium')
        
        db.session.commit()
        return jsonify({'success': True, 'budget_item': item.to_dict()})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/budget/delete/<int:item_id>', methods=['DELETE'])
@login_required
def delete_budget_item(item_id):
    """Delete budget item from database"""
    try:
        item = Budget.query.get(item_id)
        if item:
            db.session.delete(item)
            db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

# Ring Routes
@app.route('/ring')
@login_required
def ring():
    """Ring showcase page with SQLAlchemy data"""
    ring_data = Ring.query.first()
    if not ring_data:
        # Create default ring entry if none exists
        ring_data = Ring(
            jeweler='',
            stone='',
            metal='',
            style_inspiration='',
            insurance='',
            status='Researching',
            cost=0,
            deposit_paid=0
        )
        db.session.add(ring_data)
        db.session.commit()
    
    # Check for ring media files
    ring_images = []
    ring_upload_path = os.path.join('static', 'uploads', 'ring')
    if os.path.exists(ring_upload_path):
        ring_images = [f for f in os.listdir(ring_upload_path)
                      if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp',
                                           '.mov', '.mp4', '.avi', '.mkv', '.webm'))]
    
    return render_template('ring.html',
                         ring=ring_data,
                         ring_images=ring_images)

@app.route('/api/ring/update', methods=['POST'])
@login_required
def update_ring():
    """Update ring details in database"""
    try:
        data = request.get_json()
        field = data['field']
        value = data['value']
        
        ring = Ring.query.first()
        if not ring:
            ring = Ring()
            db.session.add(ring)
        
        # Map template field names to model attributes
        field_mapping = {
            'jeweler': 'jeweler',
            'metal': 'metal',
            'stone': 'stone',
            'delivered': 'status',
            'insured': 'insurance',
            'insurance_details': 'insurance',
            'style_inspiration': 'style_inspiration',
            'cost': 'cost',
            'deposit_paid': 'deposit_paid'
        }
        
        actual_field = field_mapping.get(field, field)
        setattr(ring, actual_field, value)
        
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/ring/upload-media', methods=['POST'])
@login_required
def upload_ring_media():
    """Handle ring photo and video uploads"""
    try:
        if 'media' not in request.files:
            return jsonify({'success': False, 'error': 'No media provided'})
        
        files = request.files.getlist('media')
        if not files or files[0].filename == '':
            return jsonify({'success': False, 'error': 'No media selected'})
        
        upload_dir = os.path.join(app.static_folder, 'uploads', 'ring')
        os.makedirs(upload_dir, exist_ok=True)
        
        uploaded_files = []
        allowed_extensions = {
            'png', 'jpg', 'jpeg', 'gif', 'webp',  # Images
            'mov', 'mp4', 'avi', 'mkv', 'webm'    # Videos
        }
        
        for file in files:
            if not file.filename:
                continue
            
            file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
            if file_ext not in allowed_extensions:
                continue
            
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            random_id = str(uuid.uuid4())[:8]
            safe_filename = f"ring_{timestamp}_{random_id}.{file_ext}"
            
            file_path = os.path.join(upload_dir, safe_filename)
            file.save(file_path)
            uploaded_files.append(safe_filename)
        
        if not uploaded_files:
            return jsonify({'success': False, 'error': 'No valid media files were uploaded'})
        
        return jsonify({
            'success': True,
            'message': f'{len(uploaded_files)} media files uploaded successfully',
            'files': uploaded_files
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': f'Upload failed: {str(e)}'})

@app.route('/api/ring/delete-media/<filename>', methods=['DELETE'])
@login_required
def delete_ring_media(filename):
    """Delete a ring photo or video"""
    try:
        safe_filename = secure_filename(filename)
        if safe_filename != filename:
            return jsonify({'success': False, 'error': 'Invalid filename'})
        
        file_path = os.path.join(app.static_folder, 'uploads', 'ring', safe_filename)
        
        if os.path.exists(file_path):
            os.remove(file_path)
            return jsonify({'success': True, 'message': 'Media deleted successfully'})
        else:
            return jsonify({'success': False, 'error': 'Media not found'})
    
    except Exception as e:
        return jsonify({'success': False, 'error': f'Delete failed: {str(e)}'})

@app.route('/api/ring/media', methods=['GET'])
@login_required
def get_ring_media():
    """Get list of ring photos and videos"""
    try:
        ring_upload_path = os.path.join(app.static_folder, 'uploads', 'ring')
        if not os.path.exists(ring_upload_path):
            return jsonify({'success': True, 'media': []})
        
        media_files = [f for f in os.listdir(ring_upload_path)
                      if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp',
                                           '.mov', '.mp4', '.avi', '.mkv', '.webm'))]
        
        return jsonify({'success': True, 'media': media_files})
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

# Family Routes
@app.route('/family')
@login_required
def family():
    """Family permissions page with SQLAlchemy data"""
    family_members = Family.query.order_by(Family.name).all()
    approved_count = len([f for f in family_members if f.status == 'Approved'])
    
    return render_template('family.html',
                         family_members=family_members,
                         approved_count=approved_count,
                         total_count=len(family_members))

@app.route('/api/family/<int:member_id>/toggle', methods=['POST'])
@login_required
def toggle_family_status(member_id):
    """Toggle family member approval status"""
    try:
        member = Family.query.get(member_id)
        if not member:
            return jsonify({'success': False, 'error': 'Member not found'})
        
        # Cycle through: Not Asked -> Pending -> Approved
        status_cycle = ['Not Asked', 'Pending', 'Approved']
        current_index = status_cycle.index(member.status) if member.status in status_cycle else 0
        next_index = (current_index + 1) % len(status_cycle)
        member.status = status_cycle[next_index]
        
        if member.status == 'Approved':
            member.conversation_date = date.today()
        
        db.session.commit()
        return jsonify({'success': True, 'status': member.status})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/family/update', methods=['POST'])
@login_required
def update_family_member():
    """Update family member details"""
    try:
        data = request.get_json()
        member_id = int(data['id'])
        field = data['field']
        value = data['value']
        
        member = Family.query.get(member_id)
        if not member:
            return jsonify({'success': False, 'error': 'Member not found'})
        
        setattr(member, field, value)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

# Travel Routes
@app.route('/travel')
@login_required
def travel():
    """Travel details page with SQLAlchemy data"""
    # Get all travel arrangements from database
    all_travel = Travel.query.order_by(Travel.date, Travel.departure_time).all()
    
    # Separate by type
    outbound_flights = [t for t in all_travel if t.type == 'Flight' and 
                       ('IAD' in t.details or 'DEN' in t.details or 'YYC' in t.details) and
                       t.date and t.date <= date(2025, 9, 24)]
    
    return_flights = [t for t in all_travel if t.type == 'Flight' and
                     ('YYC' in t.details or 'IAH' in t.details or 'DCA' in t.details) and
                     t.date and t.date >= date(2025, 9, 29)]
    
    hotels = [t for t in all_travel if t.type == 'Hotel']
    ground_transport = [t for t in all_travel if t.type in ['Car', 'Transport']]
    
    # For template compatibility, create travel_data list
    travel_data = all_travel
    
    return render_template('travel.html',
                         outbound_flights=outbound_flights,
                         return_flights=return_flights,
                         hotels=hotels,
                         ground_transport=ground_transport,
                         travel_data=travel_data)

# Itinerary Routes
@app.route('/itinerary')
@login_required
def itinerary():
    """Itinerary page with SQLAlchemy data"""
    # Get all itinerary items sorted by day and time
    itinerary_items = Itinerary.query.order_by(Itinerary.day, Itinerary.time).all()
    total_activities = len(itinerary_items)
    
    return render_template('itinerary.html',
                         itinerary_items=itinerary_items,
                         total_activities=total_activities)

@app.route('/api/itinerary/add', methods=['POST'])
@login_required
def add_itinerary_item():
    """Add new itinerary activity to database"""
    try:
        data = request.get_json()
        
        # Parse time if provided
        activity_time = None
        if data.get('time'):
            try:
                activity_time = datetime.strptime(data['time'], '%H:%M').time()
            except:
                pass
        
        # Calculate date from day number
        trip_start = date(2025, 9, 24)
        activity_day = int(data.get('day', 1))
        activity_date = trip_start + timedelta(days=activity_day - 1)
        
        # Check if it's a proposal activity
        is_proposal = 'PROPOSAL' in data.get('activity', '').upper()
        
        item = Itinerary(
            day=activity_day,
            date=activity_date,
            time=activity_time,
            activity=data['activity'],
            location=data.get('location', ''),
            notes=data.get('notes', ''),
            is_proposal=is_proposal or data.get('isProposal', False),
            completed=False,
            priority=data.get('priority', 'Medium')
        )
        
        db.session.add(item)
        db.session.commit()
        
        return jsonify({'success': True, 'itinerary_item': item.to_dict()})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/itinerary/update', methods=['POST'])
@login_required
def update_itinerary_item():
    """Update itinerary activity in database"""
    try:
        data = request.get_json()
        item_id = int(data['id'])
        
        item = Itinerary.query.get(item_id)
        if not item:
            return jsonify({'success': False, 'error': 'Item not found'})
        
        # Handle single field updates (inline editing)
        if 'field' in data and 'value' in data:
            field = data['field']
            value = data['value']
            
            if field == 'time' and value:
                try:
                    value = datetime.strptime(value, '%H:%M').time()
                except:
                    pass
            
            setattr(item, field, value)
        else:
            # Handle full item updates (modal editing)
            if 'day' in data:
                item.day = int(data['day'])
                # Recalculate date
                trip_start = date(2025, 9, 24)
                item.date = trip_start + timedelta(days=item.day - 1)
            
            if 'time' in data:
                try:
                    item.time = datetime.strptime(data['time'], '%H:%M').time()
                except:
                    pass
            
            if 'activity' in data:
                item.activity = data['activity']
                item.is_proposal = 'PROPOSAL' in data['activity'].upper()
            
            if 'location' in data:
                item.location = data['location']
            
            if 'notes' in data:
                item.notes = data['notes']
            
            if 'isProposal' in data:
                item.is_proposal = data['isProposal']
        
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/itinerary/delete/<int:item_id>', methods=['DELETE'])
@login_required
def delete_itinerary_item(item_id):
    """Delete itinerary activity from database"""
    try:
        item = Itinerary.query.get(item_id)
        if item:
            db.session.delete(item)
            db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/itinerary/<int:item_id>/complete', methods=['POST'])
@login_required
def toggle_itinerary_complete(item_id):
    """Toggle itinerary activity completion status"""
    try:
        data = request.get_json()
        completed = data.get('completed', False)
        
        item = Itinerary.query.get(item_id)
        if not item:
            return jsonify({'success': False, 'error': 'Item not found'})
        
        item.completed = completed
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

# Packing Routes
@app.route('/packing')
@login_required
def packing():
    """Packing list page with SQLAlchemy data"""
    packing_items = Packing.query.order_by(desc(Packing.priority), Packing.category, Packing.item).all()
    packed_count = len([p for p in packing_items if p.packed])
    total_count = len(packing_items)
    
    # Get unique categories
    categories = db.session.query(Packing.category).distinct().all()
    categories = [c[0] for c in categories if c[0]]
    if not categories:
        categories = ['General']
    
    return render_template('packing.html',
                         packing_items=packing_items,
                         packed_count=packed_count,
                         total_count=total_count,
                         categories=categories)

@app.route('/api/packing/<int:item_id>/toggle', methods=['POST'])
@login_required
def toggle_packing_status(item_id):
    """Toggle packing item status"""
    try:
        item = Packing.query.get(item_id)
        if not item:
            return jsonify({'success': False, 'error': 'Item not found'})
        
        item.packed = not item.packed
        db.session.commit()
        return jsonify({'success': True, 'packed': item.packed})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/packing/add', methods=['POST'])
@login_required
def add_packing_item():
    """Add new packing item to database"""
    try:
        data = request.get_json()
        
        # Determine category if not provided
        item_name = data['item_name'].lower()
        category = data.get('category', 'General')
        
        if not category or category == 'General':
            if any(word in item_name for word in ['ring', 'documents', 'passport']):
                category = 'Essential'
            elif any(word in item_name for word in ['camera', 'tripod', 'gear']):
                category = 'Equipment'
            elif any(word in item_name for word in ['clothes', 'hiking']):
                category = 'Clothing'
            elif any(word in item_name for word in ['toiletries']):
                category = 'Personal Care'
            else:
                category = 'General'
        
        # Determine priority
        priority = data.get('priority', 'Medium')
        if 'ring' in item_name:
            priority = 'Critical'
        
        item = Packing(
            item=data['item_name'],
            category=category,
            packed=data.get('packed', False),
            notes=data.get('notes', ''),
            quantity=int(data.get('quantity', 1)),
            priority=priority
        )
        
        db.session.add(item)
        db.session.commit()
        
        return jsonify({'success': True, 'packing_item': item.to_dict()})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/packing/update', methods=['POST'])
@login_required
def update_packing_item():
    """Update packing item in database"""
    try:
        data = request.get_json()
        item_id = int(data['id'])
        field = data['field']
        value = data['value']
        
        item = Packing.query.get(item_id)
        if not item:
            return jsonify({'success': False, 'error': 'Item not found'})
        
        setattr(item, field, value)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/packing/delete/<int:item_id>', methods=['DELETE'])
@login_required
def delete_packing_item(item_id):
    """Delete packing item from database"""
    try:
        item = Packing.query.get(item_id)
        if item:
            db.session.delete(item)
            db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

# Files Routes
@app.route('/files')
@login_required
def files():
    """Files management page with SQLAlchemy data"""
    files_data = File.query.order_by(desc(File.created_at)).all()
    
    # Calculate statistics
    total_size = sum(file.size or 0 for file in files_data)
    total_size_formatted = format_file_size(total_size)
    
    # Get unique categories
    categories = db.session.query(File.category).distinct().all()
    categories = [c[0] for c in categories if c[0]]
    
    # Count recent uploads (last 7 days)
    week_ago = datetime.now() - timedelta(days=7)
    recent_count = File.query.filter(File.created_at > week_ago).count()
    
    # Count files by category
    category_counts = {
        'travel_docs_count': File.query.filter_by(category='travel').count(),
        'reservations_count': File.query.filter_by(category='reservations').count(),
        'photos_count': File.query.filter_by(category='photos').count(),
        'videos_count': File.query.filter_by(category='videos').count(),
        'documents_count': File.query.filter_by(category='documents').count(),
        'other_count': File.query.filter_by(category='other').count(),
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
    """Handle file uploads and save to database"""
    try:
        if 'files' not in request.files:
            return jsonify({'success': False, 'error': 'No files provided'})
        
        files = request.files.getlist('files')
        if not files or files[0].filename == '':
            return jsonify({'success': False, 'error': 'No files selected'})
        
        # Get form data
        categories = request.form.getlist('category')
        notes_list = request.form.getlist('notes')
        
        # Create upload directory
        upload_dir = os.path.join(app.static_folder, 'uploads', 'files')
        os.makedirs(upload_dir, exist_ok=True)
        
        uploaded_files = []
        allowed_extensions = {'pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'gif', 'webp', 
                            'zip', 'xlsx', 'xls', 'mov', 'mp4', 'avi', 'mkv', 'webm'}
        
        for i, file in enumerate(files):
            if not file.filename:
                continue
            
            file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
            if file_ext not in allowed_extensions:
                continue
            
            # Generate safe filename
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            random_id = str(uuid.uuid4())[:8]
            safe_filename = f"file_{timestamp}_{random_id}.{file_ext}"
            
            # Save file to disk
            file_path = os.path.join(upload_dir, safe_filename)
            file.save(file_path)
            
            # Get file info
            file_size = os.path.getsize(file_path)
            file_type = f".{file_ext}"
            
            # Create database record
            file_record = File(
                filename=safe_filename,
                original_name=file.filename,
                size=file_size,
                type=file_type,
                category=categories[i] if i < len(categories) else 'other',
                notes=notes_list[i] if i < len(notes_list) else '',
                mimetype=file.mimetype or mimetypes.guess_type(file.filename)[0],
                upload_path=file_path
            )
            
            db.session.add(file_record)
            uploaded_files.append(file_record)
        
        if not uploaded_files:
            return jsonify({'success': False, 'error': 'No valid files were uploaded'})
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'{len(uploaded_files)} files uploaded successfully',
            'uploaded_count': len(uploaded_files),
            'files': [f.to_dict() for f in uploaded_files]
        })
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': f'Upload failed: {str(e)}'})

@app.route('/api/files/download/<filename>')
@login_required
def download_file(filename):
    """Download a file"""
    try:
        safe_filename = secure_filename(filename)
        if safe_filename != filename:
            return jsonify({'error': 'Invalid filename'}), 400
        
        file_path = os.path.join(app.static_folder, 'uploads', 'files', safe_filename)
        
        if not os.path.exists(file_path):
            return jsonify({'error': 'File not found'}), 404
        
        # Get original filename from database
        file_record = File.query.filter_by(filename=filename).first()
        download_name = file_record.original_name if file_record else filename
        
        return send_file(file_path, as_attachment=True, download_name=download_name)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/files/delete/<int:file_id>', methods=['DELETE'])
@login_required
def delete_file(file_id):
    """Delete a file from database and disk"""
    try:
        file_record = File.query.get(file_id)
        if not file_record:
            return jsonify({'success': False, 'error': 'File not found'})
        
        # Delete physical file
        if file_record.upload_path and os.path.exists(file_record.upload_path):
            os.remove(file_record.upload_path)
        
        # Remove from database
        db.session.delete(file_record)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'File deleted successfully'})
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/files/update/<int:file_id>', methods=['POST'])
@login_required
def update_file(file_id):
    """Update file details in database"""
    try:
        data = request.get_json()
        
        file_record = File.query.get(file_id)
        if not file_record:
            return jsonify({'success': False, 'error': 'File not found'})
        
        if 'name' in data and data['name'].strip():
            file_record.original_name = data['name'].strip()
        
        if 'category' in data:
            file_record.category = data['category']
        
        if 'notes' in data:
            file_record.notes = data['notes']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'File updated successfully',
            'file': file_record.to_dict()
        })
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/files', methods=['GET'])
@login_required
def get_files():
    """Get list of files with optional filtering"""
    try:
        category = request.args.get('category')
        search = request.args.get('search', '').lower()
        
        query = File.query
        
        # Apply filters
        if category and category != 'all':
            query = query.filter_by(category=category)
        
        if search:
            query = query.filter(
                or_(
                    func.lower(File.original_name).contains(search),
                    func.lower(File.category).contains(search),
                    func.lower(File.notes).contains(search)
                )
            )
        
        files_data = query.order_by(desc(File.created_at)).all()
        
        return jsonify({'success': True, 'files': [f.to_dict() for f in files_data]})
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

# Task Management Routes (for dashboard tasks)
@app.route('/api/tasks/<int:task_id>/toggle', methods=['POST'])
@login_required
def toggle_task_status(task_id):
    """Toggle task completion status (stored in session for now)"""
    try:
        data = request.get_json()
        completed = data.get('completed', False)
        
        # For now, return success (tasks could be stored in a separate table)
        return jsonify({
            'success': True,
            'status': 'Complete' if completed else 'In Progress',
            'completed': completed
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

# Data Export/Import Routes
@app.route('/export_json')
@login_required
def export_json():
    """Export current database data as JSON file"""
    try:
        # Collect all data from database
        export_data = {
            'budget': [b.to_dict() for b in Budget.query.all()],
            'family': [f.to_dict() for f in Family.query.all()],
            'travel': [t.to_dict() for t in Travel.query.all()],
            'itinerary': [i.to_dict() for i in Itinerary.query.all()],
            'packing': [p.to_dict() for p in Packing.query.all()],
            'ring': Ring.query.first().to_dict() if Ring.query.first() else {},
            'files': [f.to_dict() for f in File.query.all()]
        }
        
        # Save to file
        with open('hera_data_export.json', 'w') as f:
            json.dump(export_data, f, indent=2, default=str)
        
        flash('Data exported successfully to hera_data_export.json')
        return redirect(url_for('dashboard'))
    except Exception as e:
        flash(f'Export error: {str(e)}')
        return redirect(url_for('dashboard'))

@app.route('/api/refresh_data', methods=['POST'])
@login_required
def refresh_data():
    """Refresh data from database"""
    try:
        # Data is always fresh from database, no need to reload
        return jsonify({'success': True, 'message': 'Data refreshed successfully'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/dashboard/data', methods=['GET'])
@login_required
def get_dashboard_data():
    """Get dashboard data for refresh"""
    try:
        budget_stats = calculate_budget_stats()
        days_until = calculate_days_until_proposal()
        
        # Get statistics from database
        family_members = Family.query.all()
        approved_family = len([f for f in family_members if f.status == 'Approved'])
        
        packing_items = Packing.query.all()
        packed_items = len([p for p in packing_items if p.packed])
        
        return jsonify({
            'success': True,
            'stats': {
                'budget': budget_stats,
                'days_until': days_until,
                'family': {'approved': approved_family, 'total': len(family_members)},
                'packing': {'packed': packed_items, 'total': len(packing_items)}
            }
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

# Game Score API (for decoy)
@app.route('/api/games/score', methods=['POST'])
def save_game_score():
    """Fake API endpoint for game scores"""
    if not session.get('games_access'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    return jsonify({
        'success': True,
        'message': 'Score saved!',
        'new_high': random.choice([True, False])
    })

# Debug Routes (remove in production)
@app.route('/api/debug/files', methods=['GET'])
@login_required
def debug_files():
    """Debug endpoint to check files in database"""
    files = File.query.all()
    return jsonify({
        'files_count': len(files),
        'files': [f.to_dict() for f in files]
    })

# Initialize database and create tables
with app.app_context():
    # Create all tables
    db.create_all()
    
    # Create default admin user if doesn't exist
    if not User.query.filter_by(username='admin').first():
        admin_user = User()
        admin_user.username = 'admin'
        admin_user.set_password('admin123')
        db.session.add(admin_user)
        db.session.commit()
        print("✅ Default admin user created")

if __name__ == '__main__':
    print("=" * 60)
    print("🎯 HERA Proposal Planning Dashboard - SQLAlchemy Edition")
    print("=" * 60)
    print("✅ Database initialized with SQLAlchemy")
    print("✅ All models integrated")
    print("✅ Full CRUD operations available")
    print("✅ Real-time database updates")
    
    with app.app_context():
        print(f"\n📊 Current Database Stats:")
        print(f"  💰 Budget Items: {Budget.query.count()}")
        print(f"  👨‍👩‍👧‍👦 Family Members: {Family.query.count()}")
        print(f"  ✈️ Travel Segments: {Travel.query.count()}")
        print(f"  📅 Itinerary Activities: {Itinerary.query.count()}")
        print(f"  🎒 Packing Items: {Packing.query.count()}")
        print(f"  💍 Ring Details: {Ring.query.count()}")
        print(f"  📁 Files: {File.query.count()}")
        
        # Find proposal activity
        proposal = Itinerary.query.filter_by(is_proposal=True).first()
        if proposal:
            print(f"\n💍 THE BIG MOMENT:")
            print(f"   Day {proposal.day}: {proposal.activity}")
            print(f"   Location: {proposal.location}")
    
    print(f"\n🎉 Days until proposal: {calculate_days_until_proposal()}")
    print("=" * 60)
    
    # Railway deployment configuration
    port = int(os.environ.get('PORT', 8080))
    debug_mode = os.environ.get('FLASK_ENV') != 'production'
    
    print(f"\n🚀 Starting server on port {port}")
    print(f"🔧 Debug mode: {debug_mode}")
    print(f"📁 Database: {DatabaseConfig.get_database_uri()}")
    
    try:
        app.run(debug=debug_mode, host='0.0.0.0', port=port)
    except KeyboardInterrupt:
        print("\n\n👋 Server stopped.")
    except Exception as e:
        print(f"\n❌ Error starting server: {e}")