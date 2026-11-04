import React, { useState } from 'react';
import {
  Search,
  RefreshCw,
  Copy,
  Check,
  Inbox,
  Download,
  AlertCircle,
  FileSpreadsheet,
  Trash2,
  X,
} from 'lucide-react';
import { PagoMovilTransaction } from '../types/payment';
import { getBankInfo } from '../utils/banks';
import { authFetch } from '../utils/api';

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
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [closingSuccessMsg, setClosingSuccessMsg] = useState<string | null>(null);

  // User-defined exchange rate (persisted in localStorage)
  const [customRate, setCustomRate] = useState<number>(() => {
    const saved = localStorage.getItem('pagomovil_custom_rate');
    return saved && !isNaN(parseFloat(saved)) ? parseFloat(saved) : 72.50;
  });

  const handleRateChange = (valStr: string) => {
    const val = parseFloat(valStr);
    if (!isNaN(val) && val > 0) {
      setCustomRate(val);
      localStorage.setItem('pagomovil_custom_rate', val.toString());
    } else {
      setCustomRate(0);
    }
  };

  // Filter transactions by search query
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

  // Calculate totals
  const totalVes = transactions.reduce((acc, t) => acc + t.amountVes, 0);
  const totalUsd = customRate > 0 ? Math.round((totalVes / customRate) * 100) / 100 : 0;
  const count = transactions.length;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Generate Excel/CSV download and reset server
  const handleExecuteCloseDay = async () => {
    setIsClosing(true);

    try {
      // 1. Download Excel/CSV report
      const dateFormatted = new Date().toLocaleDateString('es-VE');
      const timeFormatted = new Date().toLocaleTimeString('es-VE');

      const headerLines = [
        `"REPORTE OFICIAL DE CIERRE DE CAJA - PAGO MOVIL"`,
        `"Fecha: ${dateFormatted} ${timeFormatted}"`,
        `"Tasa de Cambio Aplicada: Bs. ${customRate.toFixed(2)} por USD"`,
        `"Cantidad de Pagos: ${count}"`,
        `"Total Recaudado (VES): Bs. ${totalVes.toFixed(2)}"`,
        `"Total Equivalente (USD): $ ${totalUsd.toFixed(2)} USD"`,
        ``,
        `"Hora","Banco","Referencia","Monto (VES)","Equiv. (USD)","Telefono Emisor"`,
      ];

      const dataRows = transactions.map((t) => {
        const time = new Date(t.receivedAt).toLocaleTimeString('es-VE');
        const bank = getBankInfo(t.bankCode).shortName;
        const usdVal = customRate > 0 ? (t.amountVes / customRate).toFixed(2) : '0.00';
        return `"${time}","${bank}","${t.reference}",${t.amountVes.toFixed(2)},${usdVal},"${t.senderPhone || ''}"`;
      });

      const summaryLine = [
        ``,
        `"TOTAL DEL DIA","","${count} pagos",${totalVes.toFixed(2)},${totalUsd.toFixed(2)},""`,
      ];

      const fullCsv = [...headerLines, ...dataRows, ...summaryLine].join('\n');
      const blob = new Blob([fullCsv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Cierre_Caja_${dateFormatted.replace(/\//g, '-')}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      // 2. Clear transactions on server
      const res = await authFetch('/api/payments/close-day', { method: 'POST' });
      if (res.ok) {
        setIsClosingModalOpen(false);
        setClosingSuccessMsg(`¡Cierre completado! Se exportó el archivo Excel y la caja se reinició a Bs. 0.00`);
        setTimeout(() => setClosingSuccessMsg(null), 5000);
        onRefresh();
      }
    } catch (err) {
      console.error('Error during daily close:', err);
    } finally {
      setIsClosing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Success Notification after Closing */}
      {closingSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs text-emerald-950 font-medium">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{closingSuccessMsg}</span>
          </div>
          <button
            onClick={() => setClosingSuccessMsg(null)}
            className="text-slate-400 hover:text-slate-700"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Cierre de Caja & Totales Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Cierre y Resumen del Día
            </h3>
            <p className="text-xs text-slate-500">
              Totaliza los pagos recibidos hoy. Al pulsar en cerrar caja se descargará el Excel y se limpiará el día.
            </p>
          </div>

          {/* Rate configuration input */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-medium">Tu tasa del día:</span>
            <div className="relative w-32">
              <span className="absolute left-2.5 top-1.5 text-xs font-bold text-slate-400">Bs.</span>
              <input
                type="number"
                step="0.01"
                value={customRate || ''}
                onChange={(e) => handleRateChange(e.target.value)}
                placeholder="72.50"
                className="w-full pl-8 pr-2 py-1 text-xs font-mono font-bold rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900 bg-slate-50 focus:bg-white"
              />
            </div>
            <span className="text-xs text-slate-400 font-mono">/ USD</span>
          </div>
        </div>

        {/* Totals Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-lg">
            <span className="text-[11px] font-sans text-emerald-800 font-semibold uppercase tracking-wider block mb-1">
              Total Recaudado (VES)
            </span>
            <span className="text-xl sm:text-2xl font-bold text-emerald-950 tabular-nums">
              Bs. {totalVes.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-lg">
            <span className="text-[11px] font-sans text-blue-800 font-semibold uppercase tracking-wider block mb-1">
              Total en Dólares (USD)
            </span>
            <span className="text-xl sm:text-2xl font-bold text-blue-950 tabular-nums">
              $ {totalUsd.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-sans text-slate-600 font-semibold uppercase tracking-wider block mb-1">
                Total Pagos del Día
              </span>
              <span className="text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
                {count} {count === 1 ? 'pago' : 'pagos'}
              </span>
            </div>
          </div>
        </div>

        {/* Close Day Button */}
        <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs text-slate-400">
            Al finalizar la jornada laboral, haz clic en cerrar caja para cuadrar y reiniciar en cero.
          </span>

          <button
            onClick={() => setIsClosingModalOpen(true)}
            disabled={count === 0}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Hacer Cierre de Caja (Exportar Excel y Limpiar)</span>
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs space-y-3 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Pagos Recibidos en la Jornada Actual ({transactions.length})
          </h4>

          <div className="flex items-center gap-2">
            {transactions.length > 0 && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar referencia o teléfono..."
                  className="pl-8 pr-3 py-1 text-xs rounded-lg border border-slate-300 text-slate-800 w-52 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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

        {filtered.length === 0 ? (
          <div className="py-14 text-center text-slate-400 space-y-2">
            <Inbox className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-600 text-xs">
              No hay pagos en esta jornada
            </p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Cada nuevo pago que reciba tu teléfono Android entrará automáticamente aquí.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 -mb-4">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                  <th className="py-2.5 px-4">Hora</th>
                  <th className="py-2.5 px-4">Banco</th>
                  <th className="py-2.5 px-4">Referencia</th>
                  <th className="py-2.5 px-4 text-right">Monto (VES)</th>
                  <th className="py-2.5 px-4 text-right">Equiv. (USD)</th>
                  <th className="py-2.5 px-4">Emisor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((tx) => {
                  const bank = getBankInfo(tx.bankCode);
                  const usdVal = customRate > 0 ? (tx.amountVes / customRate).toFixed(2) : '0.00';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                        <span className="font-semibold text-slate-800">
                          {new Date(tx.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800">{bank.shortName}</span>
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

                      <td className="py-3 px-4 font-mono font-semibold text-blue-900 text-right whitespace-nowrap tabular-nums text-xs">
                        $ {usdVal}
                      </td>

                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap font-mono">
                        {tx.senderPhone || <span className="text-slate-400 italic">No disponible</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Footer Row */}
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-200 font-mono font-bold text-slate-900">
                  <td colSpan={3} className="py-3 px-4 text-xs uppercase font-sans">
                    Total del Día ({count} pagos):
                  </td>
                  <td className="py-3 px-4 text-right text-sm text-emerald-800 tabular-nums">
                    Bs. {totalVes.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right text-sm text-blue-900 tabular-nums">
                    $ {totalUsd.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Cierre de Caja */}
      {isClosingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Confirmar Cierre de Caja
                </h3>
              </div>
              <button
                onClick={() => setIsClosingModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Al confirmar el cierre de caja se realizarán automáticamente las siguientes dos acciones:
            </p>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5 font-mono">
              <div>• <strong>Descarga automática:</strong> Archivo Excel / CSV con el desglose de los <strong>{count} pagos</strong>.</div>
              <div>• <strong>Total recaudado:</strong> Bs. {totalVes.toFixed(2)} (${totalUsd.toFixed(2)} USD).</div>
              <div>• <strong>Limpieza de caja:</strong> El historial se reiniciará a <strong>Bs. 0.00</strong> para el siguiente día.</div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={handleExecuteCloseDay}
                disabled={isClosing}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                {isClosing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Generando cierre...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Confirmar y Exportar Excel</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setIsClosingModalOpen(false)}
                disabled={isClosing}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
