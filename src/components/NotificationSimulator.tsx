import React, { useState } from 'react';
import { Send, CheckCircle2, Smartphone, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { VENEZUELAN_BANKS } from '../utils/banks';

interface NotificationSimulatorProps {
  onNotificationSent: () => void;
}

export const NotificationSimulator: React.FC<NotificationSimulatorProps> = ({
  onNotificationSent,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('bdv_push');
  const [customTitle, setCustomTitle] = useState('BDVenlínea');
  const [customText, setCustomText] = useState(
    'BDV: PagoMovil recibido por Bs. 950,00 de 04141234567, Referencia: 84920153 el 03/11/2026'
  );
  const [customApp, setCustomApp] = useState('BDV Digital');
  const [sending, setSending] = useState(false);
  const [responseLog, setResponseLog] = useState<{ success: boolean; message: string; data?: any } | null>(null);

  // Bank alert presets
  const presets = [
    {
      id: 'bdv_push',
      name: 'BDV (Banco de Venezuela)',
      title: 'BDVenlínea',
      app: 'BDV Digital',
      text: `BDV: PagoMovil recibido por Bs. ${(Math.floor(Math.random() * 800) + 200).toFixed(2).replace('.', ',')} de 0414${Math.floor(1000000 + Math.random() * 9000000)}, Referencia: ${Math.floor(10000000 + Math.random() * 90000000)} el 03/11/2026`,
    },
    {
      id: 'banesco_push',
      name: 'Banesco Pago Móvil',
      title: 'PagoMóvil Banesco',
      app: 'BanescoMóvil',
      text: `Banesco Pago Movil: Recibio Bs. ${(Math.floor(Math.random() * 1200) + 300).toFixed(2).replace('.', ',')} de 0412${Math.floor(1000000 + Math.random() * 9000000)} Ref: ${Math.floor(100000 + Math.random() * 900000)} el 03/11/26 14:15.`,
    },
    {
      id: 'mercantil_tpago',
      name: 'Mercantil (Tpago)',
      title: 'Mercantil Móvil',
      app: 'Tpago Mercantil',
      text: `Tpago: Recibiste Bs. ${(Math.floor(Math.random() * 500) + 150).toFixed(2).replace('.', ',')} de 0424${Math.floor(1000000 + Math.random() * 9000000)}. Ref. 00${Math.floor(100000 + Math.random() * 900000)} Fecha 03/11/2026.`,
    },
    {
      id: 'bbva_provincial',
      name: 'BBVA Provincial',
      title: 'BBVA Provinet',
      app: 'Provinet Móvil',
      text: `BBVA Provincial informa: Recibio Pago Movil por Bs. ${(Math.floor(Math.random() * 900) + 400).toFixed(2).replace('.', ',')} desde 0416${Math.floor(1000000 + Math.random() * 9000000)}. Referencia: ${Math.floor(10000000 + Math.random() * 90000000)}.`,
    },
    {
      id: 'bancamiga_suite',
      name: 'Bancamiga Suite',
      title: 'Bancamiga Alerta',
      app: 'Bancamiga Suite',
      text: `Bancamiga: Pago movil recibido por Bs. ${(Math.floor(Math.random() * 1500) + 500).toFixed(2).replace('.', ',')} de C.I. 20${Math.floor(100000 + Math.random() * 900000)} tlf 0412${Math.floor(1000000 + Math.random() * 9000000)} Ref: ${Math.floor(100000 + Math.random() * 900000)}.`,
    },
  ];

  const handleSelectPreset = (pId: string) => {
    setSelectedPreset(pId);
    const p = presets.find((x) => x.id === pId);
    if (p) {
      setCustomTitle(p.title);
      setCustomApp(p.app);
      setCustomText(p.text);
    }
  };

  const handleSendSimulation = async () => {
    setSending(true);
    setResponseLog(null);

    try {
      const response = await fetch('/api/webhook/notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'pago_live_99a8b7c6',
        },
        body: JSON.stringify({
          apiKey: 'pago_live_99a8b7c6',
          title: customTitle,
          text: customText,
          app: customApp,
          timestamp: Date.now(),
          battery: 89,
        }),
      });

      const data = await response.json();
      setResponseLog({
        success: response.ok,
        message: data.message || (response.ok ? 'Notificación enviada y procesada' : 'Error en la solicitud'),
        data,
      });

      if (response.ok) {
        onNotificationSent();
      }
    } catch (err: any) {
      setResponseLog({
        success: false,
        message: `Error de red: ${err.message}`,
      });
    } finally {
      setSending(false);
    }
  };

  const generateNewRandomAlert = () => {
    const current = presets.find((p) => p.id === selectedPreset) || presets[0];
    // regenerates text with fresh random numbers
    if (current.id === 'bdv_push') {
      setCustomText(
        `BDV: PagoMovil recibido por Bs. ${(Math.floor(Math.random() * 800) + 200).toFixed(2).replace('.', ',')} de 0414${Math.floor(1000000 + Math.random() * 9000000)}, Referencia: ${Math.floor(10000000 + Math.random() * 90000000)} el 03/11/2026`
      );
    } else if (current.id === 'banesco_push') {
      setCustomText(
        `Banesco Pago Movil: Recibio Bs. ${(Math.floor(Math.random() * 1200) + 300).toFixed(2).replace('.', ',')} de 0412${Math.floor(1000000 + Math.random() * 9000000)} Ref: ${Math.floor(100000 + Math.random() * 900000)} el 03/11/26 15:40.`
      );
    } else {
      setCustomText(current.text);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Simulador de Notificaciones de Bancos Venezolanos
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Prueba cómo reacciona la aplicación ante alertas de Pago Móvil reales de BDV, Banesco, Mercantil, Provincial y Bancamiga.
          </p>
        </div>

        <button
          onClick={generateNewRandomAlert}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Generar Valores Aleatorios</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Preset selector & Payload Editor */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-2">
              Seleccionar Formato de Banco:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {presets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPreset(p.id)}
                  className={`p-2.5 text-left rounded-lg text-xs font-medium border transition-all ${
                    selectedPreset === p.id
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Título de la Notificación Android
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 text-slate-800"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Nombre de la App / SMS
              </label>
              <input
                type="text"
                value={customApp}
                onChange={(e) => setCustomApp(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 text-slate-800"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Texto de la Notificación Push o SMS (Cuerpo exacto)
              </label>
              <textarea
                rows={3}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                className="w-full p-3 font-mono text-xs rounded-lg border border-slate-300 text-slate-900 bg-slate-50 focus:bg-white"
                placeholder="Pega aquí cualquier SMS o notificación bancaria..."
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleSendSimulation}
              disabled={sending || !customText.trim()}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              {sending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Disparando Webhook a /api/webhook/notification...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Enviar Notificación Simulada</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Visual Android Notification Preview & Response */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 text-white rounded-xl p-5 space-y-3">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Vista previa en pantalla de bloqueo Android
            </span>

            {/* Android Notification Mockup Bubble */}
            <div className="bg-slate-800/90 rounded-xl p-3.5 border border-slate-700 space-y-1.5 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-emerald-500 flex items-center justify-center text-[10px] font-bold">
                    PM
                  </div>
                  <span className="text-xs font-semibold text-slate-200">{customTitle}</span>
                  <span className="text-[10px] text-slate-400">· ahora</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">{customApp}</span>
              </div>
              <p className="text-xs text-slate-300 leading-snug font-sans">
                {customText}
              </p>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Analizado con Regex inteligente + Gemini AI fallback</span>
            </div>
          </div>

          {/* Webhook Response Log */}
          {responseLog && (
            <div
              className={`rounded-xl p-4 border text-xs space-y-2 ${
                responseLog.success
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-rose-50 border-rose-300 text-rose-950'
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                {responseLog.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                )}
                <span>Respuesta del Servidor (HTTP 200/201)</span>
              </div>
              <p className="text-xs font-medium">{responseLog.message}</p>

              {responseLog.data?.transaction && (
                <div className="bg-white/80 p-2.5 rounded border border-emerald-200 font-mono text-[11px] space-y-0.5 text-slate-800">
                  <div>Ref: <strong>{responseLog.data.transaction.reference}</strong></div>
                  <div>Monto: <strong>Bs. {responseLog.data.transaction.amountVes.toFixed(2)}</strong></div>
                  <div>Banco: <strong>{responseLog.data.transaction.bankName}</strong></div>
                  <div>Método: {responseLog.data.transaction.parserMethod}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
