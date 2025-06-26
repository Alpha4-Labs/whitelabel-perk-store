import React, { useState } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { SUI_CONFIG } from '../config/sui';
import { Button } from './ui/Button';
import { testChainConnection, testAlphaPointsQuery } from '../utils/chainTest';

/**
 * Debug Helper Component for Perk Curation
 * 
 * This component helps companies discover available perks and their IDs
 * for easy curation configuration. Only shows when VITE_DEBUG_MODE=true
 */
export const PerkDebugHelper: React.FC = () => {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDebugQuery = async () => {
    if (!currentAccount?.address) return;
    
    setIsLoading(true);
    try {
      console.log('🔍 Debug: Starting comprehensive analysis...');
      
      // Test chain connection first
      const connectionTest = await testChainConnection(currentAccount.address);
      
      // Test Alpha Points balance
      const alphaPointsTest = await testAlphaPointsQuery(currentAccount.address);
      
      // Get all objects owned by user (using the existing suiClient from hook)
      const allObjects = await suiClient.getOwnedObjects({
        owner: currentAccount.address,
        options: {
          showContent: true,
          showType: true,
        },
      });
      
      console.log('📦 Debug: Found', allObjects.data.length, 'total objects');
      
      // Filter for different types
      const claimedPerks = allObjects.data.filter((obj: any) => {
        const objectType = obj.data?.type;
        return objectType && objectType.includes('ClaimedPerk');
      });
      
      const perkDefinitions = allObjects.data.filter((obj: any) => {
        const objectType = obj.data?.type;
        return objectType && objectType.includes('PerkDefinition');
      });
      
      const alpha4Objects = allObjects.data.filter((obj: any) => {
        const objectType = obj.data?.type;
        return objectType && objectType.includes(SUI_CONFIG.packageIds.perkManager);
      });
      
      const debugData = {
        // Connection test results
        chainConnection: connectionTest,
        alphaPointsBalance: alphaPointsTest,
        
        // Object counts
        totalObjects: allObjects.data.length,
        claimedPerks: claimedPerks.length,
        perkDefinitions: perkDefinitions.length,
        alpha4Objects: alpha4Objects.length,
        
        // Sample data
        sampleObjects: allObjects.data.slice(0, 5).map((obj: any) => ({
          id: obj.data?.objectId,
          type: obj.data?.type,
          hasContent: !!obj.data?.content,
          fields: obj.data?.content?.dataType === 'moveObject' ? Object.keys((obj.data.content as any).fields || {}) : []
        })),
        claimedPerkDetails: claimedPerks.map((obj: any) => ({
          id: obj.data?.objectId,
          type: obj.data?.type,
          fields: obj.data?.content?.dataType === 'moveObject' ? (obj.data.content as any).fields : null
        })),
        
        // Configuration
        packageId: SUI_CONFIG.packageIds.perkManager,
        network: SUI_CONFIG.network,
        rpcUrl: SUI_CONFIG.rpcUrl,
        userAddress: currentAccount.address
      };
      
      console.log('🔍 Complete debug results:', debugData);
      setDebugInfo(debugData);
      
    } catch (error) {
      console.error('❌ Debug query failed:', error);
      setDebugInfo({
        error: error.message,
        stack: error.stack
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentAccount?.address) {
    return (
      <div className="p-4 rounded-lg border border-yellow-500 bg-yellow-50">
        <p className="text-yellow-800">Connect your wallet to use the debug helper</p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-lg border-2 border-blue-500 bg-blue-50 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-blue-800">🔍 Perk Debug Helper</h3>
        <Button 
          onClick={runDebugQuery}
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          {isLoading ? 'Querying...' : 'Run Debug Query'}
        </Button>
      </div>
      
      {debugInfo && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{debugInfo.totalObjects}</div>
              <div className="text-sm text-blue-800">Total Objects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{debugInfo.claimedPerks}</div>
              <div className="text-sm text-blue-800">Claimed Perks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{debugInfo.perkDefinitions}</div>
              <div className="text-sm text-blue-800">Perk Definitions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{debugInfo.alpha4Objects}</div>
              <div className="text-sm text-blue-800">Alpha4 Objects</div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded border">
            <h4 className="font-semibold mb-2">Configuration & Connection</h4>
            <div className="text-sm space-y-1">
              <div><strong>User Address:</strong> {debugInfo.userAddress}</div>
              <div><strong>Package ID:</strong> {debugInfo.packageId}</div>
              <div><strong>Network:</strong> {debugInfo.network}</div>
              <div><strong>RPC URL:</strong> {debugInfo.rpcUrl}</div>
              
              {debugInfo.chainConnection && (
                <div className="mt-3 pt-3 border-t">
                  <div><strong>Chain Connection:</strong> {debugInfo.chainConnection.success ? '✅ Success' : '❌ Failed'}</div>
                  {debugInfo.chainConnection.chainId && (
                    <div><strong>Chain ID:</strong> {debugInfo.chainConnection.chainId}</div>
                  )}
                  {debugInfo.chainConnection.error && (
                    <div className="text-red-600"><strong>Error:</strong> {debugInfo.chainConnection.error}</div>
                  )}
                </div>
              )}
              
              {debugInfo.alphaPointsBalance && (
                <div className="mt-3 pt-3 border-t">
                  <div><strong>Alpha Points Query:</strong> {debugInfo.alphaPointsBalance.success ? '✅ Success' : '❌ Failed'}</div>
                  {debugInfo.alphaPointsBalance.balance !== undefined && (
                    <div><strong>Balance:</strong> {debugInfo.alphaPointsBalance.balance} αP</div>
                  )}
                  {debugInfo.alphaPointsBalance.error && (
                    <div className="text-red-600"><strong>Error:</strong> {debugInfo.alphaPointsBalance.error}</div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {debugInfo.error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <strong>Error:</strong> {debugInfo.error}
            </div>
          ) : (
            <>
              {debugInfo.claimedPerkDetails.length > 0 && (
                <div className="bg-white p-4 rounded border">
                  <h4 className="font-semibold mb-2">Claimed Perk Details</h4>
                  <pre className="text-xs overflow-auto bg-gray-100 p-2 rounded">
                    {JSON.stringify(debugInfo.claimedPerkDetails, null, 2)}
                  </pre>
                </div>
              )}
              
              <div className="bg-white p-4 rounded border">
                <h4 className="font-semibold mb-2">Sample Objects (First 5)</h4>
                <pre className="text-xs overflow-auto bg-gray-100 p-2 rounded">
                  {JSON.stringify(debugInfo.sampleObjects, null, 2)}
                </pre>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}; 