import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { useAdminStats, useAdminStatsOverTime, useAdminActivityLog } from '@/hooks/use-admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Users,
  UserCheck,
  Star,
  UserX,
  Flag,
  ShieldCheck,
  Radio,
  Wallet,
} from 'lucide-react';

export default function AdminAnalytics() {
  const { stats, loading: statsLoading } = useAdminStats();
  const { series, loading: seriesLoading } = useAdminStatsOverTime();
  const { entries, loading: entriesLoading } = useAdminActivityLog({ page: 1, perPage: 10 });

  const values = stats ?? {
    total_users: 0,
    verified_users: 0,
    premium_users: 0,
    suspended_users: 0,
    pending_reports: 0,
    pending_verifications: 0,
    active_streams: 0,
    pending_withdrawals: 0,
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Analytics</h2>
        <p className="text-slate-500">Platform activity and admin actions over time.</p>
      </div>

      {statsLoading ? (
        <div className="py-12 text-center text-slate-500">Loading stats...</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AdminStatCard title="Total Users" value={values.total_users} icon={Users} />
          <AdminStatCard title="Verified Users" value={values.verified_users} icon={UserCheck} />
          <AdminStatCard title="Premium Users" value={values.premium_users} icon={Star} />
          <AdminStatCard title="Suspended Users" value={values.suspended_users} icon={UserX} />
          <AdminStatCard title="Pending Reports" value={values.pending_reports} icon={Flag} />
          <AdminStatCard title="Pending Verifications" value={values.pending_verifications} icon={ShieldCheck} />
          <AdminStatCard title="Active Streams" value={values.active_streams} icon={Radio} />
          <AdminStatCard title="Pending Withdrawals" value={values.pending_withdrawals} icon={Wallet} />
        </div>
      )}

      <Card className="mt-8 border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-slate-900">Admin Activity (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {seriesLoading ? (
            <div className="py-12 text-center text-slate-500">Loading chart...</div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorActions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    stroke="#cbd5e1"
                  />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} stroke="#cbd5e1" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
                    labelFormatter={(label) => new Date(label as string).toLocaleDateString()}
                  />
                  <Area
                    type="monotone"
                    dataKey="actions"
                    stroke="#7c3aed"
                    fillOpacity={1}
                    fill="url(#colorActions)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-8 border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-slate-900">Recent Admin Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {entriesLoading ? (
            <div className="py-12 text-center text-slate-500">Loading activity...</div>
          ) : entries.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No recent activity</div>
          ) : (
            <div className="w-full overflow-x-auto rounded-md border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead>Admin</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id} className="hover:bg-slate-50">
                      <TableCell>
                        {entry.admin?.full_name ?? entry.admin?.username ?? entry.admin_id.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{entry.action}</Badge>
                      </TableCell>
                      <TableCell>
                        {entry.target_type}
                        {entry.target_id ? `: ${entry.target_id.slice(0, 8)}...` : ''}
                      </TableCell>
                      <TableCell>
                        {entry.created_at ? new Date(entry.created_at).toLocaleString() : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
