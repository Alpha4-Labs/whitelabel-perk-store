import React, { useState, useEffect, useMemo } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { Button } from './ui/Button';
import { Skeleton } from './ui/Skeleton';
import { BRAND_CONFIG } from '../config/brand';
import { SUI_CONFIG } from '../config/sui';
import { toast } from 'react-hot-toast';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// Types for owned perks
interface OwnedPerk {
  id: string;
  perkDefinitionId: string;
  name: string;
  description: string;
  perkType: string;
  icon: string;
  status: string;
  remainingUses: number | null;
  claimTimestamp: number;
  tags: string[];
  redemptionType: RedemptionType;
}

// Different redemption patterns
type RedemptionType = 
  | 'voucher_code'      // Generate a code for external use
  | 'digital_delivery'  // Deliver digital content immediately
  | 'service_booking'   // Book a service/appointment
  | 'membership_access' // Grant access to exclusive content
  | 'physical_claim';   // Claim physical goods

// Redemption result types
interface RedemptionResult {
  success: boolean;
  type: RedemptionType;
  data: {
    code?: string;
    downloadUrl?: string;
    bookingId?: string;
    accessToken?: string;
    claimTicket?: string;
    instructions?: string;
    expiresAt?: number;
  };
  message: string;
}

// Mock redemption opportunities - require owning specific perks
interface RedemptionOpportunity {
  id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  icon: string;
  rewardType: string;
  rewardDescription: string;
  requirements: {
    perkName: string;
    perkType: string;
    quantity: number;
    description: string;
  }[];
  estimatedValue: string;
  timeToRedeem: string;
}

// ===============================================
// TEMPLATE REDEMPTION OPPORTUNITIES
// ===============================================
// These are examples for deployers to customize for their own redemption portals.
// Each template shows different object consumption patterns:
//
// 1. Single Object → Service Exchange
// 2. Multiple Same Objects → Upgraded Service  
// 3. Mixed Object Types → Complex Reward
// 4. Voucher Bundle → Physical Product
// 5. High Volume → Exclusive Access
// 6. Cross-Category → Hybrid Reward
//
// DEPLOYER INSTRUCTIONS:
// - Replace these templates with your own redemption opportunities
// - Update perkType to match your curated marketplace objects
// - Customize titles, descriptions, rewards, and requirements
// - Set realistic estimatedValue and timeToRedeem
// - Test requirement checking logic with your object types
//
// OBJECT CONSUMPTION PATTERNS:
// - perkType: 'membership_access', 'voucher_code', 'digital_delivery', 'service_booking', 'physical_claim'
// - quantity: How many objects of this type are required
// - Requirements are AND logic (all must be met)
// ===============================================

