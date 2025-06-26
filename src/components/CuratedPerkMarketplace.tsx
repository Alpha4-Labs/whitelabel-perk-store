import React, { useState } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { toast } from 'react-hot-toast';
import { usePerkMarketplace, PerkDefinition } from '../hooks/usePerkMarketplace';
import { BRAND_CONFIG } from '../config/brand';
import { SUI_CONFIG } from '../config/sui';

import { buildClaimPerkQuotaFreeTransaction } from '../utils/transactions';

interface CuratedPerkMarketplaceProps {
  className?: string;
}

export const CuratedPerkMarketplace: React.FC<CuratedPerkMarketplaceProps> = ({ 
  className = "" 
}) => {
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  
  const {
    perks,
    isLoading,
    error,
    partnerNames,
    userAlphaPoints,
    refresh,
    hasPerkClaimed,
    canAffordPerk,
  } = usePerkMarketplace();

  const [purchaseLoading, setPurchaseLoading] = useState(false);

  // Get perk icon based on type
  const getPerkIcon = (perk: PerkDefinition) => {
    if (perk.icon) return perk.icon;
    
    switch (perk.perk_type) {
      case 'Access': return '🔑';
      case 'Digital Asset': return '🖼️';
      case 'Service': return '🎧';
      case 'Event': return '🎫';
      case 'Physical': return '📦';
      default: return '🎁';
    }
  };

  // Check if perk is expired
  const isPerkExpired = (perk: PerkDefinition) => {
    if (!perk.expiration_timestamp_ms) return false;
    return Date.now() > perk.expiration_timestamp_ms;
  };

  // Handle perk purchase
  const handlePerkPurchase = async (perk: PerkDefinition) => {
    if (!currentAccount?.address) {
      toast.error(BRAND_CONFIG.content.connectWalletText);
      return;
    }

    if (!canAffordPerk(perk)) {
      toast.error("Insufficient Alpha Points");
      return;
    }

    if (hasPerkClaimed(perk.id) && !perk.max_uses_per_claim) {
      toast.error("You've already claimed this perk");
      return;
    }

    if (isPerkExpired(perk)) {
      toast.error("This perk has expired");
      return;
    }

    setPurchaseLoading(true);

    try {
      const transaction = buildClaimPerkQuotaFreeTransaction(perk.id);
      
      if (currentAccount?.address) {
        transaction.setSender(currentAccount.address);
      }

      const result = await signAndExecute({
        transaction,
        chain: `sui:${SUI_CONFIG.network}`,
      });

      if (result?.digest) {
        toast.success(
          `✅ Successfully purchased "${perk.name}"!\n\n🔗 Transaction: ${result.digest.substring(0, 8)}...`,
          {
            duration: 5000,
            style: { whiteSpace: 'pre-line' }
          }
        );

        // Refresh data after successful purchase
        setTimeout(() => {
          refresh();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Perk purchase failed:', error);
      
      if (error.message?.includes('EPerkNotActive')) {
        toast.error('❌ This perk is not currently active.');
      } else if (error.message?.includes('EMaxClaimsReached')) {
        toast.error('❌ This perk has reached its maximum claims limit.');
      } else if (error.message?.includes('Insufficient balance')) {
        toast.error('❌ You don\'t have enough Alpha Points.');
      } else {
        toast.error(`❌ Purchase failed: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setPurchaseLoading(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-12">
          <div 
            className="text-6xl mb-4 inline-block opacity-70"
            style={{ 
              animation: 'spin 0.8s linear infinite',
              transformOrigin: 'center center'
            }}
          >
            ⏳
          </div>
          <div className="text-xl font-medium mb-2" style={{ color: 'var(--color-text)' }}>
            Loading {BRAND_CONFIG.company.name} perks...
          </div>
          <div className="text-sm opacity-60" style={{ color: 'var(--color-text-muted)' }}>
            Please wait while we fetch your exclusive perks
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-12">
          <div className="text-4xl mb-4">❌</div>
          <div className="text-xl font-medium mb-2 text-red-400">
            Failed to load perks
          </div>
          <div className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
            {error}
          </div>
          <button
            onClick={refresh}
            className="px-6 py-2 rounded-lg font-medium transition-colors"
            style={{ 
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-text)',
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (perks.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏪</div>
          <div className="text-xl font-medium mb-4" style={{ color: 'var(--color-text)' }}>
            {BRAND_CONFIG.content.noPerksMessage}
          </div>
          <p className="text-sm max-w-md mx-auto mb-6" style={{ color: 'var(--color-text-muted)' }}>
            {BRAND_CONFIG.company.name} will be adding exclusive perks soon. 
            {BRAND_CONFIG.company.supportEmail && (
              <>
                {' '}Have questions? Contact us at{' '}
                <a 
                  href={`mailto:${BRAND_CONFIG.company.supportEmail}`}
                  className="underline hover:no-underline"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {BRAND_CONFIG.company.supportEmail}
                </a>
              </>
            )}
          </p>
          <button
            onClick={refresh}
            className="px-6 py-2 rounded-lg font-medium transition-colors"
            style={{ 
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-text)',
            }}
          >
            🔄 Check for Updates
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 p-4 rounded-lg" 
           style={{ backgroundColor: 'var(--color-background-card)', border: '1px solid var(--color-border)' }}>
        <div>
          <h2 className="text-2xl font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
            {BRAND_CONFIG.content.title}
          </h2>
          {BRAND_CONFIG.content.subtitle && (
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {BRAND_CONFIG.content.subtitle}
            </p>
          )}
        </div>
        
        <div className="text-right">
          <div className="flex items-center gap-2">
            <span style={{ color: 'var(--color-text-muted)' }}>Available Balance:</span>
            <span className="text-xl font-semibold" style={{ color: 'var(--color-secondary)' }}>
              {userAlphaPoints.toLocaleString()} αP
            </span>
          </div>
          {BRAND_CONFIG.features.showPriceInUSD && (
            <div className="text-sm mt-1" style={{ color: 'var(--color-success)' }}>
              ≈ ${(userAlphaPoints / 1000).toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })} USD
            </div>
          )}
        </div>
      </div>

      {/* Perks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {perks.map((perk, index) => {
          const isPerkClaimed = hasPerkClaimed(perk.id);
          const isExpired = isPerkExpired(perk);
          const canAfford = canAffordPerk(perk);
          
          return (
            <div 
              key={perk.id}
              className={`p-4 rounded-lg transition-all duration-200 hover:scale-[1.01] ${
                isPerkClaimed ? 'opacity-75' : ''
              }`}
              style={{ 
                backgroundColor: 'var(--color-background-card)',
                border: `1px solid ${isPerkClaimed ? 'var(--color-success)' : 'var(--color-border)'}`,
                animationDelay: `${index * 50}ms`,
                animation: 'fadeIn 0.5s ease-out forwards'
              }}
            >
              <div className="flex items-start gap-4">
                {/* Perk Icon */}
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                  style={{ 
                    background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
                  }}
                >
                  {getPerkIcon(perk)}
                </div>
                
                {/* Perk Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                        {perk.name}
                        {isPerkClaimed && (
                          <span className="w-2 h-2 rounded-full animate-pulse" 
                                style={{ backgroundColor: 'var(--color-success)' }} />
                        )}
                        {isExpired && (
                          <span className="text-xs px-2 py-1 rounded-full" 
                                style={{ backgroundColor: 'var(--color-warning)', color: 'var(--color-background)' }}>
                            EXPIRED
                          </span>
                        )}
                      </h3>
                      
                      {BRAND_CONFIG.features.showPartnerNames && (
                        <div className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                          by {partnerNames.get(perk.creator_partner_cap_id) || 'Loading...'}
                        </div>
                      )}
                    </div>
                    
                    {/* Purchase Button */}
                    <button
                      onClick={() => handlePerkPurchase(perk)}
                      disabled={
                        purchaseLoading || 
                        !canAfford || 
                        (isPerkClaimed && !perk.max_uses_per_claim) ||
                        isExpired
                      }
                      className={`px-4 py-2 text-sm rounded-lg font-medium transition-all duration-200 min-w-[120px] ${
                        isPerkClaimed && !perk.max_uses_per_claim
                          ? 'opacity-60 cursor-not-allowed'
                          : isExpired
                          ? 'opacity-60 cursor-not-allowed'
                          : !canAfford
                          ? 'opacity-60 cursor-not-allowed'
                          : 'hover:scale-105'
                      }`}
                      style={{
                        backgroundColor: 
                          isPerkClaimed && !perk.max_uses_per_claim ? 'var(--color-success)' :
                          isExpired ? 'var(--color-warning)' :
                          !canAfford ? 'var(--color-error)' :
                          'var(--color-primary)',
                        color: 'var(--color-text)',
                      }}
                    >
                      {purchaseLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        </div>
                      ) : isPerkClaimed && !perk.max_uses_per_claim ? (
                        "✅ Claimed"
                      ) : isExpired ? (
                        "⏰ Expired"
                      ) : (
                        `${perk.current_alpha_points_price.toLocaleString()} αP`
                      )}
                    </button>
                  </div>
                  
                  {/* Perk Description */}
                  <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>
                    {perk.description}
                  </p>
                  
                  {/* Perk Stats */}
                  <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    <div className="flex items-center gap-3">
                      {BRAND_CONFIG.features.showPriceInUSD && (
                        <span style={{ color: 'var(--color-success)' }}>
                          ${perk.usdc_price.toFixed(2)} value
                        </span>
                      )}
                      
                      {BRAND_CONFIG.features.showClaimCount && (
                        <span>
                          {perk.total_claims_count} claimed
                        </span>
                      )}
                      
                      {perk.tags && perk.tags.length > 0 && (
                        <div className="flex gap-1">
                          {perk.tags.slice(0, 2).map((tag) => (
                            <span 
                              key={tag}
                              className="px-2 py-1 rounded-full text-xs"
                              style={{ 
                                backgroundColor: 'var(--color-border)',
                                color: 'var(--color-text-muted)'
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {perk.max_claims && (
                      <span className="text-xs" style={{ color: 'var(--color-warning)' }}>
                        {perk.max_claims - perk.total_claims_count} left
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {BRAND_CONFIG.content.footerText && (
        <div className="text-center mt-8 pt-6 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {BRAND_CONFIG.content.footerText}
          </p>
          {BRAND_CONFIG.company.website && (
            <a 
              href={BRAND_CONFIG.company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm hover:underline mt-2 inline-block"
              style={{ color: 'var(--color-primary)' }}
            >
              Visit {BRAND_CONFIG.company.name} →
            </a>
          )}
        </div>
      )}
    </div>
  );
}; 