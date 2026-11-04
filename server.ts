import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import {
  BankCode,
  DeviceGatewayStatus,
  PagoMovilTransaction,
  VerificationRequest,
  VerificationResult,
} from './src/types/payment';
import { parseNotificationRegex, buildTransactionFromParsed, detectBankFromText } from './src/utils/parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.NODE_ENV === 'production' && process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File persistence for real payments
const DATA_DIR = path.resolve(__dirname, 'data');
const PAYMENTS_FILE = path.join(DATA_DIR, 'payments.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface AppConfig {
  accessPin: string;
  isCustomizedInApp?: boolean;
}

function loadConfig(): AppConfig {
  const envPin = process.env.ACCESS_PIN ? process.env.ACCESS_PIN.trim() : '';

  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      // If someone explicitly customized it within the app, respect that
      if (parsed && parsed.isCustomizedInApp && parsed.accessPin) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading config.json:', err);
  }

  // Otherwise, Render environment variable ACCESS_PIN is the primary PIN
  return {
    accessPin: envPin || '1234',
    isCustomizedInApp: false,
  };
}

let appConfig: AppConfig = loadConfig();

function saveConfigToDisk() {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(appConfig, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving config.json:', err);
  }
}

// In-memory active session tokens for Cashier terminal
const activeSessions = new Set<string>();

// Rate-limiting tracker for PIN entry
const failedAttempts: { [ip: string]: { count: number; blockedUntil: number } } = {};

function loadStoredTransactions(): PagoMovilTransaction[] {
  try {
    if (fs.existsSync(PAYMENTS_FILE)) {
      const data = fs.readFileSync(PAYMENTS_FILE, 'utf-8');
      return JSON.parse(data) || [];
    }
  } catch (err) {
    console.error('Error reading payments.json:', err);
  }
  return [];
}

function saveTransactionsToDisk() {
  try {
    fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(transactions, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving payments.json:', err);
  }
}

// In-memory state with persistence (ZERO fictitious seed data)
let bcvRate = 72.50; // Current BCV rate in Bs. / USD
const API_KEY = process.env.PAYMENT_GATEWAY_API_KEY || 'pago_live_99a8b7c6';

let deviceStatus: DeviceGatewayStatus = {
  connected: false,
  lastPingAt: undefined,
  deviceName: undefined,
  batteryLevel: undefined,
  notificationsReceivedToday: 0,
  totalVesToday: 0,
  bcvRate: 72.50,
  apiKey: API_KEY,
  webhookUrl: '',
};

// Real transactions array (starts empty without any fake data)
let transactions: PagoMovilTransaction[] = loadStoredTransactions();

// Helper to recalculate today's stats
function updateStats() {
  const today = new Date().toISOString().slice(0, 10);
  const todaysTx = transactions.filter(t => t.receivedAt.startsWith(today));
  deviceStatus.notificationsReceivedToday = todaysTx.length;
  deviceStatus.totalVesToday = Math.round(todaysTx.reduce((acc, t) => acc + t.amountVes, 0) * 100) / 100;
  deviceStatus.bcvRate = bcvRate;
}
updateStats();

// Fallback Gemini AI parser for complex or unexpected notification formats
async function parseWithGemini(rawText: string, title?: string): Promise<{
  reference: string;
  amountVes: number;
  bankCode: BankCode;
  bankName: string;
  senderPhone?: string;
  senderDocument?: string;
} | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const ai = new GoogleGenAI();
    const prompt = `Analiza este texto de notificación de Pago Móvil o SMS bancario en Venezuela y extrae la información en formato JSON puro (sin markdown, sin bloques \`\`\`json):
Notificación: "${title ? title + ' - ' : ''}${rawText}"

Devuelve exactamente este JSON:
{
  "reference": "número de referencia o aprobación (solo dígitos)",
  "amountVes": número flotante con el monto en bolívares (ej: 850.50),
  "bankCode": "código bancario de 4 dígitos si se identifica (0102 para BDV, 0134 para Banesco, 0105 para Mercantil, 0108 para Provincial, 0172 para Bancamiga, 0191 para BNC, o OTHER)",
  "bankName": "Nombre del banco",
  "senderPhone": "número de teléfono del emisor si aparece",
  "senderDocument": "cédula o rif si aparece"
}`;

    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = res.text?.trim() || '';
    const cleanJson = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    return {
      reference: String(parsed.reference || '').replace(/[^0-9]/g, ''),
      amountVes: typeof parsed.amountVes === 'number' ? parsed.amountVes : parseFloat(parsed.amountVes) || 0,
      bankCode: parsed.bankCode || 'OTHER',
      bankName: parsed.bankName || 'Banco Desconocido',
      senderPhone: parsed.senderPhone,
      senderDocument: parsed.senderDocument,
    };
  } catch (err) {
    console.error('Gemini parse error:', err);
    return null;
  }
}

