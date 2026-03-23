import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { Calendar as CalendarIcon, Plus, Clock, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isAfter } from 'date-fns';

interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: number;
  participants: string[] | null;
  meeting_link: string | null;
  description: string | null;
  created_by: string | null;
}

interface Profile { id: string; full_name: string; }

export default function CalendarPage() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [duration, setDuration] = useState('30');
  const [participants, setParticipants] = useState<string[]>([]);
  const [meetingLink, setMeetingLink] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    const [mRes, pRes] = await Promise.all([
      supabase.from('meetings').select('*').order('date', { ascending: true }),
      supabase.from('profiles').select('id, full_name'),
    ]);
    if (mRes.data) setMeetings(mRes.data);
    if (pRes.data) setProfiles(pRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = monthStart.getDay();

  const upcoming = meetings
    .filter(m => isAfter(new Date(`${m.date}T${m.time}`), new Date()))
    .slice(0, 5);

  const handleDateClick = (day: Date) => {
    setSelectedDate(day);
    setDate(format(day, 'yyyy-MM-dd'));
    setCreateOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;
    setSaving(true);
    await supabase.from('meetings').insert({
      title: title.trim(),
      date,
      time,
      duration: parseInt(duration),
      participants: participants.length ? participants : null,
      meeting_link: meetingLink || null,
      description: description || null,
      created_by: user?.id,
    });
    setSaving(false);
    setTitle(''); setTime('09:00'); setDuration('30'); setParticipants([]); setMeetingLink(''); setDescription('');
    setCreateOpen(false);
    fetchData();
  };

  const toggleParticipant = (id: string) => {
    setParticipants(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const getParticipantName = (id: string) => profiles.find(p => p.id === id)?.full_name || 'Unknown';

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Inter' }}>Calendar</h1>
          <p className="text-muted-foreground text-sm">Meetings and schedule overview</p>
        </div>
        <Button onClick={() => { setDate(format(new Date(), 'yyyy-MM-dd')); setCreateOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> New Meeting
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{format(currentMonth, 'MMMM yyyy')}</CardTitle>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-px">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
              ))}
              {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}
              {days.map(day => {
                const dayMeetings = meetings.filter(m => isSameDay(new Date(m.date), day));
                const isToday = isSameDay(day, new Date());
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => handleDateClick(day)}
                    className={`min-h-[70px] p-1 rounded-lg text-left hover:bg-muted/50 transition-colors ${isToday ? 'bg-primary/5 ring-1 ring-primary/20' : ''}`}
                  >
                    <span className={`text-xs font-medium ${isToday ? 'text-primary' : 'text-foreground'}`}>
                      {format(day, 'd')}
                    </span>
                    <div className="space-y-0.5 mt-0.5">
                      {dayMeetings.slice(0, 2).map(m => (
                        <div key={m.id} className="bg-primary/10 text-primary text-[10px] px-1 py-0.5 rounded truncate">
                          {m.title}
                        </div>
                      ))}
                      {dayMeetings.length > 2 && (
                        <span className="text-[10px] text-muted-foreground">+{dayMeetings.length - 2} more</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming meetings */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Upcoming Meetings</CardTitle>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No upcoming meetings</p>
            ) : (
              <div className="space-y-3">
                {upcoming.map(m => (
                  <div key={m.id} className="border rounded-lg p-3 hover:shadow-sm transition-shadow">
                    <p className="font-medium text-sm">{m.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <CalendarIcon className="h-3 w-3" />
                      <span>{format(new Date(m.date), 'MMM d')}</span>
                      <Clock className="h-3 w-3 ml-1" />
                      <span>{m.time.slice(0, 5)}</span>
                      <span>· {m.duration}min</span>
                    </div>
                    {m.participants && m.participants.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {m.participants.map(p => (
                          <Badge key={p} variant="secondary" className="text-[10px]">{getParticipantName(p)}</Badge>
                        ))}
                      </div>
                    )}
                    {m.meeting_link && (
                      <a href={m.meeting_link} target="_blank" rel="noreferrer">
                        <Button variant="outline" size="sm" className="mt-2 gap-1 text-xs h-7">
                          <ExternalLink className="h-3 w-3" /> Join
                        </Button>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create meeting dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>New Meeting</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Meeting title" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Time</Label>
                <Input type="time" value={time} onChange={e => setTime(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Participants</Label>
              <div className="flex flex-wrap gap-1.5 p-2 border rounded-md min-h-[38px]">
                {profiles.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleParticipant(p.id)}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium transition-all ${
                      participants.includes(p.id) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {p.full_name}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Meeting Link</Label>
              <Input value={meetingLink} onChange={e => setMeetingLink(e.target.value)} placeholder="https://meet.google.com/..." />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional notes" rows={2} />
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? <LoadingSpinner size="sm" className="text-white" /> : 'Create Meeting'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