const TEMPLATE_REDEMPTION_OPPORTUNITIES: RedemptionOpportunity[] = [
  // TEMPLATE 1: Single Object → Service Exchange
  {
    id: 'single-object-service',
    title: '1-on-1 Strategy Session',
    description: 'Exchange your consultation perk for a personalized strategy session',
    difficulty: 'Easy',
    icon: '💼',
    rewardType: 'Professional Service',
    rewardDescription: '60-minute 1-on-1 strategy session with founder + follow-up summary',
    requirements: [
      {
        perkName: 'Strategy Consultation Pass',
        perkType: 'service_booking',
        quantity: 1,
        description: 'Exchange 1 Strategy Consultation Pass'
      }
    ],
    estimatedValue: '$300',
    timeToRedeem: 'Instant booking'
  },

  // TEMPLATE 2: Multiple Same Objects → Upgraded Service
  {
    id: 'multiple-same-upgrade',
    title: 'VIP Discord Access',
    description: 'Combine multiple membership perks for premium community access',
    difficulty: 'Medium',
    icon: '🌟',
    rewardType: 'Enhanced Access',
    rewardDescription: 'VIP Discord channels + Weekly AMA access + Priority DMs',
    requirements: [
      {
        perkName: 'Community Membership',
        perkType: 'membership_access',
        quantity: 3,
        description: 'Combine 3 Community Membership perks'
      }
    ],
    estimatedValue: '$150',
    timeToRedeem: '1-2 minutes'
  },

  // TEMPLATE 3: Mixed Object Types → Complex Reward
  {
    id: 'mixed-objects-complex',
    title: 'Complete Business Package',
    description: 'Ultimate business growth package requiring diverse perk portfolio',
    difficulty: 'Hard',
    icon: '🚀',
    rewardType: 'Business Package',
    rewardDescription: 'Brand audit + Website review + 3-month mentorship + Exclusive tools access',
    requirements: [
      {
        perkName: 'Business Consultation',
        perkType: 'service_booking',
        quantity: 1,
        description: 'Business consultation service'
      },
      {
        perkName: 'Premium Tools Access',
        perkType: 'digital_delivery',
        quantity: 2,
        description: '2 different premium tool licenses'
      },
      {
        perkName: 'VIP Membership',
        perkType: 'membership_access',
        quantity: 1,
        description: 'Active VIP membership status'
      }
    ],
    estimatedValue: '$2,500',
    timeToRedeem: '24-48 hours'
  },

  // TEMPLATE 4: Voucher Bundle → Physical Product
  {
    id: 'voucher-to-physical',
    title: 'Exclusive Merchandise Bundle',
    description: 'Convert your discount vouchers into premium branded merchandise',
    difficulty: 'Medium',
    icon: '📦',
    rewardType: 'Physical Bundle',
    rewardDescription: 'Premium hoodie + Signed book + Exclusive stickers + Limited edition mug',
    requirements: [
      {
        perkName: 'Discount Vouchers',
        perkType: 'voucher_code',
        quantity: 5,
        description: 'Redeem 5 discount voucher codes'
      }
    ],
    estimatedValue: '$200',
    timeToRedeem: '3-5 business days'
  },

  // TEMPLATE 5: High Volume → Exclusive Access
  {
    id: 'high-volume-exclusive',
    title: 'Founder\'s Inner Circle',
    description: 'Elite tier requiring significant perk investment for ultimate access',
    difficulty: 'Hard',
    icon: '👑',
    rewardType: 'Elite Membership',
    rewardDescription: 'Monthly founder dinners + Private Slack + Equity opportunities + Personal intro network',
    requirements: [
      {
        perkName: 'Any Membership Perks',
        perkType: 'membership_access',
        quantity: 10,
        description: 'Accumulate 10 membership perks of any type'
      },
      {
        perkName: 'Service Experiences',
        perkType: 'service_booking',
        quantity: 3,
        description: 'Complete 3 different service bookings'
      }
    ],
    estimatedValue: '$10,000+',
    timeToRedeem: 'Manual review (2-7 days)'
  },

  // TEMPLATE 6: Cross-Category → Hybrid Reward
  {
    id: 'cross-category-hybrid',
    title: 'Creator Economy Accelerator',
    description: 'Perfect for content creators - combines tools, mentorship, and promotion',
    difficulty: 'Hard',
    icon: '🎬',
    rewardType: 'Creator Package',
    rewardDescription: 'Video editing tools + Content strategy session + Social media promotion + Revenue optimization',
    requirements: [
      {
        perkName: 'Digital Tools',
        perkType: 'digital_delivery',
        quantity: 3,
        description: '3 different digital tool/software licenses'
      },
      {
        perkName: 'Strategy Session',
        perkType: 'service_booking',
        quantity: 1,
        description: '1 strategy/consultation booking'
      },
      {
        perkName: 'Promotional Credits',
        perkType: 'voucher_code',
        quantity: 2,
        description: '2 promotional/advertising credit vouchers'
      }
    ],
    estimatedValue: '$1,200',
    timeToRedeem: '1-2 weeks setup'
  }
];

