import React, { useState } from 'react';
import { Code2, Bot, ShoppingCart, Copy, Check, Sliders, DollarSign, RefreshCw } from 'lucide-react';

interface ExternalApiGuideProps {
  bcvRate: number;
  onUpdateBcvRate: (newRate: number) => Promise<void>;
  apiKey: string;
}

export const ExternalApiGuide: React.FC<ExternalApiGuideProps> = ({
  bcvRate,
  onUpdateBcvRate,
  apiKey,
}) => {
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [newRateInput, setNewRateInput] = useState(bcvRate.toString());
  const [rateSaving, setRateSaving] = useState(false);
  const [rateSuccess, setRateSuccess] = useState(false);

  const curlVerify = `curl -X POST "${typeof window !== 'undefined' ? window.location.origin : 'https://tu-app.run.app'}/api/payments/verify" \\
  -H "Content-Type: application/json" \\
  -d '{
    "reference": "94820153",
    "expectedAmountVes": 850.00,
    "orderNumber": "PEDIDO-1002",
    "markAsClaimed": true
  }'`;

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const handleSaveRate = async () => {
    const val = parseFloat(newRateInput);
    if (isNaN(val) || val <= 0) return;
    setRateSaving(true);
    try {
      await onUpdateBcvRate(val);
      setRateSuccess(true);
      setTimeout(() => setRateSuccess(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setRateSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Top Banner */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Integración API & Configuración del Sistema
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Conecta tiendas en línea, bots de WhatsApp o sistemas de facturación para verificar pagos automáticamente.
        </p>
      </div>

      {/* BCV Exchange Rate Config Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-600" />
          <h2 className="text-base font-bold text-slate-900">
            Tasa Oficial de Cambio (BCV - Banco Central de Venezuela)
          </h2>
        </div>
        <p className="text-xs text-slate-600">
          Utilizada para calcular automáticamente la conversión de bolívares a dólares en caja y en el historial.
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative max-w-xs">
            <span className="absolute left-3 top-2 text-xs font-bold text-slate-500">Bs.</span>
            <input
              type="number"
              step="0.01"
              value={newRateInput}
              onChange={(e) => setNewRateInput(e.target.value)}
              className="w-full pl-10 pr-14 py-1.5 text-sm font-mono font-bold rounded-lg border border-slate-300 text-slate-900"
            />
            <span className="absolute right-3 top-2 text-xs text-slate-400">/ USD</span>
          </div>

          <button
            onClick={handleSaveRate}
            disabled={rateSaving}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
          >
            {rateSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
            <span>{rateSuccess ? '¡Tasa Guardada!' : 'Actualizar Tasa BCV'}</span>
          </button>
        </div>
      </div>

      {/* REST API verification endpoint */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-slate-700" />
            <h2 className="text-base font-bold text-slate-900">
              API REST de Validación: <code>POST /api/payments/verify</code>
            </h2>
          </div>
          <button
            onClick={() => copyCode(curlVerify)}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            {copiedCurl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCurl ? 'Copiado' : 'Copiar cURL'}</span>
          </button>
        </div>

        <p className="text-xs text-slate-600">
          Cualquier script o sistema externo puede consultar esta ruta para verificar si un cliente pagó:
        </p>

        <pre className="p-4 bg-slate-900 text-slate-200 font-mono text-xs rounded-lg overflow-x-auto select-all">
          {curlVerify}
        </pre>

        <div className="pt-2">
          <span className="text-xs font-bold text-slate-800 block mb-1">
            Respuesta JSON retornada:
          </span>
          <pre className="p-3 bg-slate-50 border border-slate-200 font-mono text-slate-800 text-[11px] rounded-lg overflow-x-auto">
{`{
  "status": "EXACT_MATCH", // o "NOT_FOUND" / "ALREADY_CLAIMED" / "AMOUNT_MISMATCH"
  "message": "¡Pago Móvil verificado y vinculado exitosamente a la orden PEDIDO-1002!",
  "transaction": {
    "reference": "94820153",
    "amountVes": 850.00,
    "bankName": "Banco de Venezuela",
    "senderPhone": "04143829102",
    "status": "CLAIMED"
  }
}`}
          </pre>
        </div>
      </div>

      {/* Use Cases Cards: WhatsApp & WooCommerce */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Bot de WhatsApp (Chatbot de Ventas)
            </h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Cuando el cliente envíe su referencia o capture por WhatsApp, tu bot extrae los números, hace un <code>POST /api/payments/verify</code> y responde automáticamente: <em>"¡Pago confirmado! Estamos preparando tu pedido."</em>
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Tiendas WooCommerce / Shopify
            </h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Permite a tus clientes pagar por Pago Móvil en el checkout web, escribir su número de referencia, y si coincide con una notificación de tu teléfono, el pedido pasa de "Pendiente" a "Procesando" de inmediato.
          </p>
        </div>
      </div>
    </div>
  );
};
