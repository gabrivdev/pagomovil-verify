import React, { useState } from 'react';
import { KeyRound, X, Check, AlertCircle, Shield } from 'lucide-react';
import { changePin } from '../utils/api';

interface ChangePinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePinModal: React.FC<ChangePinModalProps> = ({ isOpen, onClose }) => {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPin.trim()) {
      setError('Debes ingresar el PIN actual.');
      return;
    }

    if (newPin.trim().length < 4) {
      setError('El nuevo PIN debe tener al menos 4 dígitos o caracteres.');
      return;
    }

    if (newPin !== confirmPin) {
      setError('La confirmación del nuevo PIN no coincide.');
      return;
    }

    setLoading(true);
    const res = await changePin(currentPin.trim(), newPin.trim());
    setLoading(false);

    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
        onClose();
      }, 1800);
    } else {
      setError(res.error || 'No se pudo cambiar el PIN');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Seguridad: Cambiar PIN de Caja</h2>
              <p className="text-[11px] text-slate-500">Protege el acceso a tu terminal de pagos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {success ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto">
                <Check className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-emerald-900">¡PIN Cambiado con Éxito!</h3>
              <p className="text-xs text-emerald-700">El nuevo PIN ya está activo para todas las sesiones de esta caja.</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  PIN Actual
                </label>
                <input
                  type="password"
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value)}
                  placeholder="Ingresa tu PIN actual"
                  className="w-full px-3.5 py-2.5 font-mono text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nuevo PIN de Caja (mínimo 4 dígitos)
                </label>
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="Ingresa el nuevo PIN"
                  className="w-full px-3.5 py-2.5 font-mono text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Confirmar Nuevo PIN
                </label>
                <input
                  type="password"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="Repite el nuevo PIN"
                  className="w-full px-3.5 py-2.5 font-mono text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] text-slate-500 flex items-start gap-2">
                <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  El webhook de tu teléfono Android seguirá funcionando automáticamente sin necesidad de cambiar nada en Automate.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
                >
                  {loading ? 'Guardando...' : 'Guardar Nuevo PIN'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