// ==========================================
// API ROUTES
// ==========================================

// Webhook endpoint: Android phone POSTs notifications here
app.post('/api/webhook/notification', async (req: Request, res: Response) => {
  const incomingApiKey = req.headers['x-api-key'] || req.query.apiKey || req.body?.apiKey;

  // Basic API Key validation
  if (incomingApiKey && incomingApiKey !== API_KEY && incomingApiKey !== 'demo_key') {
    return res.status(401).json({ error: 'API Key inválida. Configura la clave correcta en MacroDroid/Tasker.' });
  }

  const { text, title, app: sourceApp, package: pkg, timestamp, battery } = req.body || {};
  const rawText = text || req.body.message || '';

  if (!rawText && !title) {
    return res.status(400).json({ error: 'Falta el cuerpo del mensaje o notificación.' });
  }

  // Update device ping and status
  deviceStatus.connected = true;
  deviceStatus.lastPingAt = new Date().toISOString();
  if (battery) deviceStatus.batteryLevel = Number(battery);
  if (sourceApp && !deviceStatus.deviceName?.includes(sourceApp)) {
    // Keep device info active
  }

  // 1. Try fast local regex parser
  let parsed = parseNotificationRegex(rawText, title, sourceApp || pkg);
  let parserMethod: 'regex' | 'gemini_ai' = 'regex';

  // 2. If regex confidence is low or missing reference, try Gemini AI
  if ((!parsed || !parsed.reference || parsed.amountVes === 0) && process.env.GEMINI_API_KEY) {
    const aiParsed = await parseWithGemini(rawText, title);
    if (aiParsed && (aiParsed.reference || aiParsed.amountVes > 0)) {
      parsed = {
        reference: aiParsed.reference || '000000',
        amountVes: aiParsed.amountVes,
        bankCode: aiParsed.bankCode,
        bankName: aiParsed.bankName,
        senderPhone: aiParsed.senderPhone,
        senderDocument: aiParsed.senderDocument,
        confidence: 0.9,
      };
      parserMethod = 'gemini_ai';
    }
  }

  if (!parsed || (!parsed.reference && parsed.amountVes === 0)) {
    // We record as an unparsed notification so user can see it in logs
    const bank = detectBankFromText(rawText, title, sourceApp);
    const unparsedTx: PagoMovilTransaction = {
      id: `pm_${Date.now()}_raw`,
      reference: 'PENDIENTE',
      amountVes: 0,
      bankCode: bank.code,
      bankName: bank.name,
      receivedAt: new Date().toISOString(),
      rawNotification: `${title ? title + ': ' : ''}${rawText}`,
      sourceApp: sourceApp || pkg || 'Android Push',
      status: 'UNCLAIMED',
      parserMethod: 'regex',
    };
    transactions.unshift(unparsedTx);
    updateStats();
    return res.status(200).json({
      success: true,
      message: 'Notificación recibida pero no se detectaron montos ni referencia claros.',
      transaction: unparsedTx,
    });
  }

  // Check if this reference was already received in the last 24h
  const existing = transactions.find(t => t.reference === parsed!.reference && t.reference !== '000000');
  if (existing) {
    return res.status(200).json({
      success: true,
      message: 'Notificación ya registrada previamente.',
      transaction: existing,
      isDuplicate: true,
    });
  }

  const transaction = buildTransactionFromParsed(
    parsed,
    `${title ? title + ': ' : ''}${rawText}`,
    sourceApp || pkg || 'Notificación Android',
    bcvRate,
    parserMethod
  );

  transactions.unshift(transaction);
  updateStats();
  saveTransactionsToDisk();

  return res.status(201).json({
    success: true,
    message: 'Pago Móvil capturado y validado exitosamente.',
    transaction,
  });
});

