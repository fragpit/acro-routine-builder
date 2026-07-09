import { useContext } from 'react';
import { AppUpdateContext, type AppUpdateController } from './app-update-context';

export function useAppUpdateController(): AppUpdateController {
  const appUpdate = useContext(AppUpdateContext);
  if (!appUpdate) {
    throw new Error('useAppUpdateController must be used inside AppUpdateProvider');
  }
  return appUpdate;
}
