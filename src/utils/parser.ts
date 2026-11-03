import { BankCode, PagoMovilTransaction } from '../types/payment';

export interface ParsedPayment {
  reference: string;
  amountVes: number;
  bankCode: BankCode;
  bankName: string;
  senderPhone?: string;
  senderDocument?: string;
  senderName?: string;
  dateStr?: string;
  confidence: number;
}

// Cleans Venezuelan currency strings like "1.450,50" or "450.00" or "1450,5" into float
export function parseVenezuelanAmount(str: string): number {
  if (!str) return 0;
  // Remove "Bs.", "Bs", "VES", "Bs.S", "Bs.D", spaces
  let cleaned = str.replace(/[bB][sS][\.\s\w]*|VES/gi, '').trim();

  // If format is 1.250,50 (dot for thousands, comma for decimal)
  if (cleaned.includes(',') && cleaned.includes('.')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.includes(',')) {
    // Only comma: e.g. "450,50"
    cleaned = cleaned.replace(',', '.');
  }

  // Remove any remaining stray non-digit/dot characters
  cleaned = cleaned.replace(/[^0-9.]/g, '');
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : Math.round(val * 100) / 100;
}

export function detectBankFromText(text: string, title?: string, app?: string): { code: BankCode; name: string } {
  const combined = `${text} ${title || ''} ${app || ''}`.toLowerCase();

  if (combined.includes('venezuela') || combined.includes('bdv') || combined.includes('pagoclave') || combined.includes('2661') || combined.includes('2662')) {
    return { code: '0102', name: 'Banco de Venezuela' };
  }
  if (combined.includes('banesco') || combined.includes('0134') || combined.includes('pago movil banesco') || combined.includes('banescomovil')) {
    return { code: '0134', name: 'Banesco Banco Universal' };
  }
  if (combined.includes('mercantil') || combined.includes('tpago') || combined.includes('0105') || combined.includes('24024')) {
    return { code: '0105', name: 'Banco Mercantil' };
  }
  if (combined.includes('provincial') || combined.includes('bbva') || combined.includes('dinero rapido') || combined.includes('provinet')) {
    return { code: '0108', name: 'BBVA Banco Provincial' };
  }
  if (combined.includes('bancamiga') || combined.includes('0172')) {
    return { code: '0172', name: 'Bancamiga Banco Universal' };
  }
  if (combined.includes('bnc') || combined.includes('nacional de credito') || combined.includes('0191')) {
    return { code: '0191', name: 'Banco Nacional de Crédito (BNC)' };
  }
  if (combined.includes('bancaribe') || combined.includes('mi pago bancaribe') || combined.includes('0114')) {
    return { code: '0114', name: 'Bancaribe' };
  }
  if (combined.includes('exterior') || combined.includes('0115')) {
    return { code: '0115', name: 'Banco Exterior' };
  }
  if (combined.includes('tesoro') || combined.includes('0163')) {
    return { code: '0163', name: 'Banco del Tesoro' };
  }
  if (combined.includes('bancrecer') || combined.includes('0168')) {
    return { code: '0168', name: 'Bancrecer' };
  }
  if (combined.includes('banplus') || combined.includes('0174')) {
    return { code: '0174', name: 'Banplus Banco Universal' };
  }
  if (combined.includes('100%') || combined.includes('100 banco') || combined.includes('0156')) {
    return { code: '0156', name: '100% Banco' };
  }

  return { code: 'OTHER', name: 'Banco / Sistema Interbancario' };
}

