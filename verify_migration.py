#!/usr/bin/env python3
"""Verify migration data integrity"""

from app import app
from models import *

with app.app_context():
    print("=" * 60)
    print("📊 Database Migration Verification")
    print("=" * 60)
    
    # Count records
    print("\n📈 Record Counts:")
    print(f"   Budget items: {Budget.query.count()}")
    print(f"   Family members: {Family.query.count()}")
    print(f"   Travel arrangements: {Travel.query.count()}")
    print(f"   Itinerary items: {Itinerary.query.count()}")
    print(f"   Packing items: {Packing.query.count()}")
    print(f"   Ring details: {Ring.query.count()}")
    print(f"   Files: {File.query.count()}")
    
    # Sample data verification
    print("\n✅ Sample Data Verification:")
    
    budget = Budget.query.first()
    if budget:
        print(f"\n💰 Budget Sample:")
        print(f"   Category: {budget.category}")
        print(f"   Amount: ${budget.amount}")
        print(f"   Saved: ${budget.saved}")
        print(f"   Status: {budget.status}")
    
    family = Family.query.first()
    if family:
        print(f"\n👨‍👩‍👧‍👦 Family Sample:")
        print(f"   Name: {family.name}")
        print(f"   Relationship: {family.relationship}")
        print(f"   Status: {family.status}")
    
    travel = Travel.query.first()
    if travel:
        print(f"\n✈️ Travel Sample:")
        print(f"   Type: {travel.type}")
        print(f"   Provider: {travel.provider}")
        print(f"   Status: {travel.status}")
    
    # Check computed properties
    print("\n🔧 Testing Computed Properties:")
    if budget:
        print(f"   Budget Remaining: ${budget.remaining}")
        print(f"   Budget Progress: {budget.progress_percentage}%")
    
    ring = Ring.query.first()
    if ring:
        print(f"   Ring Balance Due: ${ring.balance_due}")
    
    print("\n✅ Migration verification complete!")
    print("=" * 60)