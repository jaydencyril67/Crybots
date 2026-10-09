import React from 'react';
import { Download } from 'lucide-react';
import { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';

type BeforeInstallPromptEvent = Event & {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt: () => Promise<void>;
};

const isAppInstalled = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
};

const InstallAppButton = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = React.useState(isAppInstalled());
  const [message, setMessage] = React.useState('');

  React.useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setMessage('');
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setMessage('CryBots has been installed.');
    };

    const standaloneQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => {
      const installed = standaloneQuery.matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
      setIsInstalled(installed);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    standaloneQuery.addEventListener('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      standaloneQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      setMessage('Automatic installation is not available in this browser right now. Open the browser menu and choose “Install app” or “Add to Home screen”.');
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;

      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setMessage('CryBots installation started.');
      }

      setDeferredPrompt(null);
    } catch {
      setMessage('Could not open the install prompt. Open the browser menu and choose “Install app” or “Add to Home screen”.');
    }
  };

  if (isInstalled) {
    return <p role="status" style={{ ...styles.message, color: theme.textMuted }}>CryBots is already installed on this device.</p>;
  }

  return (
    <>
      <button type="button" onClick={handleInstallClick} style={{ ...styles.button, border: `1px solid ${theme.primary}`, background: theme.primary, color: theme.textInverse }}>
        <Download size={18} strokeWidth={2.4} />
        Download
      </button>
      {message ? <p role="status" style={{ ...styles.message, color: theme.textMuted }}>{message}</p> : null}
    </>
  );
};

const styles = {
  button: {
    borderRadius: '999px',
    padding: '12px 18px',
    fontWeight: 800,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  message: {
    margin: '4px 0 0',
    fontSize: '0.82rem',
    lineHeight: 1.5,
    textAlign: 'center' as const,
  },
};

export default InstallAppButton;
