import React, { useState, useMemo } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Button } from './ui/Button';
import { Skeleton } from './ui/Skeleton';
import { useGenerations, type GenerationOpportunity } from '../hooks/useGenerations';
import { toast } from 'react-hot-toast';

// ===============================================
// GENERATION CENTER COMPONENT
// ===============================================
// This component displays various ways users can earn Alpha Points.
// It's designed to be highly customizable for white-label deployments.
//
// DEPLOYER CUSTOMIZATION:
// 1. Update the template generations in useGenerations.ts
// 2. Customize categories, filters, and UI colors via BRAND_CONFIG
// 3. Replace action URLs with your own platform integrations
// 4. Configure difficulty levels and reward estimates
// 5. Set up brand-specific generation opportunities
//
// FEATURES:
// - Category-based filtering (customizable)
// - Difficulty-based sorting
// - Featured/promoted generations
// - Status indicators (active, coming soon, etc.)
// - Completion tracking
// - Responsive grid layout
// - Brand-themed styling
// ===============================================

export const GenerationCenter: React.FC = () => {
  const account = useCurrentAccount();
  const { generations, isLoading, error, executeGeneration, userCompletions, refreshGenerations } = useGenerations();
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);

  // Get unique categories for filter buttons
  const categories = useMemo(() => {
    const cats = new Set(generations.map(g => g.category));
    return ['all', ...Array.from(cats)];
  }, [generations]);

  // Filter generations based on selected filters
  const filteredGenerations = useMemo(() => {
    return generations.filter(generation => {
      if (selectedCategory !== 'all' && generation.category !== selectedCategory) return false;
      if (selectedDifficulty !== 'all' && generation.difficulty !== selectedDifficulty) return false;
      if (selectedStatus !== 'all' && generation.status !== selectedStatus) return false;
      if (showFeaturedOnly && !generation.featured) return false;
      return true;
    });
  }, [generations, selectedCategory, selectedDifficulty, selectedStatus, showFeaturedOnly]);

  // Group generations: featured first, then by difficulty
  const sortedGenerations = useMemo(() => {
    const featured = filteredGenerations.filter(g => g.featured);
    const regular = filteredGenerations.filter(g => !g.featured);
    
    const sortByDifficulty = (a: GenerationOpportunity, b: GenerationOpportunity) => {
      const difficultyOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
      return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
    };
    
    return [
      ...featured.sort(sortByDifficulty),
      ...regular.sort(sortByDifficulty)
    ];
  }, [filteredGenerations]);

  const handleExecuteGeneration = async (generation: GenerationOpportunity) => {
    if (!account) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      await executeGeneration(generation.id);
      toast.success(`Started: ${generation.name}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to start generation');
    }
  };

  const getCategoryInfo = (category: string) => {
    const categoryMap: Record<string, { icon: string; label: string; color: string }> = {
      all: { icon: '🎯', label: 'All', color: 'text-gray-600' },
      social: { icon: '📱', label: 'Social', color: 'text-blue-600' },
      educational: { icon: '🎓', label: 'Learn', color: 'text-green-600' },
      engagement: { icon: '💬', label: 'Community', color: 'text-purple-600' },
      financial: { icon: '🏦', label: 'Financial', color: 'text-yellow-600' },
      loyalty: { icon: '⭐', label: 'Loyalty', color: 'text-orange-600' },
      partner: { icon: '🤝', label: 'Partners', color: 'text-pink-600' }
    };
    return categoryMap[category] || { icon: '📋', label: category, color: 'text-gray-600' };
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-500';
      case 'Medium': return 'text-yellow-500';
      case 'Hard': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return { icon: '✅', label: 'Active', color: 'text-green-500', bgColor: 'bg-green-500/10' };
      case 'coming-soon':
        return { icon: '🔜', label: 'Coming Soon', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' };
      case 'inactive':
        return { icon: '⏸️', label: 'Inactive', color: 'text-gray-500', bgColor: 'bg-gray-500/10' };
      default:
        return { icon: '❓', label: 'Unknown', color: 'text-gray-500', bgColor: 'bg-gray-500/10' };
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <Skeleton className="h-8 w-64 mx-auto mb-2" />
          <Skeleton className="h-4 w-96 mx-auto" />
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-20" />
          ))}
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

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">❌</div>
        <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
          Error Loading Generations
        </h3>
        <p className="mb-4" style={{ color: 'var(--color-text-muted)' }}>
          {error}
        </p>
        <Button onClick={refreshGenerations} variant="outline">
          🔄 Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
          🚀 Earn Alpha Points
        </h2>
        <p className="text-lg" style={{ color: 'var(--color-text-muted)' }}>
          Complete tasks and activities to earn Alpha Points
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div 
          className="p-4 rounded-lg text-center"
          style={{ 
            backgroundColor: 'var(--color-background-card)',
            border: '1px solid var(--color-border)'
          }}
        >
          <div className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
            {generations.filter(g => g.status === 'active').length}
          </div>
          <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Active Opportunities
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
            {Object.values(userCompletions).reduce((sum, count) => sum + count, 0)}
          </div>
          <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Total Completed
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
            {generations.filter(g => g.featured).length}
          </div>
          <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Featured
          </div>
        </div>
        
        <div 
          className="p-4 rounded-lg text-center"
          style={{ 
            backgroundColor: 'var(--color-background-card)',
            border: '1px solid var(--color-border)'
          }}
        >
          <div className="text-2xl font-bold" style={{ color: 'var(--color-info)' }}>
            {generations.filter(g => g.status === 'coming-soon').length}
          </div>
          <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Coming Soon
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        {/* Category Filter */}
        <div>
          <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
            Categories
          </h4>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const categoryInfo = getCategoryInfo(category);
              const isActive = selectedCategory === category;
              
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                    isActive ? 'shadow-md' : 'hover:opacity-80'
                  }`}
                  style={{
                    backgroundColor: isActive ? 'var(--color-primary)' : 'var(--color-background-card)',
                    color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  {categoryInfo.icon} {categoryInfo.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Additional Filters */}
        <div className="flex flex-wrap gap-4">
          {/* Difficulty Filter */}
          <div>
            <label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              Difficulty:
            </label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="ml-2 px-3 py-1 rounded-lg text-sm border"
              style={{
                backgroundColor: 'var(--color-background-card)',
                color: 'var(--color-text)',
                borderColor: 'var(--color-border)'
              }}
            >
              <option value="all">All</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              Status:
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="ml-2 px-3 py-1 rounded-lg text-sm border"
              style={{
                backgroundColor: 'var(--color-background-card)',
                color: 'var(--color-text)',
                borderColor: 'var(--color-border)'
              }}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="coming-soon">Coming Soon</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Featured Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="featured-only"
              checked={showFeaturedOnly}
              onChange={(e) => setShowFeaturedOnly(e.target.checked)}
              className="mr-2"
              style={{ accentColor: 'var(--color-primary)' }}
            />
            <label htmlFor="featured-only" className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              ⭐ Featured Only
            </label>
          </div>
        </div>
      </div>

      {/* Generations Grid */}
      {sortedGenerations.length === 0 ? (
        <div 
          className="text-center py-12 rounded-xl"
          style={{ 
            backgroundColor: 'var(--color-background-card)',
            border: '1px solid var(--color-border)'
          }}
        >
          <div className="text-4xl mb-3">🔍</div>
          <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
            No Generations Found
          </h4>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
            Try adjusting your filters to see more opportunities
          </p>
          <Button 
            onClick={() => {
              setSelectedCategory('all');
              setSelectedDifficulty('all');
              setSelectedStatus('all');
              setShowFeaturedOnly(false);
            }}
            variant="outline"
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedGenerations.map((generation) => (
            <GenerationCard
              key={generation.id}
              generation={generation}
              userCompletions={userCompletions[generation.id] || 0}
              onExecute={() => handleExecuteGeneration(generation)}
              getDifficultyColor={getDifficultyColor}
              getStatusInfo={getStatusInfo}
            />
          ))}
        </div>
      )}

      {/* Footer */}
      {sortedGenerations.length > 0 && (
        <div 
          className="text-center py-4 rounded-lg"
          style={{ 
            backgroundColor: 'var(--color-background-card)',
            border: '1px solid var(--color-border)'
          }}
        >
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Showing {sortedGenerations.length} of {generations.length} generation opportunities
          </p>
        </div>
      )}
    </div>
  );
};

