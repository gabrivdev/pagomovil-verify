import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck, Eye, EyeOff, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';
import { loginWithPin } from '../utils/api';

interface LockScreenProps {
  onUnlock: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (pinToTry?: string) => {
    const code = pinToTry || pin;
    if (!code.trim()) {
      setError('Por favor ingresa el PIN de seguridad.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await loginWithPin(code.trim());
    setLoading(false);

    if (res.success) {
      onUnlock();
    } else {
      setError(res.error || 'PIN incorrecto. Intenta de nuevo.');
      setPin('');
    }
  };

  const handleKeypadPress = (val: string) => {
    setError(null);
    if (val === 'CLEAR') {
      setPin('');
    } else if (val === 'BACK') {
      setPin((prev) => prev.slice(0, -1));
    } else {
      if (pin.length < 12) {
        setPin((prev) => prev + val);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        if (pin.length < 12) {
          setError(null);
          setPin((prev) => prev + e.key);
        }
      } else if (e.key === 'Backspace') {
        setPin((prev) => prev.slice(0, -1));
      } else if (e.key === 'Enter') {
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-6 sm:p-8 space-y-6">
        {/* Brand & Security Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/30">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Terminal de Caja Protegida
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Ingresa el PIN de seguridad para acceder al verificador de pagos e historial.
          </p>
        </div>

        {/* PIN Input Display */}
        <div className="space-y-3">
          <div className="relative">
            <input
              type={showPin ? 'text' : 'password'}
              value={pin}
              onChange={(e) => {
                setError(null);
                setPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 12));
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit();
              }}
              inputMode="numeric"
              placeholder="••••••"
              className="w-full text-center py-3.5 px-10 text-2xl font-mono tracking-widest font-bold bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-900 placeholder:text-slate-300"
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              tabIndex={-1}
            >
              {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Cashier Touch Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeypadPress(num)}
              className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-lg font-bold font-mono text-slate-800 transition-all flex items-center justify-center shadow-xs"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleKeypadPress('CLEAR')}
            className="h-12 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 active:scale-95 text-xs font-bold uppercase tracking-wider text-slate-600 transition-all flex items-center justify-center shadow-xs"
          >
            Borrar
          </button>
          <button
            type="button"
            onClick={() => handleKeypadPress('0')}
            className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-lg font-bold font-mono text-slate-800 transition-all flex items-center justify-center shadow-xs"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => handleKeypadPress('BACK')}
            className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-sm font-bold text-slate-700 transition-all flex items-center justify-center shadow-xs"
          >
            ⌫
          </button>
        </div>

        {/* Submit button */}
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={loading || pin.length === 0}
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.99] text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
        >
          {loading ? (
            <span>Verificando PIN...</span>
          ) : (
            <>
              <ShieldCheck className="w-5 h-5" />
              <span>Desbloquear Caja</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
