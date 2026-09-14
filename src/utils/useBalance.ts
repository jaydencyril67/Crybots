import { useEffect, useState } from 'react';
import { getCachedBalance, subscribeBalance, syncBalanceFromBackend } from './balance';

const useBalance = () => {
  const [balance, setBalance] = useState<number | null>(() => getCachedBalance());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = subscribeBalance((nextBalance) => {
      if (isMounted) {
        setBalance(nextBalance);
      }
    });

    const refresh = async () => {
      setIsRefreshing(true);
      try {
        const liveBalance = await syncBalanceFromBackend();
        if (!isMounted) {
          return;
        }

        if (typeof liveBalance === 'number') {
          setBalance(liveBalance);
          setError(null);
        }
      } catch (refreshError) {
        if (isMounted) {
          setError(refreshError instanceof Error ? refreshError.message : 'Unable to refresh balance.');
        }
      } finally {
        if (isMounted) {
          setIsRefreshing(false);
        }
      }
    };

    void refresh();
    const intervalId = window.setInterval(() => {
      void refresh();
    }, 20000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      unsubscribe();
    };
  }, []);

  return { balance, isRefreshing, error };
};

export default useBalance;
