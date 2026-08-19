import { useState, useEffect, useMemo } from 'react';
import {
  getAdminStats,
  getUsers,
  getReports,
  getReportDetails,
  getVerificationAttempts,
  type AdminStats,
  type AdminUser,
  type GetUsersParams,
  type AdminReport,
  type GetReportsParams,
  type VerificationAttempt,
  type GetVerificationAttemptsParams,
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

export function useReports(params: GetReportsParams) {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { status, page, perPage } = params;

  const fetch = useMemo(
    () => async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getReports({ status, page, perPage });
        setReports(result.data);
        setCount(result.count);
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load reports');
      } finally {
        setLoading(false);
      }
    },
    [status, page, perPage]
  );

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { reports, count, loading, error, refetch: fetch };
}

export function useReport(id: string | undefined) {
  const [report, setReport] = useState<AdminReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useMemo(
    () => async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getReportDetails(id);
        setReport(data);
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load report');
      } finally {
        setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { report, loading, error, refetch: fetch };
}

export function useVerificationAttempts(params: GetVerificationAttemptsParams) {
  const [attempts, setAttempts] = useState<VerificationAttempt[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { status, page, perPage } = params;

  const fetch = useMemo(
    () => async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getVerificationAttempts({ status, page, perPage });
        setAttempts(result.data);
        setCount(result.count);
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load verification attempts');
      } finally {
        setLoading(false);
      }
    },
    [status, page, perPage]
  );

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { attempts, count, loading, error, refetch: fetch };
}