export function parseNotificationRegex(rawText: string, title?: string, sourceApp?: string): ParsedPayment | null {
  const combined = `${title ? title + ': ' : ''}${rawText}`;
  const bank = detectBankFromText(rawText, title, sourceApp);

  // 1. Reference Extraction:
  // Patterns like:
  // "Ref: 12345678", "Referencia: 123456", "Ref. 984012", "Operacion: 893012", "Cod: 1234"
  // or numeric sequences labeled with Ref/Transaccion
  let reference = '';
  const refPatterns = [
    /(?:ref(?:erencia)?\.?|operaci[oó]n|transacci[oó]n|aprobaci[oó]n|num(?:ero)?\.?)\s*[:#\-]?\s*([0-9]{4,12})/i,
    /pago[\s\w]*con\s+ref(?:erencia)?\s*[:#\-]?\s*([0-9]{4,12})/i,
    /\b([0-9]{6,10})\b el \d{1,2}[\/\-]\d{1,2}/i,
    /Ref\s*([0-9]{4,12})/i,
  ];

  for (const pat of refPatterns) {
    const match = combined.match(pat);
    if (match && match[1]) {
      reference = match[1];
      break;
    }
  }

  // 2. Amount Extraction:
  // Patterns like:
  // "Bs. 1.250,50", "Bs 450,00", "Bs.S 300", "por Bs. 500,00", "monto Bs 1.500,00"
  let amountVes = 0;
  const amountPatterns = [
    /(?:bs\.?s?|ves|monto|por|recibiste|recibio)\s*[:#]?\s*(?:bs\.?s?|ves)?\s*([0-9]{1,3}(?:\.[0-9]{3})*(?:,[0-9]{1,2})|[0-9]+(?:,[0-9]{1,2})|[0-9]+(?:\.[0-9]{1,2}))/i,
    /([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2})\s*(?:bs|ves)/i,
    /Bs\.?\s*([0-9]+(?:,[0-9]{2})?)/i,
  ];

  for (const pat of amountPatterns) {
    const match = combined.match(pat);
    if (match && match[1]) {
      amountVes = parseVenezuelanAmount(match[1]);
      if (amountVes > 0) break;
    }
  }

  // 3. Sender Phone:
  // Patterns: 0414xxxxxxx, 0424xxxxxxx, 0412xxxxxxx, 0416xxxxxxx, 0426xxxxxxx, or 58414...
  let senderPhone: string | undefined;
  const phonePattern = /(?:tlf|tel[eé]fono|de|del|desde)?\s*[:#\-]?\s*(0414|0424|0412|0416|0426|58414|58424|58412|58416|58426)[0-9\-\s]{7,10}/i;
  const phoneMatch = combined.match(phonePattern);
  if (phoneMatch && phoneMatch[0]) {
    const cleanedDigits = phoneMatch[0].replace(/[^0-9]/g, '');
    if (cleanedDigits.length >= 10) {
      senderPhone = cleanedDigits.startsWith('58') ? '0' + cleanedDigits.substring(2) : cleanedDigits;
    }
  }

  // 4. Sender ID (Cédula / RIF):
  let senderDocument: string | undefined;
  const docPattern = /(?:c\.?i\.?|c[eé]dula|rif|identificaci[oó]n|v|e|j)\s*[:#\-]?\s*([VvEeJjGg]?\-?[0-9]{6,9})/i;
  const docMatch = combined.match(docPattern);
  if (docMatch && docMatch[1]) {
    senderDocument = docMatch[1].toUpperCase();
  }

  // If we couldn't even find reference, try searching any isolated 6-8 digit number
  if (!reference) {
    const fallbackDigits = combined.match(/\b([0-9]{6,8})\b/g);
    if (fallbackDigits && fallbackDigits.length > 0) {
      // Pick first that isn't phone prefix
      const candidate = fallbackDigits.find(d => !d.startsWith('0414') && !d.startsWith('0424') && !d.startsWith('0412'));
      if (candidate) reference = candidate;
    }
  }

  if (!reference && amountVes === 0) {
    return null; // Not enough info to construct a valid payment
  }

  return {
    reference: reference || '000000',
    amountVes,
    bankCode: bank.code,
    bankName: bank.name,
    senderPhone,
    senderDocument,
    confidence: (reference ? 0.6 : 0) + (amountVes > 0 ? 0.4 : 0),
  };
}

export function buildTransactionFromParsed(
  parsed: ParsedPayment,
  rawNotification: string,
  sourceApp: string = 'Android Notification',
  bcvRate: number = 70.0,
  parserMethod: 'regex' | 'gemini_ai' = 'regex'
): PagoMovilTransaction {
  return {
    id: `pm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    reference: parsed.reference,
    amountVes: parsed.amountVes,
    amountUsd: bcvRate > 0 ? Math.round((parsed.amountVes / bcvRate) * 100) / 100 : undefined,
    bankCode: parsed.bankCode,
    bankName: parsed.bankName,
    senderPhone: parsed.senderPhone,
    senderDocument: parsed.senderDocument,
    senderName: parsed.senderName,
    receivedAt: new Date().toISOString(),
    rawNotification,
    sourceApp,
    status: 'UNCLAIMED',
    parserMethod,
  };
}
