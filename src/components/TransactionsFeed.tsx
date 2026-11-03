import React, { useState } from 'react';
import { Search, RefreshCw, Copy, Check, Inbox } from 'lucide-react';
import { PagoMovilTransaction } from '../types/payment';
import { getBankInfo } from '../utils/banks';

interface TransactionsFeedProps {
  transactions: PagoMovilTransaction[];
  onRefresh: () => void;
}

export const TransactionsFeed: React.FC<TransactionsFeedProps> = ({
  transactions,
  onRefresh,
}) => {
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = transactions.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      t.reference.toLowerCase().includes(q) ||
      (t.senderPhone && t.senderPhone.includes(q)) ||
      t.bankName.toLowerCase().includes(q) ||
      t.amountVes.toString().includes(q)
    );
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Historial de Notificaciones Recibidas
          </h2>
          <p className="text-xs text-slate-500">
            {transactions.length === 0
              ? 'Esperando notificaciones de tu teléfono Android'
              : `${transactions.length} pago(s) registrado(s)`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {transactions.length > 0 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar referencia o teléfono..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 text-slate-800 w-56 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          )}

          <button
            onClick={onRefresh}
            className="p-1.5 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            title="Actualizar lista"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Transactions Table / Empty State */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-300">
              <Inbox className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-slate-700 text-sm">
                No hay pagos en el historial
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Las notificaciones bancarias que reciba tu teléfono Android con MacroDroid aparecerán aquí en tiempo real automáticamente.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                  <th className="py-3 px-4">Hora</th>
                  <th className="py-3 px-4">Banco</th>
                  <th className="py-3 px-4">Referencia</th>
                  <th className="py-3 px-4 text-right">Monto</th>
                  <th className="py-3 px-4">Emisor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((tx) => {
                  const bank = getBankInfo(tx.bankCode);
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                        <span className="font-semibold text-slate-800">
                          {new Date(tx.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          {new Date(tx.receivedAt).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800">{bank.shortName}</span>
                        <span className="block text-[10px] text-slate-400">{tx.sourceApp || 'Android'}</span>
                      </td>

                      <td className="py-3 px-4 font-mono whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-sm">{tx.reference}</span>
                          <button
                            onClick={() => handleCopy(tx.reference, tx.id)}
                            className="text-slate-400 hover:text-slate-700"
                            title="Copiar"
                          >
                            {copiedId === tx.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-900 text-right whitespace-nowrap tabular-nums text-sm">
                        Bs. {tx.amountVes.toFixed(2)}
                      </td>

                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap font-mono">
                        {tx.senderPhone || <span className="text-slate-400 italic">No disponible</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
