import { useState, useEffect, useMemo } from 'react';
import {
  getAdminStats,
  getUsers,
  getReports,
  getReportDetails,
  getVerificationAttempts,
  getLiveRooms,
  getRoomParticipants,
  getRoomReports,
  getMessages,
  getPaymentTransactions,
  getWithdrawalRequests,
  getGifts,
  getGiftTransactions,
  getGiftExchangeRates,
  type AdminStats,
  type AdminUser,
  type GetUsersParams,
  type AdminReport,
  type GetReportsParams,
  type VerificationAttempt,
  type GetVerificationAttemptsParams,
  type LiveRoom,
  type RoomParticipant,
  type RoomReport,
  type AdminMessage,
  type GetMessagesParams,
  type AdminPaymentTransaction,
  type GetPaymentTransactionsParams,
  type AdminWithdrawalRequest,
  type GetWithdrawalRequestsParams,
  type AdminGift,
  type GetGiftsParams,
  type AdminGiftTransaction,
  type GetGiftTransactionsParams,
  type AdminGiftExchangeRate,
  getAdminActivityLog,
  getPlatformSettings,
  getAdminAccounts,
  getAdminStatsOverTime,
  type AdminActivityLogEntry,
  type GetAdminActivityLogParams,
  type PlatformSetting,
  type AdminStatOverTime,
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

export function useLiveRooms(active?: boolean) {
  const [rooms, setRooms] = useState<LiveRoom[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useMemo(
    () => async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getLiveRooms({ active });
        setRooms(result.data);
        setCount(result.count);
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load live rooms');
      } finally {
        setLoading(false);
      }
    },
    [active]
  );

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { rooms, count, loading, error, refetch: fetch };
}

export function useRoomParticipants(roomId?: string) {
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useMemo(
    () => async () => {
      if (!roomId) {
        setParticipants([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await getRoomParticipants(roomId);
        setParticipants(data);
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load participants');
      } finally {
        setLoading(false);
      }
    },
    [roomId]
  );

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { participants, loading, error, refetch: fetch };
}

export function useRoomReports(roomId?: string) {
  const [reports, setReports] = useState<RoomReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useMemo(
    () => async () => {
      if (!roomId) {
        setReports([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await getRoomReports(roomId);
        setReports(data);
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load room reports');
      } finally {
        setLoading(false);
      }
    },
    [roomId]
  );

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { reports, loading, error, refetch: fetch };
}

export function useMessages(params: GetMessagesParams) {
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { messageType, search, page, perPage } = params;

  const fetch = useMemo(
    () => async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getMessages({ messageType, search, page, perPage });
        setMessages(result.data);
        setCount(result.count);
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load messages');
      } finally {
        setLoading(false);
      }
    },
    [messageType, search, page, perPage]
  );

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { messages, count, loading, error, refetch: fetch };
}

export function usePaymentTransactions(params: GetPaymentTransactionsParams) {
  const [transactions, setTransactions] = useState<AdminPaymentTransaction[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { status, page, perPage } = params;

  const fetch = useMemo(
    () => async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getPaymentTransactions({ status, page, perPage });
        setTransactions(result.data);
        setCount(result.count);
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load payment transactions');
      } finally {
        setLoading(false);
      }
    },
    [status, page, perPage]
  );

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { transactions, count, loading, error, refetch: fetch };
}

export function useWithdrawalRequests(params: GetWithdrawalRequestsParams) {
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawalRequest[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { status, page, perPage } = params;

  const fetch = useMemo(
    () => async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getWithdrawalRequests({ status, page, perPage });
        setWithdrawals(result.data);
        setCount(result.count);
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load withdrawal requests');
      } finally {
        setLoading(false);
      }
    },
    [status, page, perPage]
  );

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { withdrawals, count, loading, error, refetch: fetch };
}

export function useGifts(params: GetGiftsParams) {
  const [gifts, setGifts] = useState<AdminGift[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { page, perPage } = params;

  const fetch = useMemo(
    () => async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getGifts({ page, perPage });
        setGifts(result.data);
        setCount(result.count);
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load gifts');
      } finally {
        setLoading(false);
      }
    },
    [page, perPage]
  );

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { gifts, count, loading, error, refetch: fetch };
}

export function useGiftTransactions(params: GetGiftTransactionsParams) {
  const [transactions, setTransactions] = useState<AdminGiftTransaction[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { page, perPage } = params;

  const fetch = useMemo(
    () => async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getGiftTransactions({ page, perPage });
        setTransactions(result.data);
        setCount(result.count);
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load gift transactions');
      } finally {
        setLoading(false);
      }
    },
    [page, perPage]
  );

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { transactions, count, loading, error, refetch: fetch };
}

export function useGiftExchangeRates() {
  const [rates, setRates] = useState<AdminGiftExchangeRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getGiftExchangeRates();
      setRates(data);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load gift exchange rates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  return { rates, loading, error, refetch: fetch };
}

export function useAdminActivityLog(params: GetAdminActivityLogParams) {
  const [entries, setEntries] = useState<AdminActivityLogEntry[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { page, perPage } = params;

  const fetch = useMemo(
    () => async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getAdminActivityLog({ page, perPage });
        setEntries(result.data);
        setCount(result.count);
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load admin activity log');
      } finally {
        setLoading(false);
      }
    },
    [page, perPage]
  );

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { entries, count, loading, error, refetch: fetch };
}

export function usePlatformSettings() {
  const [settings, setSettings] = useState<PlatformSetting[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPlatformSettings();
      setSettings(data);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load platform settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  return { settings, loading, error, refetch: fetch };
}

export function useAdminAccounts() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminAccounts();
      setAdmins(data);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load admin accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  return { admins, loading, error, refetch: fetch };
}

export function useAdminStatsOverTime() {
  const [series, setSeries] = useState<AdminStatOverTime[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminStatsOverTime();
      setSeries(data);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load admin stats over time');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  return { series, loading, error, refetch: fetch };
}
