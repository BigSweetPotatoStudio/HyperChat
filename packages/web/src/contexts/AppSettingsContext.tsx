import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { AppSettings, AISettings } from '@dadigua/hyperchat-shared';
import { call } from '../common/call';
import {
  enable as enableDarkMode,
  disable as disableDarkMode,
} from 'darkreader';
import { initWebI18n, syncLanguageFromAppSettings } from '../i18n';

interface AppSettingsContextType {
  // 完整的应用设置
  appSettings: AppSettings | null;
  // 便捷访问各个部分
  aiSettings: AISettings | null;
  appearance: AppSettings['appearance'] | null;
  system: AppSettings['system'] | null;
  desktop: AppSettings['desktop'] | null;
  // 状态
  loading: boolean;
  error: string | null;
  // 操作方法
  refresh: () => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  updateAISettings: (aiUpdates: Partial<AISettings>) => Promise<void>;
  updateAppearance: (appearanceUpdates: Partial<AppSettings['appearance']>) => Promise<void>;
  updateSystem: (systemUpdates: Partial<AppSettings['system']>) => Promise<void>;
  updateDesktop: (desktopUpdates: Partial<AppSettings['desktop']>) => Promise<void>;
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
      
      // 自动应用夜间模式设置
      applyDarkModeSettings(settings);
      
      // 初始化i18n系统
      await initWebI18n();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load app settings';
      setError(errorMessage);
      console.error('Failed to load app settings:', err);
      
      // 即使AppSettings加载失败，也要初始化i18n（会使用备用方案）
      try {
        await initWebI18n();
      } catch (i18nError) {
        console.warn('Failed to initialize i18n:', i18nError);
      }
    } finally {
      setLoading(false);
    }
  };

  // 应用夜间模式设置
  const applyDarkModeSettings = (settings: AppSettings) => {
    try {
      if (settings.appearance?.darkTheme) {
        enableDarkMode({
          brightness: 100,
          contrast: 90,
          sepia: 10,
        });
      } else {
        disableDarkMode();
      }
    } catch (error) {
      console.warn('Failed to apply dark mode settings:', error);
    }
  };

  const updateSettings = async (updates: Partial<AppSettings>) => {
    try {
      const updatedSettings = await call('updateAppSettings', { updates });
      setAppSettings(updatedSettings);
      
      // 如果更新了外观设置，自动应用夜间模式
      if (updates.appearance) {
        applyDarkModeSettings(updatedSettings);
        
        // 如果更新了语言设置，同步到i18n系统
        if (updates.appearance.language) {
          syncLanguageFromAppSettings(updates.appearance.language);
        }
      }
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
    if (!appSettings?.appearance) return;
    const newAppearance = { ...appSettings.appearance, ...appearanceUpdates };
    await updateSettings({ 
      appearance: newAppearance
    });
  };

  const updateSystem = async (systemUpdates: Partial<AppSettings['system']>) => {
    if (!appSettings?.system) return;
    await updateSettings({ 
      system: { 
        ...appSettings.system, 
        ...systemUpdates
      } 
    });
  };

  const updateDesktop = async (desktopUpdates: Partial<AppSettings['desktop']>) => {
    if (!appSettings?.desktop) return;
    await updateSettings({ 
      desktop: { 
        ...appSettings.desktop, 
        ...desktopUpdates
      } 
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
      desktop: appSettings?.desktop || null,
      loading,
      error,
      refresh: loadSettings,
      updateSettings,
      updateAISettings,
      updateAppearance,
      updateSystem,
      updateDesktop,
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

export const useDesktopSettings = () => {
  const { desktop, loading, updateDesktop } = useAppSettings();
  return { desktop, loading, updateDesktop };
};