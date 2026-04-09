import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { PriorityBadge } from '@/components/PriorityBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Calendar, User, MessageSquare, Paperclip, Send } from 'lucide-react';
import { format } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type Task = Database['public']['Tables']['tasks']['Row'];

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author: { full_name: string } | null;
}

interface Props {
  taskId: string | null;
  onClose: () => void;
}

export function TaskDetailPanel({ taskId, onClose }: Props) {
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [assigneeName, setAssigneeName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<{ id: string; file_name: string; file_url: string }[]>([]);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!taskId) return;
    setLoading(true);

    const fetchAll = async () => {
      const { data: t } = await supabase.from('tasks').select('*').eq('id', taskId).single();
      if (t) {
        setTask(t);
        if (t.assigned_to) {
          const { data: p } = await supabase.from('profiles').select('full_name').eq('id', t.assigned_to).single();
          setAssigneeName(p?.full_name || '');
        }
        if (t.project_id) {
          const { data: pr } = await supabase.from('projects').select('name').eq('id', t.project_id).single();
          setProjectName(pr?.name || '');
        }
      }

      try {
        const { data: c, error: cErr } = await supabase
          .from('comments')
          .select('id, content, created_at, author:author_id(full_name)')
          .eq('task_id', taskId)
          .order('created_at', { ascending: true });
        if (cErr) {
          console.warn('Comment join failed, falling back:', cErr.message);
          const { data: cFallback } = await supabase.from('comments').select('*').eq('task_id', taskId).order('created_at', { ascending: true });
          if (cFallback) setComments(cFallback.map(c => ({ ...c, author: null })) as unknown as Comment[]);
        } else if (c) {
          setComments(c as unknown as Comment[]);
        }
      } catch (err) {
        console.error('Failed to fetch comments:', err);
      }

      const { data: a } = await supabase.from('file_attachments').select('id, file_name, file_url').eq('task_id', taskId);
      if (a) setAttachments(a);

      setLoading(false);
    };

    fetchAll();
  }, [taskId]);

  const postComment = async () => {
    if (!newComment.trim() || !user || !taskId) return;
    setPosting(true);
    await supabase.from('comments').insert({ task_id: taskId, author_id: user.id, content: newComment.trim() });
    const { data: c, error: cErr } = await supabase
      .from('comments')
      .select('id, content, created_at, author:author_id(full_name)')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });
    if (cErr) {
      const { data: cFallback } = await supabase.from('comments').select('*').eq('task_id', taskId).order('created_at', { ascending: true });
      if (cFallback) setComments(cFallback.map(c => ({ ...c, author: null })) as unknown as Comment[]);
    } else if (c) {
      setComments(c as unknown as Comment[]);
    }
    setNewComment('');
    setPosting(false);
  };

  const statusLabel: Record<string, string> = { todo: 'To Do', inprogress: 'In Progress', completed: 'Completed' };

  return (
    <Sheet open={!!taskId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left">{task?.title || 'Task Details'}</SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : task ? (
          <div className="space-y-6 mt-4">
            <div className="flex flex-wrap gap-2">
              <PriorityBadge priority={task.priority} />
              <Badge variant="secondary">{statusLabel[task.status]}</Badge>
              {projectName && <Badge variant="outline">{projectName}</Badge>}
            </div>

            {task.description && (
              <div>
                <h4 className="text-sm font-medium mb-1">Description</h4>
                <p className="text-sm text-muted-foreground">{task.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              {assigneeName && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{assigneeName}</span>
                </div>
              )}
              {task.deadline && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(task.deadline), 'MMM d, yyyy')}</span>
                </div>
              )}
            </div>

            {/* Attachments */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Paperclip className="h-4 w-4" /> Attachments ({attachments.length})
              </h4>
              {attachments.length === 0 ? (
                <p className="text-xs text-muted-foreground">No attachments</p>
              ) : (
                <div className="space-y-1">
                  {attachments.map(a => (
                    <a key={a.id} href={a.file_url} target="_blank" rel="noreferrer" className="block text-sm text-primary hover:underline truncate">
                      {a.file_name}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Comments */}
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Comments ({comments.length})
              </h4>
              <div className="space-y-3 mb-3 max-h-60 overflow-y-auto">
                {comments.map(c => (
                  <div key={c.id} className="bg-muted rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{(c.author as any)?.full_name || 'Unknown'}</span>
                      <span className="text-[10px] text-muted-foreground">{format(new Date(c.created_at), 'MMM d, h:mm a')}</span>
                    </div>
                    <p className="text-sm">{c.content}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Textarea
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  rows={2}
                  className="flex-1"
                />
                <Button size="icon" onClick={postComment} disabled={posting || !newComment.trim()}>
                  {posting ? <LoadingSpinner size="sm" className="text-white" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
