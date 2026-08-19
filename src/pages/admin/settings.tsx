import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminDataTable } from '@/components/admin/AdminDataTable';
import {
  usePlatformSettings,
  useAdminAccounts,
  useAdminActivityLog,
} from '@/hooks/use-admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import {
  upsertPlatformSetting,
  toggleAdmin,
  logAdminAction,
  type AdminUser,
  type PlatformSetting,
} from '@/lib/admin';

export default function AdminSettings() {
  const {
    settings,
    loading: settingsLoading,
    refetch: refetchSettings,
  } = usePlatformSettings();
  const { admins, loading: adminsLoading, refetch: refetchAdmins } = useAdminAccounts();

  const [page, setPage] = useState(1);
  const perPage = 20;
  const {
    entries,
    count,
    loading: logLoading,
    refetch: refetchLog,
  } = useAdminActivityLog({ page, perPage });

  const [editing, setEditing] = useState<PlatformSetting | null>(null);
  const [jsonText, setJsonText] = useState('');

  const [grantOpen, setGrantOpen] = useState(false);
  const [grantUserId, setGrantUserId] = useState('');

  const handleEditOpen = (setting: PlatformSetting) => {
    setEditing(setting);
    setJsonText(JSON.stringify(setting.value, null, 2));
  };

  const handleSaveSetting = async () => {
    if (!editing) return;
    try {
      const parsed = JSON.parse(jsonText);
      await upsertPlatformSetting(editing.key, parsed);
      setEditing(null);
      refetchSettings();
      refetchLog();
    } catch (err: any) {
      window.alert(err?.message ?? 'Failed to save setting. Make sure the value is valid JSON.');
    }
  };

  const handleRevoke = async (admin: AdminUser) => {
    if (!window.confirm(`Revoke admin role for ${admin.full_name ?? admin.username ?? admin.id}?`)) return;
    try {
      await toggleAdmin(admin.id, false);
      await logAdminAction('Revoke admin', 'user', admin.id, { previous: true, next: false });
      refetchAdmins();
      refetchLog();
    } catch (err: any) {
      window.alert(err?.message ?? 'Action failed');
    }
  };

  const handleGrant = async () => {
    const id = grantUserId.trim();
    if (!id) return;
    try {
      await toggleAdmin(id, true);
      await logAdminAction('Grant admin', 'user', id, { previous: false, next: true });
      setGrantOpen(false);
      setGrantUserId('');
      refetchAdmins();
      refetchLog();
    } catch (err: any) {
      window.alert(err?.message ?? 'Action failed');
    }
  };

  const platformColumns = [
    { key: 'key', label: 'Key', sortable: true },
    {
      key: 'value',
      label: 'Value',
      sortable: false,
      render: (row: PlatformSetting) => (
        <code className="text-xs text-slate-600">{JSON.stringify(row.value).slice(0, 80)}...</code>
      ),
    },
    {
      key: 'updated_at',
      label: 'Updated',
      sortable: true,
      render: (row: PlatformSetting) =>
        row.updated_at ? new Date(row.updated_at).toLocaleString() : '-',
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (row: PlatformSetting) => (
        <Button size="sm" variant="outline" onClick={() => handleEditOpen(row)}>
          Edit
        </Button>
      ),
    },
  ];

  const adminColumns = [
    {
      key: 'id',
      label: 'ID',
      sortable: true,
      render: (row: AdminUser) => (
        <span className="font-mono text-xs text-slate-600">{row.id.slice(0, 8)}...</span>
      ),
    },
    { key: 'full_name', label: 'Full Name', sortable: true, render: (row: AdminUser) => row.full_name || '-' },
    { key: 'username', label: 'Username', sortable: true, render: (row: AdminUser) => row.username || '-' },
    { key: 'email', label: 'Email', sortable: true, render: (row: AdminUser) => row.email || '-' },
    {
      key: 'is_admin',
      label: 'Admin',
      sortable: true,
      render: (row: AdminUser) => (
        <Badge variant={row.is_admin ? 'default' : 'outline'}>{row.is_admin ? 'Yes' : 'No'}</Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (row: AdminUser) => (
        <Button size="sm" variant="destructive" onClick={() => handleRevoke(row)}>
          Revoke
        </Button>
      ),
    },
  ];

  const logColumns = [
    {
      key: 'admin',
      label: 'Admin',
      sortable: false,
      render: (row: any) =>
        row.admin?.full_name ?? row.admin?.username ?? row.admin_id?.slice(0, 8) ?? '-',
    },
    {
      key: 'action',
      label: 'Action',
      sortable: true,
      render: (row: any) => <Badge variant="secondary">{row.action}</Badge>,
    },
    {
      key: 'target',
      label: 'Target',
      sortable: false,
      render: (row: any) => (
        <span>
          {row.target_type}
          {row.target_id ? `: ${row.target_id.slice(0, 8)}...` : ''}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Time',
      sortable: true,
      render: (row: any) =>
        row.created_at ? new Date(row.created_at).toLocaleString() : '-',
    },
  ];

  return (
    <AdminLayout>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Admin Settings</h2>
        <p className="text-slate-500">Manage platform settings, admin accounts and audit logs.</p>
      </div>

      <Tabs defaultValue="platform" className="w-full">
        <TabsList>
          <TabsTrigger value="platform">Platform</TabsTrigger>
          <TabsTrigger value="admins">Admins</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="platform" className="mt-6">
          {settingsLoading ? (
            <div className="py-12 text-center text-slate-500">Loading settings...</div>
          ) : (
            <AdminDataTable
              data={settings}
              columns={platformColumns}
              currentPage={1}
              perPage={100}
              total={settings.length}
            />
          )}
        </TabsContent>

        <TabsContent value="admins" className="mt-6">
          <div className="mb-4 flex justify-end">
            <Button onClick={() => setGrantOpen(true)}>Grant Admin</Button>
          </div>
          {adminsLoading ? (
            <div className="py-12 text-center text-slate-500">Loading admins...</div>
          ) : (
            <AdminDataTable
              data={admins}
              columns={adminColumns}
              currentPage={1}
              perPage={100}
              total={admins.length}
            />
          )}
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          {logLoading ? (
            <div className="py-12 text-center text-slate-500">Loading activity log...</div>
          ) : (
            <AdminDataTable
              data={entries}
              columns={logColumns}
              currentPage={page}
              perPage={perPage}
              total={count}
              onPageChange={setPage}
            />
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editing?.key}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <label className="block text-sm font-medium text-slate-700">JSON Value</label>
            <Textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows={10}
              className="font-mono text-sm"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSetting}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={grantOpen} onOpenChange={setGrantOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant Admin Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <label className="block text-sm font-medium text-slate-700">User ID</label>
            <Input
              value={grantUserId}
              onChange={(e) => setGrantUserId(e.target.value)}
              placeholder="Enter user UUID"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGrantOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGrant}>Grant</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
