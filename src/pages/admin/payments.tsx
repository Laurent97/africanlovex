import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminDataTable, type Column } from '@/components/admin/AdminDataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePaymentTransactions, useWithdrawalRequests } from '@/hooks/use-admin';
import {
  updateWithdrawalRequest,
  type AdminPaymentTransaction,
  type AdminWithdrawalRequest,
} from '@/lib/admin';

const paymentStatusOptions: { value: 'all' | 'pending' | 'completed' | 'failed' | 'refunded'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
];

const withdrawalStatusOptions: { value: 'all' | 'pending' | 'approved' | 'rejected'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

function displayName(profile?: { username?: string | null; full_name?: string | null } | null) {
  return profile?.full_name || profile?.username || 'Unknown';
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; className: string }> = {
    pending: { variant: 'outline', className: 'border-amber-300 bg-amber-50 text-amber-700' },
    completed: { variant: 'default', className: 'bg-green-600 hover:bg-green-600' },
    approved: { variant: 'default', className: 'bg-green-600 hover:bg-green-600' },
    refunded: { variant: 'secondary', className: '' },
    failed: { variant: 'destructive', className: '' },
    rejected: { variant: 'destructive', className: '' },
  };
  const c = config[status] || config.pending;
  return (
    <Badge variant={c.variant} className={c.className}>
      {status}
    </Badge>
  );
}

function maskAccount(number?: string | null) {
  if (!number) return '';
  if (number.length <= 4) return number;
  return `•••• ${number.slice(-4)}`;
}

export default function AdminPayments() {
  const [activeTab, setActiveTab] = useState('transactions');

  const [paymentStatus, setPaymentStatus] = useState<'all' | 'pending' | 'completed' | 'failed' | 'refunded'>('all');
  const [paymentPage, setPaymentPage] = useState(1);

  const [withdrawalStatus, setWithdrawalStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [withdrawalPage, setWithdrawalPage] = useState(1);

  const perPage = 10;

  const { transactions, count: paymentCount, loading: paymentsLoading, refetch: refetchPayments } =
    usePaymentTransactions({ status: paymentStatus, page: paymentPage, perPage });

  const { withdrawals, count: withdrawalCount, loading: withdrawalsLoading, refetch: refetchWithdrawals } =
    useWithdrawalRequests({ status: withdrawalStatus, page: withdrawalPage, perPage });

  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    request: AdminWithdrawalRequest | null;
    reason: string;
    acting: boolean;
  }>({ open: false, request: null, reason: '', acting: false });

  const paymentColumns: Column<AdminPaymentTransaction>[] = [
    {
      key: 'id',
      label: 'ID',
      sortable: true,
      render: (row) => <span className="font-mono text-xs text-slate-600">{row.id.slice(0, 8)}...</span>,
    },
    { key: 'user', label: 'User', sortable: true, render: (row) => displayName(row.user) },
    { key: 'amount', label: 'Amount', sortable: true, render: (row) => row.amount },
    { key: 'currency', label: 'Currency', sortable: true, render: (row) => row.currency },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
    { key: 'provider', label: 'Provider', sortable: true, render: (row) => row.provider || row.payment_method || '-' },
    {
      key: 'created_at',
      label: 'Created At',
      sortable: true,
      render: (row) => (row.created_at ? new Date(row.created_at).toLocaleString() : '-'),
    },
  ];

  const handleApprove = async (row: AdminWithdrawalRequest) => {
    if (!window.confirm(`Approve withdrawal ${row.id.slice(0, 8)}?`)) return;
    try {
      await updateWithdrawalRequest(row.id, 'approved');
      refetchWithdrawals();
    } catch (err: any) {
      window.alert(err?.message ?? 'Failed to approve withdrawal');
    }
  };

  const openReject = (row: AdminWithdrawalRequest) => {
    setRejectDialog({ open: true, request: row, reason: '', acting: false });
  };

  const handleReject = async () => {
    if (!rejectDialog.request) return;
    const reason = rejectDialog.reason.trim();
    if (!reason) {
      window.alert('Please provide a rejection reason.');
      return;
    }
    setRejectDialog((prev) => ({ ...prev, acting: true }));
    try {
      await updateWithdrawalRequest(rejectDialog.request.id, 'rejected', reason);
      setRejectDialog({ open: false, request: null, reason: '', acting: false });
      refetchWithdrawals();
    } catch (err: any) {
      window.alert(err?.message ?? 'Failed to reject withdrawal');
      setRejectDialog((prev) => ({ ...prev, acting: false }));
    }
  };

  const withdrawalColumns: Column<AdminWithdrawalRequest>[] = [
    {
      key: 'id',
      label: 'ID',
      sortable: true,
      render: (row) => <span className="font-mono text-xs text-slate-600">{row.id.slice(0, 8)}...</span>,
    },
    { key: 'user', label: 'User', sortable: true, render: (row) => displayName(row.user) },
    { key: 'amount', label: 'Amount', sortable: true, render: (row) => row.amount },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'payment_method',
      label: 'Payment Method',
      sortable: true,
      render: (row) => (
        <span>
          {row.bank_code || 'Bank'}
          {row.account_number ? ` ${maskAccount(row.account_number)}` : ''}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Requested At',
      sortable: true,
      render: (row) => (row.created_at ? new Date(row.created_at).toLocaleString() : '-'),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (row) => (
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
        <h2 className="text-2xl font-bold text-slate-900">Payments & Withdrawals</h2>
        <p className="text-slate-500">Review payment transactions and manage withdrawal requests.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Payment Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 w-full md:w-48">
                <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
                <Select
                  value={paymentStatus}
                  onValueChange={(v: any) => {
                    setPaymentStatus(v);
                    setPaymentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentStatusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {paymentsLoading ? (
                <div className="py-12 text-center text-slate-500">Loading transactions...</div>
              ) : (
                <AdminDataTable
                  data={transactions}
                  columns={paymentColumns}
                  currentPage={paymentPage}
                  perPage={perPage}
                  total={paymentCount}
                  onPageChange={setPaymentPage}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals">
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 w-full md:w-48">
                <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
                <Select
                  value={withdrawalStatus}
                  onValueChange={(v: any) => {
                    setWithdrawalStatus(v);
                    setWithdrawalPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {withdrawalStatusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {withdrawalsLoading ? (
                <div className="py-12 text-center text-slate-500">Loading withdrawal requests...</div>
              ) : (
                <AdminDataTable
                  data={withdrawals}
                  columns={withdrawalColumns}
                  currentPage={withdrawalPage}
                  perPage={perPage}
                  total={withdrawalCount}
                  onPageChange={setWithdrawalPage}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog
        open={rejectDialog.open}
        onOpenChange={(open) =>
          !open && setRejectDialog({ open: false, request: null, reason: '', acting: false })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Withdrawal</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this withdrawal request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Rejection reason</label>
            <Input
              value={rejectDialog.reason}
              onChange={(e) =>
                setRejectDialog((prev) => ({ ...prev, reason: e.target.value }))
              }
              placeholder="e.g. Invalid account details"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setRejectDialog({ open: false, request: null, reason: '', acting: false })
              }
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={rejectDialog.acting}>
              {rejectDialog.acting ? 'Rejecting...' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
