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
import { useMessages } from '@/hooks/use-admin';
import { deleteMessage, type AdminMessage } from '@/lib/admin';

const messageTypes = [
  { value: 'all', label: 'All' },
  { value: 'text', label: 'Text' },
  { value: 'image', label: 'Image' },
  { value: 'voice', label: 'Voice' },
  { value: 'gift', label: 'Gift' },
  { value: 'system', label: 'System' },
  { value: 'join', label: 'Join' },
  { value: 'leave', label: 'Leave' },
  { value: 'dating_interest', label: 'Dating Interest' },
];

function MessageContent({ msg }: { msg: AdminMessage }) {
  if (msg.message_type === 'image') {
    return (
      <a href={msg.content} target="_blank" rel="noopener noreferrer" className="inline-block">
        <img
          src={msg.content}
          alt="message media"
          className="h-12 w-12 rounded object-cover"
        />
      </a>
    );
  }
  return (
    <div className="max-w-xs truncate" title={msg.content}>
      {msg.content}
    </div>
  );
}

export default function AdminContent() {
  const [messageType, setMessageType] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 20;
  const [confirmDelete, setConfirmDelete] = useState<AdminMessage | null>(null);

  const { messages, count, loading, refetch } = useMessages({
    messageType: messageType === 'all' ? '' : messageType,
    search,
    page,
    perPage,
  });

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteMessage(confirmDelete.id);
      setConfirmDelete(null);
      refetch();
    } catch (err: any) {
      window.alert(err?.message ?? 'Failed to delete message');
    }
  };

  const columns = [
    {
      key: 'id',
      label: 'ID',
      sortable: true,
      render: (row: AdminMessage) => (
        <span className="font-mono text-xs text-slate-600">{row.id.slice(0, 8)}...</span>
      ),
    },
    {
      key: 'room',
      label: 'Room / Chat',
      sortable: true,
      render: (row: AdminMessage) =>
        row.room?.title ? `Room: ${row.room.title}` : row.conversation_id ? 'Direct Chat' : '-',
    },
    {
      key: 'sender',
      label: 'Sender',
      sortable: true,
      render: (row: AdminMessage) =>
        row.sender?.full_name || row.sender?.username || row.sender_id?.slice(0, 8) || '-',
    },
    {
      key: 'message_type',
      label: 'Type',
      sortable: true,
      render: (row: AdminMessage) => <Badge variant="outline">{row.message_type}</Badge>,
    },
    {
      key: 'content',
      label: 'Content',
      sortable: false,
      render: (row: AdminMessage) => <MessageContent msg={row} />,
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (row: AdminMessage) =>
        row.created_at ? new Date(row.created_at).toLocaleString() : '-',
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (row: AdminMessage) => (
        <Button size="sm" variant="destructive" onClick={() => setConfirmDelete(row)}>
          Delete
        </Button>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Content Moderation</h2>
        <p className="text-slate-500">Review and moderate messages across rooms and chats.</p>
      </div>

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-slate-700">Search content</label>
          <Input
            placeholder="Search message content..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-full md:w-48">
          <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
          <Select value={messageType} onValueChange={(v: any) => { setMessageType(v); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {messageTypes.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading messages...</div>
      ) : (
        <AdminDataTable
          data={messages}
          columns={columns}
          currentPage={page}
          perPage={perPage}
          total={count}
          onPageChange={setPage}
        />
      )}

      <Dialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Message</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Are you sure you want to delete this {confirmDelete?.message_type} message? This action cannot be undone.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
