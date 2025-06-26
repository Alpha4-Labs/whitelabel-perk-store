export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  email?: string;
}

export interface ConnectionStatus {
  wallet: {
    connected: boolean;
    address?: string;
  };
  discord: {
    connected: boolean;
    user?: DiscordUser;
  };
}

// Updated to match smart contract ClaimedPerk structure
export interface ClaimedPerk {
  objectId: string; // The actual object ID on Sui
  perkDefinitionId: string; // Links to the PerkDefinition
  owner: string; // User's address
  claimTimestamp: number; // When it was claimed (ms)
  status: 'ACTIVE' | 'FULLY_CONSUMED' | 'EXPIRED'; // Current status
  claimSpecificMetadataId?: string; // Optional metadata object ID
  remainingUses?: number; // For consumable perks
  
  // Derived/fetched data from PerkDefinition
  name: string;
  description: string;
  icon: string; // We'll derive this from perk_type or metadata
  perkType: string;
  usdcPrice: number;
  currentAlphaPointsPrice: number;
  tags: string[];
}

// Structure that matches the smart contract PerkDefinition
export interface PerkDefinition {
  objectId: string;
  name: string;
  description: string;
  creatorPartnerCapId: string;
  perkType: string;
  usdcPrice: number;
  currentAlphaPointsPrice: number;
  lastPriceUpdateTimestamp: number;
  maxClaims?: number;
  totalClaimsCount: number;
  isActive: boolean;
  definitionMetadataId: string;
  generatesUniqueClaimMetadata: boolean;
  maxUsesPerClaim?: number;
  expirationTimestamp?: number;
  tags: string[];
  tagMetadataId: string;
}

// For Alpha4's own reward offerings
export interface Alpha4Perk {
  id: string;
  name: string;
  description: string;
  icon: string;
  alphaPointCost: number;
  usdcValue: number;
  isAvailable: boolean;
  isPlaceholder?: boolean;
  requiredPerkType?: string; // Match against ClaimedPerk.perkType
  requiredTags?: string[]; // Match against ClaimedPerk.tags
}

// For blockchain interactions
export interface SuiObjectResponse {
  data?: {
    objectId: string;
    type: string;
    fields: Record<string, any>;
  };
}

// Brand configuration interface for white-label customization
export interface BrandConfig {
  company: {
    name: string;
    tagline?: string;
    logo?: string;
    website?: string;
    supportEmail?: string;
  };
  theme: {
    colors: {
      primary: string;
      secondary: string;
      background: string;
      backgroundCard: string;
      text: string;
      textMuted: string;
      border: string;
      success: string;
      warning: string;
      error: string;
    };
    fonts: {
      primary: string;
      secondary: string;
    };
    borderRadius: string;
  };
  curation: {
    method: 'perk_ids' | 'partner_ids' | 'tags';
    perkIds?: string[];
    allowedPartnerIds?: string[];
    requiredTags?: string[];
    excludedTags?: string[];
  };
  sorting?: {
    defaultSort?: string;
    customSorts?: Record<string, (perks: any[]) => any[]>;
    availableOptions?: Array<{ value: string; label: string }>;
  };
  filtering?: {
    enabledFilters?: string[];
    customFilters?: Record<string, {
      label: string;
      options: Array<{ value: string; label: string }>;
      filterFn: (perks: any[], value: string) => any[];
    }>;
  };
  features: {
    showDiscordIntegration: boolean;
    showUSDPricing: boolean;
    showClaimCounts: boolean;
    showPartnerNames: boolean;
    enableFiltering: boolean;
    showExpiredPerks: boolean;
    autoRefresh: boolean;
    refreshInterval: number;
    showLastUpdated: boolean;
  };
  content: {
    welcomeTitle?: string;
    welcomeMessage?: string;
    emptyStateTitle?: string;
    emptyStateMessage?: string;
    footerText?: string;
    purchaseButtonText?: string;
    connectWalletText?: string;
  };
  social?: {
    website?: string;
    twitter?: string;
    discord?: string;
    telegram?: string;
    email?: string;
  };
  analytics?: {
    enableTracking: boolean;
    trackPerkViews: boolean;
    trackPurchases: boolean;
    trackFilterUsage: boolean;
    customEvents?: Record<string, any>;
  };
  advanced?: {
    balanceBasedCuration?: {
      enabled: boolean;
      tiers: Array<{
        minBalance: number;
        maxBalance: number;
        additionalTags: string[];
      }>;
    };
    featuredPerks?: {
      enabled: boolean;
      maxCount: number;
      criteria: {
        tags: string[];
        minClaimCount: number;
      };
    };
  };
} 