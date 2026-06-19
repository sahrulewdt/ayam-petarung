import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

export interface TelegramTheme {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        initData: string;
        initDataUnsafe: {
          user?: TelegramUser;
          start_param?: string;
          auth_date?: number;
          hash?: string;
        };
        version: string;
        platform: string;
        colorScheme: 'light' | 'dark';
        themeParams: TelegramTheme;
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        BackButton: {
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
        };
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          setText: (text: string) => void;
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
          enable: () => void;
          disable: () => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        showAlert: (message: string, callback?: () => void) => void;
        showConfirm: (message: string, callback: (confirmed: boolean) => void) => void;
        sendData: (data: string) => void;
        openLink: (url: string) => void;
        openTelegramLink: (url: string) => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        enableClosingConfirmation: () => void;
        disableClosingConfirmation: () => void;
        onEvent: (eventType: string, eventHandler: () => void) => void;
        offEvent: (eventType: string, eventHandler: () => void) => void;
      };
    };
  }
}

export type TelegramWebApp = NonNullable<Window['Telegram']>['WebApp'];

export function useTelegramWebApp() {
  const isWeb = Platform.OS === 'web';
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<TelegramUser | undefined>(undefined);
  const tgRef = useRef<TelegramWebApp | null>(null);

  const isTelegram = isWeb && typeof window !== 'undefined' && !!window.Telegram?.WebApp;

  useEffect(() => {
    if (!isWeb || typeof window === 'undefined') return;
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    tgRef.current = tg;
    tg.ready();
    tg.expand();

    try {
      tg.setHeaderColor('#0D0A14');
      tg.setBackgroundColor('#0D0A14');
    } catch {
    }

    if (tg.initDataUnsafe?.user) {
      setUser(tg.initDataUnsafe.user);
    }

    setIsReady(true);
  }, [isWeb]);

  function hapticImpact(style: 'light' | 'medium' | 'heavy' = 'medium') {
    if (!isTelegram) return;
    try {
      tgRef.current?.HapticFeedback.impactOccurred(style);
    } catch {
    }
  }

  function hapticNotification(type: 'success' | 'error' | 'warning') {
    if (!isTelegram) return;
    try {
      tgRef.current?.HapticFeedback.notificationOccurred(type);
    } catch {
    }
  }

  function showBackButton(onBack: () => void) {
    if (!isTelegram) return;
    try {
      tgRef.current?.BackButton.show();
      tgRef.current?.BackButton.onClick(onBack);
    } catch {
    }
  }

  function hideBackButton() {
    if (!isTelegram) return;
    try {
      tgRef.current?.BackButton.hide();
    } catch {
    }
  }

  return {
    isTelegram,
    isReady,
    tg: tgRef.current,
    user,
    hapticImpact,
    hapticNotification,
    showBackButton,
    hideBackButton,
  };
}