export const PerkRedemptionCenter: React.FC = () => {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  
  const [ownedPerks, setOwnedPerks] = useState<OwnedPerk[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPerk, setSelectedPerk] = useState<OwnedPerk | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redemptionResult, setRedemptionResult] = useState<RedemptionResult | null>(null);
  const [filterType, setFilterType] = useState<RedemptionType | 'all'>('all');
  const [activeSlide, setActiveSlide] = useState(0);

  // Fetch owned perks on mount and account change
  useEffect(() => {
    if (currentAccount?.address) {
      fetchOwnedPerks();
    }
  }, [currentAccount?.address]);

  const fetchOwnedPerks = async () => {
    if (!currentAccount?.address) return;
    
    setIsLoading(true);
    try {
      console.log('🔍 Fetching owned perks for:', currentAccount.address);
      console.log('🔧 Using package:', SUI_CONFIG.packageIds.perkManager);
      
      const packageId = SUI_CONFIG.packageIds.perkManager;
      
      // Query for ClaimedPerk objects owned by the user (using same pattern as marketplace)
      let ownedObjects = await suiClient.getOwnedObjects({
        owner: currentAccount.address,
        filter: {
          StructType: `${packageId}::perk_manager::ClaimedPerk`
        },
        options: {
          showContent: true,
          showType: true,
        },
      });

      console.log('📦 Found', ownedObjects.data.length, 'owned perk objects using specific filter');

      // If no results, try querying all objects and filtering (fallback mechanism like marketplace)
      if (ownedObjects.data.length === 0) {
        console.log('🔄 No results with specific filter, trying fallback method...');
        const allObjects = await suiClient.getOwnedObjects({
          owner: currentAccount.address,
          options: {
            showContent: true,
            showType: true,
          },
        });
        
        // Filter for ClaimedPerk objects
        const claimedPerkObjects = allObjects.data.filter((obj: any) => {
          const objectType = obj.data?.type;
          return objectType && objectType.includes('ClaimedPerk');
        });
        
        console.log('📦 Found', claimedPerkObjects.length, 'claimed perk objects using fallback method');
        
        ownedObjects = {
          data: claimedPerkObjects,
          hasNextPage: false,
          nextCursor: null
        };
      }

      const perks: OwnedPerk[] = [];

      for (const obj of ownedObjects.data) {
        if (obj.data?.content && obj.data.content.dataType === 'moveObject') {
          const fields = (obj.data.content as any).fields;
          
          try {
            // Try different possible field names (same as marketplace)
            const perkDefinitionId = fields.perk_definition_id || fields.perkDefinitionId || fields.definition_id;
            
            if (!perkDefinitionId) {
              console.warn('No perk definition ID found in object:', obj.data.objectId, fields);
              continue;
            }
            
            console.log('🎯 Processing claimed perk:', obj.data.objectId, 'for definition:', perkDefinitionId);
            
            // Get the perk definition details
            const perkDefResponse = await suiClient.getObject({
              id: perkDefinitionId,
              options: { showContent: true }
            });

            if (perkDefResponse.data?.content && 'fields' in perkDefResponse.data.content) {
              const defFields = perkDefResponse.data.content.fields as any;
              
              // Parse remaining uses properly
              let remainingUses = null;
              if (fields.remaining_uses !== undefined && fields.remaining_uses !== null) {
                remainingUses = typeof fields.remaining_uses === 'number' 
                  ? fields.remaining_uses 
                  : parseInt(fields.remaining_uses) || null;
              }
              
              const perk: OwnedPerk = {
                id: obj.data.objectId,
                perkDefinitionId: perkDefinitionId,
                name: defFields.name || 'Unknown Perk',
                description: defFields.description || 'No description available',
                perkType: defFields.perk_type || 'Unknown',
                icon: '🎁', // Default icon, could be enhanced
                status: fields.status || 'ACTIVE',
                remainingUses: remainingUses,
                claimTimestamp: parseInt(fields.claim_timestamp_ms) || Date.now(),
                tags: defFields.tags || [],
                redemptionType: determineRedemptionType(defFields)
              };
              
              console.log('✅ Successfully processed perk:', perk.name, 'Type:', perk.redemptionType);
              perks.push(perk);
            } else {
              console.warn('Failed to get perk definition content for:', perkDefinitionId);
            }
          } catch (error) {
            console.warn('Failed to fetch perk definition for:', fields.perk_definition_id, error);
          }
        }
      }

      setOwnedPerks(perks);
      console.log('✅ Processed', perks.length, 'total owned perks');
      
      if (perks.length === 0) {
        console.log('ℹ️ No owned perks found. User may need to purchase perks from the Marketplace tab.');
      }
      
    } catch (error) {
      console.error('❌ Error fetching owned perks:', error);
      toast.error('Failed to load your perks. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Determine redemption type based on perk characteristics
  const determineRedemptionType = (defFields: any): RedemptionType => {
    const name = (defFields.name || '').toLowerCase();
    const description = (defFields.description || '').toLowerCase();
    const tags = defFields.tags || [];
    
    // Check tags first for explicit redemption types
    if (tags.some((tag: string) => tag.toLowerCase().includes('voucher') || tag.toLowerCase().includes('code'))) {
      return 'voucher_code';
    }
    if (tags.some((tag: string) => tag.toLowerCase().includes('digital') || tag.toLowerCase().includes('download'))) {
      return 'digital_delivery';
    }
    if (tags.some((tag: string) => tag.toLowerCase().includes('booking') || tag.toLowerCase().includes('appointment'))) {
      return 'service_booking';
    }
    if (tags.some((tag: string) => tag.toLowerCase().includes('membership') || tag.toLowerCase().includes('access'))) {
      return 'membership_access';
    }
    if (tags.some((tag: string) => tag.toLowerCase().includes('physical') || tag.toLowerCase().includes('shipping'))) {
      return 'physical_claim';
    }
    
    // Fallback to name/description analysis
    if (name.includes('voucher') || name.includes('code') || description.includes('voucher')) {
      return 'voucher_code';
    }
    if (name.includes('download') || name.includes('digital') || description.includes('digital')) {
      return 'digital_delivery';
    }
    if (name.includes('booking') || name.includes('appointment') || description.includes('schedule')) {
      return 'service_booking';
    }
    if (name.includes('membership') || name.includes('access') || name.includes('premium')) {
      return 'membership_access';
    }
    if (name.includes('merch') || name.includes('physical') || name.includes('shipping')) {
      return 'physical_claim';
    }
    
    // Default to voucher code for unknown types
    return 'voucher_code';
  };

  // Filter perks based on selected type
  const filteredPerks = useMemo(() => {
    if (filterType === 'all') return ownedPerks;
    return ownedPerks.filter(perk => perk.redemptionType === filterType);
  }, [ownedPerks, filterType]);

  // Handle perk redemption
  const handleRedeemPerk = async (perk: OwnedPerk) => {
    if (!currentAccount?.address) return;
    
    setIsRedeeming(true);
    setSelectedPerk(perk);
    setRedemptionResult(null);
    
    try {
      console.log('🎁 Redeeming perk:', perk.name, 'Type:', perk.redemptionType);
      
      // Simulate different redemption patterns
      const result = await simulateRedemption(perk);
      
      if (result.success) {
        setRedemptionResult(result);
        toast.success(`${perk.name} redeemed successfully!`);
        
        // Refresh owned perks to reflect changes
        setTimeout(() => {
          fetchOwnedPerks();
        }, 2000);
      } else {
        toast.error(result.message);
      }
      
    } catch (error) {
      console.error('❌ Redemption failed:', error);
      toast.error('Redemption failed. Please try again.');
    } finally {
      setIsRedeeming(false);
      setSelectedPerk(null);
    }
  };

  // Handle redemption opportunity
  const handleRedemptionOpportunity = async (opportunity: RedemptionOpportunity) => {
    if (!currentAccount?.address) return;
    
    // Check if user meets requirements
    const meetsRequirements = checkRedemptionRequirements(opportunity, ownedPerks);
    
    if (!meetsRequirements.canRedeem) {
      toast.error(`Missing requirements: ${meetsRequirements.missingRequirements.join(', ')}`);
      return;
    }
    
    setIsRedeeming(true);
    
    try {
      console.log('🏆 Redeeming opportunity:', opportunity.title);
      
      // Simulate opportunity redemption (2-5 seconds based on difficulty)
      const redeemTime = opportunity.difficulty === 'Easy' ? 1000 : 
                        opportunity.difficulty === 'Medium' ? 3000 : 5000;
      
      await new Promise(resolve => setTimeout(resolve, redeemTime));
      
      const result: RedemptionResult = {
        success: true,
        type: 'membership_access', // Default type for opportunities
        data: {
          code: `${opportunity.id.toUpperCase()}-${Math.random().toString(36).substring(2, 8)}`,
          instructions: `Your ${opportunity.title} has been activated! ${opportunity.rewardDescription}`,
          expiresAt: Date.now() + (365 * 24 * 60 * 60 * 1000) // 1 year
        },
        message: `${opportunity.title} redeemed successfully!`
      };
      
      setRedemptionResult(result);
      toast.success(`🏆 ${opportunity.title} unlocked!`);
      
      // Refresh owned perks
      setTimeout(() => {
        fetchOwnedPerks();
      }, 2000);
      
    } catch (error) {
      console.error('❌ Opportunity redemption failed:', error);
      toast.error('Redemption failed. Please try again.');
    } finally {
      setIsRedeeming(false);
    }
  };

  // Check if user meets redemption requirements
  const checkRedemptionRequirements = (opportunity: RedemptionOpportunity, userPerks: OwnedPerk[]) => {
    const missingRequirements: string[] = [];
    
    for (const requirement of opportunity.requirements) {
      const matchingPerks = userPerks.filter(perk => 
        perk.redemptionType === requirement.perkType && 
        perk.status === 'ACTIVE'
      );
      
      if (matchingPerks.length < requirement.quantity) {
        const missing = requirement.quantity - matchingPerks.length;
        missingRequirements.push(`${missing}x ${requirement.perkName}`);
      }
    }
    
    return {
      canRedeem: missingRequirements.length === 0,
      missingRequirements
    };
  };

  // Simulate different redemption patterns (in real implementation, this would interact with your backend)
  const simulateRedemption = async (perk: OwnedPerk): Promise<RedemptionResult> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    switch (perk.redemptionType) {
      case 'voucher_code':
        return {
          success: true,
          type: 'voucher_code',
          data: {
            code: generateVoucherCode(),
            instructions: 'Use this code at checkout to receive your discount or item.',
            expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
          },
          message: 'Voucher code generated successfully!'
        };
        
      case 'digital_delivery':
        return {
          success: true,
          type: 'digital_delivery',
          data: {
            downloadUrl: `https://downloads.${BRAND_CONFIG.company.name.toLowerCase()}.com/${generateDownloadId()}`,
            instructions: 'Your digital content is ready for download. Link expires in 7 days.',
            expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
          },
          message: 'Digital content delivered successfully!'
        };
        
      case 'service_booking':
        return {
          success: true,
          type: 'service_booking',
          data: {
            bookingId: generateBookingId(),
            instructions: 'Your service slot has been reserved. You will receive a confirmation email shortly.',
            expiresAt: Date.now() + (90 * 24 * 60 * 60 * 1000) // 90 days to use
          },
          message: 'Service booking confirmed!'
        };
        
      case 'membership_access':
        return {
          success: true,
          type: 'membership_access',
          data: {
            accessToken: generateAccessToken(),
            instructions: 'Your premium access has been activated. Use this token to access exclusive content.',
            expiresAt: Date.now() + (365 * 24 * 60 * 60 * 1000) // 1 year
          },
          message: 'Premium access granted!'
        };
        
      case 'physical_claim':
        return {
          success: true,
          type: 'physical_claim',
          data: {
            claimTicket: generateClaimTicket(),
            instructions: 'Please provide this claim ticket and your ID when collecting your item. Processing time: 5-7 business days.',
            expiresAt: Date.now() + (60 * 24 * 60 * 60 * 1000) // 60 days to claim
          },
          message: 'Physical item claim initiated!'
        };
        
      default:
        return {
          success: false,
          type: perk.redemptionType,
          data: {},
          message: 'Unknown redemption type'
        };
    }
  };

  // Helper functions for generating redemption data
  const generateVoucherCode = () => `${BRAND_CONFIG.company.name.substring(0, 3).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const generateDownloadId = () => Math.random().toString(36).substring(2, 15);
  const generateBookingId = () => `BK-${Date.now().toString().slice(-8)}`;
  const generateAccessToken = () => `AT-${Math.random().toString(36).substring(2, 20).toUpperCase()}`;
  const generateClaimTicket = () => `CT-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  // Get redemption type display info
  const getRedemptionTypeInfo = (type: RedemptionType) => {
    switch (type) {
      case 'voucher_code':
        return { icon: '🎫', label: 'Voucher Code', color: 'text-blue-600' };
      case 'digital_delivery':
        return { icon: '📱', label: 'Digital Delivery', color: 'text-green-600' };
      case 'service_booking':
        return { icon: '📅', label: 'Service Booking', color: 'text-purple-600' };
      case 'membership_access':
        return { icon: '👑', label: 'Premium Access', color: 'text-yellow-600' };
      case 'physical_claim':
        return { icon: '📦', label: 'Physical Item', color: 'text-orange-600' };
      default:
        return { icon: '🎁', label: 'Unknown', color: 'text-gray-600' };
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-6 rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
              <Skeleton className="h-6 w-3/4 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3 mb-4" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
          🎁 Perk Redemption Center
        </h2>
        <p className="text-lg" style={{ color: 'var(--color-text-muted)' }}>
          Redeem your owned perks instantly or combine them for exclusive rewards
        </p>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Left Side: Owned Perks */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
                🎫 Your Owned Perks
              </h3>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Instantly redeem any of your owned perks
              </p>
            </div>
            <Button onClick={fetchOwnedPerks} variant="outline" size="sm">
              🔄 Refresh
            </Button>
          </div>

          {/* Filter Tabs for Owned Perks */}
          <div className="flex flex-wrap gap-2">
            {(['all', 'voucher_code', 'digital_delivery', 'service_booking', 'membership_access', 'physical_claim'] as const).map((type) => {
              const isActive = filterType === type;
              const typeInfo = type === 'all' 
                ? { icon: '🎁', label: 'All', color: 'text-gray-600' }
                : getRedemptionTypeInfo(type);
              
              return (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    isActive 
                      ? 'shadow-md' 
                      : 'hover:opacity-80'
                  }`}
                  style={{
                    backgroundColor: isActive ? 'var(--color-primary)' : 'var(--color-background-card)',
                    color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  {typeInfo.icon} {typeInfo.label}
                </button>
              );
            })}
          </div>

          {/* Owned Perks Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div 
              className="p-3 rounded-lg text-center"
              style={{ 
                backgroundColor: 'var(--color-background-card)',
                border: '1px solid var(--color-border)'
              }}
            >
              <div className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
                {ownedPerks.length}
              </div>
              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Total Owned
              </div>
            </div>
            
            <div 
              className="p-3 rounded-lg text-center"
              style={{ 
                backgroundColor: 'var(--color-background-card)',
                border: '1px solid var(--color-border)'
              }}
            >
              <div className="text-xl font-bold" style={{ color: 'var(--color-success)' }}>
                {ownedPerks.filter(p => p.status === 'ACTIVE').length}
              </div>
              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Ready to Use
              </div>
            </div>
          </div>

          {/* Owned Perks Grid with Scroll */}
          {filteredPerks.length === 0 ? (
            <div 
              className="text-center py-12 rounded-xl"
              style={{ 
                backgroundColor: 'var(--color-background-card)',
                border: '1px solid var(--color-border)'
              }}
            >
              <div className="text-4xl mb-3">🎁</div>
              <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                {filterType === 'all' ? 'No Perks Owned' : 'No Perks of This Type'}
              </h4>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {filterType === 'all' 
                  ? 'Visit the Marketplace tab to purchase your first perk!'
                  : `No ${getRedemptionTypeInfo(filterType as RedemptionType).label.toLowerCase()} perks found.`
                }
              </p>
            </div>
          ) : (
            <div 
              className="space-y-3 max-h-[600px] overflow-y-auto pr-2"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'var(--color-border) transparent'
              }}
            >
              {/* Show count indicator if more than 5 */}
              {filteredPerks.length > 5 && (
                <div 
                  className="text-xs text-center py-2 rounded-lg"
                  style={{ 
                    backgroundColor: 'var(--color-background)',
                    color: 'var(--color-text-muted)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  📜 Showing {filteredPerks.length} perks - scroll to see all
                </div>
              )}
              
              {filteredPerks.map((perk) => {
                const typeInfo = getRedemptionTypeInfo(perk.redemptionType);
                return (
                  <PerkRedemptionCard
                    key={perk.id}
                    perk={perk}
                    typeInfo={typeInfo}
                    onRedeem={() => handleRedeemPerk(perk)}
                    isRedeeming={isRedeeming && selectedPerk?.id === perk.id}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Redemption Opportunities */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
                🏆 Redemption Opportunities
              </h3>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Combine your perks for exclusive rewards
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {activeSlide + 1} of {TEMPLATE_REDEMPTION_OPPORTUNITIES.length} templates • Swipe to explore
              </div>
              
              {/* Navigation Arrows positioned under "swipe to explore" text */}
              <div className="flex items-center gap-2">
                <button
                  className="swiper-button-prev-custom w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 hover:scale-110"
                  style={{
                    backgroundColor: 'var(--color-background-card)',
                    borderColor: 'var(--color-primary)',
                    color: 'var(--color-primary)',
                  }}
                >
                  <span className="text-sm">‹</span>
                </button>
                <button
                  className="swiper-button-next-custom w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 hover:scale-110"
                  style={{
                    backgroundColor: 'var(--color-background-card)',
                    borderColor: 'var(--color-primary)',
                    color: 'var(--color-primary)',
                  }}
                >
                  <span className="text-sm">›</span>
                </button>
              </div>
            </div>
          </div>

          {/* Redemption Opportunities Swiper */}
          <div className="redemption-swiper-container">
            <style>{`
              .redemption-opportunities-swiper .swiper-pagination {
                bottom: 8px !important;
              }
              .redemption-opportunities-swiper .swiper-pagination-bullet {
                opacity: 0.5;
                transition: all 0.3s ease;
              }
              .redemption-opportunities-swiper .swiper-pagination-bullet-active {
                opacity: 1;
                transform: scale(1.2);
              }
              .redemption-opportunities-swiper .swiper-button-prev,
              .redemption-opportunities-swiper .swiper-button-next {
                display: none;
              }
            `}</style>
            <Swiper
              modules={[Navigation, Pagination, Autoplay]}
              spaceBetween={20}
              slidesPerView={1}
              navigation={{
                nextEl: '.swiper-button-next-custom',
                prevEl: '.swiper-button-prev-custom',
              }}
              pagination={{
                clickable: true,
                dynamicBullets: true,
              }}
              autoplay={{
                delay: 8000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              loop={TEMPLATE_REDEMPTION_OPPORTUNITIES.length > 1}
              onSlideChange={(swiper) => setActiveSlide(swiper.realIndex)}
              className="redemption-opportunities-swiper"
              style={{ 
                paddingBottom: '40px',
                '--swiper-navigation-color': 'var(--color-primary)',
                '--swiper-pagination-color': 'var(--color-primary)',
                '--swiper-pagination-bullet-inactive-color': 'var(--color-border)',
              } as React.CSSProperties}
            >
              {TEMPLATE_REDEMPTION_OPPORTUNITIES.map((opportunity) => (
                <SwiperSlide key={opportunity.id}>
                  <RedemptionOpportunityCard
                    opportunity={opportunity}
                    ownedPerks={ownedPerks}
                    onRedeem={() => handleRedemptionOpportunity(opportunity)}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>

      </div>

      {/* Redemption Result Modal */}
      {redemptionResult && (
        <RedemptionResultModal
          result={redemptionResult}
          onClose={() => setRedemptionResult(null)}
        />
      )}
    </div>
  );
};

// Individual perk redemption card component
interface PerkRedemptionCardProps {
  perk: OwnedPerk;
  typeInfo: { icon: string; label: string; color: string };
  onRedeem: () => void;
  isRedeeming: boolean;
}

const PerkRedemptionCard: React.FC<PerkRedemptionCardProps> = ({
  perk,
  typeInfo,
  onRedeem,
  isRedeeming
}) => {
  const canRedeem = perk.status === 'ACTIVE' && (perk.remainingUses === null || perk.remainingUses > 0);
  
  return (
    <div 
      className="p-4 rounded-lg border transition-all duration-200 hover:shadow-md"
      style={{ 
        backgroundColor: 'var(--color-background-card)',
        borderColor: canRedeem ? 'var(--color-primary)' : 'var(--color-border)',
        borderWidth: canRedeem ? '2px' : '1px'
      }}
    >
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="text-lg">{perk.icon}</div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate" style={{ color: 'var(--color-text)' }}>
              {perk.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span 
                className="text-xs px-2 py-1 rounded-full"
                style={{ 
                  backgroundColor: 'var(--color-background)',
                  color: 'var(--color-text-muted)',
                  border: '1px solid var(--color-border)'
                }}
              >
                {typeInfo.icon} {typeInfo.label}
              </span>
              {perk.status === 'ACTIVE' && (
                <span 
                  className="text-xs px-2 py-1 rounded-full"
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    color: '#059669',
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                  }}
                >
                  Ready
                </span>
              )}
            </div>
          </div>
        </div>
        
        {perk.remainingUses !== null && (
          <div className="text-right ml-2">
            <div className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
              {perk.remainingUses}
            </div>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              uses
            </div>
          </div>
        )}
      </div>

      {/* Compact Description */}
      <p className="text-xs mb-3 line-clamp-1" style={{ color: 'var(--color-text-muted)' }}>
        {perk.description}
      </p>

      {/* Action Button */}
      <Button
        onClick={onRedeem}
        disabled={!canRedeem || isRedeeming}
        variant={canRedeem ? "default" : "outline"}
        size="sm"
        className="w-full"
      >
        {isRedeeming ? (
          <>🔄 Redeeming...</>
        ) : !canRedeem ? (
          '❌ Cannot Redeem'
        ) : (
          <>🎁 Redeem Now</>
        )}
      </Button>
    </div>
  );
};

// Redemption result modal component
// Redemption opportunity card component
interface RedemptionOpportunityCardProps {
  opportunity: RedemptionOpportunity;
  ownedPerks: OwnedPerk[];
  onRedeem: () => void;
}

const RedemptionOpportunityCard: React.FC<RedemptionOpportunityCardProps> = ({
  opportunity,
  ownedPerks,
  onRedeem
}) => {
  const requirementCheck = useMemo(() => {
    const missingRequirements: string[] = [];
    let totalRequired = 0;
    let totalOwned = 0;
    
    for (const requirement of opportunity.requirements) {
      const matchingPerks = ownedPerks.filter(perk => 
        perk.redemptionType === requirement.perkType && 
        perk.status === 'ACTIVE'
      );
      
      totalRequired += requirement.quantity;
      totalOwned += Math.min(matchingPerks.length, requirement.quantity);
      
      if (matchingPerks.length < requirement.quantity) {
        const missing = requirement.quantity - matchingPerks.length;
        missingRequirements.push(`${missing}x ${requirement.perkName}`);
      }
    }
    
    return {
      canRedeem: missingRequirements.length === 0,
      missingRequirements,
      completionPercent: Math.round((totalOwned / totalRequired) * 100)
    };
  }, [opportunity.requirements, ownedPerks]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return '#10B981'; // green
      case 'Medium': return '#F59E0B'; // amber
      case 'Hard': return '#EF4444'; // red
      default: return '#6B7280'; // gray
    }
  };

  return (
    <div 
      className="p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-lg h-full flex flex-col"
      style={{ 
        backgroundColor: 'var(--color-background-card)',
        borderColor: requirementCheck.canRedeem ? '#10B981' : 'var(--color-border)',
        minHeight: '450px'
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-xl">{opportunity.icon}</div>
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-semibold" style={{ color: 'var(--color-text)' }}>
                {opportunity.title}
              </h4>
              <span 
                className="px-2 py-1 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: getDifficultyColor(opportunity.difficulty) }}
              >
                {opportunity.difficulty}
              </span>
            </div>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {opportunity.description}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
            {opportunity.estimatedValue}
          </div>
          <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {opportunity.timeToRedeem}
          </div>
        </div>
      </div>

      {/* Requirements */}
      <div className="space-y-2 mb-4">
        <div className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
          Requirements:
        </div>
        
        {opportunity.requirements.map((req, index) => {
          const matchingPerks = ownedPerks.filter(perk => 
            perk.redemptionType === req.perkType && 
            perk.status === 'ACTIVE'
          );
          const owned = matchingPerks.length;
          const needed = req.quantity;
          const isMet = owned >= needed;
          
          return (
            <div 
              key={index}
              className="flex items-center justify-between p-3 rounded-lg border transition-all duration-200"
              style={{ 
                backgroundColor: isMet 
                  ? 'rgba(16, 185, 129, 0.1)' 
                  : 'rgba(239, 68, 68, 0.1)',
                borderColor: isMet ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'
              }}
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm">{isMet ? '✅' : '❌'}</span>
                  <div className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                    {req.perkName}
                  </div>
                </div>
                <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {req.description}
                </div>
              </div>
              
              <div 
                className="text-sm font-bold px-2 py-1 rounded-lg ml-3"
                style={{ 
                  backgroundColor: isMet 
                    ? 'rgba(16, 185, 129, 0.2)' 
                    : 'rgba(239, 68, 68, 0.2)',
                  color: isMet ? '#059669' : '#DC2626'
                }}
              >
                {owned}/{needed}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
          <span>Progress</span>
          <span>{requirementCheck.completionPercent}%</span>
        </div>
        <div 
          className="w-full rounded-full h-2"
          style={{ backgroundColor: 'var(--color-border)' }}
        >
          <div 
            className="h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${requirementCheck.completionPercent}%`,
              backgroundColor: requirementCheck.canRedeem ? '#10B981' : '#F59E0B'
            }}
          />
        </div>
      </div>

      {/* Reward Preview */}
      <div 
        className="p-3 rounded-lg mb-4 flex-grow"
        style={{ 
          backgroundColor: 'var(--color-background)',
          border: '1px solid var(--color-border)'
        }}
      >
        <div className="text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
          🎁 {opportunity.rewardType}
        </div>
        <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {opportunity.rewardDescription}
        </div>
      </div>

      {/* Action Button - Always at bottom */}
      <div className="mt-auto">
        <Button
          onClick={onRedeem}
          disabled={!requirementCheck.canRedeem}
          variant={requirementCheck.canRedeem ? "default" : "outline"}
          size="sm"
          className="w-full"
        >
          {requirementCheck.canRedeem 
            ? `🏆 Redeem ${opportunity.title}` 
            : `Missing: ${requirementCheck.missingRequirements.join(', ')}`
          }
        </Button>
      </div>
    </div>
  );
};

interface RedemptionResultModalProps {
  result: RedemptionResult;
  onClose: () => void;
}

const RedemptionResultModal: React.FC<RedemptionResultModalProps> = ({ result, onClose }) => {
  const [copied, setCopied] = useState(false);
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const typeInfo = {
    voucher_code: { title: 'Voucher Code Generated', icon: '🎫' },
    digital_delivery: { title: 'Digital Content Ready', icon: '📱' },
    service_booking: { title: 'Service Booked', icon: '📅' },
    membership_access: { title: 'Access Granted', icon: '👑' },
    physical_claim: { title: 'Claim Ticket Issued', icon: '📦' }
  }[result.type] || { title: 'Redemption Complete', icon: '🎁' };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div 
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl"
        style={{ 
          backgroundColor: 'var(--color-background-card)',
          border: '1px solid var(--color-border)'
        }}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">{typeInfo.icon}</div>
          <h3 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
            {typeInfo.title}
          </h3>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {result.message}
          </p>
        </div>

        {/* Redemption Data */}
        <div className="space-y-4 mb-6">
          {result.data.code && (
            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                Voucher Code
              </label>
              <div className="flex items-center gap-2 mt-1">
                <div 
                  className="flex-1 p-3 rounded-lg font-mono text-center text-lg font-bold"
                  style={{ 
                    backgroundColor: 'var(--color-background)',
                    border: '2px solid var(--color-primary)'
                  }}
                >
                  {result.data.code}
                </div>
                <Button
                  onClick={() => copyToClipboard(result.data.code!)}
                  variant="outline"
                  size="sm"
                >
                  {copied ? '✅' : '📋'}
                </Button>
              </div>
            </div>
          )}

          {result.data.downloadUrl && (
            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                Download Link
              </label>
              <div className="flex items-center gap-2 mt-1">
                <a
                  href={result.data.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 p-3 rounded-lg text-center text-sm underline"
                  style={{ 
                    backgroundColor: 'var(--color-background)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-primary)'
                  }}
                >
                  📥 Download Now
                </a>
                <Button
                  onClick={() => copyToClipboard(result.data.downloadUrl!)}
                  variant="outline"
                  size="sm"
                >
                  📋
                </Button>
              </div>
            </div>
          )}

          {result.data.bookingId && (
            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                Booking ID
              </label>
              <div className="flex items-center gap-2 mt-1">
                <div 
                  className="flex-1 p-3 rounded-lg font-mono text-center"
                  style={{ 
                    backgroundColor: 'var(--color-background)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  {result.data.bookingId}
                </div>
                <Button
                  onClick={() => copyToClipboard(result.data.bookingId!)}
                  variant="outline"
                  size="sm"
                >
                  📋
                </Button>
              </div>
            </div>
          )}

          {result.data.accessToken && (
            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                Access Token
              </label>
              <div className="flex items-center gap-2 mt-1">
                <div 
                  className="flex-1 p-3 rounded-lg font-mono text-center text-sm"
                  style={{ 
                    backgroundColor: 'var(--color-background)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  {result.data.accessToken}
                </div>
                <Button
                  onClick={() => copyToClipboard(result.data.accessToken!)}
                  variant="outline"
                  size="sm"
                >
                  📋
                </Button>
              </div>
            </div>
          )}

          {result.data.claimTicket && (
            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                Claim Ticket
              </label>
              <div className="flex items-center gap-2 mt-1">
                <div 
                  className="flex-1 p-3 rounded-lg font-mono text-center"
                  style={{ 
                    backgroundColor: 'var(--color-background)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  {result.data.claimTicket}
                </div>
                <Button
                  onClick={() => copyToClipboard(result.data.claimTicket!)}
                  variant="outline"
                  size="sm"
                >
                  📋
                </Button>
              </div>
            </div>
          )}

          {result.data.instructions && (
            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                Instructions
              </label>
              <div 
                className="mt-1 p-3 rounded-lg text-sm"
                style={{ 
                  backgroundColor: 'var(--color-background)',
                  border: '1px solid var(--color-border)'
                }}
              >
                {result.data.instructions}
              </div>
            </div>
          )}

          {result.data.expiresAt && (
            <div className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
              ⏰ Expires: {new Date(result.data.expiresAt).toLocaleDateString()}
            </div>
          )}
        </div>

        {/* Close Button */}
        <Button
          onClick={onClose}
          variant="default"
          className="w-full"
        >
          ✅ Done
        </Button>
      </div>
    </div>
  );
}; 