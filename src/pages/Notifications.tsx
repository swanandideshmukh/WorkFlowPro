import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { Bell, CheckCheck, AlertTriangle, Calendar, MessageSquare, UserPlus } from 'lucide-react';
import { format } from 'date-fns';

interface Notification {
  id: string;
  message: string;
  is_read: boolean;
  type: string | null;
  created_at: string;
}

const typeIcons: Record<string, any> = {
  overdue: AlertTriangle,
  deadline: Calendar,
  assignment: UserPlus,
  comment: MessageSquare,
  info: Bell,
};

const typeColors: Record<string, string> = {
  overdue: 'bg-red-100 text-red-600',
  deadline: 'bg-yellow-100 text-yellow-600',
  assignment: 'bg-blue-100 text-blue-600',
  comment: 'bg-emerald-100 text-emerald-600',
  info: 'bg-slate-100 text-slate-600',
};

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setNotifications(data);
    setLoading(false);
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Inter' }}>Notifications</h1>
          <p className="text-muted-foreground text-sm">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllRead} className="gap-2">
            <CheckCheck className="h-4 w-4" /> Mark All Read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up! Notifications will appear here when there are updates." />
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const type = n.type || 'info';
            const Icon = typeIcons[type] || Bell;
            const colorClass = typeColors[type] || typeColors.info;
            return (
              <Card key={n.id} className={`shadow-sm transition-all hover:shadow-md ${!n.is_read ? 'border-l-4 border-l-primary' : 'opacity-75'}`}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{format(new Date(n.created_at), 'MMM d, h:mm a')}</p>
                  </div>
                  {!n.is_read && <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
