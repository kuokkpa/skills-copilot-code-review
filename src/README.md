# Mergington High School Activities API

FastAPI application for viewing extracurricular activities, managing student signups,
and publishing announcements.

## Features

- View and filter extracurricular activities
- Teacher login for registration/unregistration actions
- Database-driven announcements with start/end dates
- Authenticated announcement management (create/update/delete)

## Getting Started

1. Install dependencies:

   ```bash
   pip install -r ../requirements.txt
   ```

2. Run the API from the repository root:

   ```bash
   uvicorn src.app:app --reload
   ```

3. Open:

- `http://localhost:8000/static/index.html`
- `http://localhost:8000/docs`

## API Endpoints

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET | `/activities` | Get all activities (supports `day`, `start_time`, `end_time` query params) |
| POST | `/activities/{activity_name}/signup?email=...&teacher_username=...` | Register a student for an activity (auth required) |
| POST | `/activities/{activity_name}/unregister?email=...&teacher_username=...` | Unregister a student (auth required) |
| POST | `/auth/login?username=...&password=...` | Teacher/admin login |
| GET | `/auth/check-session?username=...` | Validate teacher/admin session |
| GET | `/announcements` | List active announcements (public) |
| GET | `/announcements/manage?teacher_username=...` | List all announcements for management (auth required) |
| POST | `/announcements/manage?teacher_username=...` | Create an announcement (auth required) |
| PUT | `/announcements/manage/{announcement_id}?teacher_username=...` | Update an announcement (auth required) |
| DELETE | `/announcements/manage/{announcement_id}?teacher_username=...` | Delete an announcement (auth required) |

## Data Storage

Data is stored in MongoDB collections initialized from `src/backend/database.py`:

- `activities`
- `teachers`
- `announcements`

`announcements` entries use:

- `message` (string, required)
- `expires_on` (YYYY-MM-DD, required)
- `starts_on` (YYYY-MM-DD, optional)
