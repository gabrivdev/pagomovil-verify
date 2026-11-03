import React from 'react';
import { CheckCircle2, Smartphone, Key } from 'lucide-react';
import { DeviceGatewayStatus } from '../types/payment';

interface HeaderProps {
  activeTab: 'verifier' | 'history';
  setActiveTab: (tab: 'verifier' | 'history') => void;
  deviceStatus: DeviceGatewayStatus | null;
  onOpenWebhookModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  deviceStatus,
  onOpenWebhookModal,
}) => {
  const isOnline = deviceStatus?.connected ?? false;

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between gap-6 h-16">
          {/* Zone 1: Wordmark */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-base font-bold text-slate-900 tracking-tight whitespace-nowrap">
              Verificador Pago Móvil
            </span>
          </div>

          {/* Zone 2: Navigation - Only 2 tabs: Verificador and Historial */}
          <nav className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setActiveTab('verifier')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'verifier'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Verificar Pago
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'history'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Historial de Pagos
            </button>
          </nav>

          {/* Zone 3: Webhook endpoint button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenWebhookModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap"
              title="Ver URL del webhook para el teléfono"
            >
              <Smartphone className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">URL Webhook</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
