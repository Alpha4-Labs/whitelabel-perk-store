import { BrandConfig } from '../../src/types';

/**
 * TRC-Crypto Brand Configuration
 * A professional crypto trading and research platform
 * User: hello@trc-crypto.com
 */
export const trcCryptoBrandConfig: BrandConfig = {
  // Company Information
  company: {
    name: "TRC-Crypto",
    tagline: "Professional Crypto Trading & Research",
    logo: "/assets/trc-crypto-logo.svg",
    website: "https://trc-crypto.com",
    supportEmail: "hello@trc-crypto.com",
  },

  // Visual Theming - Professional Crypto Theme
  theme: {
    colors: {
      primary: '#f7931a', // Bitcoin Orange
      secondary: '#627eea', // Ethereum Blue  
      background: '#0a0a0a', // Deep Black
      backgroundCard: '#1a1a1a', // Dark Gray
      text: '#ffffff', // White
      textMuted: '#a0a0a0', // Light Gray
      border: '#333333', // Medium Gray
      success: '#00d4aa', // Teal Green
      warning: '#ff9500', // Amber
      error: '#ff3b30', // Red
    },
    fonts: {
      primary: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      secondary: "'JetBrains Mono', 'Consolas', monospace",
    },
    borderRadius: '12px',
  },

  // Perk Curation - Focus on DeFi, Trading, and Crypto perks
  curation: {
    method: 'tags',
    requiredTags: ['defi', 'trading', 'crypto', 'finance'],
    excludedTags: ['gaming', 'nft-art', 'social'], // Exclude non-trading focused
  },

  // Advanced Sorting & Filtering
  sorting: {
    defaultSort: 'value', // Show best value perks first
    customSorts: {
      'value': (perks) => {
        // Sort by best value (claims per alpha point)
        return perks.sort((a, b) => {
          const aValue = (a.claimCount || 0) / (a.current_alpha_points_price || 1);
          const bValue = (b.claimCount || 0) / (b.current_alpha_points_price || 1);
          return bValue - aValue;
        });
      },
      'professional': (perks) => {
        // Prioritize professional/institutional perks
        const professionalTags = ['institutional', 'professional', 'premium', 'vip'];
        return perks.sort((a, b) => {
          const aScore = (a.tags || []).filter(tag => professionalTags.includes(tag)).length;
          const bScore = (b.tags || []).filter(tag => professionalTags.includes(tag)).length;
          return bScore - aScore;
        });
      },
    },
    availableOptions: [
      { value: 'value', label: 'Best Value' },
      { value: 'professional', label: 'Professional Focus' },
      { value: 'price-low', label: 'Price: Low to High' },
      { value: 'price-high', label: 'Price: High to Low' },
      { value: 'newest', label: 'Latest Additions' },
      { value: 'ending-soon', label: 'Ending Soon' },
    ],
  },

  // Custom Filtering Options
  filtering: {
    enabledFilters: ['search', 'tags', 'price', 'availability'],
    customFilters: {
      'trading-type': {
        label: 'Trading Focus',
        options: [
          { value: 'spot', label: 'Spot Trading' },
          { value: 'derivatives', label: 'Derivatives' },
          { value: 'defi', label: 'DeFi Protocols' },
          { value: 'yield', label: 'Yield Farming' },
          { value: 'lending', label: 'Lending/Borrowing' },
        ],
        filterFn: (perks, value) => {
          return perks.filter(perk => 
            perk.tags?.includes(value) || 
            perk.description?.toLowerCase().includes(value)
          );
        },
      },
      'access-level': {
        label: 'Access Level',
        options: [
          { value: 'retail', label: 'Retail Traders' },
          { value: 'professional', label: 'Professional' },
          { value: 'institutional', label: 'Institutional' },
          { value: 'vip', label: 'VIP Members' },
        ],
        filterFn: (perks, value) => {
          return perks.filter(perk => perk.tags?.includes(value));
        },
      },
    },
  },

  // Feature Configuration
  features: {
    showDiscordIntegration: true,
    showUSDPricing: true, // Important for trading platform
    showClaimCounts: true,
    showPartnerNames: false, // Focus on perks, not partners
    enableFiltering: true,
    showExpiredPerks: false,
    autoRefresh: true,
    refreshInterval: 30000, // 30 seconds - active trading needs fresh data
    showLastUpdated: true,
  },

  // Content Customization
  content: {
    welcomeTitle: "Professional Crypto Trading Perks",
    welcomeMessage: "Access exclusive trading tools, research reports, and DeFi opportunities curated for professional traders.",
    emptyStateTitle: "No Trading Perks Available",
    emptyStateMessage: "We're constantly adding new professional trading perks. Check back soon or contact support for custom opportunities.",
    footerText: "© 2024 TRC-Crypto. Professional trading platform.",
    purchaseButtonText: "Claim Perk",
    connectWalletText: "Connect Wallet to Access Trading Perks",
  },

  // Social Links
  social: {
    website: "https://trc-crypto.com",
    twitter: "https://twitter.com/trc_crypto",
    discord: "https://discord.gg/trc-crypto",
    telegram: "https://t.me/trc_crypto",
    email: "hello@trc-crypto.com",
  },

  // Analytics & Tracking
  analytics: {
    enableTracking: true,
    trackPerkViews: true,
    trackPurchases: true,
    trackFilterUsage: true,
    customEvents: {
      'professional_perk_interest': ['institutional', 'professional', 'vip'],
      'high_value_perk_view': (perk) => perk.current_alpha_points_price > 10000,
    },
  },

  // Advanced Features
  advanced: {
    // Show different perks based on user's Alpha Points balance
    balanceBasedCuration: {
      enabled: true,
      tiers: [
        {
          minBalance: 0,
          maxBalance: 1000,
          additionalTags: ['beginner', 'low-cost'],
        },
        {
          minBalance: 1000,
          maxBalance: 10000,
          additionalTags: ['intermediate', 'professional'],
        },
        {
          minBalance: 10000,
          maxBalance: Infinity,
          additionalTags: ['premium', 'institutional', 'vip'],
        },
      ],
    },
    
    // Featured perks section
    featuredPerks: {
      enabled: true,
      maxCount: 3,
      criteria: {
        tags: ['featured', 'premium', 'institutional'],
        minClaimCount: 10,
      },
    },
  },
}; 