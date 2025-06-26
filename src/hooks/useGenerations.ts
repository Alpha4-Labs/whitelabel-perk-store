import { useState, useEffect, useCallback } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { BRAND_CONFIG } from '../config/brand';

export interface GenerationOpportunity {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  status: 'active' | 'inactive' | 'coming-soon';
  estimatedTimeMinutes: number | null;
  estimatedReward: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  requirements: string[];
  actionType: 'external_url' | 'wallet_action' | 'social_proof' | 'time_based';
  actionUrl?: string;
  isRecurring: boolean;
  maxCompletions?: number;
  completionsToday?: number;
  expiresAt?: number;
  featured?: boolean;
}

export interface UseGenerationsReturn {
  generations: GenerationOpportunity[];
  isLoading: boolean;
  error: string | null;
  refreshGenerations: () => Promise<void>;
  executeGeneration: (generationId: string) => Promise<void>;
  userCompletions: Record<string, number>;
}

// ===============================================
// TEMPLATE GENERATION OPPORTUNITIES
// ===============================================
// These are examples for deployers to customize for their white-label generation portal.
// Each template shows different Alpha Points earning patterns:
//
// DEPLOYER INSTRUCTIONS:
// - Replace these templates with your own generation opportunities
// - Update actionType and actionUrl to match your platform integrations
// - Customize titles, descriptions, rewards, and requirements
// - Set realistic estimatedReward and estimatedTimeMinutes
// - Configure category filters to match your brand themes
//
// ACTION TYPES:
// - external_url: Redirect to partner site/app for task completion
// - wallet_action: On-chain transaction or wallet interaction
// - social_proof: Social media sharing, Discord joining, etc.
// - time_based: Daily check-ins, staking periods, etc.
//
// CATEGORIES (customize for your brand):
// - 'engagement': Community interaction, social tasks
// - 'financial': Staking, lending, trading activities  
// - 'educational': Learning modules, quizzes, tutorials
// - 'social': Sharing, referrals, community building
// - 'loyalty': Daily check-ins, long-term engagement
// - 'partner': Cross-platform integrations
// ===============================================

const getTemplateGenerations = (): GenerationOpportunity[] => [
  // TEMPLATE 1: Social Engagement (Easy)
  {
    id: 'social-share-daily',
    name: `Share ${BRAND_CONFIG.company.name} on Social`,
    description: 'Share our latest announcement on your social media platforms',
    icon: '📱',
    category: 'social',
    status: 'active',
    estimatedTimeMinutes: 2,
    estimatedReward: '50-100 αP',
    difficulty: 'Easy',
    tags: ['social', 'viral', 'daily'],
    requirements: ['Connected social account', 'Share with company hashtag'],
    actionType: 'external_url',
    actionUrl: `https://twitter.com/intent/tweet?text=Check%20out%20${encodeURIComponent(BRAND_CONFIG.company.name)}!&url=${encodeURIComponent(BRAND_CONFIG.company.website)}`,
    isRecurring: true,
    maxCompletions: 1,
    completionsToday: 0,
    featured: true
  },

  // TEMPLATE 2: Educational Content (Medium)
  {
    id: 'learn-crypto-basics',
    name: 'Complete Crypto Education Module',
    description: 'Learn the fundamentals of blockchain and cryptocurrency',
    icon: '🎓',
    category: 'educational',
    status: 'active',
    estimatedTimeMinutes: 15,
    estimatedReward: '200-300 αP',
    difficulty: 'Medium',
    tags: ['education', 'blockchain', 'quiz'],
    requirements: ['Pass quiz with 80% score', 'Complete all lessons'],
    actionType: 'external_url',
    actionUrl: 'https://academy.example.com/crypto-101',
    isRecurring: false,
    maxCompletions: 1,
    completionsToday: 0,
    featured: false
  },

  // TEMPLATE 3: Community Engagement (Easy)
  {
    id: 'discord-daily-checkin',
    name: 'Daily Discord Check-in',
    description: 'Visit our Discord community and say hello in the daily channel',
    icon: '💬',
    category: 'engagement',
    status: 'active',
    estimatedTimeMinutes: 1,
    estimatedReward: '25-50 αP',
    difficulty: 'Easy',
    tags: ['community', 'daily', 'discord'],
    requirements: ['Join Discord server', 'Post in #daily-checkin'],
    actionType: 'external_url',
    actionUrl: 'https://discord.gg/your-server',
    isRecurring: true,
    maxCompletions: 1,
    completionsToday: 0,
    featured: false
  },

  // TEMPLATE 4: Financial Activity (Hard)
  {
    id: 'stake-tokens-longterm',
    name: 'Long-term Token Staking',
    description: 'Stake tokens for 30+ days to earn consistent Alpha Points',
    icon: '🏦',
    category: 'financial',
    status: 'active',
    estimatedTimeMinutes: 5,
    estimatedReward: '1000+ αP/month',
    difficulty: 'Hard',
    tags: ['staking', 'defi', 'longterm'],
    requirements: ['Minimum 100 tokens', '30-day lock period', 'Sui wallet connected'],
    actionType: 'wallet_action',
    isRecurring: false,
    maxCompletions: 5,
    completionsToday: 0,
    featured: true
  },

  // TEMPLATE 5: Referral Program (Medium)
  {
    id: 'invite-friends',
    name: 'Invite Friends Program',
    description: 'Invite friends to join and earn when they complete their first task',
    icon: '👥',
    category: 'social',
    status: 'active',
    estimatedTimeMinutes: 3,
    estimatedReward: '300-500 αP per friend',
    difficulty: 'Medium',
    tags: ['referral', 'friends', 'bonus'],
    requirements: ['Friend signs up with your link', 'Friend completes first generation'],
    actionType: 'external_url',
    actionUrl: '/invite',
    isRecurring: true,
    maxCompletions: 10,
    completionsToday: 0,
    featured: true
  },

  // TEMPLATE 6: Loyalty Program (Easy)
  {
    id: 'weekly-loyalty-bonus',
    name: 'Weekly Loyalty Bonus',
    description: 'Complete at least 5 tasks this week for a bonus reward',
    icon: '⭐',
    category: 'loyalty',
    status: 'active',
    estimatedTimeMinutes: null,
    estimatedReward: '500 αP bonus',
    difficulty: 'Easy',
    tags: ['loyalty', 'weekly', 'bonus'],
    requirements: ['Complete 5 different generations this week'],
    actionType: 'time_based',
    isRecurring: true,
    maxCompletions: 1,
    completionsToday: 0,
    expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 1 week from now
    featured: false
  },

  // TEMPLATE 7: Partner Integration (Coming Soon)
  {
    id: 'partner-marketplace-purchase',
    name: 'Partner Marketplace Purchase',
    description: 'Make a purchase on our partner marketplace and earn bonus points',
    icon: '🛒',
    category: 'partner',
    status: 'coming-soon',
    estimatedTimeMinutes: 10,
    estimatedReward: '10% of purchase in αP',
    difficulty: 'Medium',
    tags: ['shopping', 'partner', 'bonus'],
    requirements: ['Partner account linked', 'Minimum $50 purchase'],
    actionType: 'external_url',
    actionUrl: 'https://partner-marketplace.example.com',
    isRecurring: true,
    featured: false
  },

  // TEMPLATE 8: Educational Quiz (Medium)
  {
    id: 'weekly-crypto-quiz',
    name: 'Weekly Crypto Market Quiz',
    description: 'Test your knowledge of current crypto market trends',
    icon: '🧠',
    category: 'educational',
    status: 'active',
    estimatedTimeMinutes: 5,
    estimatedReward: '100-200 αP',
    difficulty: 'Medium',
    tags: ['quiz', 'markets', 'weekly'],
    requirements: ['Score 70% or higher', 'Complete within time limit'],
    actionType: 'external_url',
    actionUrl: '/quiz/weekly-market',
    isRecurring: true,
    maxCompletions: 1,
    completionsToday: 0,
    featured: false
  }
];

