import csv
import os
from datetime import datetime, date, time


def import_csv_data(data_dir='documents'):
    """Import data from CSV files into the database using Python's built-in csv module"""
    try:
        # Import here to avoid circular imports
        from app import db, Budget, Ring, Family, Travel, Itinerary, Packing

        # Clear existing data
        db.session.query(Budget).delete()
        db.session.query(Ring).delete()
        db.session.query(Family).delete()
        db.session.query(Travel).delete()
        db.session.query(Itinerary).delete()
        db.session.query(Packing).delete()

        # Import Budget data
        budget_file = os.path.join(data_dir, 'Hera Master Doc  Budget.csv')
        if os.path.exists(budget_file):
            with open(budget_file, 'r', encoding='utf-8') as file:
                reader = csv.reader(file)
                lines = list(reader)

                # Skip first 2 rows, get headers from row 3
                if len(lines) > 2:
                    headers = [h.strip() for h in lines[2] if h.strip()]  # Remove empty first column
                    headers = headers[1:]  # Remove first empty column

                    for row_data in lines[3:]:
                        if len(row_data) > 1 and row_data[1].strip():  # Skip empty rows
                            row = row_data[1:]  # Remove first empty column
                            if len(row) >= len(headers):
                                row_dict = dict(zip(headers, row))

                                category = row_dict.get('Category', '').strip()
                                if category:
                                    # Clean currency values
                                    budget_str = row_dict.get('Budget', '0').replace('$', '').replace(',', '').strip()
                                    saved_str = row_dict.get('Saved', '0').replace('$', '').replace(',', '').strip()

                                    try:
                                        budget_amount = float(budget_str) if budget_str else 0
                                        saved_amount = float(saved_str) if saved_str else 0
                                    except ValueError:
                                        budget_amount = 0
                                        saved_amount = 0

                                    budget_item = Budget(
                                        category=category,
                                        amount=budget_amount,
                                        saved=saved_amount,
                                        status='Paid' if saved_amount >= budget_amount else 'Outstanding',
                                        notes=row_dict.get('Notes', '').strip()
                                    )
                                    db.session.add(budget_item)

        # Import Ring data
        ring_file = os.path.join(data_dir, 'Hera Master Doc  Ring.csv')
        if os.path.exists(ring_file):
            with open(ring_file, 'r', encoding='utf-8') as file:
                reader = csv.reader(file)
                lines = list(reader)

                ring_data = {}
                if len(lines) > 2:
                    for row_data in lines[3:]:
                        if len(row_data) > 2 and row_data[1].strip():
                            field = row_data[1].strip()
                            details = row_data[2].strip()
                            if field and details:
                                field_key = field.lower().replace(' ', '_').replace('(', '').replace(')', '')
                                ring_data[field_key] = details

                ring = Ring(
                    jeweler=ring_data.get('jeweler', ''),
                    stone=ring_data.get('stones', ring_data.get('stone', '')),
                    metal=ring_data.get('metal', ''),
                    style_inspiration=ring_data.get('ring_style_inspiration', ''),
                    insurance=ring_data.get('insurance', ''),
                    status=ring_data.get('status', 'Delivered'),
                    cost=6400.0,  # From your budget data
                    deposit_paid=6400.0  # From your budget data
                )
                db.session.add(ring)

        # Import Family data
        family_file = os.path.join(data_dir, 'Hera Master Doc  Permissions.csv')
        if os.path.exists(family_file):
            with open(family_file, 'r', encoding='utf-8') as file:
                reader = csv.reader(file)
                lines = list(reader)

                if len(lines) > 2:
                    for row_data in lines[3:]:
                        if len(row_data) > 1 and row_data[1].strip():
                            row = row_data[1:]  # Remove first empty column
                            if len(row) >= 2:
                                family_member = Family(
                                    name=row[0].strip(),
                                    status=row[1].strip() if len(row) > 1 else 'Pending',
                                    notes=row[2].strip() if len(row) > 2 else ''
                                )
                                db.session.add(family_member)

        # Import Travel data
        travel_file = os.path.join(data_dir, 'Hera Master Doc  Travel.csv')
        if os.path.exists(travel_file):
            with open(travel_file, 'r', encoding='utf-8') as file:
                reader = csv.reader(file)
                lines = list(reader)

                if len(lines) > 2:
                    headers = [h.strip() for h in lines[2] if h.strip()]
                    headers = headers[1:]  # Remove first empty column

                    for row_data in lines[3:]:
                        if len(row_data) > 1 and row_data[1].strip():
                            row = row_data[1:]  # Remove first empty column
                            if len(row) >= len(headers):
                                row_dict = dict(zip(headers, row))

                                segment = row_dict.get('Segment', '').strip()
                                if segment:
                                    # Parse times
                                    departure_time = None
                                    arrival_time = None

                                    dep_time_str = row_dict.get('Departure Time', '').strip()
                                    if dep_time_str:
                                        try:
                                            departure_time = datetime.strptime(dep_time_str, '%I:%M %p').time()
                                        except:
                                            try:
                                                departure_time = datetime.strptime(dep_time_str, '%H:%M').time()
                                            except:
                                                pass

                                    arr_time_str = row_dict.get('Arrival Time', '').strip()
                                    if arr_time_str:
                                        try:
                                            arrival_time = datetime.strptime(arr_time_str, '%I:%M %p').time()
                                        except:
                                            try:
                                                arrival_time = datetime.strptime(arr_time_str, '%H:%M').time()
                                            except:
                                                pass

                                    # Parse date
                                    flight_date = None
                                    date_str = row_dict.get('Date', '').strip()
                                    if date_str:
                                        try:
                                            flight_date = datetime.strptime(date_str, '%m/%d/%Y').date()
                                        except:
                                            try:
                                                flight_date = datetime.strptime(date_str, '%Y-%m-%d').date()
                                            except:
                                                pass

                                    travel_item = Travel(
                                        details=segment,
                                        provider=row_dict.get('Airline', '').strip(),
                                        confirmation=row_dict.get('Confirmation Number', '').strip(),
                                        departure_time=departure_time,
                                        arrival_time=arrival_time,
                                        date=flight_date,
                                        seats=row_dict.get('Seat', '').strip(),
                                        status='Confirmed'
                                    )
                                    db.session.add(travel_item)

        # Import Itinerary data
        itinerary_file = os.path.join(data_dir, 'Hera Master Doc  Itinerary.csv')
        if os.path.exists(itinerary_file):
            with open(itinerary_file, 'r', encoding='utf-8') as file:
                reader = csv.reader(file)
                lines = list(reader)

                day_counter = 1
                if len(lines) > 2:
                    headers = [h.strip() for h in lines[2] if h.strip()]
                    headers = headers[1:]  # Remove first empty column

                    for row_data in lines[3:]:
                        if len(row_data) > 1 and row_data[2].strip():  # Check if Activity column has data
                            row = row_data[1:]  # Remove first empty column
                            if len(row) >= len(headers):
                                row_dict = dict(zip(headers, row))

                                activity = row_dict.get('Activity', '').strip()
                                if activity:
                                    # Parse time range
                                    start_time = None
                                    end_time = None
                                    time_range = row_dict.get('Time', '').strip()

                                    if '–' in time_range or '-' in time_range:
                                        try:
                                            times = time_range.replace('–', '-').split('-')
                                            if len(times) == 2:
                                                start_str = times[0].strip()
                                                end_str = times[1].strip()

                                                # Parse start time
                                                try:
                                                    start_time = datetime.strptime(start_str, '%H:%M').time()
                                                except:
                                                    try:
                                                        start_time = datetime.strptime(start_str, '%I:%M %p').time()
                                                    except:
                                                        pass

                                                # Parse end time
                                                try:
                                                    end_time = datetime.strptime(end_str, '%H:%M').time()
                                                except:
                                                    try:
                                                        end_time = datetime.strptime(end_str, '%I:%M %p').time()
                                                    except:
                                                        pass
                                        except:
                                            pass
                                    elif time_range:
                                        # Single time
                                        try:
                                            start_time = datetime.strptime(time_range, '%H:%M').time()
                                        except:
                                            try:
                                                start_time = datetime.strptime(time_range, '%I:%M %p').time()
                                            except:
                                                pass

                                    itinerary_item = Itinerary(
                                        day=day_counter,
                                        time_range=time_range,
                                        start_time=start_time,
                                        end_time=end_time,
                                        activity=activity,
                                        location=row_dict.get('Location/Details', '').strip(),
                                        notes=row_dict.get('Notes', '').strip()
                                    )
                                    db.session.add(itinerary_item)

        # Import Packing data
        packing_file = os.path.join(data_dir, 'Hera Master Doc  Packing List.csv')
        if os.path.exists(packing_file):
            with open(packing_file, 'r', encoding='utf-8') as file:
                reader = csv.reader(file)
                lines = list(reader)

                if len(lines) > 2:
                    for row_data in lines[3:]:
                        if len(row_data) > 1 and row_data[1].strip():
                            row = row_data[1:]  # Remove first empty column

                            item_name = row[0].strip()
                            if item_name:
                                # Determine category and priority based on item name
                                if any(word in item_name.lower() for word in ['ring', 'documents', 'passport']):
                                    category = 'Essential'
                                    priority = 'High'
                                elif any(word in item_name.lower() for word in ['camera', 'clothes', 'gear']):
                                    category = 'Important'
                                    priority = 'Medium'
                                else:
                                    category = 'Standard'
                                    priority = 'Medium'

                                # Parse packed status
                                packed_status = False
                                if len(row) > 1:
                                    packed_val = row[1].strip().lower()
                                    packed_status = packed_val in ['true', 'yes', '1', 'packed']

                                packing_item = Packing(
                                    category=category,
                                    item=item_name,
                                    packed=packed_status,
                                    notes=row[2].strip() if len(row) > 2 else '',
                                    priority=priority
                                )
                                db.session.add(packing_item)

        db.session.commit()
        return True, "CSV data imported successfully"

    except Exception as e:
        db.session.rollback()
        return False, f"Error importing CSV data: {str(e)}"


