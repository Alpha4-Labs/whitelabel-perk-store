import React, { useState, useEffect, useMemo } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { Button } from './ui/Button';
import { Skeleton } from './ui/Skeleton';
import { BRAND_CONFIG } from '../config/brand';
import { SUI_CONFIG } from '../config/sui';
import { toast } from 'react-hot-toast';

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

export const PerkRedemptionCenter: React.FC = () => {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  
  const [ownedPerks, setOwnedPerks] = useState<OwnedPerk[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPerk, setSelectedPerk] = useState<OwnedPerk | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redemptionResult, setRedemptionResult] = useState<RedemptionResult | null>(null);
  const [filterType, setFilterType] = useState<RedemptionType | 'all'>('all');

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
      
      // Query for ClaimedPerk objects owned by the user
      const ownedObjects = await suiClient.getOwnedObjects({
        owner: currentAccount.address,
        filter: {
          StructType: `${SUI_CONFIG.packageIds.perkManager}::perk_manager::ClaimedPerk`
        },
        options: {
          showContent: true,
          showType: true,
        },
      });

      console.log('📦 Found', ownedObjects.data.length, 'owned perk objects');

      const perks: OwnedPerk[] = [];

      for (const obj of ownedObjects.data) {
        if (obj.data?.content && 'fields' in obj.data.content) {
          const fields = obj.data.content.fields as any;
          
          try {
            // Get the perk definition details
            const perkDefResponse = await suiClient.getObject({
              id: fields.perk_definition_id,
              options: { showContent: true }
            });

            if (perkDefResponse.data?.content && 'fields' in perkDefResponse.data.content) {
              const defFields = perkDefResponse.data.content.fields as any;
              
              const perk: OwnedPerk = {
                id: obj.data.objectId,
                perkDefinitionId: fields.perk_definition_id,
                name: defFields.name || 'Unknown Perk',
                description: defFields.description || 'No description available',
                perkType: defFields.perk_type || 'Unknown',
                icon: '🎁', // Default icon, could be enhanced
                status: fields.status || 'ACTIVE',
                remainingUses: fields.remaining_uses || null,
                claimTimestamp: parseInt(fields.claim_timestamp_ms) || Date.now(),
                tags: defFields.tags || [],
                redemptionType: determineRedemptionType(defFields)
              };
              
              perks.push(perk);
            }
          } catch (error) {
            console.warn('Failed to fetch perk definition for:', fields.perk_definition_id, error);
          }
        }
      }

      setOwnedPerks(perks);
      console.log('✅ Processed', perks.length, 'owned perks');
      
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            🎁 Perk Redemption Center
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Redeem your owned perks for codes, content, services, and more
          </p>
        </div>
        
        <Button onClick={fetchOwnedPerks} variant="outline" size="sm">
          🔄 Refresh
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'voucher_code', 'digital_delivery', 'service_booking', 'membership_access', 'physical_claim'] as const).map((type) => {
          const isActive = filterType === type;
          const typeInfo = type === 'all' 
            ? { icon: '🎁', label: 'All Perks', color: 'text-gray-600' }
            : getRedemptionTypeInfo(type);
          
          return (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div 
          className="p-4 rounded-lg text-center"
          style={{ 
            backgroundColor: 'var(--color-background-card)',
            border: '1px solid var(--color-border)'
          }}
        >
          <div className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
            {ownedPerks.length}
          </div>
          <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Total Perks
          </div>
        </div>
        
        <div 
          className="p-4 rounded-lg text-center"
          style={{ 
            backgroundColor: 'var(--color-background-card)',
            border: '1px solid var(--color-border)'
          }}
        >
          <div className="text-2xl font-bold" style={{ color: 'var(--color-success)' }}>
            {ownedPerks.filter(p => p.status === 'ACTIVE').length}
          </div>
          <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Active
          </div>
        </div>
        
        <div 
          className="p-4 rounded-lg text-center"
          style={{ 
            backgroundColor: 'var(--color-background-card)',
            border: '1px solid var(--color-border)'
          }}
        >
          <div className="text-2xl font-bold" style={{ color: 'var(--color-warning)' }}>
            {ownedPerks.filter(p => p.remainingUses !== null && p.remainingUses > 0).length}
          </div>
          <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Multi-Use
          </div>
        </div>
        
        <div 
          className="p-4 rounded-lg text-center"
          style={{ 
            backgroundColor: 'var(--color-background-card)',
            border: '1px solid var(--color-border)'
          }}
        >
          <div className="text-2xl font-bold" style={{ color: 'var(--color-text-muted)' }}>
            {filteredPerks.length}
          </div>
          <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Filtered
          </div>
        </div>
      </div>

      {/* Perks Grid */}
      {filteredPerks.length === 0 ? (
        <div 
          className="text-center py-16 rounded-xl"
          style={{ 
            backgroundColor: 'var(--color-background-card)',
            border: '1px solid var(--color-border)'
          }}
        >
          <div className="text-6xl mb-4">🎁</div>
          <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
            {filterType === 'all' ? 'No Perks Owned' : 'No Perks of This Type'}
          </h3>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
            {filterType === 'all' 
              ? 'Visit the Marketplace tab to purchase your first perk!'
              : `You don't have any ${getRedemptionTypeInfo(filterType as RedemptionType).label.toLowerCase()} perks yet.`
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      className="p-6 rounded-xl border transition-all duration-200 hover:shadow-lg"
      style={{ 
        backgroundColor: 'var(--color-background-card)',
        borderColor: 'var(--color-border)'
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{perk.icon}</div>
          <div>
            <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
              {perk.name}
            </h3>
            <div className={`text-xs ${typeInfo.color} flex items-center gap-1`}>
              {typeInfo.icon} {typeInfo.label}
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`text-xs px-2 py-1 rounded-full ${
            perk.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {perk.status}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>
        {perk.description}
      </p>

      {/* Usage Info */}
      {perk.remainingUses !== null && (
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
            <span>Remaining Uses</span>
            <span>{perk.remainingUses}</span>
          </div>
          <div 
            className="h-2 rounded-full"
            style={{ backgroundColor: 'var(--color-border)' }}
          >
            <div 
              className="h-2 rounded-full transition-all duration-300"
              style={{ 
                backgroundColor: 'var(--color-primary)',
                width: `${Math.max(10, (perk.remainingUses / 10) * 100)}%`
              }}
            />
          </div>
        </div>
      )}

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