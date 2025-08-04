from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, send_file
from flask_login import LoginManager, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import os
import pandas as pd
from io import BytesIO

from database import db

app = Flask(__name__)
app.config['SECRET_KEY'] = 'hera_proposal_planning_2025'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///hera.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Import models after db initialization
from models import User, Budget, Ring, Family, Travel, Itinerary, Packing
from utils import import_excel_data

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route('/')
@login_required
def dashboard():
    # Get countdown to September 24, 2025
    target_date = datetime(2025, 9, 24)
    current_date = datetime.now()
    days_remaining = (target_date - current_date).days
    
    # Get summary stats
    budget_items = Budget.query.all()
    total_budget = sum(item.amount for item in budget_items)
    paid_budget = sum(item.amount for item in budget_items if item.status == 'Paid')
    budget_progress = (paid_budget / total_budget * 100) if total_budget > 0 else 0
    
    family_members = Family.query.all()
    approved_family = sum(1 for member in family_members if member.status == 'Approved')
    family_progress = (approved_family / len(family_members) * 100) if family_members else 0
    
    packing_items = Packing.query.all()
    packed_items = sum(1 for item in packing_items if item.packed)
    packing_progress = (packed_items / len(packing_items) * 100) if packing_items else 0
    
    return render_template('dashboard.html',
                         days_remaining=days_remaining,
                         total_budget=total_budget,
                         paid_budget=paid_budget,
                         budget_progress=budget_progress,
                         approved_family=approved_family,
                         total_family=len(family_members),
                         family_progress=family_progress,
                         packed_items=packed_items,
                         total_packing=len(packing_items),
                         packing_progress=packing_progress)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        user = User.query.filter_by(username=username).first()
        
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

@app.route('/budget')
@login_required
def budget():
    budget_items = Budget.query.all()
    return render_template('budget.html', budget_items=budget_items)

@app.route('/ring')
@login_required
def ring():
    ring_data = Ring.query.first()
    return render_template('ring.html', ring=ring_data)

@app.route('/family')
@login_required
def family():
    family_members = Family.query.all()
    return render_template('family.html', family_members=family_members)

@app.route('/travel')
@login_required
def travel():
    travel_data = Travel.query.all()
    return render_template('travel.html', travel_data=travel_data)

@app.route('/itinerary')
@login_required
def itinerary():
    itinerary_items = Itinerary.query.order_by(Itinerary.day, Itinerary.start_time).all()
    return render_template('itinerary.html', itinerary_items=itinerary_items)

@app.route('/packing')
@login_required
def packing():
    packing_items = Packing.query.all()
    return render_template('packing.html', packing_items=packing_items)

