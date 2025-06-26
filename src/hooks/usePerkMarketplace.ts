import { useState, useEffect, useMemo } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { SuiClient } from '@mysten/sui/client';
import { toast } from 'react-hot-toast';
import { BRAND_CONFIG, shouldDisplayPerk } from '../config/brand';
import { SUI_CONFIG } from '../config/sui';

// Match the PerkDefinition interface from frontend
export interface PerkDefinition {
  id: string;
  name: string;
  description: string;
  creator_partner_cap_id: string;
  perk_type: string;
  usdc_price: number;
  current_alpha_points_price: number;
  last_price_update_timestamp_ms: number;
  partner_share_percentage: number;
  platform_share_percentage: number;
  max_claims?: number;
  total_claims_count: number;
  is_active: boolean;
  generates_unique_claim_metadata: boolean;
  max_uses_per_claim?: number;
  expiration_timestamp_ms?: number;
  tags?: string[];
  icon?: string;
  packageId: string;
}

// Cache configuration
const CACHE_KEY = 'curated_marketplace_perks';
const CACHE_EXPIRY_KEY = 'curated_marketplace_perks_expiry';
const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const getLocalStorageCache = (): PerkDefinition[] | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const expiry = localStorage.getItem(CACHE_EXPIRY_KEY);
    
    if (cached && expiry) {
      const expiryTime = parseInt(expiry);
      if (Date.now() < expiryTime) {
        return JSON.parse(cached) as PerkDefinition[];
      } else {
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_EXPIRY_KEY);
      }
    }
  } catch (err) {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_EXPIRY_KEY);
  }
  return null;
};

const setLocalStorageCache = (perks: PerkDefinition[]) => {
  try {
    const expiryTime = Date.now() + CACHE_DURATION_MS;
    localStorage.setItem(CACHE_KEY, JSON.stringify(perks));
    localStorage.setItem(CACHE_EXPIRY_KEY, expiryTime.toString());
  } catch (err) {
    console.warn('Failed to cache perks:', err);
  }
};

