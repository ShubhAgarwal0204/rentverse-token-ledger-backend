import crypto from 'crypto';
import { readLedgerFile, writeLedgerFile } from '../utils/storage';
import { Block, BlockType } from './types';

const GENESIS_HASH = '0'.repeat(64);

interface ContractOptions {
  name?: string;
  symbol?: string;
  decimals?: number;
  owner?: string | null;
}

function sha256(data: unknown): string {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

function isValidAddress(address: unknown): address is string {
  return typeof address === 'string' && address.trim().length > 0;
}

export class TokenLedgerContract {
  name: string;
  symbol: string;
  decimals: number;
  owner: string | null;
  balances: Record<string, number>;
  totalSupply: number;
  chain: Block[];

  constructor(opts: ContractOptions = {}) {
    this.name = opts.name || 'RentVerse Token';
    this.symbol = opts.symbol || 'RVT';
    this.decimals = opts.decimals ?? 18;
    this.owner = opts.owner ?? null;

    const persisted = readLedgerFile();
    if (persisted) {
      this.balances = persisted.balances || {};
      this.totalSupply = persisted.totalSupply || 0;
      this.chain = persisted.chain?.length ? persisted.chain : [this.genesisBlock()];
      this.name = persisted.name || this.name;
      this.symbol = persisted.symbol || this.symbol;
      this.decimals = persisted.decimals ?? this.decimals;
      this.owner = persisted.owner ?? this.owner;
    } else {
      this.balances = {};
      this.totalSupply = 0;
      this.chain = [this.genesisBlock()];
      this.persist();
    }
  }

  private genesisBlock(): Block {
    const block: Omit<Block, 'hash'> = {
      index: 0,
      type: 'GENESIS',
      timestamp: new Date().toISOString(),
      previousHash: GENESIS_HASH,
    };
    return { ...block, hash: sha256(block) };
  }

  private persist() {
    writeLedgerFile({
      name: this.name,
      symbol: this.symbol,
      decimals: this.decimals,
      owner: this.owner,
      totalSupply: this.totalSupply,
      balances: this.balances,
      chain: this.chain,
    });
  }

  private appendBlock(type: BlockType, payload: Partial<Block>): Block {
    const previous = this.chain[this.chain.length - 1];
    const draft = {
      index: this.chain.length,
      type,
      ...payload,
      timestamp: new Date().toISOString(),
      previousHash: previous.hash,
    };
    const block = { ...draft, hash: sha256(draft) } as Block;
    this.chain.push(block);
    this.persist();
    return block;
  }

  balanceOf(address: string): number {
    if (!isValidAddress(address)) throw new Error('Invalid address');
    return this.balances[address] || 0;
  }

  mint(to: string, amount: number, from?: string): Block {
    if (!isValidAddress(to)) throw new Error('Invalid recipient address');
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('Amount must be a positive number');
    if (this.owner && from && from !== this.owner) throw new Error('Only the contract owner may mint tokens');

    this.balances[to] = (this.balances[to] || 0) + amount;
    this.totalSupply += amount;

    return this.appendBlock('MINT', { to, amount, resultingBalance: this.balances[to] });
  }

  transfer(from: string, to: string, amount: number): Block {
    if (!isValidAddress(from) || !isValidAddress(to)) throw new Error('Invalid sender or recipient address');
    if (from === to) throw new Error('Sender and recipient must differ');
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('Amount must be a positive number');

    const senderBalance = this.balances[from] || 0;
    if (senderBalance < amount) throw new Error('Insufficient balance');

    this.balances[from] = senderBalance - amount;
    this.balances[to] = (this.balances[to] || 0) + amount;

    return this.appendBlock('TRANSFER', {
      from,
      to,
      amount,
      resultingBalances: { [from]: this.balances[from], [to]: this.balances[to] },
    });
  }

  getTransactions(address?: string): Block[] {
    const entries = this.chain.filter((b) => b.type !== 'GENESIS');
    if (!address) return entries;
    return entries.filter((b) => b.to === address || b.from === address);
  }

  getState() {
    return {
      name: this.name,
      symbol: this.symbol,
      decimals: this.decimals,
      owner: this.owner,
      totalSupply: this.totalSupply,
      holders: Object.keys(this.balances).length,
    };
  }

  isChainValid(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      const { hash, ...rest } = this.chain[i];
      if (sha256(rest) !== hash) return false;
      if (rest.previousHash !== this.chain[i - 1].hash) return false;
    }
    return true;
  }
}

export default TokenLedgerContract;
