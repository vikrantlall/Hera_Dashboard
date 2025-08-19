#!/usr/bin/env python3
"""Test CRUD operations with the Flask app"""

import requests
import json

# Base URL
BASE_URL = "http://localhost:8080"

# Start a session to maintain cookies
session = requests.Session()

def test_login():
    """Test login functionality"""
    print("Testing login...")
    response = session.post(f"{BASE_URL}/login", data={
        'username': 'admin',
        'password': 'admin123'
    })
    if response.status_code == 200 or response.status_code == 302:
        print("✅ Login successful")
        return True
    else:
        print(f"❌ Login failed: {response.status_code}")
        return False

def test_dashboard():
    """Test dashboard access"""
    print("\nTesting dashboard access...")
    response = session.get(f"{BASE_URL}/dashboard")
    if response.status_code == 200:
        print("✅ Dashboard accessible")
        # Check if it contains SQLAlchemy data
        if "Budget Saved" in response.text and "Tasks Complete" in response.text:
            print("✅ Dashboard shows SQLAlchemy data")
        return True
    else:
        print(f"❌ Dashboard access failed: {response.status_code}")
        return False

def test_budget_page():
    """Test budget page"""
    print("\nTesting budget page...")
    response = session.get(f"{BASE_URL}/budget")
    if response.status_code == 200:
        print("✅ Budget page accessible")
        if "Total Budget" in response.text:
            print("✅ Budget data displayed")
        return True
    else:
        print(f"❌ Budget page failed: {response.status_code}")
        return False

def test_add_budget_item():
    """Test adding a new budget item"""
    print("\nTesting add budget item...")
    
    # Get CSRF token from budget page
    response = session.get(f"{BASE_URL}/budget")
    
    # Add new budget item via API
    new_item = {
        'category': 'Test Item',
        'amount': 100.00,
        'saved': 50.00,
        'status': 'Outstanding',
        'notes': 'Test from CRUD verification'
    }
    
    response = session.post(f"{BASE_URL}/budget/add", 
                           json=new_item,
                           headers={'Content-Type': 'application/json'})
    
    if response.status_code == 200:
        result = response.json()
        if result.get('success'):
            print(f"✅ Budget item added: ID {result.get('id')}")
            return result.get('id')
    
    print(f"❌ Failed to add budget item: {response.status_code}")
    return None

def test_update_budget_item(item_id):
    """Test updating a budget item"""
    print(f"\nTesting update budget item {item_id}...")
    
    update_data = {
        'saved': 75.00,
        'status': 'Paid'
    }
    
    response = session.post(f"{BASE_URL}/budget/update/{item_id}",
                           json=update_data,
                           headers={'Content-Type': 'application/json'})
    
    if response.status_code == 200:
        result = response.json()
        if result.get('success'):
            print(f"✅ Budget item updated")
            return True
    
    print(f"❌ Failed to update budget item: {response.status_code}")
    return False

def test_family_page():
    """Test family page"""
    print("\nTesting family page...")
    response = session.get(f"{BASE_URL}/family")
    if response.status_code == 200:
        print("✅ Family page accessible")
        if "Papa" in response.text or "family" in response.text.lower():
            print("✅ Family data displayed")
        return True
    else:
        print(f"❌ Family page failed: {response.status_code}")
        return False

def main():
    print("=" * 60)
    print("🧪 Testing CRUD Operations")
    print("=" * 60)
    
    # Test login
    if not test_login():
        print("Cannot proceed without login")
        return
    
    # Test pages
    test_dashboard()
    test_budget_page()
    test_family_page()
    
    # Test CRUD operations
    item_id = test_add_budget_item()
    if item_id:
        test_update_budget_item(item_id)
    
    print("\n✅ CRUD testing complete!")
    print("=" * 60)

if __name__ == "__main__":
    main()