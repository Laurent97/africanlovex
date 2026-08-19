import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useReport } from '@/hooks/use-admin';
import { supabase } from '@/lib/supabase';
import { takeModerationAction } from '@/lib/moderation';
import { updateReportStatus, logAdminAction } from '@/lib/admin';

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

type ActionType = 'warn' | 'suspend' | 'ban' | 'resolve' | 'dismiss';

interface ConfirmState {
  open: boolean;
  type: ActionType | null;
  title: string;
  message: string;
  notes: string;
}

export default function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { report, loading, error, refetch } = useReport(id);

  const [confirm, setConfirm] = useState<ConfirmState>({
    open: false,
    type: null,
    title: '',
    message: '',
    notes: '',
  });
  const [acting, setActing] = useState(false);

  const openConfirm = (type: ActionType, title: string, message: string) => {
    setConfirm({ open: true, type, title, message, notes: '' });
  };

  const handleConfirm = async () => {
    if (!report || !confirm.type) return;
    setActing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const moderatorId = user?.id;
      if (!moderatorId) throw new Error('Not authenticated');

      if (confirm.type === 'resolve') {
        await updateReportStatus(report.id, 'resolved', confirm.notes || undefined);
        await logAdminAction('Mark report resolved', 'report', report.id, { notes: confirm.notes });
      } else if (confirm.type === 'dismiss') {
        await updateReportStatus(report.id, 'dismissed', confirm.notes || undefined);
        await logAdminAction('Dismiss report', 'report', report.id, { notes: confirm.notes });
      } else {
        await takeModerationAction({
          report_id: report.id,
          action: confirm.type as 'warn' | 'suspend' | 'ban',
          moderator_id: moderatorId,
          notes: confirm.notes || undefined,
          duration_days: confirm.type === 'suspend' ? 1 : undefined,
        });
        await logAdminAction(
          `Moderation: ${confirm.type}`,
          'report',
          report.id,
          { moderation_action: confirm.type, notes: confirm.notes }
        );
      }

      setConfirm((prev) => ({ ...prev, open: false }));
      refetch();
    } catch (err: any) {
      window.alert(err?.message ?? 'Action failed');
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="mb-6 space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !report) {
    return (
      <AdminLayout>
        <div className="py-12 text-center text-slate-600">
          <p className="mb-4">{error || 'Report not found'}</p>
          <Button onClick={() => navigate('/admin/reports')}>Back to Reports</Button>
        </div>
      </AdminLayout>
    );
  }

  const reporter = report.reporter_profile;
  const reported = report.reported_profile;

  return (
    <AdminLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Report Detail</h2>
        <p className="text-slate-500">Review the report and take moderation action.</p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reporter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p><strong>Name:</strong> {displayName(reporter)}</p>
            <p><strong>Username:</strong> {reporter?.username || '-'}</p>
            <p><strong>ID:</strong> {report.reporter_id}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reported User</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p><strong>Name:</strong> {displayName(reported)}</p>
            <p><strong>Username:</strong> {reported?.username || '-'}</p>
            <p><strong>Country:</strong> {reported?.country || '-'}</p>
            <p><strong>ID:</strong> {report.reported_user_id}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Report Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>Category:</strong> {report.category}</p>
          <p><strong>Reason:</strong> {report.reason}</p>
          <p><strong>Status:</strong> <ReportStatusBadge status={report.status} /></p>
          <p><strong>Created:</strong> {new Date(report.created_at).toLocaleString()}</p>
          <div className="pt-2">
            <strong>Description:</strong>
            <p className="mt-1 whitespace-pre-wrap text-slate-700">{report.description || '-'}</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => openConfirm('warn', 'Warn reported user', 'Send a warning to the reported user.')}>
          Warn
        </Button>
        <Button onClick={() => openConfirm('suspend', 'Suspend for 1 day', 'Suspend the reported user for 1 day.')}>
          Suspend (1 day)
        </Button>
        <Button variant="destructive" onClick={() => openConfirm('ban', 'Ban reported user', 'Permanently ban the reported user.')}>
          Ban
        </Button>
        <Button variant="secondary" onClick={() => openConfirm('resolve', 'Mark report resolved', 'Mark this report as resolved.')}>
          Mark Resolved
        </Button>
        <Button variant="outline" onClick={() => openConfirm('dismiss', 'Dismiss report', 'Dismiss this report without action.')}>
          Dismiss
        </Button>
      </div>

      <Dialog open={confirm.open} onOpenChange={(open) => !open && setConfirm((prev) => ({ ...prev, open: false }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirm.title}</DialogTitle>
            <DialogDescription>{confirm.message}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Notes (optional)</label>
            <Textarea
              value={confirm.notes}
              onChange={(e) => setConfirm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Add any notes..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm((prev) => ({ ...prev, open: false }))}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={acting}>
              {acting ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
