import React from 'react';
import { useAlphaPoints } from '../hooks/useAlphaPoints';
import { formatPoints, alphaPointsToUSD } from '../utils/format';
import { BRAND_CONFIG } from '../config/brand';

export const PointsDisplay: React.FC = () => {
  const { points, loading, error } = useAlphaPoints();

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border animate-pulse" 
           style={{ 
             backgroundColor: 'var(--color-background-card)',
             borderColor: 'var(--color-border)'
           }}>
        <div className="text-lg">⭐</div>
        <div className="text-sm">
          <span style={{ color: 'var(--color-text)' }}>...</span>
          <span className="ml-1" style={{ color: 'var(--color-text-muted)' }}>αP</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border" 
           style={{ 
             backgroundColor: 'var(--color-background-card)',
             borderColor: 'var(--color-error)'
           }}>
        <div className="text-lg">⚠️</div>
        <div className="text-sm" style={{ color: 'var(--color-error)' }}>
          Error
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border" 
         style={{ 
           backgroundColor: 'var(--color-background-card)',
           borderColor: 'var(--color-border)'
         }}>
      <div className="text-lg">⭐</div>
      <div className="text-sm">
        <span style={{ color: 'var(--color-text)' }}>
          {formatPoints(points.available)}
        </span>
        <span className="ml-1" style={{ color: 'var(--color-text-muted)' }}>αP</span>
        {BRAND_CONFIG.features.showPriceInUSD && (
          <div className="text-xs" style={{ color: 'var(--color-success)' }}>
            ≈ ${alphaPointsToUSD(points.available)}
          </div>
        )}
      </div>
      {points.locked > 0 && (
        <div className="text-xs px-2 py-1 rounded" 
             style={{ 
               backgroundColor: 'var(--color-background)',
               color: 'var(--color-text-muted)'
             }}>
          {formatPoints(points.locked)} locked
        </div>
      )}
    </div>
  );
}; 