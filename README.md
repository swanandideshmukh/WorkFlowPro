# WorkFlowPro

A web-based internal task and workflow management system built as a simplified alternative to Jira and Asana. Helps teams assign tasks, track project progress, schedule meetings, and collaborate efficiently through one centralized platform.


> Simplified alternative to Jira and Asana built for small to medium organizations.



| Role | Email | Password |
|------|-------|----------|
| Admin | admin@workflowpro.com | Demo@123 |
| Manager | manager@workflowpro.com | Demo@123 |
| Employee | employee@workflowpro.com | Demo@123 |

## Features

- Kanban board with drag-and-drop task management
- Real-time dashboard with Chart.js analytics
- Role-based access control — Admin, Manager, Employee
- Meeting scheduler with monthly calendar
- Daily task tracker with progress bar
- Task comments and team collaboration
- Deadline notifications and overdue alerts
- Admin panel for user and project management

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, JavaScript |
| Framework | React.js |
| Styling | Tailwind CSS |
| Backend | Node.js |
| Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth |
| Charts | Chart.js |
| Deployment | Netlify |

## Project Structure
```
src/
├── components/       Reusable UI components
│   ├── Sidebar.jsx
│   ├── TaskCard.jsx
│   ├── TaskDetailPanel.jsx
│   └── Modal.jsx
├── pages/            Full page components
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── Kanban.jsx
│   ├── Tasks.jsx
│   ├── Calendar.jsx
│   ├── DailyTasks.jsx
│   └── Admin.jsx
├── context/
│   └── AuthContext.jsx
└── App.jsx
```



## Screenshots


> Login page
<img width="1334" height="685" alt="Screenshot 2026-03-25 163729" src="https://github.com/user-attachments/assets/4ceffe8b-c4f1-448d-a533-4ab64c9f0525" />


> Dashboard
<img width="1339" height="681" alt="Screenshot 2026-03-25 163826" src="https://github.com/user-attachments/assets/e8a189ca-ecfb-4b08-ba93-514092db0bfe" />


> Kanban Board
><img width="1335" height="670" alt="Screenshot 2026-03-25 163927" src="https://github.com/user-attachments/assets/37edf234-09e4-42d0-a0b6-6bf185f4d3c7" />

> 


