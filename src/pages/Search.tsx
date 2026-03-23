import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PriorityBadge } from '@/components/PriorityBadge';
import { EmptyState } from '@/components/EmptyState';
import { Search as SearchIcon, ListTodo, FolderOpen, Users } from 'lucide-react';

interface SearchResult {
  tasks: { id: string; title: string; status: string; priority: any }[];
  projects: { id: string; name: string; description: string | null }[];
  users: { id: string; full_name: string; email: string }[];
}

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult>({ tasks: [], projects: [], users: [] });
  const [searched, setSearched] = useState(false);

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (q.length < 2) { setSearched(false); return; }
    setSearched(true);

    const [tasks, projects, users] = await Promise.all([
      supabase.from('tasks').select('id, title, status, priority').ilike('title', `%${q}%`).limit(10),
      supabase.from('projects').select('id, name, description').ilike('name', `%${q}%`).limit(10),
      supabase.from('profiles').select('id, full_name, email').ilike('full_name', `%${q}%`).limit(10),
    ]);

    setResults({
      tasks: tasks.data || [],
      projects: projects.data || [],
      users: users.data || [],
    });
  };

  const totalResults = results.tasks.length + results.projects.length + results.users.length;
  const statusLabel: Record<string, string> = { todo: 'To Do', inprogress: 'In Progress', completed: 'Completed' };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold" style={{ fontFamily: 'Inter' }}>Search</h1>

      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Search tasks, projects, people..."
          className="pl-9"
          autoFocus
        />
      </div>

      {searched && totalResults === 0 && (
        <EmptyState icon={SearchIcon} title="No results found" description={`Nothing matched "${query}". Try a different search term.`} />
      )}

      {results.tasks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ListTodo className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Tasks ({results.tasks.length})</h3>
          </div>
          <div className="space-y-1.5">
            {results.tasks.map(t => (
              <Card key={t.id} className="p-3 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t.title}</span>
                  <div className="flex gap-2">
                    <PriorityBadge priority={t.priority} />
                    <Badge variant="secondary" className="text-[10px]">{statusLabel[t.status]}</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {results.projects.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Projects ({results.projects.length})</h3>
          </div>
          <div className="space-y-1.5">
            {results.projects.map(p => (
              <Card key={p.id} className="p-3 hover:shadow-md transition-shadow">
                <p className="text-sm font-medium">{p.name}</p>
                {p.description && <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>}
              </Card>
            ))}
          </div>
        </div>
      )}

      {results.users.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">People ({results.users.length})</h3>
          </div>
          <div className="space-y-1.5">
            {results.users.map(u => (
              <Card key={u.id} className="p-3 hover:shadow-md transition-shadow">
                <p className="text-sm font-medium">{u.full_name}</p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
