import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminDataTable } from '@/components/admin/AdminDataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAdminUsers } from '@/hooks/use-admin';
import { toggleAdmin, toggleSuspension, logAdminAction, type AdminUser } from '@/lib/admin';

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'suspended'>('all');
  const [vipTier, setVipTier] = useState<'all' | 'free' | 'premium'>('all');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const [viewUser, setViewUser] = useState<AdminUser | null>(null);

  const { users, count, loading, refetch } = useAdminUsers({
    page,
    perPage,
    search,
    status,
    vipTier,
  });

  const handleToggleAdmin = async (user: AdminUser) => {
    const next = !user.is_admin;
    const label = next ? 'Make Admin' : 'Remove Admin';
    if (!window.confirm(`${label} for ${user.full_name ?? user.username ?? user.id}?`)) return;
    try {
      await toggleAdmin(user.id, next);
      await logAdminAction(label, 'user', user.id, { previous: user.is_admin, next });
      refetch();
    } catch (err: any) {
      window.alert(err?.message ?? 'Action failed');
    }
  };

  const handleToggleSuspension = async (user: AdminUser) => {
    if (user.is_suspended) {
      if (!window.confirm(`Activate account for ${user.full_name ?? user.username ?? user.id}?`)) return;
      try {
        await toggleSuspension(user.id, 'unsuspend');
        await logAdminAction('Activate user', 'user', user.id, {});
        refetch();
      } catch (err: any) {
        window.alert(err?.message ?? 'Action failed');
      }
    } else {
      const reason = window.prompt(`Reason for suspending ${user.full_name ?? user.username ?? user.id}:`);
      if (reason === null) return;
      const daysRaw = window.prompt('Suspension duration in days (0 for indefinite):', '0');
      if (daysRaw === null) return;
      const durationDays = parseInt(daysRaw, 10) || 0;
      try {
        await toggleSuspension(user.id, 'suspend', durationDays, reason);
        await logAdminAction('Suspend user', 'user', user.id, { duration_days: durationDays, reason });
        refetch();
      } catch (err: any) {
        window.alert(err?.message ?? 'Action failed');
      }
    }
  };

  const columns = [
    {
      key: 'id',
      label: 'ID',
      sortable: true,
      render: (row: AdminUser) => (
        <span className="font-mono text-xs text-slate-600">{row.id.slice(0, 8)}...</span>
      ),
    },
    { key: 'full_name', label: 'Full Name', sortable: true, render: (row: AdminUser) => row.full_name || '-' },
    { key: 'email', label: 'Email / Username', sortable: true, render: (row: AdminUser) => row.username || row.email || '-' },
    { key: 'country', label: 'Country', sortable: true, render: (row: AdminUser) => row.country || '-' },
    {
      key: 'vip_tier',
      label: 'VIP',
      sortable: true,
      render: (row: AdminUser) => (
        <Badge variant={row.vip_tier === 'free' ? 'secondary' : 'default'}>{row.vip_tier ?? 'free'}</Badge>
      ),
    },
    {
      key: 'is_verified',
      label: 'Verified',
      sortable: true,
      render: (row: AdminUser) => (
        <Badge variant={row.is_verified ? 'default' : 'outline'}>{row.is_verified ? 'Yes' : 'No'}</Badge>
      ),
    },
    {
      key: 'is_suspended',
      label: 'Suspended',
      sortable: true,
      render: (row: AdminUser) => (
        <Badge variant={row.is_suspended ? 'destructive' : 'secondary'}>
          {row.is_suspended ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    {
      key: 'is_admin',
      label: 'Admin',
      sortable: true,
      render: (row: AdminUser) => (
        <Badge variant={row.is_admin ? 'default' : 'outline'}>{row.is_admin ? 'Yes' : 'No'}</Badge>
      ),
    },
    {
      key: 'created_at',
      label: 'Joined',
      sortable: true,
      render: (row: AdminUser) =>
        row.created_at ? new Date(row.created_at).toLocaleDateString() : '-',
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (row: AdminUser) => (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setViewUser(row)}>
            View
          </Button>
          <Button
            size="sm"
            variant={row.is_admin ? 'outline' : 'default'}
            onClick={() => handleToggleAdmin(row)}
          >
            {row.is_admin ? 'Remove Admin' : 'Make Admin'}
          </Button>
          <Button
            size="sm"
            variant={row.is_suspended ? 'default' : 'destructive'}
            onClick={() => handleToggleSuspension(row)}
          >
            {row.is_suspended ? 'Activate' : 'Suspend'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
        <p className="text-slate-500">Search, filter and manage platform users.</p>
      </div>

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-slate-700">Search</label>
          <Input
            placeholder="Search by name or username"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-full md:w-48">
          <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
          <Select value={status} onValueChange={(v: any) => { setStatus(v); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-48">
          <label className="mb-1 block text-sm font-medium text-slate-700">VIP</label>
          <Select value={vipTier} onValueChange={(v: any) => { setVipTier(v); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="VIP" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading users...</div>
      ) : (
        <AdminDataTable
          data={users}
          columns={columns}
          currentPage={page}
          perPage={perPage}
          total={count}
          onPageChange={setPage}
        />
      )}

      <Dialog open={!!viewUser} onOpenChange={(open) => !open && setViewUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {viewUser && (
            <div className="space-y-2 text-sm">
              <p><strong>ID:</strong> {viewUser.id}</p>
              <p><strong>Full Name:</strong> {viewUser.full_name || '-'}</p>
              <p><strong>Username:</strong> {viewUser.username || '-'}</p>
              <p><strong>Country:</strong> {viewUser.country || '-'}</p>
              <p><strong>VIP Tier:</strong> {viewUser.vip_tier ?? 'free'}</p>
              <p><strong>Verified:</strong> {viewUser.is_verified ? 'Yes' : 'No'}</p>
              <p><strong>Suspended:</strong> {viewUser.is_suspended ? 'Yes' : 'No'}</p>
              <p><strong>Admin:</strong> {viewUser.is_admin ? 'Yes' : 'No'}</p>
              <p><strong>Joined:</strong> {viewUser.created_at ? new Date(viewUser.created_at).toLocaleString() : '-'}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