// Individual generation card component
interface GenerationCardProps {
  generation: GenerationOpportunity;
  userCompletions: number;
  onExecute: () => void;
  getDifficultyColor: (difficulty: string) => string;
  getStatusInfo: (status: string) => { icon: string; label: string; color: string; bgColor: string };
}

const GenerationCard: React.FC<GenerationCardProps> = ({
  generation,
  userCompletions,
  onExecute,
  getDifficultyColor,
  getStatusInfo
}) => {
  const statusInfo = getStatusInfo(generation.status);
  const canExecute = generation.status === 'active';
  const isCompleted = generation.maxCompletions && userCompletions >= generation.maxCompletions;
  
  return (
    <div 
      className={`p-6 rounded-xl border transition-all duration-200 hover:shadow-lg flex flex-col h-full ${
        generation.featured ? 'ring-2' : ''
      }`}
      style={{ 
        backgroundColor: 'var(--color-background-card)',
        borderColor: generation.featured ? 'var(--color-primary)' : 'var(--color-border)',
        '--tw-ring-color': generation.featured ? 'var(--color-primary)' : 'transparent'
      } as React.CSSProperties}
    >
      {/* Content Area - Flex Grow */}
      <div className="flex-grow">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{generation.icon}</div>
            <div>
              <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>
                {generation.name}
                {generation.featured && (
                  <span className="ml-2 text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-600">
                    ⭐ Featured
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span 
                  className={`text-xs px-2 py-1 rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}
                >
                  {statusInfo.icon} {statusInfo.label}
                </span>
                <span className={`text-xs font-medium ${getDifficultyColor(generation.difficulty)}`}>
                  {generation.difficulty}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
          {generation.description}
        </p>

        {/* Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: 'var(--color-text-muted)' }}>Reward:</span>
            <span className="font-medium" style={{ color: 'var(--color-success)' }}>
              {generation.estimatedReward}
            </span>
          </div>
          
          {generation.estimatedTimeMinutes && (
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: 'var(--color-text-muted)' }}>Time:</span>
              <span style={{ color: 'var(--color-text)' }}>
                ~{generation.estimatedTimeMinutes}min
              </span>
            </div>
          )}
          
          {generation.maxCompletions && (
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: 'var(--color-text-muted)' }}>Progress:</span>
              <span style={{ color: 'var(--color-text)' }}>
                {userCompletions}/{generation.maxCompletions}
              </span>
            </div>
          )}
        </div>

        {/* Requirements */}
        {generation.requirements.length > 0 && (
          <div className="mb-4">
            <h5 className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
              Requirements:
            </h5>
            <ul className="text-xs space-y-1">
              {generation.requirements.slice(0, 2).map((req, index) => (
                <li key={index} className="flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
                  <span className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }}></span>
                  {req}
                </li>
              ))}
              {generation.requirements.length > 2 && (
                <li className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  +{generation.requirements.length - 2} more requirements
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Action Button */}
      <Button
        onClick={onExecute}
        disabled={!canExecute || !!isCompleted}
        className="w-full"
        variant={canExecute && !isCompleted ? 'default' : 'outline'}
      >
        {isCompleted 
          ? '✅ Completed'
          : !canExecute 
          ? statusInfo.label
          : generation.actionType === 'external_url'
          ? '🚀 Start Task'
          : generation.actionType === 'wallet_action'
          ? '💳 Connect & Execute'
          : '▶️ Begin'
        }
      </Button>
    </div>
  );
}; 