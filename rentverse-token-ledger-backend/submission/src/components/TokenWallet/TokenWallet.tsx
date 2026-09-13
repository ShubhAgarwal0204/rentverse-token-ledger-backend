import React, { useEffect, useState, useCallback } from 'react';
import {
  getContractState,
  getBalance,
  mintTokens,
  transferTokens,
  getTransactions,
  ContractState,
  Transaction,
} from '../../api/tokenApi';

function randomAddress(): string {
  const chars = 'abcdef0123456789';
  let hex = '';
  for (let i = 0; i < 40; i++) hex += chars[Math.floor(Math.random() * chars.length)];
  return `0x${hex}`;
}

function shorten(address?: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function TokenWallet() {
  const [address, setAddress] = useState(randomAddress());
  const [contractState, setContractState] = useState<ContractState | null>(null);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [mintAmount, setMintAmount] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [status, setStatus] = useState<{ type: 'error' | 'success' | null; message: string }>({
    type: null,
    message: '',
  });
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [state, bal, txs] = await Promise.all([
        getContractState(),
        getBalance(address),
        getTransactions(address),
      ]);
      setContractState(state);
      setBalance(bal.balance);
      setTransactions(txs.transactions);
    } catch {
      setStatus({ type: 'error', message: 'Could not reach the token API. Is the server running?' });
    }
  }, [address]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: null, message: '' });
    try {
      const result = await mintTokens(address, Number(mintAmount), address);
      setStatus({ type: 'success', message: result.message });
      setMintAmount('');
      await refresh();
    } catch (err: any) {
      setStatus({ type: 'error', message: err.response?.data?.error || 'Mint failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: null, message: '' });
    try {
      const result = await transferTokens(address, transferTo, Number(transferAmount));
      setStatus({ type: 'success', message: result.message });
      setTransferTo('');
      setTransferAmount('');
      await refresh();
    } catch (err: any) {
      setStatus({ type: 'error', message: err.response?.data?.error || 'Transfer failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{contractState?.name || 'Token Ledger'}</h2>
          <p className="text-sm text-slate-500">
            Simulated {contractState?.symbol || 'RVT'} ledger — no live blockchain required.
          </p>
        </div>
        <div className="text-right text-sm text-slate-500">
          <div>Total supply</div>
          <div className="text-lg font-medium text-slate-900">
            {contractState?.totalSupply ?? '—'} {contractState?.symbol}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 p-4 space-y-3">
        <label className="block text-sm text-slate-600">Active address (demo wallet)</label>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 font-mono text-sm"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <button
            type="button"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
            onClick={() => setAddress(randomAddress())}
          >
            New address
          </button>
        </div>
        <div className="flex items-baseline justify-between pt-2">
          <span className="text-sm text-slate-500">Balance for {shorten(address)}</span>
          <span className="text-2xl font-semibold text-emerald-700">
            {balance} {contractState?.symbol}
          </span>
        </div>
      </div>

      {status.message && (
        <div
          className={`rounded-md px-3 py-2 text-sm ${
            status.type === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}
        >
          {status.message}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <form onSubmit={handleMint} className="rounded-lg border border-slate-200 p-4 space-y-3">
          <h3 className="font-medium text-slate-900">Mint tokens</h3>
          <p className="text-xs text-slate-500">Creates new tokens into the active address.</p>
          <input
            type="number"
            min="0"
            step="any"
            required
            placeholder="Amount"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={mintAmount}
            onChange={(e) => setMintAmount(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-emerald-600 text-white py-2 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            Mint
          </button>
        </form>

        <form onSubmit={handleTransfer} className="rounded-lg border border-slate-200 p-4 space-y-3">
          <h3 className="font-medium text-slate-900">Transfer tokens</h3>
          <p className="text-xs text-slate-500">Sends tokens from the active address.</p>
          <input
            type="text"
            required
            placeholder="Recipient address"
            className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm"
            value={transferTo}
            onChange={(e) => setTransferTo(e.target.value)}
          />
          <input
            type="number"
            min="0"
            step="any"
            required
            placeholder="Amount"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-slate-900 text-white py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <h3 className="font-medium text-slate-900 mb-3">Transaction history</h3>
        {transactions.length === 0 ? (
          <p className="text-sm text-slate-500">No transactions for this address yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {transactions
              .slice()
              .reverse()
              .map((tx) => (
                <li key={tx.hash} className="py-2 text-sm flex items-center justify-between">
                  <div>
                    <span className="font-medium">{tx.type}</span>{' '}
                    <span className="text-slate-500">
                      {tx.type === 'MINT' ? `to ${shorten(tx.to)}` : `${shorten(tx.from)} → ${shorten(tx.to)}`}
                    </span>
                  </div>
                  <div className="text-slate-700">
                    {tx.amount} {contractState?.symbol}
                  </div>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}
