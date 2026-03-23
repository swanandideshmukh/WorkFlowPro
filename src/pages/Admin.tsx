import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { StatCard } from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Users, FolderOpen, ListTodo, Shield, Pencil, Trash2 } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { Database } from '@/integrations/supabase/types';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

type AppRole = Database['public']['Enums']['app_role'];

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  role: AppRole;
}

export default function Admin() {
  const { role: currentRole } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string; description: string | null }[]>([]);
  const [tasks, setTasks] = useState<{ id: string; status: string; project_id: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [newRole, setNewRole] = useState<AppRole>('employee');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentRole !== 'admin') return;
    const fetchData = async () => {
      const [profilesRes, rolesRes, projectsRes, tasksRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email'),
        supabase.from('user_roles').select('user_id, role'),
        supabase.from('projects').select('id, name, description'),
        supabase.from('tasks').select('id, status, project_id'),
      ]);
      const profiles = profilesRes.data || [];
      const roles = rolesRes.data || [];
      setUsers(profiles.map(p => ({
        ...p,
        role: (roles.find(r => r.user_id === p.id)?.role || 'employee') as AppRole,
      })));
      if (projectsRes.data) setProjects(projectsRes.data);
      if (tasksRes.data) setTasks(tasksRes.data);
      setLoading(false);
    };
    fetchData();
  }, [currentRole]);

  if (currentRole !== 'admin') return <Navigate to="/dashboard" replace />;

  const handleRoleUpdate = async () => {
    if (!editUser) return;
    setSaving(true);
    await supabase.from('user_roles').update({ role: newRole }).eq('user_id', editUser.id);
    setSaving(false);
    setEditUser(null);
    // refetch
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from('profiles').select('id, full_name, email'),
      supabase.from('user_roles').select('user_id, role'),
    ]);
    const profiles = profilesRes.data || [];
    const roles = rolesRes.data || [];
    setUsers(profiles.map(p => ({
      ...p,
      role: (roles.find(r => r.user_id === p.id)?.role || 'employee') as AppRole,
    })));
  };

  const handleDeleteProject = async (id: string) => {
    await supabase.from('projects').delete().eq('id', id);
    const { data } = await supabase.from('projects').select('id, name, description');
    if (data) setProjects(data);
  };

  const barData = {
    labels: projects.map(p => p.name),
    datasets: [
      { label: 'Completed', data: projects.map(p => tasks.filter(t => t.project_id === p.id && t.status === 'completed').length), backgroundColor: 'hsl(160, 84%, 39%)', borderRadius: 4 },
      { label: 'Remaining', data: projects.map(p => tasks.filter(t => t.project_id === p.id && t.status !== 'completed').length), backgroundColor: 'hsl(215, 16%, 47%)', borderRadius: 4 },
    ],
  };

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Inter' }}>Admin Panel</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Users" value={users.length} icon={Users} iconColor="text-primary" iconBg="bg-blue-100" />
        <StatCard title="Projects" value={projects.length} icon={FolderOpen} iconColor="text-emerald-600" iconBg="bg-emerald-100" />
        <StatCard title="Total Tasks" value={tasks.length} icon={ListTodo} iconColor="text-yellow-600" iconBg="bg-yellow-100" />
      </div>

      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-base">User Management</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium text-muted-foreground">Name</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Email</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Role</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3 font-medium">{u.full_name}</td>
                    <td className="py-3 text-muted-foreground">{u.email}</td>
                    <td className="py-3"><Badge variant="secondary" className="text-xs capitalize">{u.role}</Badge></td>
                    <td className="py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => { setEditUser(u); setNewRole(u.role); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-base">Projects</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium text-muted-foreground">Name</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Description</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Tasks</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map(p => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3 font-medium">{p.name}</td>
                    <td className="py-3 text-muted-foreground max-w-xs truncate">{p.description || '—'}</td>
                    <td className="py-3 text-right tabular-nums">{tasks.filter(t => t.project_id === p.id).length}</td>
                    <td className="py-3 text-right">
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteProject(p.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-base">Task Completion by Project</CardTitle></CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No projects to display</p>
          ) : (
            <Bar data={barData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } }, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } } } }} />
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Edit Role — {editUser?.full_name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={newRole} onValueChange={v => setNewRole(v as AppRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleRoleUpdate} className="w-full" disabled={saving}>
              {saving ? <LoadingSpinner size="sm" className="text-white" /> : 'Update Role'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
