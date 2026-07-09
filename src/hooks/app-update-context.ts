import { createContext } from 'react';
import type { useAppUpdate } from './useAppUpdate';

export type AppUpdateController = ReturnType<typeof useAppUpdate>;

export const AppUpdateContext = createContext<AppUpdateController | null>(null);
