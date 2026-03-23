import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type Priority = Database['public']['Enums']['task_priority'];

const config: Record<Priority, { label: string; className: string }> = {
  high: { label: 'High', className: 'bg-red-100 text-red-700 border-red-200' },
  medium: { label: 'Medium', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  low: { label: 'Low', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  const c = config[priority];
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', c.className)}>
      {c.label}
    </span>
  );
}

export const priorityBorderColor: Record<Priority, string> = {
  high: 'border-l-red-500',
  medium: 'border-l-yellow-500',
  low: 'border-l-emerald-500',
};
