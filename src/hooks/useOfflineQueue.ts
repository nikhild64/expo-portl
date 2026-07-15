import { useEffect, useState } from 'react';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

import {
  drainOfflineQueue,
  getPendingCount,
  subscribePendingCount,
} from '@/lib/offlineQueue';

function isOfflineState(state: NetInfoState) {
  return !(state.isConnected && state.isInternetReachable !== false);
}

export function useOfflineQueue() {
  const [offline, setOffline] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    void getPendingCount().then(setPendingCount);
    return subscribePendingCount(setPendingCount);
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const nextOffline = isOfflineState(state);
      setOffline((wasOffline) => {
        if (wasOffline && !nextOffline) {
          void drainOfflineQueue();
        }
        return nextOffline;
      });
    });

    void NetInfo.fetch().then((state) => {
      const nextOffline = isOfflineState(state);
      setOffline(nextOffline);
      if (!nextOffline) void drainOfflineQueue();
    });

    return unsubscribe;
  }, []);

  return { offline, pendingCount };
}