# AJAX Routes for Budget CRUD Operations
@app.route('/api/budget', methods=['POST'])
@login_required
def add_budget_item():
    try:
        data = request.get_json()
        budget_item = Budget(
            category=data['category'],
            amount=float(data['amount']),
            status=data.get('status', 'Outstanding'),
            notes=data.get('notes', ''),
            emoji=data.get('emoji', '💰')
        )
        db.session.add(budget_item)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'item': {
                'id': budget_item.id,
                'category': budget_item.category,
                'amount': budget_item.amount,
                'status': budget_item.status,
                'notes': budget_item.notes,
                'emoji': budget_item.emoji
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/budget/<int:item_id>', methods=['PUT'])
@login_required
def update_budget_item(item_id):
    try:
        budget_item = Budget.query.get_or_404(item_id)
        data = request.get_json()
        
        if 'category' in data:
            budget_item.category = data['category']
        if 'amount' in data:
            budget_item.amount = float(data['amount'])
        if 'status' in data:
            budget_item.status = data['status']
        if 'notes' in data:
            budget_item.notes = data['notes']
        if 'emoji' in data:
            budget_item.emoji = data['emoji']
            
        budget_item.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/budget/<int:item_id>', methods=['DELETE'])
@login_required
def delete_budget_item(item_id):
    try:
        budget_item = Budget.query.get_or_404(item_id)
        db.session.delete(budget_item)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

# AJAX Routes for Ring CRUD Operations
@app.route('/api/ring', methods=['PUT'])
@login_required
def update_ring():
    try:
        ring = Ring.query.first()
        if not ring:
            ring = Ring()
            db.session.add(ring)
        
        data = request.get_json()
        
        if 'jeweler' in data:
            ring.jeweler = data['jeweler']
        if 'stone' in data:
            ring.stone = data['stone']
        if 'metal' in data:
            ring.metal = data['metal']
        if 'style_inspiration' in data:
            ring.style_inspiration = data['style_inspiration']
        if 'insurance' in data:
            ring.insurance = data['insurance']
        if 'status' in data:
            ring.status = data['status']
        if 'notes' in data:
            ring.notes = data['notes']
            
        ring.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/ring/upload', methods=['POST'])
@login_required
def upload_ring_photo():
    try:
        if 'photo' not in request.files:
            return jsonify({'success': False, 'error': 'No photo provided'}), 400
        
        file = request.files['photo']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        # Create uploads directory if it doesn't exist
        upload_dir = os.path.join(app.static_folder, 'uploads', 'ring_photos')
        os.makedirs(upload_dir, exist_ok=True)
        
        # Save file with timestamp to avoid conflicts
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{timestamp}_{file.filename}"
        file_path = os.path.join(upload_dir, filename)
        file.save(file_path)
        
        # Return the URL path for the uploaded file
        photo_url = f"/static/uploads/ring_photos/{filename}"
        
        return jsonify({
            'success': True,
            'photo_url': photo_url,
            'filename': filename
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

# AJAX Routes for Family CRUD Operations
@app.route('/api/family', methods=['POST'])
@login_required
def add_family_member():
    try:
        data = request.get_json()
        family_member = Family(
            name=data['name'],
            status=data.get('status', 'Pending'),
            reaction=data.get('reaction', ''),
            notes=data.get('notes', '')
        )
        if 'conversation_date' in data and data['conversation_date']:
            family_member.conversation_date = datetime.strptime(data['conversation_date'], '%Y-%m-%d').date()
        
        db.session.add(family_member)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'member': {
                'id': family_member.id,
                'name': family_member.name,
                'status': family_member.status,
                'reaction': family_member.reaction,
                'notes': family_member.notes,
                'conversation_date': family_member.conversation_date.isoformat() if family_member.conversation_date else None
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/family/<int:member_id>', methods=['PUT'])
@login_required
def update_family_member(member_id):
    try:
        family_member = Family.query.get_or_404(member_id)
        data = request.get_json()
        
        if 'name' in data:
            family_member.name = data['name']
        if 'status' in data:
            family_member.status = data['status']
        if 'reaction' in data:
            family_member.reaction = data['reaction']
        if 'notes' in data:
            family_member.notes = data['notes']
        if 'conversation_date' in data:
            if data['conversation_date']:
                family_member.conversation_date = datetime.strptime(data['conversation_date'], '%Y-%m-%d').date()
            else:
                family_member.conversation_date = None
                
        family_member.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/family/<int:member_id>', methods=['DELETE'])
@login_required
def delete_family_member(member_id):
    try:
        family_member = Family.query.get_or_404(member_id)
        db.session.delete(family_member)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

# AJAX Routes for Travel CRUD Operations
@app.route('/api/travel', methods=['POST'])
@login_required
def add_travel_item():
    try:
        data = request.get_json()
        travel_item = Travel(
            type=data['type'],
            provider=data.get('provider', ''),
            details=data.get('details', ''),
            confirmation=data.get('confirmation', ''),
            cost=float(data.get('cost', 0)),
            status=data.get('status', 'Booked'),
            notes=data.get('notes', '')
        )
        if 'date' in data and data['date']:
            travel_item.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        if 'time' in data and data['time']:
            travel_item.time = datetime.strptime(data['time'], '%H:%M').time()
        
        db.session.add(travel_item)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'item': {
                'id': travel_item.id,
                'type': travel_item.type,
                'provider': travel_item.provider,
                'details': travel_item.details,
                'confirmation': travel_item.confirmation,
                'cost': travel_item.cost,
                'status': travel_item.status,
                'notes': travel_item.notes,
                'date': travel_item.date.isoformat() if travel_item.date else None,
                'time': travel_item.time.strftime('%H:%M') if travel_item.time else None
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/travel/<int:item_id>', methods=['PUT'])
@login_required
def update_travel_item(item_id):
    try:
        travel_item = Travel.query.get_or_404(item_id)
        data = request.get_json()
        
        if 'type' in data:
            travel_item.type = data['type']
        if 'provider' in data:
            travel_item.provider = data['provider']
        if 'details' in data:
            travel_item.details = data['details']
        if 'confirmation' in data:
            travel_item.confirmation = data['confirmation']
        if 'cost' in data:
            travel_item.cost = float(data['cost'])
        if 'status' in data:
            travel_item.status = data['status']
        if 'notes' in data:
            travel_item.notes = data['notes']
        if 'date' in data:
            if data['date']:
                travel_item.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
            else:
                travel_item.date = None
        if 'time' in data:
            if data['time']:
                travel_item.time = datetime.strptime(data['time'], '%H:%M').time()
            else:
                travel_item.time = None
                
        travel_item.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/travel/<int:item_id>', methods=['DELETE'])
@login_required
def delete_travel_item(item_id):
    try:
        travel_item = Travel.query.get_or_404(item_id)
        db.session.delete(travel_item)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

# AJAX Routes for Itinerary CRUD Operations
@app.route('/api/itinerary', methods=['POST'])
@login_required
def add_itinerary_item():
    try:
        data = request.get_json()
        itinerary_item = Itinerary(
            day=data['day'],
            activity=data['activity'],
            location=data.get('location', ''),
            notes=data.get('notes', ''),
            special=data.get('special', False),
            order=data.get('order', 0)
        )
        if 'start_time' in data and data['start_time']:
            itinerary_item.start_time = datetime.strptime(data['start_time'], '%H:%M').time()
        if 'end_time' in data and data['end_time']:
            itinerary_item.end_time = datetime.strptime(data['end_time'], '%H:%M').time()
        
        db.session.add(itinerary_item)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'item': {
                'id': itinerary_item.id,
                'day': itinerary_item.day,
                'activity': itinerary_item.activity,
                'location': itinerary_item.location,
                'start_time': itinerary_item.start_time.strftime('%H:%M') if itinerary_item.start_time else None,
                'end_time': itinerary_item.end_time.strftime('%H:%M') if itinerary_item.end_time else None,
                'notes': itinerary_item.notes,
                'special': itinerary_item.special,
                'order': itinerary_item.order
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/itinerary/<int:item_id>', methods=['PUT'])
@login_required
def update_itinerary_item(item_id):
    try:
        itinerary_item = Itinerary.query.get_or_404(item_id)
        data = request.get_json()
        
        if 'day' in data:
            itinerary_item.day = data['day']
        if 'activity' in data:
            itinerary_item.activity = data['activity']
        if 'location' in data:
            itinerary_item.location = data['location']
        if 'notes' in data:
            itinerary_item.notes = data['notes']
        if 'special' in data:
            itinerary_item.special = data['special']
        if 'order' in data:
            itinerary_item.order = data['order']
        if 'start_time' in data:
            if data['start_time']:
                itinerary_item.start_time = datetime.strptime(data['start_time'], '%H:%M').time()
            else:
                itinerary_item.start_time = None
        if 'end_time' in data:
            if data['end_time']:
                itinerary_item.end_time = datetime.strptime(data['end_time'], '%H:%M').time()
            else:
                itinerary_item.end_time = None
                
        itinerary_item.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/itinerary/<int:item_id>', methods=['DELETE'])
@login_required
def delete_itinerary_item(item_id):
    try:
        itinerary_item = Itinerary.query.get_or_404(item_id)
        db.session.delete(itinerary_item)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/itinerary/reorder', methods=['PUT'])
@login_required
def reorder_itinerary():
    try:
        data = request.get_json()
        order_data = data.get('order', [])
        
        for item in order_data:
            itinerary_item = Itinerary.query.get(item['id'])
            if itinerary_item:
                itinerary_item.order = item['order']
        
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

# AJAX Routes for Packing CRUD Operations
@app.route('/api/packing', methods=['POST'])
@login_required
def add_packing_item():
    try:
        data = request.get_json()
        packing_item = Packing(
            category=data['category'],
            item=data['item'],
            quantity=int(data.get('quantity', 1)),
            packed=data.get('packed', False),
            notes=data.get('notes', ''),
            priority=data.get('priority', 'Medium')
        )
        
        db.session.add(packing_item)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'item': {
                'id': packing_item.id,
                'category': packing_item.category,
                'item': packing_item.item,
                'quantity': packing_item.quantity,
                'packed': packing_item.packed,
                'notes': packing_item.notes,
                'priority': packing_item.priority
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/packing/<int:item_id>', methods=['PUT'])
@login_required
def update_packing_item(item_id):
    try:
        packing_item = Packing.query.get_or_404(item_id)
        data = request.get_json()
        
        if 'category' in data:
            packing_item.category = data['category']
        if 'item' in data:
            packing_item.item = data['item']
        if 'quantity' in data:
            packing_item.quantity = int(data['quantity'])
        if 'packed' in data:
            packing_item.packed = data['packed']
        if 'notes' in data:
            packing_item.notes = data['notes']
        if 'priority' in data:
            packing_item.priority = data['priority']
                
        packing_item.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/packing/<int:item_id>', methods=['DELETE'])
@login_required
def delete_packing_item(item_id):
    try:
        packing_item = Packing.query.get_or_404(item_id)
        db.session.delete(packing_item)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/packing/toggle/<int:item_id>', methods=['PUT'])
@login_required
def toggle_packing_item(item_id):
    try:
        packing_item = Packing.query.get_or_404(item_id)
        packing_item.packed = not packing_item.packed
        packing_item.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'packed': packing_item.packed
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

# Excel Export Route
@app.route('/export/excel')
@login_required
def export_to_excel():
    try:
        # Create a BytesIO buffer to hold the Excel file
        output = BytesIO()
        
        # Create a Pandas Excel writer using the buffer
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            # Export Budget data
            budget_data = []
            for item in Budget.query.all():
                budget_data.append({
                    'ID': item.id,
                    'Category': item.category,
                    'Amount': item.amount,
                    'Status': item.status,
                    'Notes': item.notes,
                    'Emoji': item.emoji,
                    'Created': item.created_at.strftime('%Y-%m-%d %H:%M:%S') if item.created_at else '',
                    'Updated': item.updated_at.strftime('%Y-%m-%d %H:%M:%S') if item.updated_at else ''
                })
            if budget_data:
                budget_df = pd.DataFrame(budget_data)
                budget_df.to_excel(writer, sheet_name='Budget', index=False)
            
            # Export Family data
            family_data = []
            for member in Family.query.all():
                family_data.append({
                    'ID': member.id,
                    'Name': member.name,
                    'Status': member.status,
                    'Conversation Date': member.conversation_date.strftime('%Y-%m-%d') if member.conversation_date else '',
                    'Reaction': member.reaction,
                    'Notes': member.notes,
                    'Created': member.created_at.strftime('%Y-%m-%d %H:%M:%S') if member.created_at else '',
                    'Updated': member.updated_at.strftime('%Y-%m-%d %H:%M:%S') if member.updated_at else ''
                })
            if family_data:
                family_df = pd.DataFrame(family_data)
                family_df.to_excel(writer, sheet_name='Family', index=False)
            
            # Export Ring data
            ring = Ring.query.first()
            if ring:
                ring_data = [{
                    'ID': ring.id,
                    'Jeweler': ring.jeweler,
                    'Stone': ring.stone,
                    'Metal': ring.metal,
                    'Style Inspiration': ring.style_inspiration,
                    'Insurance': ring.insurance,
                    'Status': ring.status,
                    'Notes': ring.notes,
                    'Created': ring.created_at.strftime('%Y-%m-%d %H:%M:%S') if ring.created_at else '',
                    'Updated': ring.updated_at.strftime('%Y-%m-%d %H:%M:%S') if ring.updated_at else ''
                }]
                ring_df = pd.DataFrame(ring_data)
                ring_df.to_excel(writer, sheet_name='Ring', index=False)
            
            # Export Travel data
            travel_data = []
            for item in Travel.query.all():
                travel_data.append({
                    'ID': item.id,
                    'Type': item.type,
                    'Provider': item.provider,
                    'Details': item.details,
                    'Date': item.date.strftime('%Y-%m-%d') if item.date else '',
                    'Time': item.time.strftime('%H:%M') if item.time else '',
                    'Confirmation': item.confirmation,
                    'Cost': item.cost,
                    'Status': item.status,
                    'Notes': item.notes,
                    'Created': item.created_at.strftime('%Y-%m-%d %H:%M:%S') if item.created_at else '',
                    'Updated': item.updated_at.strftime('%Y-%m-%d %H:%M:%S') if item.updated_at else ''
                })
            if travel_data:
                travel_df = pd.DataFrame(travel_data)
                travel_df.to_excel(writer, sheet_name='Travel', index=False)
            
            # Export Itinerary data
            itinerary_data = []
            for item in Itinerary.query.order_by(Itinerary.day, Itinerary.order, Itinerary.start_time).all():
                itinerary_data.append({
                    'ID': item.id,
                    'Day': item.day,
                    'Order': item.order,
                    'Activity': item.activity,
                    'Location': item.location,
                    'Start Time': item.start_time.strftime('%H:%M') if item.start_time else '',
                    'End Time': item.end_time.strftime('%H:%M') if item.end_time else '',
                    'Special': 'Yes' if item.special else 'No',
                    'Notes': item.notes,
                    'Created': item.created_at.strftime('%Y-%m-%d %H:%M:%S') if item.created_at else '',
                    'Updated': item.updated_at.strftime('%Y-%m-%d %H:%M:%S') if item.updated_at else ''
                })
            if itinerary_data:
                itinerary_df = pd.DataFrame(itinerary_data)
                itinerary_df.to_excel(writer, sheet_name='Itinerary', index=False)
            
            # Export Packing data
            packing_data = []
            for item in Packing.query.all():
                packing_data.append({
                    'ID': item.id,
                    'Category': item.category,
                    'Item': item.item,
                    'Quantity': item.quantity,
                    'Packed': 'Yes' if item.packed else 'No',
                    'Priority': item.priority,
                    'Notes': item.notes,
                    'Created': item.created_at.strftime('%Y-%m-%d %H:%M:%S') if item.created_at else '',
                    'Updated': item.updated_at.strftime('%Y-%m-%d %H:%M:%S') if item.updated_at else ''
                })
            if packing_data:
                packing_df = pd.DataFrame(packing_data)
                packing_df.to_excel(writer, sheet_name='Packing', index=False)
        
        # Rewind the buffer
        output.seek(0)
        
        # Generate filename with current timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'HERA_Proposal_Data_{timestamp}.xlsx'
        
        return send_file(
            output,
            as_attachment=True,
            download_name=filename,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        
    except Exception as e:
        flash(f'Error exporting data: {str(e)}', 'error')
        return redirect(url_for('dashboard'))

def create_admin_user():
    """Create admin user if it doesn't exist"""
    admin = User.query.filter_by(username='admin').first()
    if not admin:
        admin = User(
            username='admin',
            password_hash=generate_password_hash('hera2025')
        )
        db.session.add(admin)
        db.session.commit()

def init_database():
    """Initialize database and import Excel data"""
    db.create_all()
    create_admin_user()
    
    # Check if data already exists
    if Budget.query.first() is None:
        # Import data from Excel
        excel_path = os.path.join('documents', 'Hera Master Doc.xlsx')
        if os.path.exists(excel_path):
            import_excel_data(excel_path, db)
            print("Excel data imported successfully!")

if __name__ == '__main__':
    with app.app_context():
        init_database()
    
    app.run(debug=True)