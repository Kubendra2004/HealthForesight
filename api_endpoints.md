# HealthForesight API Endpoints - Complete Documentation
**Base URL:** `http://localhost:8000`

**Total Endpoints:** 100+  
**Routers:** 19

---

## 🔐 Authentication (`/auth`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| POST | `/auth/login` | Login with username/password | Public |
| POST | `/auth/register` | Register new patient/doctor | Public |
| POST | `/auth/signup` | Admin creates users (any role) | Admin |
| POST | `/auth/refresh` | Refresh JWT token | Authenticated |

---

## 👥 Frontdesk Operations (`/frontdesk`)

### Appointments
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/frontdesk/appointments` | Create appointment (auto Google Meet for online) |
| GET | `/frontdesk/appointments` | List appointments (filter by patient/doctor) |
| PUT | `/frontdesk/appointments/{id}` | Update appointment status |
| DELETE | `/frontdesk/appointments/{id}` | Cancel appointment |

### Billing
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/frontdesk/bills` | Generate invoice |
| GET | `/frontdesk/bills/{patient_id}` | Get patient bills |
| POST | `/frontdesk/bills/{id}/pay` | Mark bill as paid |

### Notifications
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/frontdesk/notifications/{user_id}` | Get user notifications |
| PUT | `/frontdesk/notifications/{id}/read` | Mark notification as read |

---

## 👨‍⚕️ Doctor Operations (`/doctor`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/doctor/prescriptions` | Issue prescription |
| GET | `/doctor/prescriptions/{patient_id}` | Get patient prescriptions |
| GET | `/doctor/patients` | Get assigned patients list |

---

## 🔬 ML Predictions (`/ml`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/ml/predict/heart-disease` | Heart disease prediction |
| POST | `/ml/predict/diabetes` | Diabetes prediction |
| POST | `/ml/predict/clustering` | Patient risk clustering |
| POST | `/ml/predict/readmission` | 30-day readmission risk |
| POST | `/ml/predict/icu_transfer` | ICU transfer risk |
| GET | `/ml/predict/resources` | Resource forecasting (1/7/30 days) |
| POST | `/ml/predict/length-of-stay` | Length of stay prediction |
| POST | `/ml/explain` | SHAP explanations for predictions |
| POST | `/ml/retrain/{model_name}` | Retrain model (Admin) |

---

## 🤖 Chatbot (`/chatbot`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/chatbot/ask` | Ask medical question (RAG-enabled) |
| POST | `/chatbot/execute-action` | Execute chatbot action |

---

## 📂 File Management (`/files`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/files/upload` | Upload medical report |
| GET | `/files/{file_id}` | Download file |
| GET | `/files/list/{patient_id}` | List patient files |
| POST | `/files/process/{file_id}` | Extract report data |
| POST | `/files/generate-summary/{patient_id}` | Generate PDF summary |

---

## 🏥 Resources & Beds (`/resources`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/resources/levels` | Current resource levels |
| POST | `/resources/update` | Manual resource update |
| POST | `/resources/allocate-bed` | Allocate bed to patient |
| POST | `/resources/deallocate-bed` | Deallocate bed |
| GET | `/resources/3d-view` | 3D visualization data |

---

## 📋 Operations (`/operations`)

### Waitlist
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/operations/waitlist` | Add to waitlist |
| GET | `/operations/waitlist` | View waitlist |
| PUT | `/operations/waitlist/{id}` | Update priority/status |

### Inventory
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/operations/inventory` | Add inventory item |
| GET | `/operations/inventory` | View inventory |
| PUT | `/operations/inventory/{id}` | Update stock |

---

## 🔌 FHIR Interoperability (`/fhir`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/fhir/Patient/{id}` | Get FHIR Patient resource |
| GET | `/fhir/Patient` | Search patients (FHIR Bundle) |

---

## 📊 Metrics & Monitoring (`/metrics`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/metrics` | Prometheus metrics endpoint |

---

## 🔴 WebSocket (`/ws`)
| Endpoint | Description |
| :--- | :--- |
| `/ws/{client_id}` | WebSocket connection for real-time updates |

---

