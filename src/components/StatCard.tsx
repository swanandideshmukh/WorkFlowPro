import { LucideIcon } from 'lucide-react';   //// StatCard component for dashboard metrics
import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
}

export function StatCard({ title, value, icon: Icon, iconColor, iconBg }: StatCardProps) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
