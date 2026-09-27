import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';

export function useAuthHydration() {
  const [hydrated, setHydrated] = useState(() => useAuthStore.persist.hasHydrated());

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
      return undefined;
    }
    return useAuthStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  return hydrated;
}

export function useAuth() {
  const { user, accessToken, refreshToken, setSession, updateUser, logout } = useAuthStore();

  return {
    user,
    accessToken,
    refreshToken,
    isAuthenticated: Boolean(user && accessToken),
    setSession,
    updateUser,
    logout,
  };
}
