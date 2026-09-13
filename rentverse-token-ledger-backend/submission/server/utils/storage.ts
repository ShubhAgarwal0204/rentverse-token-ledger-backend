import fs from 'fs';
import path from 'path';
import { LedgerState } from '../ledger/types';

const DATA_DIR = path.join(__dirname, '..', 'data');
const LEDGER_PATH = path.join(DATA_DIR, 'ledger.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function readLedgerFile(): LedgerState | null {
  try {
    ensureDataDir();
    if (!fs.existsSync(LEDGER_PATH)) return null;
    const raw = fs.readFileSync(LEDGER_PATH, 'utf-8');
    if (!raw.trim()) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('failed to read ledger file, starting fresh:', (err as Error).message);
    return null;
  }
}

export function writeLedgerFile(state: LedgerState) {
  try {
    ensureDataDir();
    fs.writeFileSync(LEDGER_PATH, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('failed to persist ledger file:', (err as Error).message);
  }
}
