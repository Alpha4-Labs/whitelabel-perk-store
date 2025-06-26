// Sui Network Configuration

// Helper function to validate Sui Object IDs
const isValidSuiObjectId = (id: string | undefined): boolean => {
  return typeof id === 'string' && id.startsWith('0x') && id.length === 66;
};

// Helper function to handle invalid IDs
const handleInvalidId = (name: string, id: string | undefined): string => {
  throw new Error(`Missing or invalid ${name} in environment variables. Please check your .env file.`);
};

export const SUI_CONFIG = {
  network: (import.meta.env.VITE_SUI_NETWORK as 'mainnet' | 'testnet' | 'devnet') || 'testnet',
  rpcUrl: import.meta.env.VITE_SUI_RPC_URL || 'https://fullnode.testnet.sui.io',
  
  // Smart Contract Package IDs (update these when contracts are deployed)
  packageIds: {
    main: import.meta.env.VITE_PACKAGE_ID || import.meta.env.VITE_PERK_MANAGER_PACKAGE_ID,
    perkManager: import.meta.env.VITE_PERK_MANAGER_PACKAGE_ID,
  },
  
  // Shared Objects (required for Alpha Points balance queries)
  // These MUST be provided via environment variables - no fallbacks
  sharedObjects: {
    config: isValidSuiObjectId(import.meta.env.VITE_CONFIG_ID) 
      ? import.meta.env.VITE_CONFIG_ID 
      : handleInvalidId('VITE_CONFIG_ID', import.meta.env.VITE_CONFIG_ID),
    ledger: isValidSuiObjectId(import.meta.env.VITE_LEDGER_ID) 
      ? import.meta.env.VITE_LEDGER_ID 
      : handleInvalidId('VITE_LEDGER_ID', import.meta.env.VITE_LEDGER_ID),
    stakingManager: isValidSuiObjectId(import.meta.env.VITE_STAKING_MANAGER_ID) 
      ? import.meta.env.VITE_STAKING_MANAGER_ID 
      : handleInvalidId('VITE_STAKING_MANAGER_ID', import.meta.env.VITE_STAKING_MANAGER_ID),
    oracle: isValidSuiObjectId(import.meta.env.VITE_ORACLE_ID) 
      ? import.meta.env.VITE_ORACLE_ID 
      : handleInvalidId('VITE_ORACLE_ID', import.meta.env.VITE_ORACLE_ID),
  },
  
  // Object types
  types: {
    claimedPerk: (packageId: string) => `${packageId}::perk_manager::ClaimedPerk`,
    perkDefinition: (packageId: string) => `${packageId}::perk_manager::PerkDefinition`,
  },
} as const;

// Helper to check if using real contracts or mock data
export const isUsingRealContracts = () => {
  const packageId = SUI_CONFIG.packageIds.perkManager;
  // Real contracts should be longer than 10 characters and not start with 0x1234
  return packageId && packageId.length > 10 && !packageId.startsWith('0x1234567890abcdef');
};

// Helper to get the appropriate network display name
export const getNetworkDisplayName = () => {
  switch (SUI_CONFIG.network) {
    case 'mainnet': return 'Mainnet';
    case 'testnet': return 'Testnet';
    case 'devnet': return 'Devnet';
    default: return 'Unknown';
  }
}; 