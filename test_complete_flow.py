#!/usr/bin/env python3
"""Complete application flow test"""

import requests
import json
import time

BASE_URL = "http://localhost:8080"
session = requests.Session()

def test_login():
    """Test login"""
    print("1. Testing login...")
    response = session.post(f"{BASE_URL}/login", data={
        'username': 'admin',
        'password': 'admin123'
    }, allow_redirects=False)
    
    if response.status_code == 302:
        print("   ✅ Login successful")
        return True
    print(f"   ❌ Login failed: {response.status_code}")
    return False

def test_dashboard():
    """Test dashboard"""
    print("2. Testing dashboard...")
    response = session.get(f"{BASE_URL}/dashboard")
    
    if response.status_code == 200:
        content = response.text
        checks = [
            ("Budget data", "$" in content and "Budget Saved" in content),
            ("Task data", "Tasks Complete" in content),
            ("Family data", "Family Approved" in content),
            ("Countdown", "Until The Big Trip" in content)
        ]
        
        for check_name, check_result in checks:
            if check_result:
                print(f"   ✅ {check_name} present")
            else:
                print(f"   ❌ {check_name} missing")
        return True
    print(f"   ❌ Dashboard failed: {response.status_code}")
    return False

def test_all_pages():
    """Test all main pages"""
    print("3. Testing all pages...")
    
    pages = [
        ("/budget", "Budget Management"),
        ("/family", "Family"),
        ("/travel", "Travel"),
        ("/itinerary", "Itinerary"),
        ("/packing", "Packing"),
        ("/ring", "Ring"),
        ("/files", "Files")
    ]
    
    for url, expected_content in pages:
        response = session.get(f"{BASE_URL}{url}")
        if response.status_code == 200:
            if expected_content in response.text or expected_content.lower() in response.text.lower():
                print(f"   ✅ {url} - OK")
            else:
                print(f"   ⚠️  {url} - Loaded but content check failed")
        else:
            print(f"   ❌ {url} - Failed ({response.status_code})")

def test_crud_operations():
    """Test CRUD operations"""
    print("4. Testing CRUD operations...")
    
    # Test adding a budget item
    response = session.post(f"{BASE_URL}/budget/add", 
                           json={
                               'category': 'Test Item',
                               'amount': 100,
                               'saved': 50,
                               'status': 'Outstanding',
                               'notes': 'Automated test'
                           },
                           headers={'Content-Type': 'application/json'})
    
    if response.status_code == 200:
        data = response.json()
        if data.get('success'):
            print(f"   ✅ Added budget item (ID: {data.get('id')})")
            
            # Test updating
            item_id = data.get('id')
            update_response = session.post(f"{BASE_URL}/budget/update/{item_id}",
                                          json={'saved': 75, 'status': 'Paid'},
                                          headers={'Content-Type': 'application/json'})
            
            if update_response.status_code == 200:
                print(f"   ✅ Updated budget item")
            
            # Test deleting
            delete_response = session.delete(f"{BASE_URL}/budget/delete/{item_id}")
            if delete_response.status_code == 200:
                print(f"   ✅ Deleted budget item")
        else:
            print(f"   ❌ Failed to add budget item")
    else:
        print(f"   ❌ CRUD operations failed")

def test_database_stats():
    """Verify database statistics"""
    print("5. Verifying database statistics...")
    
    import sys
    sys.path.insert(0, '/Users/vikrantlall/Documents/GitHub/Hera_Dashboard')
    from app import app
    from models import Budget, Family, Travel, Itinerary, Packing, Ring, File
    
    with app.app_context():
        stats = {
            'Budget': Budget.query.count(),
            'Family': Family.query.count(),
            'Travel': Travel.query.count(),
            'Itinerary': Itinerary.query.count(),
            'Packing': Packing.query.count(),
            'Ring': Ring.query.count(),
            'Files': File.query.count()
        }
        
        for model, count in stats.items():
            if count > 0:
                print(f"   ✅ {model}: {count} records")
            else:
                print(f"   ⚠️  {model}: No records")
        
        # Test computed properties
        budget_item = Budget.query.first()
        if budget_item:
            print(f"   ✅ Computed properties work (Progress: {budget_item.progress_percentage}%)")

def main():
    print("=" * 60)
    print("🧪 Complete Application Flow Test")
    print("=" * 60)
    
    # Wait for server to be ready
    time.sleep(1)
    
    # Run tests
    if test_login():
        test_dashboard()
        test_all_pages()
        test_crud_operations()
        test_database_stats()
    
    print("\n" + "=" * 60)
    print("✅ Complete application test finished!")
    print("=" * 60)

if __name__ == "__main__":
    main()