export function useGenerations(): UseGenerationsReturn {
  const client = useSuiClient();
  const account = useCurrentAccount();
  const [generations, setGenerations] = useState<GenerationOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userCompletions, setUserCompletions] = useState<Record<string, number>>({});

  const fetchGenerations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Implement real blockchain fetching once deployed
      // The real implementation will:
      // 1. Query the Generation Registry for available opportunities
      // 2. Fetch user completion history from blockchain
      // 3. Apply brand configuration filters
      // 4. Check user eligibility for each generation
      
      console.warn('⚠️ MOCK DATA: Using template generations for white-label deployment');
      console.log('📝 TODO: Implement real fetching with:');
      console.log('  1. Query Generation Registry for opportunities');
      console.log('  2. Fetch user completion history');
      console.log('  3. Apply BRAND_CONFIG filters');
      console.log('  4. Check user eligibility requirements');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get template generations and apply brand filtering if configured
      let availableGenerations = getTemplateGenerations();
      
      // Apply brand configuration filters (example)
      if (BRAND_CONFIG.features.disableExpiredPerks) {
        availableGenerations = availableGenerations.filter(gen => 
          !gen.expiresAt || gen.expiresAt > Date.now()
        );
      }
      
      // Filter by brand categories if specified in config
      // (This could be added to BRAND_CONFIG for generation curation)
      
      setGenerations(availableGenerations);
      
      // Mock user completion data
      const mockCompletions: Record<string, number> = {
        'social-share-daily': 3,
        'discord-daily-checkin': 7,
        'learn-crypto-basics': 1,
        'weekly-crypto-quiz': 2
      };
      setUserCompletions(mockCompletions);
      
    } catch (err: any) {
      console.error('❌ Error fetching generations:', err);
      setError(err.message || 'Failed to fetch generation opportunities');
    } finally {
      setIsLoading(false);
    }
  }, [client, account]);

  const executeGeneration = useCallback(async (generationId: string) => {
    const generation = generations.find(g => g.id === generationId);
    if (!generation) {
      throw new Error('Generation not found');
    }

    try {
      // TODO: Implement real execution logic
      console.log('🚀 Executing generation:', generation.name);
      
      if (generation.actionType === 'external_url' && generation.actionUrl) {
        // Open external URL
        window.open(generation.actionUrl, '_blank');
      } else if (generation.actionType === 'wallet_action') {
        // Execute on-chain transaction
        console.log('📝 TODO: Implement wallet transaction for:', generationId);
      }
      
      // Optimistically update completion count
      setUserCompletions(prev => ({
        ...prev,
        [generationId]: (prev[generationId] || 0) + 1
      }));
      
    } catch (err: any) {
      console.error('❌ Error executing generation:', err);
      throw err;
    }
  }, [generations]);

  const refreshGenerations = useCallback(async () => {
    await fetchGenerations();
  }, [fetchGenerations]);

  // Auto-fetch on mount and when account changes
  useEffect(() => {
    fetchGenerations();
  }, [fetchGenerations]);

  return {
    generations,
    isLoading,
    error,
    refreshGenerations,
    executeGeneration,
    userCompletions
  };
} 