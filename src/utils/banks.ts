import { BankCode, BankInfo } from '../types/payment';

export const VENEZUELAN_BANKS: Record<BankCode, BankInfo> = {
  '0102': {
    code: '0102',
    name: 'Banco de Venezuela',
    shortName: 'BDV',
    color: '#003882',
    accentBg: 'bg-blue-50 text-blue-900 border-blue-200',
    iconText: 'BDV',
  },
  '0134': {
    code: '0134',
    name: 'Banesco Banco Universal',
    shortName: 'Banesco',
    color: '#007A33',
    accentBg: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    iconText: 'BAN',
  },
  '0105': {
    code: '0105',
    name: 'Banco Mercantil',
    shortName: 'Mercantil',
    color: '#0B2341',
    accentBg: 'bg-sky-50 text-sky-900 border-sky-200',
    iconText: 'MER',
  },
  '0108': {
    code: '0108',
    name: 'BBVA Banco Provincial',
    shortName: 'Provincial',
    color: '#004481',
    accentBg: 'bg-indigo-50 text-indigo-900 border-indigo-200',
    iconText: 'BBVA',
  },
  '0172': {
    code: '0172',
    name: 'Bancamiga Banco Universal',
    shortName: 'Bancamiga',
    color: '#008489',
    accentBg: 'bg-teal-50 text-teal-900 border-teal-200',
    iconText: 'BCA',
  },
  '0191': {
    code: '0191',
    name: 'Banco Nacional de Crédito (BNC)',
    shortName: 'BNC',
    color: '#005A9C',
    accentBg: 'bg-cyan-50 text-cyan-900 border-cyan-200',
    iconText: 'BNC',
  },
  '0114': {
    code: '0114',
    name: 'Bancaribe',
    shortName: 'Bancaribe',
    color: '#005596',
    accentBg: 'bg-blue-50 text-blue-900 border-blue-200',
    iconText: 'BCB',
  },
  '0115': {
    code: '0115',
    name: 'Banco Exterior',
    shortName: 'Exterior',
    color: '#0072CE',
    accentBg: 'bg-sky-50 text-sky-900 border-sky-200',
    iconText: 'EXT',
  },
  '0163': {
    code: '0163',
    name: 'Banco del Tesoro',
    shortName: 'Tesoro',
    color: '#8B0000',
    accentBg: 'bg-rose-50 text-rose-900 border-rose-200',
    iconText: 'BDT',
  },
  '0168': {
    code: '0168',
    name: 'Bancrecer',
    shortName: 'Bancrecer',
    color: '#FF6600',
    accentBg: 'bg-orange-50 text-orange-900 border-orange-200',
    iconText: 'BCR',
  },
  '0166': {
    code: '0166',
    name: 'Banco Agrícola de Venezuela',
    shortName: 'Agrícola',
    color: '#2E7D32',
    accentBg: 'bg-green-50 text-green-900 border-green-200',
    iconText: 'BAV',
  },
  '0175': {
    code: '0175',
    name: 'Banco Bicentenario',
    shortName: 'Bicentenario',
    color: '#C62828',
    accentBg: 'bg-red-50 text-red-900 border-red-200',
    iconText: 'BCB',
  },
  '0174': {
    code: '0174',
    name: 'Banplus Banco Universal',
    shortName: 'Banplus',
    color: '#303F9F',
    accentBg: 'bg-violet-50 text-violet-900 border-violet-200',
    iconText: 'BPL',
  },
  '0156': {
    code: '0156',
    name: '100% Banco',
    shortName: '100% Banco',
    color: '#D32F2F',
    accentBg: 'bg-amber-50 text-amber-900 border-amber-200',
    iconText: '100',
  },
  'OTHER': {
    code: 'OTHER',
    name: 'Otro Banco / Sistema Interbancario',
    shortName: 'Interbancario',
    color: '#475569',
    accentBg: 'bg-slate-50 text-slate-800 border-slate-200',
    iconText: 'OTR',
  },
};

export function getBankInfo(code?: string): BankInfo {
  if (code && code in VENEZUELAN_BANKS) {
    return VENEZUELAN_BANKS[code as BankCode];
  }
  return VENEZUELAN_BANKS['OTHER'];
}
