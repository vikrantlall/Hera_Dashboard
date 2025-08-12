# HERA - Proposal Planning Dashboard

A comprehensive proposal planning application built with Flask. Manages budget, travel, family coordination, itinerary planning, and more for a complete proposal experience.

## Features

**Budget Management**
- Track expenses across 9 categories ($11,691 total budget)
- Payment status monitoring
- Savings timeline with monthly goals

**Family Coordination**
- Permission tracking for 8 family members
- Status updates and conversation notes
- Approval progress monitoring

**Travel Planning**
- Flight details (4 flights with confirmations)
- Hotel reservations and amenities
- Ground transportation coordination
- Complete travel timeline

**Itinerary Management**
- 42+ scheduled activities with locations
- Time-based scheduling system
- Completion tracking
- Special proposal day activities

**Ring Management**
- Complete specifications and vendor details
- Design approval workflow
- Delivery tracking
- Photo documentation

**Packing Organization**
- Categorized packing lists (Essential, Equipment, Clothing, etc.)
- Pack/unpack status tracking
- Item-specific notes

**File Management**
- Document uploads and organization
- Photo galleries with lightbox viewing
- Travel document storage

## Technical Stack

**Backend**
- Flask 2.3.3 (Python web framework)
- Flask-Login (authentication)
- JSON data storage (database-ready models included)

**Frontend**
- Responsive HTML5/CSS3
- Vanilla JavaScript with AJAX
- Font Awesome icons
- Inter font family

**Architecture**
- Modular design with separate CSS/JS files
- RESTful API endpoints
- Production-ready deployment configuration

## Installation

```bash
# Clone and setup
git clone <repository-url>
cd hera-proposal-dashboard

# Virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run application
python app.py
```

Access at `http://localhost:5000`

## Authentication & Security

The application uses a multi-tier authentication system:

**Primary Access (HERA Dashboard)**
- Username: `admin`
- Password: `admin123`
- Grants full access to proposal planning system

**Decoy Access (Development Tools)**
- Username: `demo` 
- Password: `test123`
- Redirects to harmless development utilities page
- Provides cover story for wrong credentials

**Security Features**
- Session-based authentication with Flask-Login
- Password hashing with Werkzeug
- Session isolation between access levels
- Invalid credentials show generic error

The decoy system presents a believable "personal development tools" interface to anyone using incorrect credentials, maintaining operational security while providing plausible deniability.

## Project Structure

```
HERA/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── hera_data.json        # Data storage
├── static/
│   ├── css/              # Stylesheets (base, components, modules)
│   ├── js/               # JavaScript (base, dashboard, modules)
│   ├── images/           # Assets and logos
│   └── uploads/          # File upload directory
├── templates/
│   ├── base.html         # Master template
│   ├── dashboard.html    # Main dashboard
│   ├── budget.html       # Budget management
│   ├── ring.html         # Ring details
│   ├── family.html       # Family permissions
│   ├── travel.html       # Travel coordination
│   ├── itinerary.html    # Activity planning
│   ├── packing.html      # Packing lists
│   ├── files.html        # File management
│   ├── login.html        # Authentication
│   └── games.html        # Decoy page
└── Procfile              # Railway deployment
```

## API Endpoints

```python
# Budget Management
GET  /api/budget                    # Get all budget items
POST /api/budget/add               # Add budget item
PUT  /api/budget/<id>/edit         # Update budget item
POST /api/budget/<id>/toggle       # Toggle payment status
DEL  /api/budget/<id>/delete       # Delete budget item

# Itinerary Planning
GET  /api/itinerary               # Get all activities
POST /api/itinerary/add           # Add activity
PUT  /api/itinerary/<id>/edit     # Update activity
POST /api/itinerary/<id>/complete # Toggle completion
DEL  /api/itinerary/<id>/delete   # Delete activity

# Other modules follow similar patterns
POST /api/ring/update             # Update ring details
POST /api/family/<id>/toggle      # Toggle family approval
POST /api/packing/<id>/toggle     # Toggle packed status
POST /api/files/upload            # Handle file uploads
```

## Configuration

Key settings in `app.py`:
```python
app.secret_key = 'hera_proposal_2025_emerald_lake_secret'  # Change for production

# Proposal date for countdown
proposal_date = datetime(2025, 9, 26)  # September 26, 2025
```

Update proposal details in `hera_data.json`:
```json
{
  "main": {
    "tripDates": "9/24/2025 - 9/29/2025",
    "proposalDate": "2025-09-26",
    "totalBudget": 11691.2,
    "totalSaved": 7511.2
  }
}
```

## Deployment

**Railway Deployment**

1. Create `Procfile`:
   ```
   web: python app.py
   ```

2. Update `app.py` for production:
   ```python
   if __name__ == '__main__':
       port = int(os.environ.get('PORT', 5000))
       app.run(host='0.0.0.0', port=port, debug=False)
   ```

3. Set environment variables:
   ```
   FLASK_ENV=production
   SECRET_KEY=your-production-secret-key
   ```

**Production Checklist**
- [ ] Update secret key for production
- [ ] Set `debug=False`
- [ ] Configure proper error handling
- [ ] Test authentication system
- [ ] Verify file upload permissions

## Technical Overview

- **Lines of Code**: 5,000+ (Python, JavaScript, CSS, HTML)
- **Files**: 20+ templates and static files
- **Features**: 7 major modules with full CRUD operations
- **Data Points**: 100+ tracked items across all modules
- **Architecture**: Fully modular and scalable

## Future Enhancements

**Phase 2**
- Database migration (PostgreSQL/MySQL)
- Multi-user collaboration
- Mobile app development
- Push notifications

**Phase 3**
- AI recommendations
- Calendar integration
- Weather API integration
- Vendor management system

## License

Proprietary software. All rights reserved. Unauthorized access, use, or distribution is prohibited.

---

**Developer**: Vikrant  
**Project Status**: Production Ready  
**Deployment**: Railway Compatible