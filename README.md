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

## Getting Started
```bash
# Clone the repository
git clone https://github.com/swanandideshmukh/WorkFlowPro.git

# Navigate into the project
cd WorkFlowPro

# Install dependencies
npm install

# Add environment variables
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Start development server
npm run dev
```

## Screenshots

> Dashboard, Kanban Board, and Admin Panel screenshots coming soon

## License

