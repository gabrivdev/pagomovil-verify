import React, { useState } from 'react';
import { Copy, Check, Smartphone, X } from 'lucide-react';

interface WebhookModalProps {
  isOpen: boolean;
  onClose: () => void;
  webhookUrl: string;
  apiKey: string;
}

export const WebhookModal: React.FC<WebhookModalProps> = ({
  isOpen,
  onClose,
  webhookUrl,
  apiKey,
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  if (!isOpen) return null;

  const copy = (text: string, type: 'url' | 'key') => {
    navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const jsonTemplate = JSON.stringify(
    {
      apiKey: apiKey,
      app: '{not_app_name}',
      title: '{not_title}',
      text: '{not_text}',
    },
    null,
    2
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 border border-slate-200 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">
              Datos para conectar tu Android
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 font-bold"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3.5 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              URL del Webhook (Para colocar en MacroDroid):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={webhookUrl}
                className="flex-1 p-2 font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-800 select-all"
              />
              <button
                onClick={() => copy(webhookUrl, 'url')}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg flex items-center gap-1 shrink-0"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUrl ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
            <div className="mt-2 p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-900 space-y-1">
              <p className="font-semibold">💡 ¿Cómo funciona la URL con Render.com?</p>
              <p>
                Al crear tu servicio en Render, Render te asignará un enlace público propio (ejemplo: <code className="font-bold">https://mi-pago.onrender.com</code>).
              </p>
              <p>
                La ruta de recepción siempre es <code className="font-bold">/api/webhook/notification</code>. Por tanto, en Render tu webhook final será:
                <br />
                <code className="font-mono bg-white px-1 py-0.5 rounded border border-blue-200 font-bold block mt-1">
                  https://mi-pago.onrender.com/api/webhook/notification
                </code>
              </p>
              <p className="text-slate-500 text-[10px]">
                (Cuando abras la app desde Render en tu navegador, este botón detectará automáticamente ese dominio y te mostrará el enlace listo).
              </p>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              API Key:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={apiKey}
                className="flex-1 p-2 font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-800 select-all"
              />
              <button
                onClick={() => copy(apiKey, 'key')}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg flex items-center gap-1 shrink-0"
              >
                {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-1.5 text-slate-600">
            <span className="font-bold text-slate-800 block">En MacroDroid (Android):</span>
            <p>1. <strong>Disparador:</strong> Notificación Recibida (marca tus apps de bancos o SMS).</p>
            <p>2. <strong>Acción:</strong> Solicitud HTTP (POST a la URL de arriba con formato application/json).</p>
            <p>3. <strong>Cuerpo (Body):</strong></p>
            <pre className="p-2.5 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-lg select-all">
              {jsonTemplate}
            </pre>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
