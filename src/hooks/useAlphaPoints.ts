import { useCallback, useEffect, useState } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { SUI_CONFIG } from '../config/sui';

interface PointBalance {
  available: number;
  locked: number;
  total: number;
}

/**
 * Decoder for u64 values from Sui Move call results
 */
function decodeU64(bytesInput: Array<number> | Uint8Array | unknown): number {
  let bytes: Uint8Array;

  if (Array.isArray(bytesInput) && bytesInput.every(n => typeof n === 'number')) {
    bytes = new Uint8Array(bytesInput);
  } else if (bytesInput instanceof Uint8Array) {
    bytes = bytesInput;
  } else {
    return 0;
  }

  if (!bytes || bytes.length !== 8) {
    return 0;
  }
  
  try {
    const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const valueBigInt = dataView.getBigUint64(0, true); // true for little-endian
    return Number(valueBigInt);
  } catch (err) {
    return 0;
  }
}

/**
 * Hook for fetching and managing Alpha Points balance
 */
export const useAlphaPoints = () => {
  const currentAccount = useCurrentAccount();
  const client = useSuiClient();
  
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState<PointBalance>({ available: 0, locked: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  const fetchPoints = useCallback(async () => {
    if (!currentAccount?.address) {
      setPoints({ available: 0, locked: 0, total: 0 });
      setLoading(false);
      setError(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const txb = new Transaction();

      txb.moveCall({
        target: `${SUI_CONFIG.packageIds.perkManager}::ledger::get_available_balance`,
        arguments: [
          txb.object(SUI_CONFIG.sharedObjects.ledger),
          txb.pure.address(currentAccount.address),
        ],
        typeArguments: [],
      });

      txb.moveCall({
        target: `${SUI_CONFIG.packageIds.perkManager}::ledger::get_locked_balance`,
        arguments: [
          txb.object(SUI_CONFIG.sharedObjects.ledger),
          txb.pure.address(currentAccount.address),
        ],
        typeArguments: [],
      });

      const inspectResult = await client.devInspectTransactionBlock({
        sender: currentAccount.address,
        transactionBlock: txb,
      });
      
      const status = inspectResult?.effects?.status?.status;
      if (status !== 'success') {
        const errorMsg = inspectResult?.effects?.status?.error || 'Unknown devInspect error';
        throw new Error(`Failed to fetch points: ${errorMsg}`);
      }
      
      if (!inspectResult.results || inspectResult.results.length < 2) {
        throw new Error('Could not retrieve point balances: Invalid response structure.');
      }
      
      let available = 0;
      let locked = 0;
      
      const availableResult = inspectResult.results[0];
      if (availableResult?.returnValues?.[0]) {
        const [bytes, type] = availableResult.returnValues[0];
        if (type === 'u64' && Array.isArray(bytes)) {
          available = decodeU64(bytes);
        }
      }
      
      const lockedResult = inspectResult.results[1];
      if (lockedResult?.returnValues?.[0]) {
        const [bytes, type] = lockedResult.returnValues[0];
        if (type === 'u64' && Array.isArray(bytes)) {
          locked = decodeU64(bytes);
        }
      }
      
      const totalPoints = available + locked;
      setPoints({
        available,
        locked,
        total: totalPoints,
      });
      
    } catch (error: any) {
      console.error('Error fetching Alpha Points:', error);
      setError(error.message || 'An unknown error occurred while fetching points.');
    } finally {
      setLoading(false);
    }
  }, [currentAccount?.address, client]);

  useEffect(() => {
    fetchPoints();
  }, [fetchPoints]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!currentAccount?.address) return;

    const interval = setInterval(fetchPoints, 30000);
    return () => clearInterval(interval);
  }, [currentAccount?.address, fetchPoints]);

  return { 
    points, 
    loading, 
    error, 
    refetch: fetchPoints
  };
}; 