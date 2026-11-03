import React, { useState } from 'react';
import {
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  ShieldAlert,
} from 'lucide-react';
import { VerificationResult, PagoMovilTransaction } from '../types/payment';

interface CashierVerifierProps {
  onPaymentVerified?: () => void;
}

export const CashierVerifier: React.FC<CashierVerifierProps> = ({ onPaymentVerified }) => {
  const [reference, setReference] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  const handleVerify = async () => {
    if (!reference.trim()) return;

    setLoading(true);
    try {
      const expectedVes = amount && !isNaN(parseFloat(amount)) ? parseFloat(amount) : undefined;
      const response = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: reference.trim(),
          expectedAmountVes: expectedVes,
        }),
      });

      const data: VerificationResult = await response.json();
      setResult(data);
      if (onPaymentVerified) onPaymentVerified();
    } catch (err) {
      console.error('Error verifying payment:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleClear = () => {
    setReference('');
    setAmount('');
    setResult(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Verificar Notificación de Pago Móvil
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Ingresa la referencia proporcionada por el cliente para comprobar si ya llegó la notificación al teléfono.
        </p>
      </div>

      {/* Main Verification Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Número de Referencia
          </label>
          <input
            type="text"
            value={reference}
            onChange={(e) => {
              setReference(e.target.value.replace(/[^0-9]/g, ''));
              if (result) setResult(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleVerify();
            }}
            placeholder="Ej: 94820153 (o los últimos 4 a 6 dígitos)"
            className="w-full px-4 py-3 text-base font-mono font-bold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 placeholder:font-normal placeholder:text-sm placeholder:text-slate-400"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Monto en Bolívares (Opcional)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-500">Bs.</span>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (result) setResult(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleVerify();
              }}
              placeholder="0.00"
              className="w-full pl-10 pr-4 py-2.5 text-sm font-mono font-semibold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="pt-2 flex gap-2">
          <button
            onClick={handleVerify}
            disabled={loading || !reference.trim()}
            className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Buscando notificación...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Verificar Pago</span>
              </>
            )}
          </button>

          {(reference || result) && (
            <button
              onClick={handleClear}
              className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-lg transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Result Display */}
      {result && (
        <div className="animate-in fade-in duration-200">
          {/* Status: EXACT MATCH (CONFIRMED) */}
          {result.status === 'EXACT_MATCH' && result.transaction && (
            <div className="bg-emerald-50 border-2 border-emerald-400 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                    ¡Pago Móvil Confirmado!
                  </span>
                  <div className="text-2xl font-bold font-mono text-emerald-950 tabular-nums">
                    Bs. {result.transaction.amountVes.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-emerald-200 p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Referencia:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {result.transaction.reference}
                    </span>
                    <button
                      onClick={() => copyText(result.transaction!.reference)}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Banco Receptor:</span>
                  <span className="font-bold text-slate-800">{result.transaction.bankName}</span>
                </div>

                {result.transaction.senderPhone && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Teléfono Emisor:</span>
                    <span className="font-mono text-slate-800">{result.transaction.senderPhone}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Fecha y Hora:</span>
                  <span className="font-mono text-slate-700">
                    {new Date(result.transaction.receivedAt).toLocaleTimeString()} ({new Date(result.transaction.receivedAt).toLocaleDateString()})
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Status: NOT FOUND */}
          {result.status === 'NOT_FOUND' && (
            <div className="bg-slate-50 border border-slate-300 rounded-xl p-5 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center mx-auto">
                <XCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Pago No Encontrado
              </h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                No ha llegado ninguna notificación con la referencia <strong>"{reference}"</strong> a este teléfono.
              </p>
              <p className="text-[11px] text-slate-400 pt-1">
                Si el cliente acaba de transferir, espera unos segundos a que la red interbancaria entregue el mensaje y vuelve a pulsar "Verificar Pago".
              </p>
            </div>
          )}

          {/* Status: AMOUNT MISMATCH */}
          {result.status === 'AMOUNT_MISMATCH' && result.transaction && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2.5 text-amber-900 font-bold">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>La referencia existe, pero el monto no coincide</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-amber-200 text-xs space-y-1 font-mono">
                <div>Monto notificado por el banco: <strong>Bs. {result.transaction.amountVes.toFixed(2)}</strong></div>
                <div>Monto que colocaste: <strong>Bs. {amount}</strong></div>
              </div>
            </div>
          )}

          {/* Status: ALREADY CLAIMED */}
          {result.status === 'ALREADY_CLAIMED' && result.transaction && (
            <div className="bg-rose-50 border border-rose-300 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2.5 text-rose-900 font-bold">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                <span>Este pago ya fue marcado como verificado anteriormente</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-rose-200 text-xs font-mono text-slate-800">
                Ref: {result.transaction.reference} · Bs. {result.transaction.amountVes.toFixed(2)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
