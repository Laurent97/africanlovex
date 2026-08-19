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
import { useGifts, useGiftTransactions } from '@/hooks/use-admin';
import {
  createGift,
  toggleGiftActive,
  updateGiftPrice,
  type AdminGift,
  type AdminGiftTransaction,
} from '@/lib/admin';

const categoryOptions = ['everyday', 'romantic', 'serious', 'legendary', 'real_world'];

function displayName(profile?: { username?: string | null; full_name?: string | null } | null) {
  return profile?.full_name || profile?.username || 'Unknown';
}

function GiftStatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <Badge variant="default" className="bg-green-600 hover:bg-green-600">
      Active
    </Badge>
  ) : (
    <Badge variant="secondary">Inactive</Badge>
  );
}

export default function AdminGifts() {
  const [activeTab, setActiveTab] = useState('catalog');
  const [giftPage, setGiftPage] = useState(1);
  const [txPage, setTxPage] = useState(1);
  const perPage = 10;

  const { gifts, count: giftCount, loading: giftsLoading, refetch: refetchGifts } = useGifts({
    page: giftPage,
    perPage,
  });

  const { transactions, count: txCount, loading: txLoading, refetch: refetchTransactions } =
    useGiftTransactions({ page: txPage, perPage });

  const [priceDialog, setPriceDialog] = useState<{
    open: boolean;
    gift: AdminGift | null;
    price: string;
    acting: boolean;
  }>({ open: false, gift: null, price: '', acting: false });

  const [addForm, setAddForm] = useState({
    name: '',
    price: '',
    category: 'everyday',
    imageUrl: '',
  });
  const [adding, setAdding] = useState(false);

  const openPriceDialog = (row: AdminGift) => {
    setPriceDialog({ open: true, gift: row, price: String(row.cost_coins), acting: false });
  };

  const handlePriceUpdate = async () => {
    if (!priceDialog.gift) return;
    const price = Number(priceDialog.price);
    if (!Number.isFinite(price) || price < 0) {
      window.alert('Please enter a valid price.');
      return;
    }
    setPriceDialog((prev) => ({ ...prev, acting: true }));
    try {
      await updateGiftPrice(priceDialog.gift.id, price);
      setPriceDialog({ open: false, gift: null, price: '', acting: false });
      refetchGifts();
    } catch (err: any) {
      window.alert(err?.message ?? 'Failed to update gift price');
      setPriceDialog((prev) => ({ ...prev, acting: false }));
    }
  };

  const handleToggle = async (row: AdminGift) => {
    try {
      await toggleGiftActive(row.id, !row.is_active);
      refetchGifts();
    } catch (err: any) {
      window.alert(err?.message ?? 'Failed to toggle gift');
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(addForm.price);
    if (!addForm.name.trim() || !Number.isFinite(price) || price < 0) {
      window.alert('Please provide a valid name and price.');
      return;
    }
    setAdding(true);
    try {
      await createGift({
        name: addForm.name.trim(),
        cost_coins: price,
        tier: addForm.category,
        icon_url: addForm.imageUrl.trim() || '',
      });
      setAddForm({ name: '', price: '', category: 'everyday', imageUrl: '' });
      setGiftPage(1);
      refetchGifts();
    } catch (err: any) {
      window.alert(err?.message ?? 'Failed to add gift');
    } finally {
      setAdding(false);
    }
  };

  const giftColumns: Column<AdminGift>[] = [
    {
      key: 'id',
      label: 'ID',
      sortable: true,
      render: (row) => <span className="font-mono text-xs text-slate-600">{row.id.slice(0, 8)}...</span>,
    },
    { key: 'name', label: 'Name', sortable: true, render: (row) => row.name },
    {
      key: 'cost_coins',
      label: 'Price in Coins',
      sortable: true,
      render: (row) => row.cost_coins,
    },
    {
      key: 'tier',
      label: 'Category',
      sortable: true,
      render: (row) => <span className="capitalize">{row.tier || '-'}</span>,
    },
    {
      key: 'is_active',
      label: 'Is Active',
      sortable: true,
      render: (row) => <GiftStatusBadge isActive={row.is_active} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => openPriceDialog(row)}>
            Edit Price
          </Button>
          <Button
            size="sm"
            variant={row.is_active ? 'secondary' : 'default'}
            onClick={() => handleToggle(row)}
          >
            {row.is_active ? 'Disable' : 'Enable'}
          </Button>
        </div>
      ),
    },
  ];

  const transactionColumns: Column<AdminGiftTransaction>[] = [
    {
      key: 'gift',
      label: 'Gift',
      sortable: true,
      render: (row) => row.gift?.name || '-',
    },
    { key: 'sender', label: 'Sender', sortable: true, render: (row) => displayName(row.sender) },
    { key: 'receiver', label: 'Receiver', sortable: true, render: (row) => displayName(row.receiver) },
    {
      key: 'created_at',
      label: 'Sent At',
      sortable: true,
      render: (row) => (row.created_at ? new Date(row.created_at).toLocaleString() : '-'),
    },
  ];

  return (
    <AdminLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Gift Management</h2>
        <p className="text-slate-500">Manage the gift catalog and review sent gifts.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="catalog">Catalog</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New Gift</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdd} className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <Input
                  value={addForm.name}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Gift name"
                  required
                />
                <Input
                  type="number"
                  value={addForm.price}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, price: e.target.value }))}
                  placeholder="Price in coins"
                  required
                />
                <Select
                  value={addForm.category}
                  onValueChange={(v: any) => setAddForm((prev) => ({ ...prev, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={addForm.imageUrl}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="Image URL or emoji"
                />
                <div className="md:col-span-4">
                  <Button type="submit" disabled={adding}>
                    {adding ? 'Adding...' : 'Add Gift'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gift Catalog</CardTitle>
            </CardHeader>
            <CardContent>
              {giftsLoading ? (
                <div className="py-12 text-center text-slate-500">Loading gifts...</div>
              ) : (
                <AdminDataTable
                  data={gifts}
                  columns={giftColumns}
                  currentPage={giftPage}
                  perPage={perPage}
                  total={giftCount}
                  onPageChange={setGiftPage}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Gift Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {txLoading ? (
                <div className="py-12 text-center text-slate-500">Loading gift transactions...</div>
              ) : (
                <AdminDataTable
                  data={transactions}
                  columns={transactionColumns}
                  currentPage={txPage}
                  perPage={perPage}
                  total={txCount}
                  onPageChange={setTxPage}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog
        open={priceDialog.open}
        onOpenChange={(open) =>
          !open && setPriceDialog({ open: false, gift: null, price: '', acting: false })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Gift Price</DialogTitle>
            <DialogDescription>
              Update the coin price for {priceDialog.gift?.name || 'this gift'}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Price in coins</label>
            <Input
              type="number"
              value={priceDialog.price}
              onChange={(e) =>
                setPriceDialog((prev) => ({ ...prev, price: e.target.value }))
              }
              placeholder="e.g. 100"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setPriceDialog({ open: false, gift: null, price: '', acting: false })
              }
            >
              Cancel
            </Button>
            <Button onClick={handlePriceUpdate} disabled={priceDialog.acting}>
              {priceDialog.acting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
