import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { AppSettings, AISettings } from '@hyperchat/shared/jsonSchemas/appSettingsSchema.mts';
import { call } from '../common/call';

interface AppSettingsContextType {
  // 完整的应用设置
  appSettings: AppSettings | null;
  // 便捷访问各个部分
  aiSettings: AISettings | null;
  appearance: AppSettings['appearance'] | null;
  system: AppSettings['system'] | null;
  // 状态
  loading: boolean;
  error: string | null;
  // 操作方法
  refresh: () => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  updateAISettings: (aiUpdates: Partial<AISettings>) => Promise<void>;
  updateAppearance: (appearanceUpdates: Partial<AppSettings['appearance']>) => Promise<void>;
  updateSystem: (systemUpdates: Partial<AppSettings['system']>) => Promise<void>;
}

const AppSettingsContext = createContext<AppSettingsContextType | null>(null);

export const AppSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const settings = await call('getAppSettings');
      setAppSettings(settings);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load app settings';
      setError(errorMessage);
      console.error('Failed to load app settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<AppSettings>) => {
    try {
      const updatedSettings = await call('updateAppSettings', { updates });
      setAppSettings(updatedSettings);
    } catch (err) {
      console.error('Failed to update app settings:', err);
      throw err;
    }
  };

  const updateAISettings = async (aiUpdates: Partial<AISettings>) => {
    if (!appSettings?.ai) return;
    const updatedAI = { ...appSettings.ai, ...aiUpdates };
    await updateSettings({ ai: updatedAI });
  };

  const updateAppearance = async (appearanceUpdates: Partial<AppSettings['appearance']>) => {
    await updateSettings({ 
      appearance: { ...appSettings?.appearance, ...appearanceUpdates } 
    });
  };

  const updateSystem = async (systemUpdates: Partial<AppSettings['system']>) => {
    await updateSettings({ 
      system: { ...appSettings?.system, ...systemUpdates } 
    });
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <AppSettingsContext.Provider value={{
      appSettings,
      aiSettings: appSettings?.ai || null,
      appearance: appSettings?.appearance || null,
      system: appSettings?.system || null,
      loading,
      error,
      refresh: loadSettings,
      updateSettings,
      updateAISettings,
      updateAppearance,
      updateSystem,
    }}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within AppSettingsProvider');
  }
  return context;
};

// 便捷的单独 hooks
export const useAISettings = () => {
  const { aiSettings, loading, updateAISettings } = useAppSettings();
  return { aiSettings, loading, updateAISettings };
};

export const useAppearanceSettings = () => {
  const { appearance, loading, updateAppearance } = useAppSettings();
  return { appearance, loading, updateAppearance };
};

export const useSystemSettings = () => {
  const { system, loading, updateSystem } = useAppSettings();
  return { system, loading, updateSystem };
};