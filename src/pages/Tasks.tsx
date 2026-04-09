import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PriorityBadge } from '@/components/PriorityBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { CreateTaskModal } from '@/components/CreateTaskModal';
import { TaskDetailPanel } from '@/components/TaskDetailPanel';
import { ListTodo, Plus, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type Task = Database['public']['Tables']['tasks']['Row'] & {
  profiles?: { full_name: string } | null;
  projects?: { name: string } | null;
};

type TaskPriority = Database['public']['Enums']['task_priority'];
type TaskStatus = Database['public']['Enums']['task_status'];

const tabs = [
  { id: 'my', label: 'My Tasks' },
  { id: 'all', label: 'All Tasks' },
  { id: 'assigned', label: 'Assigned by Me' },
] as const;

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'my' | 'all' | 'assigned'>('my');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | null>(null);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, profiles:assigned_to(full_name), projects(name)')
        .order('created_at', { ascending: false });
      if (error) {
        console.warn('Join query failed, falling back:', error.message);
        const { data: fallback } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
        if (fallback) setTasks(fallback as unknown as Task[]);
      } else if (data) {
        setTasks(data as unknown as Task[]);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchTasks(); }, []);

  const filtered = tasks
    .filter(t => {
      if (tab === 'my') return t.assigned_to === user?.id;
      if (tab === 'assigned') return t.created_by === user?.id;
      return true;
    })
    .filter(t => !filterPriority || t.priority === filterPriority)
    .filter(t => !filterStatus || t.status === filterStatus);

  const statusLabel: Record<string, string> = { todo: 'To Do', inprogress: 'In Progress', completed: 'Completed' };

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Inter' }}>Tasks</h1>
          <p className="text-muted-foreground text-sm">Manage and track all tasks</p>
        </div>
      </div>

      {/* Segmented control */}
      <div className="inline-flex rounded-lg bg-muted p-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'px-4 py-1.5 rounded-md text-sm font-medium transition-all',
              tab === t.id ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {(['high', 'medium', 'low'] as TaskPriority[]).map(p => (
          <button
            key={p}
            onClick={() => setFilterPriority(filterPriority === p ? null : p)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium border transition-all',
              filterPriority === p ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:border-primary/50'
            )}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)} Priority
          </button>
        ))}
        {(['todo', 'inprogress', 'completed'] as TaskStatus[]).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(filterStatus === s ? null : s)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium border transition-all',
              filterStatus === s ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:border-primary/50'
            )}
          >
            {statusLabel[s]}
          </button>
        ))}
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <EmptyState icon={ListTodo} title="No tasks found" description="Try adjusting your filters or create a new task." action={<Button onClick={() => setCreateOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Create Task</Button>} />
      ) : (
        <div className="space-y-2">
          {filtered.map(task => (
            <Card
              key={task.id}
              className="p-4 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]"
              onClick={() => setSelectedTaskId(task.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className={cn('font-medium text-sm', task.status === 'completed' && 'line-through text-muted-foreground')}>{task.title}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                    {task.profiles && (
                      <span className="flex items-center gap-1"><User className="h-3 w-3" />{(task.profiles as any).full_name}</span>
                    )}
                    {task.projects && <span>{(task.projects as any).name}</span>}
                    {task.deadline && (
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(task.deadline), 'MMM d')}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <PriorityBadge priority={task.priority} />
                  <Badge variant="secondary" className="text-[10px]">{statusLabel[task.status]}</Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* FAB */}
      <Button
        onClick={() => setCreateOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg md:hidden z-40"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <CreateTaskModal open={createOpen} onOpenChange={setCreateOpen} onCreated={fetchTasks} />
      <TaskDetailPanel taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />
    </div>
  );
}
