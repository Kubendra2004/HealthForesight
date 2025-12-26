# Frontdesk Dashboard - Backend Integration Guide

## ✅ Backend Integration Complete

All frontdesk dashboard features are fully integrated with the backend.

## Authentication

**Frontdesk Test User:**
- Username: `frontdesk1`
- Password: `frontdesk123`
- Email: `frontdesk@hospital.com`
- Role: `frontdesk`

## Backend Endpoints Connected

### 1. Appointments (`/frontdesk/appointments`)
- ✅ `GET /frontdesk/appointments` - Fetch all appointments
- ✅ `POST /frontdesk/appointments` - Create new appointment
- ✅ `PUT /frontdesk/appointments/{id}` - Update appointment status (approve/reject)
- ✅ `DELETE /frontdesk/appointments/{id}` - Cancel appointment

### 2. Billing (`/frontdesk/bills`)
- ✅ `POST /frontdesk/bills` - Generate new bill
- ✅ `GET /frontdesk/bills/{patient_id}` - Get patient bills
- ✅ `POST /frontdesk/bills/{id}/pay` - Process payment

### 3. Resources (`/resources`)
- ✅ `GET /resources/current` - Get current resource levels
- ✅ `POST /resources/update` - Update resource levels

### 4. Beds (`/beds`)
- ✅ `GET /beds` - List all beds
- ✅ `POST /beds/allocate` - Allocate bed to patient
- ✅ `POST /beds/deallocate` - Deallocate bed (generates bill automatically)

### 5. Operations (`/operations`)
**Waitlist:**
- ✅ `POST /operations/waitlist` - Add to waitlist
- ✅ `GET /operations/waitlist` - View waitlist
- ✅ `PUT /operations/waitlist/{id}/status` - Update status

**Inventory:**
- ✅ `POST /operations/inventory` - Add inventory item
- ✅ `GET /operations/inventory` - View inventory
- ✅ `PUT /operations/inventory/{id}` - Update quantity

### 6. Users (`/auth/users`)
- ✅ `GET /auth/users?role=doctor` - Get list of doctors (NEW ENDPOINT ADDED)

## Sample Data Created

### Resources (5 items)
- Beds: 45/60
- ICU: 8/12
- Oxygen: 150/200 cylinders
- Ventilators: 5/10
- Wheelchairs: 18/25

### Beds (20 beds across 4 wards)
- General Ward: Beds 101-105 (3 available, 2 occupied)
- ICU: Beds 106-110 (3 available, 2 occupied)
- Pediatric: Beds 111-115 (3 available, 2 occupied)
- Emergency: Beds 116-120 (3 available, 2 occupied)

### Waitlist (4 entries)
- patient10: Cardiology Consultation (High priority)
- patient11: Orthopedic Surgery (Medium)
- patient12: General Checkup (Low)
- patient13: Physical Therapy (Medium)

### Inventory (7 items)
- Surgical Masks: 500 boxes
- Hand Sanitizer: 150 bottles
- Disposable Gloves: 300 boxes
- Syringes (5ml): 50 packs ⚠️ LOW STOCK
- Bandages: 200 rolls
- IV Drips: 30 units ⚠️ LOW STOCK
- Thermometers: 25 units

## Testing the Dashboard

1. **Login:**
   - Navigate to `http://localhost:5173/login`
   - Username: `frontdesk1`
   - Password: `frontdesk123`

2. **Dashboard redirects to:** `/dashboard/frontdesk`

3. **Test Features:**
   - ✅ View stats on Dashboard tab
   - ✅ Create new appointment (needs doctor user - use kubendra)
   - ✅ View and manage appointments
   - ✅ Generate bills
   - ✅ Monitor resources
   - ✅ Allocate/deallocate beds
   - ✅ View waitlist and inventory

## Data Flow Examples

### Creating an Appointment
```javascript
Frontend:
POST /frontdesk/appointments
Body: {
  patient_id: "patient1",
  doctor_id: "kubendra",
  date: "2025-12-08T10:00:00Z",
  reason: "Checkup",
  type: "in-person",
  status: "Scheduled"
}

Backend Response: { id: "...", message: "Appointment scheduled/requested" }
```

### Allocating a Bed
```javascript
Frontend:
POST /beds/allocate
Body: { bed_id: "bed_id_here", patient_id: "patient1" }

Backend: Updates bed status to "Occupied"
Frontend: Bed card updates in real-time
```

### Deallocating a Bed
```javascript
Frontend:
POST /beds/deallocate
Body: { bed_id: "bed_id_here" }

Backend: 
1. Updates bed status to "Available"
2. Automatically generates hospital stay bill
Frontend: Shows success message "Bed deallocated and bill generated"
```

## Scripts for Setup

### Create Frontdesk User
```bash
python create_frontdesk_user_db.py
```

### Create Sample Data
```bash
python create_sample_frontdesk_data.py
```

## All Features Working

✅ **Dashboard Tab** - Overview with stats
✅ **Appointments Tab** - CRUD operations
✅ **Billing Tab** - Bill generation
✅ **Resources Tab** - Real-time monitoring
✅ **Beds Tab** - Allocation management
✅ **Operations Tab** - Waitlist & Inventory

## Notes

- All API calls include JWT authentication via Bearer token
- Error handling implemented with snackbar notifications
- Real-time UI updates after backend operations
- Sample data provides realistic testing environment
