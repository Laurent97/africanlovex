import { AdminLayout } from './AdminLayout';

export default function AdminPlaceholder() {
  return (
    <AdminLayout>
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center text-slate-500">
        <h2 className="mb-2 text-2xl font-bold text-slate-900">Coming soon</h2>
        <p>This admin section is under development.</p>
      </div>
    </AdminLayout>
  );
}
