import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { Button } from '@/components/ui/button';
import { useAdminStats } from '@/hooks/use-admin';
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

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { stats, loading } = useAdminStats();

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

  return (
    <AdminLayout>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
        <p className="text-slate-500">Overview of platform activity and health.</p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading stats...</div>
      ) : (
        <>
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

          <div className="mt-8 flex flex-wrap gap-3">
            <Button onClick={() => navigate('/admin/reports')}>View Reports</Button>
            <Button onClick={() => navigate('/admin/verification')}>View Verifications</Button>
            <Button onClick={() => navigate('/admin/users')}>View Users</Button>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
