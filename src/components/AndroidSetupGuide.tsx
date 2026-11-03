import React, { useState } from 'react';
import {
  Smartphone,
  Copy,
  Check,
  Download,
  Key,
  Globe,
  Radio,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  FileCode,
  Layers,
  ArrowRight,
  Wifi,
} from 'lucide-react';
import { DeviceGatewayStatus } from '../types/payment';

interface AndroidSetupGuideProps {
  deviceStatus: DeviceGatewayStatus | null;
  onTestPing: () => void;
}

export const AndroidSetupGuide: React.FC<AndroidSetupGuideProps> = ({
  deviceStatus,
  onTestPing,
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'macrodroid' | 'tasker' | 'sms'>('macrodroid');

  const webhookUrl =
    deviceStatus?.webhookUrl ||
    (typeof window !== 'undefined' ? `${window.location.origin}/api/webhook/notification` : 'https://tu-app.run.app/api/webhook/notification');

  const apiKey = deviceStatus?.apiKey || 'pago_live_99a8b7c6';

  const macrodroidPayload = JSON.stringify(
    {
      apiKey: apiKey,
      app: '{not_app_name}',
      title: '{not_title}',
      text: '{not_text}',
      package: '{not_package_name}',
      timestamp: '{system_time}',
      battery: '{battery}',
    },
    null,
    2
  );

  const copyToClipboard = (text: string, type: 'url' | 'key' | 'json') => {
    navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    }
  };

  const handleDownloadMacro = () => {
    const macroConfig = {
      name: "PagoMovil_Webhook_Forwarder",
      version: 1,
      author: "PagoMovil Verify",
      targetWebhookUrl: webhookUrl,
      apiKey: apiKey,
      recommendedApps: [
        "com.bancodevenezuela.bdvenlinea",
        "com.banesco.banescomovil",
        "com.mercantilbanco.mobile",
        "com.bbva.provinet",
        "com.bancamiga.suite",
        "com.google.android.apps.messaging"
      ],
      httpMethod: "POST",
      contentType: "application/json",
      jsonBody: macrodroidPayload,
    };

    const blob = new Blob([JSON.stringify(macroConfig, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pagomovil_macrodroid_template.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Introduction banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                Cómo conectar tu teléfono Android a esta App
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Convierte tu teléfono receptor en una pasarela automática sin programar una sola línea de código Android.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700 text-xs">
            <Wifi className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-slate-400 block text-[10px]">Estado del Gateway:</span>
              <span className="font-semibold text-white">
                {deviceStatus?.connected ? 'Conectado y recibiendo' : 'Esperando primer webhook'}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <span className="font-bold text-white block mb-0.5">1. Alojamiento en la nube</span>
            Esta app ya corre en un servidor Cloud Run en internet con HTTPS 24/7.
          </div>
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <span className="font-bold text-white block mb-0.5">2. Tu teléfono Android</span>
            Recibe el SMS o Push bancario (BDV, Banesco, Mercantil, etc.).
          </div>
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <span className="font-bold text-white block mb-0.5">3. Webhook instantáneo</span>
            MacroDroid reenvía la notificación a esta app en menos de 0.8 segundos.
          </div>
        </div>
      </div>

      {/* Connection Credentials Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Key className="w-4 h-4 text-emerald-600" />
          Credenciales de Conexión de tu Webhook
        </h2>
        <p className="text-xs text-slate-500">
          Copia esta URL y API Key en la aplicación de tu teléfono (MacroDroid o Tasker).
        </p>

        <div className="space-y-3">
          {/* Webhook URL */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              URL del Webhook (Endpoint Receptor HTTPS)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={webhookUrl}
                className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-800 select-all"
              />
              <button
                onClick={() => copyToClipboard(webhookUrl, 'url')}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 shrink-0"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUrl ? '¡Copiado!' : 'Copiar URL'}</span>
              </button>
            </div>
          </div>

          {/* API Key */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              API Key de Seguridad (Token Secreto)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={apiKey}
                className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-800 select-all"
              />
              <button
                onClick={() => copyToClipboard(apiKey, 'key')}
                className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg flex items-center gap-1.5 shrink-0"
              >
                {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey ? 'Copiado' : 'Copiar Key'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Method Selector */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setSelectedMethod('macrodroid')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
              selectedMethod === 'macrodroid'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            Método 1: MacroDroid (Recomendado · Más Fácil)
          </button>
          <button
            onClick={() => setSelectedMethod('tasker')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
              selectedMethod === 'tasker'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            Método 2: Tasker (Avanzado)
          </button>
          <button
            onClick={() => setSelectedMethod('sms')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
              selectedMethod === 'sms'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            Método 3: SMS Forwarder
          </button>
        </div>

        {/* Step-by-Step for MacroDroid */}
        {selectedMethod === 'macrodroid' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Configuración en 3 minutos con MacroDroid
                </h3>
                <p className="text-xs text-slate-500">
                  MacroDroid es una aplicación gratuita en Google Play que permite automatizar tareas sin escribir código.
                </p>
              </div>

              <button
                onClick={handleDownloadMacro}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar Plantilla JSON</span>
              </button>
            </div>

            {/* Steps list */}
            <div className="space-y-4 text-xs text-slate-700">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Instala MacroDroid en tu teléfono Android
                  </h4>
                  <p className="text-slate-600 mt-0.5">
                    Descarga <span className="font-semibold text-slate-800">MacroDroid</span> gratis desde Google Play Store. Al abrirla, concédele permiso de "Acceso a Notificaciones" (Notification Listener) en los ajustes de Android.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  2
                </div>
                <div className="space-y-1.5 flex-1">
                  <h4 className="font-bold text-slate-900 text-sm">
                    Crea una Macro nueva y agrega el Disparador (Trigger)
                  </h4>
                  <p className="text-slate-600">
                    Pulsa <span className="font-semibold text-slate-800">"Añadir Macro"</span> y en la sección roja de Disparadores:
                  </p>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-slate-800 space-y-1">
                    <div>• <strong>Disparador:</strong> Eventos del Dispositivo → <strong>Notificación</strong> → <strong>Notificación Recibida</strong></div>
                    <div>• <strong>Seleccionar Aplicaciones:</strong> Marca tus bancos venezolanos (BDVenlínea, Pago Móvil Banesco, Mercantil Móvil, Provinet, Bancamiga) o la app de <strong>Mensajes SMS</strong> si recibes alertas de los códigos 2661 / 24024.</div>
                    <div>• En "Contenido de texto" deja seleccionado <strong>Cualquiera</strong>.</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  3
                </div>
                <div className="space-y-2 flex-1">
                  <h4 className="font-bold text-slate-900 text-sm">
                    Agrega la Acción (Action) para enviar el Webhook HTTP
                  </h4>
                  <p className="text-slate-600">
                    En la sección azul de Acciones, pulsa <span className="font-semibold text-slate-800">+</span> y selecciona:
                  </p>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-slate-800 space-y-1.5">
                    <div>• <strong>Acción:</strong> Conectividad → <strong>Solicitud HTTP (HTTP Request)</strong></div>
                    <div>• <strong>Método:</strong> POST</div>
                    <div>• <strong>URL:</strong> <span className="text-emerald-700 font-bold select-all">{webhookUrl}</span></div>
                    <div>• <strong>Tipo de Contenido:</strong> application/json</div>
                    <div>• <strong>Encabezados (Headers):</strong> <code className="bg-slate-200 px-1 py-0.5 rounded">x-api-key: {apiKey}</code></div>
                  </div>

                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-800">
                        Copia y pega este contenido en el campo "Cuerpo de la Solicitud (Body)":
                      </span>
                      <button
                        onClick={() => copyToClipboard(macrodroidPayload, 'json')}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                      >
                        {copiedJson ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedJson ? '¡Copiado!' : 'Copiar JSON'}
                      </button>
                    </div>
                    <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-lg overflow-x-auto select-all">
                      {macrodroidPayload}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  4
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Guarda la Macro y enciende el interruptor
                  </h4>
                  <p className="text-slate-600 mt-0.5">
                    Ponle de nombre "Reenvío Pago Móvil" y guarda. A partir de este momento, cada vez que tu teléfono reciba una notificación o SMS bancario, llegará de inmediato a esta aplicación web.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tasker alternative */}
        {selectedMethod === 'tasker' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900">Configuración con Tasker</h3>
            <p className="text-slate-600">
              Si usas Tasker con el plugin <strong>AutoNotification</strong>:
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-slate-700 font-mono">
              <li>Crea un Perfil: <strong>Event → Plugin → AutoNotification → Intercept</strong>.</li>
              <li>En "Apps" selecciona tus bancos (BDV, Banesco, etc.).</li>
              <li>En la Tarea asociada: agrega la acción <strong>Net → HTTP Request</strong>.</li>
              <li>Method: <code>POST</code>. URL: <code>{webhookUrl}</code>.</li>
              <li>Headers: <code>x-api-key: {apiKey}</code> y <code>Content-Type: application/json</code>.</li>
              <li>Body: <code>{`{"apiKey":"${apiKey}","title":"%antitle","text":"%antext","app":"%anapp"}`}</code></li>
            </ol>
          </div>
        )}

        {/* SMS Forwarder alternative */}
        {selectedMethod === 'sms' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900">Para teléfonos que solo reciben SMS</h3>
            <p className="text-slate-600">
              Si tu teléfono bancario es un Android donde no tienes instaladas las apps bancarias sino que te llegan SMS de los bancos (como <strong>2661 / 2662</strong> de BDV o <strong>24024</strong> de Mercantil):
            </p>
            <p className="text-slate-600">
              Puedes usar la app gratuita <strong>SMS Forwarder</strong> (de Google Play o F-Droid) o MacroDroid seleccionando como disparador <strong>"SMS Recibido"</strong> de números que coincidan con 2661, 2662, Banesco, etc., apuntando al mismo Webhook.
            </p>
          </div>
        )}
      </div>

      {/* Explanation of Where/How to Host in Internet */}
      <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-6 space-y-3">
        <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-700" />
          ¿Dónde y cómo alojar esta aplicación en internet? (Recomendaciones de Servidores)
        </h3>
        <div className="text-xs text-emerald-900 space-y-2 leading-relaxed">
          <p>
            • <strong>Esta aplicación YA ESTÁ ALOJADA y lista para usar</strong> en Google Cloud Run bajo tu URL segura HTTPS asignada. Puedes usarla directamente sin pagar hosting adicional.
          </p>
          <p>
            • <strong>Si deseas tener tu propio dominio personalizado</strong> (ejemplo: <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono">pagos.mitienda.com</code>):
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Render.com (Gratis / 7$ al mes):</strong> Conectas tu repositorio GitHub con 1 clic. Render detecta Node.js + Express automáticamente y te da un subdominio HTTPS gratuito con certificado SSL incluido.
            </li>
            <li>
              <strong>Railway.app:</strong> Despliegue en 60 segundos con alta disponibilidad para que el webhook nunca se apague.
            </li>
            <li>
              <strong>VPS propio (DigitalOcean / Hetzner):</strong> Ejecutas <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono">npm run build && npm start</code> con PM2 o Docker.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
