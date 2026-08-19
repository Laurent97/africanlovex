import { useLocation, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Flag,
  Radio,
  Gift,
  CreditCard,
  FileText,
  BarChart3,
  Settings,
} from 'lucide-react';

const links = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/verification', label: 'Verifications', icon: ShieldCheck },
  { to: '/admin/reports', label: 'Reports', icon: Flag },
  { to: '/admin/live', label: 'Live', icon: Radio },
  { to: '/admin/gifts', label: 'Gifts', icon: Gift },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard },
  { to: '/admin/content', label: 'Content', icon: FileText },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation();

  return (
    <nav className="flex h-full flex-col gap-1 p-3">
      <Link
        to="/admin"
        className="mb-6 flex items-center gap-2 px-3 py-2 text-xl font-bold text-white"
        onClick={onNavigate}
      >
        <span className="text-lovex-gold">♥</span>
        Admin
      </Link>
      {links.map((link) => {
        const Icon = link.icon;
        const active =
          link.to === '/admin'
            ? pathname === '/admin'
            : link.to === pathname || pathname.startsWith(`${link.to}/`);
        return (
          <Link
            key={link.to}
            to={link.to}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
              active
                ? 'bg-white/10 text-white'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            )}
          >
            <Icon className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
