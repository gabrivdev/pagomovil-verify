import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { CashierVerifier } from './components/CashierVerifier';
import { TransactionsFeed } from './components/TransactionsFeed';
import { WebhookModal } from './components/WebhookModal';
import { PagoMovilTransaction, DeviceGatewayStatus } from './types/payment';
import { Bell, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'verifier' | 'history'>('verifier');
  const [transactions, setTransactions] = useState<PagoMovilTransaction[]>([]);
  const [deviceStatus, setDeviceStatus] = useState<DeviceGatewayStatus | null>(null);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [latestIncomingToast, setLatestIncomingToast] = useState<PagoMovilTransaction | null>(null);
  const prevCountRef = useRef<number>(0);

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
          setTimeout(() => setLatestIncomingToast(null), 5000);
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

      {/* Floating alert when a notification arrives */}
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
        Verificador Pago Móvil · Conectado en tiempo real con Android
      </footer>
    </div>
  );
}
