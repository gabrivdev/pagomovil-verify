import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { CashierVerifier } from './components/CashierVerifier';
import { TransactionsFeed } from './components/TransactionsFeed';
import { WebhookModal } from './components/WebhookModal';
import { PagoMovilTransaction, DeviceGatewayStatus } from './types/payment';
import { Bell, X } from 'lucide-react';

// Synthesize pleasant chime using Web Audio API
function playChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch (e) {
    // Audio context not allowed or unsupported
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'verifier' | 'history'>('verifier');
  const [transactions, setTransactions] = useState<PagoMovilTransaction[]>([]);
  const [deviceStatus, setDeviceStatus] = useState<DeviceGatewayStatus | null>(null);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [latestIncomingToast, setLatestIncomingToast] = useState<PagoMovilTransaction | null>(null);
  const prevCountRef = useRef<number>(0);

  // Desktop notifications permission state
  const [desktopNotifAllowed, setDesktopNotifAllowed] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  });

  const requestDesktopNotif = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        const allowed = perm === 'granted';
        setDesktopNotifAllowed(allowed);

        if (allowed) {
          playChime();
          new Notification('¡Notificaciones en Windows Activas!', {
            body: 'Tu navegador te avisará en la esquina de la pantalla cada vez que caiga un pago móvil.',
          });
        }
      } catch (err) {
        console.error('Error requesting notification permission:', err);
      }
    }
  };

  const triggerWindowsNotification = (tx: PagoMovilTransaction) => {
    playChime();

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(`¡Pago Móvil Recibido! - Bs. ${tx.amountVes.toFixed(2)}`, {
          body: `Banco: ${tx.bankName}\nRef: ${tx.reference}${tx.senderPhone ? ` · Tel: ${tx.senderPhone}` : ''}`,
          tag: tx.id,
          requireInteraction: false,
        });

        notif.onclick = () => {
          window.focus();
          notif.close();
        };
      } catch (e) {
        console.error('Failed to trigger native desktop notification:', e);
      }
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await fetch('/api/payments');
      if (res.ok) {
        const data = await res.json();
        const incoming: PagoMovilTransaction[] = data.transactions || [];

        // Check if a new payment arrived from the phone
        if (prevCountRef.current > 0 && incoming.length > prevCountRef.current) {
          const newest = incoming[0];
          setLatestIncomingToast(newest);
          triggerWindowsNotification(newest);
          setTimeout(() => setLatestIncomingToast(null), 6000);
        }
        prevCountRef.current = incoming.length;
        setTransactions(incoming);

        if (data.device) {
          setDeviceStatus(data.device);
        }
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
    }
  };

  useEffect(() => {
    fetchPayments();

    // Auto-poll every 3.5s so notifications appear instantly
    const interval = setInterval(fetchPayments, 3500);
    return () => clearInterval(interval);
  }, []);

  const webhookUrl =
    deviceStatus?.webhookUrl ||
    (typeof window !== 'undefined'
      ? `${window.location.origin}/api/webhook/notification`
      : 'https://tu-app.onrender.com/api/webhook/notification');

  const apiKey = deviceStatus?.apiKey || 'pago_live_99a8b7c6';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        deviceStatus={deviceStatus}
        onOpenWebhookModal={() => setIsWebhookModalOpen(true)}
        desktopNotifAllowed={desktopNotifAllowed}
        onRequestDesktopNotif={requestDesktopNotif}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'verifier' && (
          <CashierVerifier onPaymentVerified={fetchPayments} />
        )}

        {activeTab === 'history' && (
          <TransactionsFeed
            transactions={transactions}
            onRefresh={fetchPayments}
          />
        )}
      </main>

      {/* Floating alert when a notification arrives in browser */}
      {latestIncomingToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white rounded-xl p-4 shadow-xl border border-slate-700 max-w-sm w-full flex items-start justify-between gap-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
              <Bell className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-400 block">
                ¡Notificación de Pago Móvil Recibida!
              </span>
              <p className="font-mono font-bold text-sm text-white">
                Bs. {latestIncomingToast.amountVes.toFixed(2)}{' '}
                <span className="font-normal text-xs text-slate-400">({latestIncomingToast.bankName})</span>
              </p>
              <p className="text-[11px] text-slate-400 font-mono">
                Ref: {latestIncomingToast.reference}
              </p>
            </div>
          </div>
          <button
            onClick={() => setLatestIncomingToast(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modal for Webhook settings */}
      <WebhookModal
        isOpen={isWebhookModalOpen}
        onClose={() => setIsWebhookModalOpen(false)}
        webhookUrl={webhookUrl}
        apiKey={apiKey}
      />

      <footer className="py-4 border-t border-slate-200 mt-auto text-center text-xs text-slate-400">
        Verificador Pago Móvil · Conectado en tiempo real con Android y Alertas de Windows
      </footer>
    </div>
  );
}
