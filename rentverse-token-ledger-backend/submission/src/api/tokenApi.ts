import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/token';

const client = axios.create({ baseURL: BASE_URL });

export interface ContractState {
  name: string;
  symbol: string;
  decimals: number;
  owner: string | null;
  totalSupply: number;
  holders: number;
}

export interface Transaction {
  index: number;
  type: 'MINT' | 'TRANSFER';
  timestamp: string;
  previousHash: string;
  hash: string;
  to?: string;
  from?: string;
  amount?: number;
  resultingBalance?: number;
  resultingBalances?: Record<string, number>;
}

export const getContractState = () =>
  client.get<ContractState>('/state').then((res) => res.data);

export const getBalance = (address: string) =>
  client.get<{ address: string; balance: number; symbol: string }>(
    `/balance/${encodeURIComponent(address)}`
  ).then((res) => res.data);

export const mintTokens = (to: string, amount: number, from?: string) =>
  client.post('/mint', { to, amount, from }).then((res) => res.data);

export const transferTokens = (from: string, to: string, amount: number) =>
  client.post('/transfer', { from, to, amount }).then((res) => res.data);

export const getTransactions = (address?: string) =>
  client.get<{ transactions: Transaction[] }>('/transactions', {
    params: address ? { address } : {},
  }).then((res) => res.data);

export const verifyLedger = () =>
  client.get<{ valid: boolean }>('/verify').then((res) => res.data);
