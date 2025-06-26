import React, { useState, useEffect } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { formatPoints } from '../utils/format';
import { SUI_CONFIG } from '../config/sui';
import { brandConfig } from '../config/brand';

// Helper to format points consistently
const formatAlphaPoints = (points: bigint | string | number): string => {
  const pointsNum = typeof points === 'bigint' ? Number(points) : Number(points);
  return new Intl.NumberFormat().format(pointsNum);
};

export const AlphaPointsBalance: React.FC = () => {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  
  const [balance, setBalance] = useState<bigint>(0n);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch Alpha Points balance from the chain
  const fetchBalance = async () => {
    if (!currentAccount?.address || !suiClient) {
      setBalance(0n);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Query the user's Alpha Points balance using the ledger
      const tx = new Transaction();
      tx.moveCall({
        target: `${SUI_CONFIG.packageIds.perkManager}::ledger::get_balance`,
        arguments: [
          tx.pure.address(currentAccount.address),
        ],
      });

      const devInspectResult = await suiClient.devInspectTransactionBlock({
        sender: currentAccount.address,
        transactionBlock: tx,
      });

      if (devInspectResult.results?.[0]?.returnValues?.[0]) {
        const [returnValue] = devInspectResult.results[0].returnValues[0];
        const bytes = new Uint8Array(returnValue);
        const dataView = new DataView(bytes.buffer);
        const userBalance = dataView.getBigUint64(0, true); // little-endian
        
        setBalance(userBalance);
      } else {
        // If no balance found, default to 0
        setBalance(0n);
      }
    } catch (error) {
      console.error('Error fetching Alpha Points balance:', error);
      setError('Failed to fetch balance');
      setBalance(0n);
    } finally {
      setLoading(false);
    }
  };

  // Fetch balance when account changes
  useEffect(() => {
    fetchBalance();
  }, [currentAccount?.address, suiClient]);

  // Auto-refresh balance every 30 seconds
  useEffect(() => {
    if (!currentAccount?.address) return;

    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [currentAccount?.address]);

  if (!currentAccount) {
    return null;
  }

  return (
    <div className="bg-[var(--color-background-card)]/80 backdrop-blur-lg border border-[var(--color-border)] rounded-2xl p-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
            style={{
              background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`
            }}
          >
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--color-text)]">Alpha Points</h3>
            <p className="text-sm text-[var(--color-text-muted)]">Available Balance</p>
          </div>
        </div>
        
        {/* Refresh Button */}
        <button
          onClick={fetchBalance}
          disabled={loading}
          className="p-2 rounded-lg bg-[var(--color-background)]/50 border border-[var(--color-border)] hover:bg-[var(--color-background)]/80 transition-colors disabled:opacity-50"
          title="Refresh balance"
        >
          <svg 
            className={`w-4 h-4 text-[var(--color-text-muted)] ${loading ? 'animate-spin' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Balance Display */}
      <div className="bg-[var(--color-background)]/30 backdrop-blur-sm border border-[var(--color-border)] rounded-xl p-4">
        {loading ? (
          <div className="animate-pulse">
            <div className="h-8 bg-[var(--color-border)] rounded-lg w-1/2 mb-2"></div>
            <div className="h-4 bg-[var(--color-border)] rounded w-1/3"></div>
          </div>
        ) : error ? (
          <div className="text-center">
            <div className="text-red-400 text-sm mb-2">⚠️ {error}</div>
            <button
              onClick={fetchBalance}
              className="text-xs text-[var(--color-primary)] hover:underline"
            >
              Try again
            </button>
          </div>
        ) : (
          <div>
            <div className="text-3xl font-bold text-[var(--color-text)] mb-2">
              {formatAlphaPoints(balance)}
              <span className="text-lg font-normal text-[var(--color-text-muted)] ml-2">αP</span>
            </div>
            
            {brandConfig.features.showUSDPricing && (
              <div className="text-sm text-[var(--color-success)]">
                ≈ ${(Number(balance) / 1000).toLocaleString(undefined, { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })} USD
              </div>
            )}
          </div>
        )}
      </div>

      {/* Connected Account Info */}
      <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--color-text-muted)]">Connected Account:</span>
          <span className="font-mono text-[var(--color-text)] bg-[var(--color-background)]/50 px-2 py-1 rounded">
            {currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}
          </span>
        </div>
      </div>
    </div>
  );
}; 