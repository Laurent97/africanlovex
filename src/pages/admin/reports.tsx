import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminDataTable } from '@/components/admin/AdminDataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useReports } from '@/hooks/use-admin';
import { updateReportStatus, type AdminReport } from '@/lib/admin';

const statusOptions: { value: 'all' | 'pending' | 'resolved' | 'dismissed'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
];

function displayName(profile?: { username?: string | null; full_name?: string | null } | null) {
  return profile?.full_name || profile?.username || 'Unknown';
}

function ReportStatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; className: string }> = {
    pending: { variant: 'outline', className: 'border-amber-300 bg-amber-50 text-amber-700' },
    reviewing: { variant: 'outline', className: 'border-blue-300 bg-blue-50 text-blue-700' },
    resolved: { variant: 'default', className: '' },
    dismissed: { variant: 'secondary', className: '' },
  };
  const c = config[status] || config.pending;
  return (
    <Badge variant={c.variant} className={c.className}>
      {status}
    </Badge>
  );
}

export default function AdminReports() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'pending' | 'resolved' | 'dismissed'>('all');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const { reports, loading, refetch } = useReports({
    status,
    page: 1,
    perPage: 1000,
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return reports;
    return reports.filter((r) => {
      const reported = displayName(r.reported_profile).toLowerCase();
      const reporter = displayName(r.reporter_profile).toLowerCase();
      return reported.includes(term) || reporter.includes(term) || r.category.toLowerCase().includes(term);
    });
  }, [reports, search]);

  const paged = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page]);

  const handleMarkResolved = async (row: AdminReport) => {
    if (!window.confirm(`Mark report ${row.id.slice(0, 8)} as resolved?`)) return;
    try {
      await updateReportStatus(row.id, 'resolved');
      refetch();
    } catch (err: any) {
      window.alert(err?.message ?? 'Failed to update report');
    }
  };

  const handleDismiss = async (row: AdminReport) => {
    if (!window.confirm(`Dismiss report ${row.id.slice(0, 8)}?`)) return;
    try {
      await updateReportStatus(row.id, 'dismissed');
      refetch();
    } catch (err: any) {
      window.alert(err?.message ?? 'Failed to update report');
    }
  };

  const columns = [
    {
      key: 'id',
      label: 'ID',
      sortable: true,
      render: (row: AdminReport) => (
        <span className="font-mono text-xs text-slate-600">{row.id.slice(0, 8)}...</span>
      ),
    },
    {
      key: 'reported_user',
      label: 'Reported User',
      sortable: true,
      render: (row: AdminReport) => displayName(row.reported_profile),
    },
    {
      key: 'reporter',
      label: 'Reporter',
      sortable: true,
      render: (row: AdminReport) => displayName(row.reporter_profile),
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (row: AdminReport) => row.category,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row: AdminReport) => <ReportStatusBadge status={row.status} />,
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (row: AdminReport) =>
        row.created_at ? new Date(row.created_at).toLocaleDateString() : '-',
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (row: AdminReport) => (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate(`/admin/reports/${row.id}`)}>
            View
          </Button>
          {row.status !== 'resolved' && (
            <Button size="sm" onClick={() => handleMarkResolved(row)}>
              Mark Resolved
            </Button>
          )}
          {row.status !== 'dismissed' && (
            <Button size="sm" variant="secondary" onClick={() => handleDismiss(row)}>
              Dismiss
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Reports Queue</h2>
        <p className="text-slate-500">Review and act on user-submitted reports.</p>
      </div>

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-slate-700">Search</label>
          <Input
            placeholder="Search by reported or reporter name"
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
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading reports...</div>
      ) : (
        <AdminDataTable
          data={paged}
          columns={columns}
          currentPage={page}
          perPage={perPage}
          total={filtered.length}
          onPageChange={setPage}
        />
      )}
    </AdminLayout>
  );
}