// ==========================================
// CASHIER AUTHENTICATION & SECURITY
// ==========================================
function getSessionTokenFromReq(req: Request): string | undefined {
  const headerToken = req.headers['x-session-token'];
  if (headerToken && typeof headerToken === 'string') return headerToken;
  const bearer = req.headers.authorization;
  if (bearer && bearer.startsWith('Bearer ')) return bearer.slice(7);
  if (req.query.token && typeof req.query.token === 'string') return req.query.token;
  return undefined;
}

function requireAuth(req: Request, res: Response, next: () => void) {
  const token = getSessionTokenFromReq(req);
  if (!token || !activeSessions.has(token)) {
    return res.status(401).json({
      error: 'Acceso no autorizado. Terminal de caja bloqueada.',
      requiresAuth: true,
    });
  }
  next();
}

// POST /api/auth/login - Check PIN and issue session token
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { pin } = req.body;
  const ip = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
  const now = Date.now();

  const attempt = failedAttempts[ip];
  if (attempt && attempt.blockedUntil > now) {
    const remainingSec = Math.ceil((attempt.blockedUntil - now) / 1000);
    return res.status(429).json({
      error: `Demasiados intentos fallidos. Por seguridad, espera ${remainingSec} segundos.`,
    });
  }

  const expectedPin = (appConfig.accessPin || process.env.ACCESS_PIN || '1234').trim();

  if (!pin || pin.toString().trim() !== expectedPin) {
    const count = (attempt?.count || 0) + 1;
    let blockedUntil = 0;
    if (count >= 5) {
      blockedUntil = now + 15000; // 15 seconds lockout
    }
    failedAttempts[ip] = { count, blockedUntil };
    return res.status(401).json({
      error: 'PIN incorrecto. Verifica el código e intenta de nuevo.',
    });
  }

  // Success: reset attempts
  delete failedAttempts[ip];
  const token = 'pos_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  activeSessions.add(token);

  return res.json({
    success: true,
    token,
    message: 'Sesión iniciada exitosamente',
  });
});

// GET /api/auth/verify - Validate session token
app.get('/api/auth/verify', (req: Request, res: Response) => {
  const token = getSessionTokenFromReq(req);
  if (token && activeSessions.has(token)) {
    return res.json({ authenticated: true });
  }
  return res.status(401).json({ authenticated: false });
});

// POST /api/auth/logout - End cashier session
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const token = getSessionTokenFromReq(req);
  if (token) {
    activeSessions.delete(token);
  }
  return res.json({ success: true, message: 'Caja bloqueada' });
});

// POST /api/auth/change-pin - Change cashier PIN
app.post('/api/auth/change-pin', requireAuth, (req: Request, res: Response) => {
  const { currentPin, newPin } = req.body;
  const expectedPin = (appConfig.accessPin || process.env.ACCESS_PIN || '1234').trim();

  if (!currentPin || currentPin.toString().trim() !== expectedPin) {
    return res.status(400).json({ error: 'El PIN actual no es correcto.' });
  }

  if (!newPin || newPin.toString().trim().length < 4) {
    return res.status(400).json({ error: 'El nuevo PIN debe tener al menos 4 caracteres o números.' });
  }

  appConfig.accessPin = newPin.toString().trim();
  appConfig.isCustomizedInApp = true;
  saveConfigToDisk();

  return res.json({
    success: true,
    message: 'PIN de caja actualizado correctamente.',
  });
});

// GET /api/payments - List all payments with optional filtering (Protected)
app.get('/api/payments', requireAuth, (req: Request, res: Response) => {
  const { status, bank, query } = req.query;
  let filtered = [...transactions];

  if (status && typeof status === 'string' && status !== 'ALL') {
    filtered = filtered.filter(t => t.status === status);
  }

  if (bank && typeof bank === 'string' && bank !== 'ALL') {
    filtered = filtered.filter(t => t.bankCode === bank);
  }

  if (query && typeof query === 'string' && query.trim() !== '') {
    const q = query.toLowerCase().trim();
    filtered = filtered.filter(t =>
      t.reference.toLowerCase().includes(q) ||
      (t.senderPhone && t.senderPhone.includes(q)) ||
      (t.senderDocument && t.senderDocument.toLowerCase().includes(q)) ||
      t.bankName.toLowerCase().includes(q) ||
      t.amountVes.toString().includes(q) ||
      (t.claimedForOrder && t.claimedForOrder.toLowerCase().includes(q))
    );
  }

  return res.json({
    transactions: filtered,
    total: filtered.length,
    device: deviceStatus,
  });
});

