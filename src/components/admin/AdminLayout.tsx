import { useState, type ReactNode } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-slate-50">
      <aside className="sticky top-0 hidden h-screen w-64 flex-col overflow-y-auto bg-slate-900 text-white md:flex">
        <AdminSidebar />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader onMenuClick={() => setOpen(true)} />
        <main className="flex-1 bg-white p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 bg-slate-900 p-0 text-white">
          <AdminSidebar onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
