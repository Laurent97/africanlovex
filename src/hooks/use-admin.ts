import { useState, useEffect, useMemo } from 'react';
import {
  getAdminStats,
  getUsers,
  type AdminStats,
  type AdminUser,
  type GetUsersParams,
} from '@/lib/admin';

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminStats();
      setStats(data);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  return { stats, loading, error, refetch: fetch };
}

export function useAdminUsers(params: GetUsersParams) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { page, perPage, search, status, vipTier } = params;

  const fetch = useMemo(
    () => async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getUsers({ page, perPage, search, status, vipTier });
        setUsers(result.data);
        setCount(result.count);
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load users');
      } finally {
        setLoading(false);
      }
    },
    [page, perPage, search, status, vipTier]
  );

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { users, count, loading, error, refetch: fetch };
}
