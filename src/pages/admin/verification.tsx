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
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useVerificationAttempts } from '@/hooks/use-admin';
import { approveVerification, rejectVerification, type VerificationAttempt } from '@/lib/admin';

const statusOptions: { value: 'all' | 'pending' | 'approved' | 'rejected'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

function displayName(profile?: { username?: string | null; full_name?: string | null } | null) {
  return profile?.full_name || profile?.username || 'Unknown';
}

function VerificationStatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; className: string }> = {
    pending: { variant: 'outline', className: 'border-amber-300 bg-amber-50 text-amber-700' },
    approved: { variant: 'default', className: 'bg-green-600 hover:bg-green-600' },
    rejected: { variant: 'destructive', className: '' },
  };
  const c = config[status] || config.pending;
  return (
    <Badge variant={c.variant} className={c.className}>
      {status}
    </Badge>
  );
}

export default function AdminVerification() {
  const [status, setStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [page, setPage] = useState(1);
  const perPage = 10;
  const { attempts, count, loading, refetch } = useVerificationAttempts({
    status,
    page,
    perPage,
  });

  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    attempt: VerificationAttempt | null;
    reason: string;
    acting: boolean;
  }>({ open: false, attempt: null, reason: '', acting: false });

  const handleApprove = async (attempt: VerificationAttempt) => {
    if (!window.confirm(`Approve verification for ${displayName(attempt.profile)}?`)) return;
    try {
      await approveVerification(attempt.id);
      refetch();
    } catch (err: any) {
      window.alert(err?.message ?? 'Failed to approve verification');
    }
  };

  const openReject = (attempt: VerificationAttempt) => {
    setRejectDialog({ open: true, attempt, reason: '', acting: false });
  };

  const handleReject = async () => {
    if (!rejectDialog.attempt) return;
    const reason = rejectDialog.reason.trim();
    if (!reason) {
      window.alert('Please provide a rejection reason.');
      return;
    }
    setRejectDialog((prev) => ({ ...prev, acting: true }));
    try {
      await rejectVerification(rejectDialog.attempt.id, reason);
      setRejectDialog({ open: false, attempt: null, reason: '', acting: false });
      refetch();
    } catch (err: any) {
      window.alert(err?.message ?? 'Failed to reject verification');
      setRejectDialog((prev) => ({ ...prev, acting: false }));
    }
  };

  const columns = [
    {
      key: 'user',
      label: 'User',
      sortable: true,
      render: (row: VerificationAttempt) => displayName(row.profile),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row: VerificationAttempt) => <VerificationStatusBadge status={row.status} />,
    },
    {
      key: 'created_at',
      label: 'Submitted At',
      sortable: true,
      render: (row: VerificationAttempt) =>
        row.created_at ? new Date(row.created_at).toLocaleString() : '-',
    },
    {
      key: 'selfie',
      label: 'Selfie Preview',
      sortable: false,
      render: (row: VerificationAttempt) => {
        const url = row.selfie_urls?.[0];
        return url ? (
          <img
            src={url}
            alt="Selfie"
            className="max-h-32 rounded border object-cover"
          />
        ) : (
          <span className="text-sm text-slate-400">No selfie</span>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (row: VerificationAttempt) => (
        <div className="flex flex-wrap gap-2">
          {row.status !== 'approved' && (
            <Button size="sm" onClick={() => handleApprove(row)}>
              Approve
            </Button>
          )}
          {row.status !== 'rejected' && (
            <Button size="sm" variant="destructive" onClick={() => openReject(row)}>
              Reject
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Verification Queue</h2>
        <p className="text-slate-500">Review and process user verification attempts.</p>
      </div>

      <div className="mb-6 w-full md:w-48">
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

      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading verification attempts...</div>
      ) : (
        <AdminDataTable
          data={attempts}
          columns={columns}
          currentPage={page}
          perPage={perPage}
          total={count}
          onPageChange={setPage}
        />
      )}

      <Dialog
        open={rejectDialog.open}
        onOpenChange={(open) => !open && setRejectDialog({ open: false, attempt: null, reason: '', acting: false })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Verification</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this verification attempt.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Rejection reason</label>
            <Input
              value={rejectDialog.reason}
              onChange={(e) => setRejectDialog((prev) => ({ ...prev, reason: e.target.value }))}
              placeholder="e.g. Face not clearly visible"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialog({ open: false, attempt: null, reason: '', acting: false })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectDialog.acting}
            >
              {rejectDialog.acting ? 'Rejecting...' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
