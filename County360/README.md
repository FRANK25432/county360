# County360 — County Data & Decision Support Prototype

County360 is a demo web application for exploring county facilities and basic planning indicators.
This prototype uses **clearly labelled demonstration records**. Do not present demo records or simulated gap scores as official county statistics.

## Stack
- Backend: Python, Django, Django REST Framework, SQLite
- Frontend: React + Vite, Axios, Leaflet / React-Leaflet, Recharts, Lucide
- Map tiles: OpenStreetMap

## Requirements
- Python 3.10+
- Node.js 20+
- npm

## 1. Start the backend (Windows PowerShell)
```powershell
cd County360\backend
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo
python manage.py createsuperuser
python manage.py runserver
```
Backend: http://127.0.0.1:8000/
API: http://127.0.0.1:8000/api/facilities/

If PowerShell blocks activation:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\venv\Scripts\Activate.ps1
```

## 2. Start the frontend (open a second terminal)
```powershell
cd County360\frontend
npm install
npm run dev
```
Frontend: http://localhost:5173/

## Useful API endpoints
- `GET /api/health/`
- `GET /api/facilities/`
- `GET /api/facilities/?category=health`
- `GET /api/facilities/?search=clinic`
- `GET /api/facilities/?sub_county=Kapsabet`
- `GET /api/facilities/statistics/`
- `GET /api/categories/`

The Django admin is at `/admin/`.

## Important prototype notes
- Seed records are fictional examples for development only.
- Coordinates are approximate demo map positions and must not be used for navigation or official planning.
- This MVP does not yet include a real AI service, authenticated planner permissions, or a validated statistical gap model. The “planning insights” are transparent illustrative calculations.
- Before public deployment: configure production secrets, `DEBUG=False`, allowed hosts, HTTPS, authentication and authorization, rate limiting, backups, and verified official data.