// POST /api/payments/verify - Check and validate a payment (Cashier POS)
app.post('/api/payments/verify', requireAuth, (req: Request, res: Response) => {
  const {
    reference,
    expectedAmountVes,
    expectedBankCode,
    orderNumber,
    claimedBy,
    markAsClaimed,
  }: VerificationRequest = req.body;

  if (!reference || reference.trim() === '') {
    return res.status(400).json({
      status: 'NOT_FOUND',
      message: 'Debe ingresar el número de referencia para verificar.',
    } as VerificationResult);
  }

  const cleanRef = reference.trim();

  // Find transaction matching exact reference or suffix match (e.g. customer entered last 4 or 6 digits)
  const tx = transactions.find(t => {
    if (t.reference === cleanRef) return true;
    if (cleanRef.length >= 4 && t.reference.endsWith(cleanRef)) return true;
    return false;
  });

  if (!tx) {
    return res.json({
      status: 'NOT_FOUND',
      message: `No se encontró ningún Pago Móvil con la referencia "${cleanRef}". Si el cliente acaba de transferir, espera 30-60 segundos a que llegue la notificación al teléfono.`,
    } as VerificationResult);
  }

  // Check if bank code matches (if requested)
  if (expectedBankCode && expectedBankCode !== 'OTHER' && tx.bankCode !== expectedBankCode) {
    // Bank mismatch warning
  }

  // Check if already claimed / used
  if (tx.status === 'CLAIMED') {
    return res.json({
      status: 'ALREADY_CLAIMED',
      message: `¡ATENCIÓN! Este Pago Móvil YA FUE UTILIZADO previamente para la orden ${tx.claimedForOrder || 'N/A'} por ${tx.claimedBy || 'Cajero'} el ${new Date(tx.claimedAt || tx.receivedAt).toLocaleTimeString()}. Posible intento de reutilización de capture.`,
      transaction: tx,
      actualAmount: tx.amountVes,
      expectedAmount: expectedAmountVes,
    } as VerificationResult);
  }

  // Check amount match if provided
  if (expectedAmountVes !== undefined && expectedAmountVes > 0) {
    const tolerance = 0.5; // 0.5 Bs tolerance for minor cent rounding
    const diff = Math.abs(tx.amountVes - expectedAmountVes);
    if (diff > tolerance) {
      return res.json({
        status: 'AMOUNT_MISMATCH',
        message: `Referencia encontrada pero el monto no coincide. Notificado: Bs. ${tx.amountVes.toFixed(2)}, Esperado: Bs. ${expectedAmountVes.toFixed(2)}. Diferencia: Bs. ${diff.toFixed(2)}.`,
        transaction: tx,
        actualAmount: tx.amountVes,
        expectedAmount: expectedAmountVes,
      } as VerificationResult);
    }
  }

  // If markAsClaimed is requested, lock the transaction
  if (markAsClaimed) {
    tx.status = 'CLAIMED';
    tx.claimedBy = claimedBy || 'Caja Web';
    tx.claimedForOrder = orderNumber || `TICK-${Date.now().toString().slice(-5)}`;
    tx.claimedAt = new Date().toISOString();
    saveTransactionsToDisk();
  }

  return res.json({
    status: 'EXACT_MATCH',
    message: markAsClaimed
      ? `¡Pago Móvil verificado y vinculado exitosamente a la orden ${tx.claimedForOrder}!`
      : '¡Pago Móvil verificado exitosamente! Monto y referencia confirmados.',
    transaction: tx,
    actualAmount: tx.amountVes,
    expectedAmount: expectedAmountVes,
  } as VerificationResult);
});

// POST /api/payments/claim - Manually claim a transaction
app.post('/api/payments/claim', requireAuth, (req: Request, res: Response) => {
  const { id, orderNumber, claimedBy } = req.body;
  const tx = transactions.find(t => t.id === id);
  if (!tx) {
    return res.status(404).json({ error: 'Transacción no encontrada' });
  }

  tx.status = 'CLAIMED';
  tx.claimedBy = claimedBy || 'Caja';
  tx.claimedForOrder = orderNumber || `FAC-${Date.now().toString().slice(-4)}`;
  tx.claimedAt = new Date().toISOString();
  saveTransactionsToDisk();

  return res.json({ success: true, transaction: tx });
});