## 📈 Analytics (`/analytics`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/analytics/cohorts/create` | Create patient cohort |
| GET | `/analytics/cohorts/{id}/stats` | Get cohort statistics |
| GET | `/analytics/outcomes/treatment-success` | Treatment outcomes |
| GET | `/analytics/resource-utilization` | Resource usage analysis |
| GET | `/analytics/cost-per-patient` | Cost analysis |

---

## 👤 Patient Portal (`/portal`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/portal/journal` | Log health journal entry |
| GET | `/portal/journal` | Get journal entries |
| POST | `/portal/reminders` | Set medication reminder |
| GET | `/portal/reminders` | Get reminders |
| GET | `/portal/labs/trends` | Lab result trends |
| POST | `/portal/appointments/request` | Request appointment |
| GET | `/portal/appointments/requests` | View appointment requests |

---

## 🛠️ Admin Tools (`/admin`)

### Data Export
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/admin/export/patients?format=csv\|excel` | Export patients |
| GET | `/admin/export/appointments?format=csv\|excel` | Export appointments |

### Reports
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/admin/reports/custom` | Build custom report |

### Rostering
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/admin/roster/generate` | Generate staff roster |

### User Management
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/admin/users` | List all users |
| GET | `/admin/users/{id}` | Get user details |
| DELETE | `/admin/users/{id}` | Delete user |

---

## 🏥 Clinical Decision Support (`/clinical`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/clinical/vitals-check` | Check vitals against thresholds |
| POST | `/clinical/predict/fall-risk` | Fall risk assessment |
| POST | `/clinical/med-reconciliation` | Check drug interactions (50+) |
| POST | `/clinical/adverse-events` | Log adverse event |
| GET | `/clinical/adverse-events/trends` | Analyze adverse events |

---

## 🔗 Integrations (`/integrations`)

### Telemedicine
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/integrations/telemedicine/create-meeting` | Create Google Meet link |
| GET | `/integrations/telemedicine/meetings/{appointment_id}` | Get meeting details |

### Lab Integration
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/integrations/lab/import` | Bulk import lab results |
| GET | `/integrations/lab/{patient_id}` | Get patient lab results |

---

## 🔍 Audit Logs (`/admin/audit`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/admin/audit/logs` | View audit logs (Admin) |
| GET | `/admin/audit/stats` | Audit statistics |

---

## 🔐 Session Management (`/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/auth/sessions` | Get active sessions |
| POST | `/auth/session/create` | Create new session |
| DELETE | `/auth/sessions/{id}` | Logout specific session |
| DELETE | `/auth/sessions/all` | Logout all sessions |

---

## 📝 Request/Response Examples

### Create Online Appointment (Auto Google Meet)
**POST** `/frontdesk/appointments`
```json
{
  "patient_id": "p123",
  "doctor_id": "d456",
  "date": "2024-12-10T15:00:00",
  "reason": "Virtual Consultation",
  "type": "online",
  "status": "Confirmed"
}
```
**Response:**
```json
{
  "id": "abc123",
  "message": "Appointment scheduled/requested",
  "meet_url": "https://meet.google.com/xyz-abcd-efg",
  "meet_code": "xyz-abcd-efg"
}
```

### Check Drug Interactions
**POST** `/clinical/med-reconciliation`
```json
{
  "medications": ["aspirin", "warfarin", "lisinopril"]
}
```
**Response:**
```json
{
  "medications_count": 3,
  "warnings": [
    {
      "type": "interaction",
      "severity": "high",
      "medications": ["aspirin", "warfarin"],
      "message": "Increased bleeding risk: Monitor INR closely..."
    }
  ],
  "status": "warnings",
  "critical_count": 0
}
```

### Export to Excel
**GET** `/admin/export/patients?format=excel`
**Response:** Downloads `patients.xlsx` with styled headers

---

## 🔑 Authentication
Most endpoints require JWT token in header:
```http
Authorization: Bearer <your_jwt_token>
```
Get token from `/auth/login`

---

## 📚 Interactive API Docs
Visit: `http://localhost:8000/docs` for Swagger UI with all endpoints

**Total:** 100+ functional endpoints ready for frontend integration!
