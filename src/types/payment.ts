export type BankCode =
  | '0102' // Banco de Venezuela (BDV)
  | '0134' // Banesco
  | '0105' // Mercantil
  | '0108' // BBVA Provincial
  | '0172' // Bancamiga
  | '0191' // BNC
  | '0114' // Bancaribe
  | '0115' // Banco Exterior
  | '0163' // Banco del Tesoro
  | '0168' // Bancrecer
  | '0166' // Banco Agrícola
  | '0175' // Banco Bicentenario
  | '0174' // Banplus
  | '0156' // 100% Banco
  | 'OTHER';

export interface BankInfo {
  code: BankCode;
  name: string;
  shortName: string;
  color: string;
  accentBg: string;
  iconText: string;
}

export type PaymentStatus = 'UNCLAIMED' | 'CLAIMED' | 'DISPUTED';

export interface PagoMovilTransaction {
  id: string;
  reference: string;
  amountVes: number;
  amountUsd?: number;
  bankCode: BankCode;
  bankName: string;
  senderPhone?: string;
  senderDocument?: string; // Cedula / RIF
  senderName?: string;
  receivedAt: string; // ISO date
  rawNotification: string;
  sourceApp?: string; // e.g. "BanescoMóvil", "BDV Digital", "SMS 2661"
  status: PaymentStatus;
  claimedBy?: string; // e.g. "Caja 1"
  claimedForOrder?: string; // Order / Ticket #
  claimedAt?: string;
  parserMethod: 'regex' | 'gemini_ai';
}

export interface VerificationRequest {
  reference: string;
  expectedAmountVes?: number;
  expectedBankCode?: BankCode;
  orderNumber?: string;
  claimedBy?: string;
  markAsClaimed?: boolean;
}

export interface VerificationResult {
  status: 'EXACT_MATCH' | 'AMOUNT_MISMATCH' | 'ALREADY_CLAIMED' | 'NOT_FOUND';
  message: string;
  transaction?: PagoMovilTransaction;
  expectedAmount?: number;
  actualAmount?: number;
}

export interface DeviceGatewayStatus {
  connected: boolean;
  lastPingAt?: string;
  deviceName?: string;
  batteryLevel?: number;
  notificationsReceivedToday: number;
  totalVesToday: number;
  bcvRate: number;
  apiKey: string;
  webhookUrl: string;
}

export interface WebhookNotificationPayload {
  apiKey?: string;
  text?: string;
  title?: string;
  app?: string;
  package?: string;
  timestamp?: number | string;
  subText?: string;
}