def export_to_csv(output_dir='exports'):
    """Export current database data back to CSV format"""
    try:
        # Import here to avoid circular imports
        from app import Budget, Ring, Family, Travel, Itinerary, Packing

        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)

        # Export Budget
        budget_items = Budget.query.all()
        budget_file = os.path.join(output_dir, 'budget_export.csv')
        with open(budget_file, 'w', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            writer.writerow(['Category', 'Budget', 'Saved', 'Remaining', 'Status', 'Notes'])
            for item in budget_items:
                writer.writerow([
                    item.category,
                    f'${item.amount:,.2f}',
                    f'${item.saved:,.2f}',
                    f'${item.remaining:,.2f}',
                    item.status,
                    item.notes
                ])

        # Export Ring
        ring = Ring.query.first()
        if ring:
            ring_file = os.path.join(output_dir, 'ring_export.csv')
            with open(ring_file, 'w', newline='', encoding='utf-8') as file:
                writer = csv.writer(file)
                writer.writerow(['Field', 'Details'])
                writer.writerow(['Jeweler', ring.jeweler])
                writer.writerow(['Stone(s)', ring.stone])
                writer.writerow(['Metal', ring.metal])
                writer.writerow(['Style Inspiration', ring.style_inspiration])
                writer.writerow(['Insurance', ring.insurance])
                writer.writerow(['Status', ring.status])

        # Export Family
        family_members = Family.query.all()
        family_file = os.path.join(output_dir, 'family_export.csv')
        with open(family_file, 'w', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            writer.writerow(['Family Member', 'Status', 'Notes'])
            for member in family_members:
                writer.writerow([member.name, member.status, member.notes])

        # Export Travel
        travel_items = Travel.query.all()
        travel_file = os.path.join(output_dir, 'travel_export.csv')
        with open(travel_file, 'w', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            writer.writerow(
                ['Segment', 'Airline', 'Confirmation Number', 'Departure Time', 'Arrival Time', 'Date', 'Seat',
                 'Status'])
            for item in travel_items:
                writer.writerow([
                    item.details,
                    item.provider,
                    item.confirmation,
                    item.departure_time.strftime('%I:%M %p') if item.departure_time else '',
                    item.arrival_time.strftime('%I:%M %p') if item.arrival_time else '',
                    item.date.strftime('%m/%d/%Y') if item.date else '',
                    item.seats,
                    item.status
                ])

        # Export Itinerary
        itinerary_items = Itinerary.query.order_by(Itinerary.day, Itinerary.start_time).all()
        itinerary_file = os.path.join(output_dir, 'itinerary_export.csv')
        with open(itinerary_file, 'w', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            writer.writerow(['Time', 'Activity', 'Location/Details', 'Notes'])
            for item in itinerary_items:
                writer.writerow([
                    item.time_range,
                    item.activity,
                    item.location,
                    item.notes
                ])

        # Export Packing
        packing_items = Packing.query.all()
        packing_file = os.path.join(output_dir, 'packing_export.csv')
        with open(packing_file, 'w', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            writer.writerow(['Item', 'Packed', 'Notes'])
            for item in packing_items:
                writer.writerow([
                    item.item,
                    item.packed,
                    item.notes
                ])

        return True, f"Data exported successfully to {output_dir}/"
    except Exception as e:
        return False, f"Error exporting data: {str(e)}"


# Legacy function for backward compatibility
def import_excel_data(file_path):
    """Legacy function - redirects to CSV import"""
    return import_csv_data()