export const usePerkMarketplace = () => {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  
  const [perks, setPerks] = useState<PerkDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [partnerNames, setPartnerNames] = useState<Map<string, string>>(new Map());
  const [claimedPerks, setClaimedPerks] = useState<Set<string>>(new Set());
  const [userAlphaPoints, setUserAlphaPoints] = useState(0);

  // Fetch all marketplace perks
  const fetchMarketplacePerks = async (): Promise<PerkDefinition[]> => {
    if (!suiClient) return [];
    
    try {
      const packageId = SUI_CONFIG.packageIds.perkManager;
      
      // Query for PerkDefinitionCreated events
      const perkCreatedEvents = await suiClient.queryEvents({
        query: {
          MoveEventType: `${packageId}::perk_manager::PerkDefinitionCreated`
        },
        order: 'descending',
        limit: 50, // Reasonable limit for curated marketplaces
      });

      const perkIds: string[] = [];
      for (const event of perkCreatedEvents.data) {
        if (event.parsedJson && typeof event.parsedJson === 'object') {
          const eventData = event.parsedJson as any;
          perkIds.push(eventData.perk_definition_id);
        }
      }

      // Fetch perk details
      const fetchedPerks: PerkDefinition[] = [];
      const batchSize = 5; // Small batches for reliability
      
      for (let i = 0; i < perkIds.length; i += batchSize) {
        const batch = perkIds.slice(i, i + batchSize);
        const batchPromises = batch.map(async (id) => {
          try {
            const result = await suiClient.getObject({
              id,
              options: { showContent: true, showType: true },
            });

            if (result?.data?.content && result.data.content.dataType === 'moveObject') {
              const fields = (result.data.content as any).fields;
              const revenueSplit = fields.revenue_split_policy?.fields || fields.revenue_split_policy || {};
              
              return {
                id: result.data.objectId,
                name: fields.name || 'Unknown Perk',
                description: fields.description || '',
                creator_partner_cap_id: fields.creator_partner_cap_id,
                perk_type: fields.perk_type || 'General',
                usdc_price: parseFloat(fields.usdc_price || '0'),
                current_alpha_points_price: parseFloat(fields.current_alpha_points_price || '0'),
                last_price_update_timestamp_ms: parseInt(fields.last_price_update_timestamp_ms || '0'),
                partner_share_percentage: parseInt(revenueSplit.partner_share_percentage || '70'),
                platform_share_percentage: parseInt(revenueSplit.platform_share_percentage || '30'),
                max_claims: fields.max_claims ? parseInt(fields.max_claims) : undefined,
                total_claims_count: parseInt(fields.total_claims_count || '0'),
                is_active: fields.is_active || false,
                generates_unique_claim_metadata: fields.generates_unique_claim_metadata || false,
                max_uses_per_claim: fields.max_uses_per_claim ? parseInt(fields.max_uses_per_claim) : undefined,
                expiration_timestamp_ms: fields.expiration_timestamp_ms ? parseInt(fields.expiration_timestamp_ms) : undefined,
                tags: Array.isArray(fields.tags) ? fields.tags : (fields.tags?.length > 0 ? [fields.tags] : []),
                icon: fields.icon,
                packageId,
              } as PerkDefinition;
            }
          } catch (err) {
            console.warn(`Failed to fetch perk ${id}:`, err);
            return null;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        const validPerks = batchResults.filter((perk): perk is PerkDefinition => 
          perk !== null && perk.is_active
        );
        fetchedPerks.push(...validPerks);
        
        // Small delay between batches
        if (i + batchSize < perkIds.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return fetchedPerks;
    } catch (error) {
      console.error('Failed to fetch marketplace perks:', error);
      throw error;
    }
  };

  // Fetch partner names
  const fetchPartnerNames = async (partnerCapIds: string[]) => {
    if (!suiClient || partnerCapIds.length === 0) return;

    try {
      const newNames = new Map<string, string>();
      
      for (const partnerCapId of partnerCapIds) {
        try {
          const result = await suiClient.getObject({
            id: partnerCapId,
            options: {
              showContent: true,
              showType: true,
            },
          });

          if (result?.data?.content && result.data.content.dataType === 'moveObject') {
            const fields = (result.data.content as any).fields;
            const companyName = fields.partner_name || 'Unknown Partner';
            newNames.set(partnerCapId, companyName);
          } else {
            newNames.set(partnerCapId, 'Unknown Partner');
          }
        } catch (error) {
          newNames.set(partnerCapId, 'Unknown Partner');
        }
      }
      
      setPartnerNames(prev => new Map([...prev, ...newNames]));
    } catch (error) {
      console.error('Failed to fetch partner names:', error);
    }
  };

  // Fetch user's claimed perks
  const fetchClaimedPerks = async () => {
    if (!suiClient || !currentAccount?.address) {
      setClaimedPerks(new Set());
      return;
    }

    try {
      const packageId = SUI_CONFIG.packageIds.perkManager;
      
      const claimedObjects = await suiClient.getOwnedObjects({
        owner: currentAccount.address,
        filter: {
          StructType: `${packageId}::perk_manager::ClaimedPerk`
        },
        options: {
          showContent: true,
          showType: true,
        },
      });

      const claimedPerkIds = new Set<string>();
      
      claimedObjects.data.forEach((obj: any) => {
        if (obj.data?.content && obj.data.content.dataType === 'moveObject') {
          const fields = (obj.data.content as any).fields;
          const perkDefinitionId = fields.perk_definition_id || fields.perkDefinitionId || fields.definition_id;
          
          if (perkDefinitionId) {
            claimedPerkIds.add(perkDefinitionId);
          }
        }
      });
      
      setClaimedPerks(claimedPerkIds);
    } catch (error) {
      console.error('Failed to fetch claimed perks:', error);
      setClaimedPerks(new Set());
    }
  };

  // Fetch user's Alpha Points balance
  const fetchUserAlphaPoints = async () => {
    if (!suiClient || !currentAccount?.address) {
      setUserAlphaPoints(0);
      return;
    }

    try {
      // This would typically query the user's ledger entry
      // For now, we'll use a placeholder value
      setUserAlphaPoints(10000); // Placeholder
    } catch (error) {
      console.error('Failed to fetch user Alpha Points:', error);
      setUserAlphaPoints(0);
    }
  };

  // Load all data
  const loadMarketplaceData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Try cache first
      const cachedPerks = getLocalStorageCache();
      if (cachedPerks && cachedPerks.length > 0) {
        // Apply brand filtering to cached perks
        const filteredPerks = cachedPerks.filter(perk => shouldDisplayPerk(perk, BRAND_CONFIG));
        setPerks(filteredPerks);
        setIsLoading(false);
        
        // Load partner names in background for cached data
        const uniquePartnerCapIds = [...new Set(filteredPerks.map(perk => perk.creator_partner_cap_id))];
        fetchPartnerNames(uniquePartnerCapIds);
        return;
      }
      
      // Fetch fresh data
      const allPerks = await fetchMarketplacePerks();
      
      // Apply brand filtering
      const filteredPerks = allPerks.filter(perk => shouldDisplayPerk(perk, BRAND_CONFIG));
      
      setPerks(filteredPerks);
      setLocalStorageCache(allPerks); // Cache all perks, filter on display
      
      // Load partner names
      if (filteredPerks.length > 0) {
        const uniquePartnerCapIds = [...new Set(filteredPerks.map(perk => perk.creator_partner_cap_id))];
        fetchPartnerNames(uniquePartnerCapIds);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load perks';
      setError(errorMessage);
      toast.error('Failed to load marketplace perks');
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh data
  const refresh = async () => {
    // Clear cache
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_EXPIRY_KEY);
    
    await loadMarketplaceData();
    await fetchClaimedPerks();
    await fetchUserAlphaPoints();
    
    toast.success('Marketplace refreshed!');
  };

  // Initial load
  useEffect(() => {
    loadMarketplaceData();
  }, [suiClient]);

  // Load user-specific data when account changes
  useEffect(() => {
    fetchClaimedPerks();
    fetchUserAlphaPoints();
  }, [currentAccount?.address, suiClient]);

  // Apply brand configuration sorting
  const sortedPerks = useMemo(() => {
    return [...perks].sort((a, b) => {
      switch (BRAND_CONFIG.perks.defaultSort) {
        case 'alphabetical':
          return a.name.localeCompare(b.name);
        case 'date':
          return b.last_price_update_timestamp_ms - a.last_price_update_timestamp_ms;
        case 'price-low':
          return a.current_alpha_points_price - b.current_alpha_points_price;
        case 'price-high':
          return b.current_alpha_points_price - a.current_alpha_points_price;
        case 'claims':
          return b.total_claims_count - a.total_claims_count;
        default:
          return 0;
      }
    });
  }, [perks]);

  return {
    perks: sortedPerks,
    isLoading,
    error,
    partnerNames,
    claimedPerks,
    userAlphaPoints,
    refresh,
    hasPerkClaimed: (perkId: string) => claimedPerks.has(perkId),
    canAffordPerk: (perk: PerkDefinition) => userAlphaPoints >= perk.current_alpha_points_price,
  };
}; 