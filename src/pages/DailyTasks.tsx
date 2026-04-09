import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { PriorityBadge } from '@/components/PriorityBadge';
import { Progress } from '@/components/ui/progress';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { CheckCircle2, Calendar } from 'lucide-react';
import { format, isToday, addDays, isBefore, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type Task = Database['public']['Tables']['tasks']['Row'] & {
  projects?: { name: string } | null;
};

export default function DailyTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, projects(name)')
        .eq('assigned_to', user.id)
        .order('deadline', { ascending: true });
      if (error) {
        console.warn('Join query failed, falling back:', error.message);
        const { data: fallback } = await supabase.from('tasks').select('*').eq('assigned_to', user.id).order('deadline', { ascending: true });
        if (fallback) setTasks(fallback as unknown as Task[]);
      } else if (data) {
        setTasks(data as unknown as Task[]);
      }
    } catch (err) {
      console.error('Failed to fetch daily tasks:', err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchTasks(); }, [user]);

  const toggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'todo' : 'completed';
    await supabase.from('tasks').update({ status: newStatus as any }).eq('id', taskId);
    fetchTasks();
  };

  const today = new Date();
  const todayTasks = tasks.filter(t => t.deadline && isToday(new Date(t.deadline)));
  const allTodayAndPast = tasks.filter(t => !t.deadline || isBefore(new Date(t.deadline), endOfDay(today)));

  const todayPending = allTodayAndPast.filter(t => t.status !== 'completed');
  const todayCompleted = allTodayAndPast.filter(t => t.status === 'completed');
  const totalToday = allTodayAndPast.length;
  const completedCount = todayCompleted.length;
  const progress = totalToday > 0 ? (completedCount / totalToday) * 100 : 0;

  // Upcoming 7 days
  const upcoming: { date: Date; tasks: Task[] }[] = [];
  for (let i = 1; i <= 7; i++) {
    const day = addDays(today, i);
    const dayTasks = tasks.filter(t => t.deadline && format(new Date(t.deadline), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'));
    if (dayTasks.length > 0) upcoming.push({ date: day, tasks: dayTasks });
  }

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Inter' }}>Daily Tasks</h1>
        <p className="text-lg text-muted-foreground">{format(today, 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Progress */}
      <Card className="shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Today's Progress</span>
            <span className="text-sm text-muted-foreground tabular-nums">{completedCount}/{totalToday} completed</span>
          </div>
          <Progress value={progress} className="h-2.5" />
        </CardContent>
      </Card>

      {/* Today's tasks */}
      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-base">Today's Tasks</CardTitle></CardHeader>
        <CardContent>
          {todayPending.length === 0 && todayCompleted.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="No tasks for today" description="Enjoy your free day or create some tasks!" />
          ) : (
            <div className="space-y-1">
              {todayPending.map(task => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    checked={false}
                    onCheckedChange={() => toggleTask(task.id, task.status)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{task.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <PriorityBadge priority={task.priority} />
                      {task.projects && <span className="text-xs text-muted-foreground">{(task.projects as any).name}</span>}
                    </div>
                  </div>
                  {task.deadline && (
                    <span className="text-xs text-muted-foreground">{format(new Date(task.deadline), 'h:mm a')}</span>
                  )}
                </div>
              ))}

              {todayCompleted.length > 0 && (
                <>
                  <div className="pt-4 pb-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Completed Today</p>
                  </div>
                  {todayCompleted.map(task => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 py-2.5 px-2 rounded-lg opacity-60"
                    >
                      <Checkbox
                        checked={true}
                        onCheckedChange={() => toggleTask(task.id, task.status)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm line-through text-muted-foreground">{task.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <PriorityBadge priority={task.priority} />
                          {task.projects && <span className="text-xs text-muted-foreground">{(task.projects as any).name}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming 7 days */}
      {upcoming.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-base">Upcoming (Next 7 Days)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {upcoming.map(({ date, tasks: dayTasks }) => (
              <div key={date.toISOString()}>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" /> {format(date, 'EEEE, MMM d')}
                </p>
                <div className="space-y-1 pl-1">
                  {dayTasks.map(task => (
                    <div key={task.id} className="flex items-center gap-3 py-1.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{task.title}</p>
                      </div>
                      <PriorityBadge priority={task.priority} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
