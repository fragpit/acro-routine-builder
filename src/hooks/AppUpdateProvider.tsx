import type { ReactNode } from 'react';
import { AppUpdateContext } from './app-update-context';
import { useAppUpdate } from './useAppUpdate';

export function AppUpdateProvider({ children }: { children: ReactNode }) {
  const appUpdate = useAppUpdate();

  return (
    <AppUpdateContext.Provider value={appUpdate}>
      {children}
    </AppUpdateContext.Provider>
  );
}
