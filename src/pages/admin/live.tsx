import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useLiveRooms, useRoomParticipants, useRoomReports } from '@/hooks/use-admin';
import { terminateRoom, removeParticipant, type LiveRoom, type RoomParticipant } from '@/lib/admin';

const statusOptions = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export default function AdminLive() {
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const active = filter === 'all' ? undefined : filter === 'active';
  const { rooms, loading, refetch } = useLiveRooms(active);
  const [selected, setSelected] = useState<LiveRoom | null>(null);
  const { participants, loading: loadingParts, refetch: refetchParts } = useRoomParticipants(
    selected?.id ?? undefined
  );
  const { reports } = useRoomReports(selected?.id ?? undefined);
  const [confirmTerminate, setConfirmTerminate] = useState<LiveRoom | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<RoomParticipant | null>(null);

  const handleTerminate = async () => {
    if (!confirmTerminate) return;
    try {
      await terminateRoom(confirmTerminate.id);
      setConfirmTerminate(null);
      setSelected(null);
      refetch();
    } catch (err: any) {
      window.alert(err?.message ?? 'Failed to terminate room');
    }
  };

  const handleRemove = async () => {
    if (!confirmRemove || !selected) return;
    try {
      await removeParticipant(selected.id, confirmRemove.user_id);
      setConfirmRemove(null);
      refetchParts();
      refetch();
    } catch (err: any) {
      window.alert(err?.message ?? 'Failed to remove participant');
    }
  };

  const participantName = (p: RoomParticipant) =>
    p.user?.full_name || p.user?.username || p.user_id.slice(0, 8);

  const hostName = (r: LiveRoom) =>
    r.host?.full_name || r.host?.username || r.host_name || r.host_id.slice(0, 8);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Live Streams</h2>
        <p className="text-slate-500">Monitor active and past live rooms.</p>
      </div>

      <div className="mb-6 w-full md:w-48">
        <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
        <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
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
        <div className="py-12 text-center text-slate-500">Loading live rooms...</div>
      ) : (
        <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead>Title</TableHead>
                <TableHead>Host</TableHead>
                <TableHead>Participants</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No live rooms found
                  </TableCell>
                </TableRow>
              ) : (
                rooms.map((room) => (
                  <TableRow
                    key={room.id}
                    onClick={() => setSelected(room)}
                    className="cursor-pointer hover:bg-slate-50"
                  >
                    <TableCell className="font-medium">{room.title}</TableCell>
                    <TableCell>{hostName(room)}</TableCell>
                    <TableCell>{room.viewer_count ?? 0}</TableCell>
                    <TableCell>
                      {room.started_at ? new Date(room.started_at).toLocaleString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={room.is_active ? 'default' : 'secondary'}>
                        {room.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {selected && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <CardTitle>{selected.title}</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setSelected(null)}>
                  Close
                </Button>
                <Button size="sm" variant="destructive" onClick={() => setConfirmTerminate(selected)}>
                  Terminate Room
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <p>
                <strong>Host:</strong> {hostName(selected)}
              </p>
              <p>
                <strong>Active:</strong>{' '}
                <Badge variant={selected.is_active ? 'default' : 'secondary'}>
                  {selected.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </p>
              <p>
                <strong>Started:</strong>{' '}
                {selected.started_at ? new Date(selected.started_at).toLocaleString() : '-'}
              </p>
              <p>
                <strong>Participants:</strong> {selected.viewer_count ?? 0}
              </p>
            </div>

            <div>
              <h3 className="mb-2 font-semibold text-slate-900">Participants</h3>
              {loadingParts ? (
                <div className="text-sm text-slate-500">Loading participants...</div>
              ) : participants.length === 0 ? (
                <div className="text-sm text-slate-500">No active participants.</div>
              ) : (
                <div className="overflow-hidden rounded-md border border-slate-200">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {participants.map((p) => (
                        <TableRow key={p.id} className="hover:bg-slate-50">
                          <TableCell>{participantName(p)}</TableCell>
                          <TableCell>{p.is_host ? 'Host' : p.role || 'Viewer'}</TableCell>
                          <TableCell>
                            {p.joined_at ? new Date(p.joined_at).toLocaleString() : '-'}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setConfirmRemove(p)}
                            >
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <div>
              <h3 className="mb-2 font-semibold text-slate-900">Reports</h3>
              {reports.length === 0 ? (
                <div className="text-sm text-slate-500">No reports for this room.</div>
              ) : (
                <ul className="space-y-2">
                  {reports.map((r) => (
                    <li key={r.id} className="rounded-md border border-slate-200 p-3 text-sm">
                      <p className="font-medium text-slate-700">
                        {r.reporter?.full_name || r.reporter?.username || r.reporter_id.slice(0, 8)}
                      </p>
                      <p className="text-slate-500">{r.reason}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {new Date(r.created_at).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!confirmTerminate} onOpenChange={(open) => !open && setConfirmTerminate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Terminate Room</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Are you sure you want to terminate &quot;{confirmTerminate?.title}&quot;? This cannot be undone.
          </DialogDescription>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmTerminate(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleTerminate}>
              Terminate
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmRemove} onOpenChange={(open) => !open && setConfirmRemove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Participant</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Remove {confirmRemove ? participantName(confirmRemove) : 'this participant'} from the room?
          </DialogDescription>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmRemove(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemove}>
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
