import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { PriorityBadge, priorityBorderColor } from '@/components/PriorityBadge';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { Plus, Columns3, Calendar as CalendarIcon, User } from 'lucide-react';
import { format } from 'date-fns';
import { CreateTaskModal } from '@/components/CreateTaskModal';
import { TaskDetailPanel } from '@/components/TaskDetailPanel';
import type { Database } from '@/integrations/supabase/types';

type TaskStatus = Database['public']['Enums']['task_status'];
type Task = Database['public']['Tables']['tasks']['Row'] & {
  profiles?: { full_name: string } | null;
  projects?: { name: string } | null;
};

const columns: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'todo', label: 'To Do', color: 'bg-slate-500' },
  { id: 'inprogress', label: 'In Progress', color: 'bg-yellow-500' },
  { id: 'completed', label: 'Completed', color: 'bg-emerald-500' },
];

export default function Kanban() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      // Try with joins first
      const { data, error } = await supabase
        .from('tasks')
        .select('*, profiles:assigned_to(full_name), projects(name)')
        .order('created_at', { ascending: false });
      if (error) {
        console.warn('Join query failed, falling back to simple query:', error.message);
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

  useEffect(() => {
    fetchTasks();
    const channel = supabase
      .channel('kanban-tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchTasks())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const newStatus = result.destination.droppableId as TaskStatus;
    const taskId = result.draggableId;
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
  };

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Inter' }}>Kanban Board</h1>
          <p className="text-muted-foreground text-sm">Drag tasks between columns to update status</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Create Task
        </Button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map(col => {
            const colTasks = tasks.filter(t => t.status === col.id);
            return (
              <div key={col.id} className="bg-muted/50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className={`h-2.5 w-2.5 rounded-full ${col.color}`} />
                  <h3 className="font-semibold text-sm">{col.label}</h3>
                  <Badge variant="secondary" className="ml-auto text-xs">{colTasks.length}</Badge>
                </div>

                <Droppable droppableId={col.id}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2 min-h-[200px]">
                      {colTasks.map((task, i) => (
                        <Draggable key={task.id} draggableId={task.id} index={i}>
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`p-3 cursor-pointer border-l-4 ${priorityBorderColor[task.priority]} hover:shadow-md transition-shadow ${snapshot.isDragging ? 'shadow-lg rotate-1' : ''}`}
                              onClick={() => setSelectedTaskId(task.id)}
                            >
                              <p className="font-medium text-sm mb-2 line-clamp-2">{task.title}</p>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <PriorityBadge priority={task.priority} />
                                {task.projects && (
                                  <span className="truncate max-w-[100px]">{(task.projects as any).name}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                {task.profiles && (
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" /> {(task.profiles as any).full_name}
                                  </span>
                                )}
                                {task.deadline && (
                                  <span className="flex items-center gap-1">
                                    <CalendarIcon className="h-3 w-3" /> {format(new Date(task.deadline), 'MMM d')}
                                  </span>
                                )}
                              </div>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      <CreateTaskModal open={createOpen} onOpenChange={setCreateOpen} onCreated={fetchTasks} />
      <TaskDetailPanel taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />
    </div>
  );
}
