import React, { useState } from 'react';
import {
  Server,
  ExternalLink,
  Copy,
  Check,
  GitBranch,
  Settings,
  ShieldCheck,
  Globe,
  Terminal,
  CheckCircle2,
  FileCode,
} from 'lucide-react';

export const RenderDeployGuide: React.FC = () => {
  const [copiedBuild, setCopiedBuild] = useState(false);
  const [copiedStart, setCopiedStart] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedYaml, setCopiedYaml] = useState(false);

  const buildCmd = 'npm install && npm run build';
  const startCmd = 'npm start';

  const renderYamlContent = `services:
  - type: web
    name: pagomovil-verify
    env: node
    plan: free
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PAYMENT_GATEWAY_API_KEY
        generateValue: true`;

  const copyText = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                Guía Paso a Paso para Alojar en Render.com
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Despliega esta aplicación en un servidor web en la nube con HTTPS gratuito y sin costos de servidor.
              </p>
            </div>
          </div>

          <a
            href="https://dashboard.render.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-slate-900 font-semibold text-xs rounded-xl hover:bg-slate-100 transition-colors shrink-0 shadow-sm"
          >
            <span>Ir a Render.com</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <span className="font-bold text-white block mb-0.5">Plan Gratuito Permanente</span>
            Render ofrece un plan Free para Web Services con SSL HTTPS incluido.
          </div>
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <span className="font-bold text-white block mb-0.5">Despliegue Automático</span>
            Cada vez que actualices tu código en GitHub, Render actualiza tu servidor en vivo.
          </div>
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <span className="font-bold text-white block mb-0.5">URL Pública Lista</span>
            Te asignará una dirección fija como <code>https://tu-app.onrender.com</code> para MacroDroid.
          </div>
        </div>
      </div>

      {/* Step by Step Container */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-8 shadow-xs">
        {/* Step 1 */}
        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center shrink-0 text-sm">
            1
          </div>
          <div className="space-y-2 flex-1">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-emerald-600" />
              Sube este código a tu cuenta de GitHub
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Crea un repositorio en tu cuenta de <a href="https://github.com/new" target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-600 underline">GitHub</a> (puede ser privado o público) y sube los archivos de este proyecto.
            </p>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 space-y-1">
              <div>git init</div>
              <div>git add .</div>
              <div>git commit -m "PagoMovil Verifier inicial"</div>
              <div>git branch -M main</div>
              <div>git remote add origin https://github.com/tu-usuario/pagomovil-verify.git</div>
              <div>git push -u origin main</div>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center shrink-0 text-sm">
            2
          </div>
          <div className="space-y-2 flex-1">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-600" />
              Crea un nuevo Web Service en Render
            </h2>
            <ol className="list-decimal pl-5 text-xs text-slate-600 space-y-1">
              <li>Ingresa a tu cuenta de <a href="https://dashboard.render.com" target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-semibold underline">dashboard.render.com</a>.</li>
              <li>Haz clic en el botón azul <strong>"New +"</strong> en la esquina superior derecha y selecciona <strong>"Web Service"</strong>.</li>
              <li>Selecciona <strong>"Build and deploy from a Git repository"</strong> y vincula tu repositorio de GitHub recién creado.</li>
            </ol>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center shrink-0 text-sm">
            3
          </div>
          <div className="space-y-3 flex-1">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Settings className="w-4 h-4 text-emerald-600" />
              Configuración exacta del servicio en Render
            </h2>
            <p className="text-xs text-slate-600">
              En la pantalla de configuración de Render, completa los campos con estos valores exactos:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-500 block text-[11px] font-semibold">Name:</span>
                <span className="font-mono font-bold text-slate-800">pagomovil-verify</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">o el nombre que prefieras</span>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-500 block text-[11px] font-semibold">Language / Runtime:</span>
                <span className="font-mono font-bold text-slate-800">Node</span>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 block text-[11px] font-semibold">Build Command:</span>
                  <button
                    onClick={() => copyText(buildCmd, setCopiedBuild)}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                  >
                    {copiedBuild ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedBuild ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
                <code className="font-mono font-bold text-slate-800 text-xs block mt-1 bg-white p-1 rounded border border-slate-200">
                  {buildCmd}
                </code>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 block text-[11px] font-semibold">Start Command:</span>
                  <button
                    onClick={() => copyText(startCmd, setCopiedStart)}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                  >
                    {copiedStart ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedStart ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
                <code className="font-mono font-bold text-slate-800 text-xs block mt-1 bg-white p-1 rounded border border-slate-200">
                  {startCmd}
                </code>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg sm:col-span-2">
                <span className="text-slate-500 block text-[11px] font-semibold">Instance Type / Plan:</span>
                <span className="font-semibold text-slate-800">Free ($0 / month)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center shrink-0 text-sm">
            4
          </div>
          <div className="space-y-3 flex-1">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Variables de Entorno (Environment Variables)
            </h2>
            <p className="text-xs text-slate-600">
              Baja hasta la sección <strong>"Environment Variables"</strong> en Render y añade estas dos variables:
            </p>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3 text-xs font-mono">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <span className="font-bold text-slate-900">NODE_ENV</span>
                  <span className="text-slate-400 mx-2">=</span>
                  <span className="text-emerald-700 font-semibold">production</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">PAYMENT_GATEWAY_API_KEY</span>
                  <span className="text-slate-400 mx-2">=</span>
                  <span className="text-emerald-700 font-semibold">pago_live_99a8b7c6</span>
                </div>
                <button
                  onClick={() => copyText('pago_live_99a8b7c6', setCopiedKey)}
                  className="text-[11px] font-sans text-slate-600 hover:text-slate-900"
                >
                  {copiedKey ? 'Copiada' : 'Copiar Valor'}
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              * Nota: La variable <code>PORT</code> no necesitas agregarla; Render la asigna automáticamente a través de <code>process.env.PORT</code>, lo cual tu app ya soporta de forma nativa.
            </p>
          </div>
        </div>

        {/* Step 5 */}
        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-sm">
            ✓
          </div>
          <div className="space-y-2 flex-1">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-600" />
              ¡Listo! Haz clic en "Create Web Service" y vincula tu teléfono
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Render tardará entre 1 y 2 minutos en compilar tu aplicación. Al finalizar, te mostrará la URL pública asignada, por ejemplo:
            </p>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg font-mono text-xs text-emerald-900 font-bold select-all">
              https://tu-app-nombre.onrender.com/api/webhook/notification
            </div>
            <p className="text-xs text-slate-600">
              Esa será la URL que pondrás en la acción de MacroDroid en tu teléfono Android.
            </p>
          </div>
        </div>
      </div>

      {/* Render Blueprint Option */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">
              Archivo <code>render.yaml</code> ya incluido en el proyecto
            </h3>
          </div>
          <button
            onClick={() => copyText(renderYamlContent, setCopiedYaml)}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            {copiedYaml ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedYaml ? 'Copiado' : 'Copiar render.yaml'}</span>
          </button>
        </div>
        <p className="text-xs text-slate-600">
          Ya he creado el archivo <code>render.yaml</code> en la raíz de tu proyecto. Si en Render usas la opción <strong>"Blueprint"</strong>, Render leerá este archivo y configurará todo automáticamente sin que tengas que rellenar ningún formulario.
        </p>
      </div>
    </div>
  );
};
