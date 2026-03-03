import { useEffect } from 'react';
import { checkSubscriptionStatus, initRevenueCat } from '../api/revenueCatApi';
import { useAppStore } from '../store/useAppStore';

export function useSubscription() {
  const uid = useAppStore((s) => s.uid);
  const setIsPaid = useAppStore((s) => s.setIsPaid);

  useEffect(() => {
    if (!uid) return;
    initRevenueCat(uid);
    checkSubscriptionStatus().then((paid) => {
      setIsPaid(paid);
    });
  }, [uid]);
}
