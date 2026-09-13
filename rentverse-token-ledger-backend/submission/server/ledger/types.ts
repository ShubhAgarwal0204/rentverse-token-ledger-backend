export type BlockType = 'GENESIS' | 'MINT' | 'TRANSFER';

export interface Block {
  index: number;
  type: BlockType;
  timestamp: string;
  previousHash: string;
  hash: string;
  to?: string;
  from?: string;
  amount?: number;
  resultingBalance?: number;
  resultingBalances?: Record<string, number>;
}

export interface LedgerState {
  name: string;
  symbol: string;
  decimals: number;
  owner: string | null;
  totalSupply: number;
  balances: Record<string, number>;
  chain: Block[];
}
