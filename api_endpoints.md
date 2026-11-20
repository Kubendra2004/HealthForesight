# HealthForesight API Endpoints - Overview
**Base URL:** `http://localhost:8000`

The route list below is a hand-maintained overview. For the exact current request and response schemas, use FastAPI's `/docs` page while the backend is running.

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
| POST | `/frontdesk/appointments` | Create an in-person appointment or request |
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
| GET | `/patient/prescriptions/{patient_id}` | Get an authorized patient's prescriptions |
| GET | `/doctor/prescriptions/{doctor_id}` | Get the authenticated doctor's prescriptions |
| GET | `/doctor/patients/{doctor_id}` | Get the authenticated doctor's assigned patients |

---

## 🔬 ML Predictions (`/ml`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/ml/predict/heart` | Heart disease prediction |
| POST | `/ml/predict/diabetes` | Diabetes prediction |
| POST | `/ml/predict/cluster` | Patient risk clustering |
| POST | `/ml/predict/readmission` | 30-day readmission risk |
| POST | `/ml/predict/icu_transfer` | ICU transfer risk |
| GET | `/ml/predict/resources` | Resource forecasting (1/7/30 days) |
| POST | `/analytics/predict/length-of-stay` | Length of stay estimate |
| POST | `/ml/explain/heart` | Heart model explanation |
| POST | `/ml/explain/diabetes` | Diabetes model explanation |
| POST | `/admin/models/retrain?model_name=heart` | Retrain a model (Admin) |

---

## 🤖 Chatbot (`/chatbot`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/chatbot/ask` | Ask medical question with authenticated patient context, RAG retrieval, and tool-assisted actions |

---

## 📂 File Management (`/files`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/files/upload` | Upload medical report |
| GET | `/files/download/{filename}` | Download an authorized patient file |
| GET | `/files/patient/{patient_id}` | List patient files |
| POST | `/files/process/{file_id}` | Extract report data |

---

## 🏥 Resources & Beds (`/resources`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/resources/current` | Current resource levels |
| POST | `/resources/update` | Manual resource update |
| GET | `/beds` | List beds |
| POST | `/beds/allocate` | Allocate bed to patient |
| POST | `/beds/deallocate` | Deallocate bed |
| GET | `/ml/predict/resources?days=7` | Fresh resource forecast (1-30 days; returns 503 when stale or unavailable) |

---

## 📋 Operations (`/operations`)

### Waitlist
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/operations/waitlist` | Add to waitlist |
| GET | `/operations/waitlist` | View waitlist |
| PUT | `/operations/waitlist/{id}/status` | Update waitlist status |

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
| `/ws/connect?token=<jwt>` | JWT-authenticated WebSocket connection |

---

## 📈 Analytics (`/analytics`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/analytics/cohorts/create` | Create patient cohort |
| GET | `/analytics/cohorts/{id}/stats` | Get cohort statistics |
| GET | `/analytics/outcomes/treatment-success` | Reports unavailable until treatment outcomes/readmissions are recorded |
| GET | `/analytics/resource-utilization` | Current bed and oxygen inventory snapshot; no historical consumption |
| GET | `/analytics/cost-per-patient` | Recorded bill amount summary; department and per-patient totals are not tracked |

Clinical prediction endpoints require complete inputs. Profile-based predictions are skipped when required values are missing; unsupported diabetes-model gender categories return HTTP 422. Model scores in this API are not clinically validated.

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
| POST | `/integrations/telemedicine/create-meeting` | Returns 503 until Google Calendar integration is configured |
| GET | `/integrations/telemedicine/meetings/{appointment_id}` | Get an existing meeting (if configured) |

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

### Create Appointment
**POST** `/frontdesk/appointments`
```json
{
  "patient_id": "p123",
  "doctor_id": "d456",
  "date": "2024-12-10T15:00:00",
  "reason": "Routine consultation",
  "type": "in-person",
  "status": "Requested"
}
```
**Response:**
```json
{
  "id": "abc123",
  "message": "Appointment scheduled/requested"
}
```

Online appointments are currently unavailable. The app does not yet have Google Calendar credentials to create real meeting links.

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

Route access is role and record dependent. Clinical or operational information should only be requested by an authenticated user with access to the relevant patient or workflow.
