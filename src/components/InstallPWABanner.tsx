import { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const STORAGE_KEY = 'pwa-install-dismissed';

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function InstallPWABanner() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    if (isIOS()) {
      setIosHint(true);
      setVisible(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  }

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === 'accepted') dismiss();
  }

  if (!visible) return null;

  return (
    <div className="install-banner">
      <span className="install-banner__text">
        {iosHint ? (
          <>
            <Share size={14} />
            Toque em <strong>Compartilhar</strong> → <strong>Adicionar à Tela de Início</strong>
          </>
        ) : (
          <>
            <Download size={14} />
            Instale o Espetinho System para acesso rápido
          </>
        )}
      </span>

      <div className="install-banner__actions">
        {!iosHint && (
          <button className="install-banner__btn--primary" onClick={install}>
            Instalar
          </button>
        )}
        <button className="install-banner__btn--dismiss" onClick={dismiss} aria-label="Dispensar">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
