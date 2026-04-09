import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StatCard } from '@/components/StatCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ListTodo, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { format } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

interface TaskRow {
  id: string;
  title: string;
  status: string;
  priority: string;
  deadline: string | null;
  project_id: string | null;
  updated_at: string;
  projects?: { name: string } | null;
}

export default function Dashboard() {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [tasksRes, projectsRes] = await Promise.all([
        supabase.from('tasks').select('*, projects(name)'),
        supabase.from('projects').select('id, name'),
      ]);
      if (tasksRes.error) {
        console.warn('Tasks join failed, falling back:', tasksRes.error.message);
        const { data } = await supabase.from('tasks').select('*');
        if (data) setTasks(data as unknown as TaskRow[]);
      } else if (tasksRes.data) {
        setTasks(tasksRes.data as unknown as TaskRow[]);
      }
      if (projectsRes.data) setProjects(projectsRes.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('dashboard-tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;

  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const inProgress = tasks.filter(t => t.status === 'inprogress').length;
  const overdue = tasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed').length;

  // Bar chart: tasks per project
  const barData = {
    labels: projects.map(p => p.name),
    datasets: [{
      label: 'Tasks',
      data: projects.map(p => tasks.filter(t => t.project_id === p.id).length),
      backgroundColor: 'hsl(217, 91%, 60%)',
      borderRadius: 6,
      barThickness: 32,
    }],
  };

  // Donut chart
  const todo = tasks.filter(t => t.status === 'todo').length;
  const donutData = {
    labels: ['To Do', 'In Progress', 'Completed'],
    datasets: [{
      data: [todo, inProgress, completed],
      backgroundColor: ['hsl(215, 16%, 47%)', 'hsl(38, 92%, 50%)', 'hsl(160, 84%, 39%)'],
      borderWidth: 0,
    }],
  };

  const recentTasks = [...tasks].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Inter' }}>Dashboard</h1>
        <p className="text-muted-foreground text-sm">Overview of your workspace</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Tasks" value={total} icon={ListTodo} iconColor="text-primary" iconBg="bg-blue-100" />
        <StatCard title="Completed" value={completed} icon={CheckCircle2} iconColor="text-emerald-600" iconBg="bg-emerald-100" />
        <StatCard title="In Progress" value={inProgress} icon={Clock} iconColor="text-yellow-600" iconBg="bg-yellow-100" />
        <StatCard title="Overdue" value={overdue} icon={AlertTriangle} iconColor="text-red-600" iconBg="bg-red-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-base">Tasks by Project</CardTitle></CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No projects yet</p>
            ) : (
              <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }} />
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-base">Status Breakdown</CardTitle></CardHeader>
          <CardContent className="flex justify-center">
            {total === 0 ? (
              <p className="text-sm text-muted-foreground py-8">No tasks yet</p>
            ) : (
              <div className="w-64 h-64">
                <Doughnut data={donutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, cutout: '65%' }} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-base">Recent Activity</CardTitle></CardHeader>
        <CardContent>
          {recentTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {recentTasks.map(task => (
                <div key={task.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {(task.projects as any)?.name || 'No project'} · {task.status.replace('inprogress', 'In Progress')}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(task.updated_at), 'MMM d, h:mm a')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
