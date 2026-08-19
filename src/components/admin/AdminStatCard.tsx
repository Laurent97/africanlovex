import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';

interface AdminStatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
}

function formatValue(value: number | string) {
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  return value ?? '0';
}

export function AdminStatCard({ title, value, icon: Icon }: AdminStatCardProps) {
  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
        <div className="rounded-md bg-slate-100 p-2 text-slate-700">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900">{formatValue(value)}</div>
      </CardContent>
    </Card>
  );
}