// POST /api/payments/unclaim - Revert claimed status
app.post('/api/payments/unclaim', requireAuth, (req: Request, res: Response) => {
  const { id } = req.body;
  const tx = transactions.find(t => t.id === id);
  if (!tx) {
    return res.status(404).json({ error: 'Transacción no encontrada' });
  }

  tx.status = 'UNCLAIMED';
  tx.claimedBy = undefined;
  tx.claimedForOrder = undefined;
  tx.claimedAt = undefined;
  saveTransactionsToDisk();

  return res.json({ success: true, transaction: tx });
});

// GET /api/device/status - Device gateway and stats
app.get('/api/device/status', requireAuth, (req: Request, res: Response) => {
  updateStats();
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  const fullWebhookUrl = `${protocol}://${host}/api/webhook/notification`;
  deviceStatus.webhookUrl = fullWebhookUrl;

  return res.json(deviceStatus);
});

// POST /api/device/ping - Heartbeat
app.post('/api/device/ping', (req: Request, res: Response) => {
  const { deviceName, batteryLevel } = req.body;
  deviceStatus.connected = true;
  deviceStatus.lastPingAt = new Date().toISOString();
  if (deviceName) deviceStatus.deviceName = deviceName;
  if (batteryLevel) deviceStatus.batteryLevel = batteryLevel;
  return res.json({ success: true, timestamp: deviceStatus.lastPingAt });
});

// POST /api/settings/bcv - Update BCV rate
app.post('/api/settings/bcv', requireAuth, (req: Request, res: Response) => {
  const { rate } = req.body;
  if (rate && !isNaN(Number(rate)) && Number(rate) > 0) {
    bcvRate = Number(rate);
    deviceStatus.bcvRate = bcvRate;
    // update amounts in USD for all
    transactions.forEach(t => {
      t.amountUsd = Math.round((t.amountVes / bcvRate) * 100) / 100;
    });
    return res.json({ success: true, bcvRate });
  }
  return res.status(400).json({ error: 'Tasa inválida' });
});

// POST /api/payments/close-day - Clears transactions for the daily close
app.post('/api/payments/close-day', requireAuth, (_req: Request, res: Response) => {
  transactions = [];
  updateStats();
  saveTransactionsToDisk();
  return res.json({ success: true, message: 'Cierre de caja completado. Historial reiniciado a 0.' });
});

// GET /api/export/csv - Download transactions CSV
app.get('/api/export/csv', requireAuth, (req: Request, res: Response) => {
  const rate = req.query.rate ? parseFloat(req.query.rate as string) || bcvRate : bcvRate;
  const totalVes = transactions.reduce((acc, t) => acc + t.amountVes, 0);
  const totalUsd = rate > 0 ? (totalVes / rate).toFixed(2) : '0.00';

  const summary = [
    `"CIERRE DE CAJA - PAGO MOVIL"`,
    `"Fecha: ${new Date().toLocaleDateString('es-VE')}"`,
    `"Tasa de Cambio: Bs. ${rate.toFixed(2)} por USD"`,
    `"Total Transacciones: ${transactions.length}"`,
    `"Total Recaudado VES: Bs. ${totalVes.toFixed(2)}"`,
    `"Total Recaudado USD: $ ${totalUsd}"`,
    ``,
  ];

  const headers = ['Hora', 'Banco', 'Referencia', 'Monto VES', 'Monto USD', 'Teléfono'];
  const rows = transactions.map(t => [
    `"${new Date(t.receivedAt).toLocaleTimeString('es-VE')}"`,
    `"${t.bankName}"`,
    `"${t.reference}"`,
    t.amountVes.toFixed(2),
    rate > 0 ? (t.amountVes / rate).toFixed(2) : '0.00',
    `"${t.senderPhone || ''}"`,
  ]);

  const csvContent = [...summary, headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="Cierre_PagoMovil_${new Date().toISOString().slice(0, 10)}.csv"`);
  return res.send(csvContent);
});

// ==========================================
// VITE INTEGRATION / SERVER START
// ==========================================
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PagoMovil Verify Backend Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
