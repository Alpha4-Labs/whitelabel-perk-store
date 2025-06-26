import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, MagnifyingGlassIcon, FunnelIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { Button } from './ui/Button';

interface PerkFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    search: string;
    tags: Set<string>;
    priceRange: [number, number];
    sortBy: 'alphabetical' | 'price-low' | 'price-high' | 'claims' | 'newest';
    showExpired: boolean;
  };
  onFiltersChange: (filters: any) => void;
  availableTags: string[];
  totalPerks: number;
  filteredPerks: number;
}

export const PerkFilterModal: React.FC<PerkFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  availableTags,
  totalPerks,
  filteredPerks,
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'tags' | 'price' | 'sort'>('search');
  const [localSearch, setLocalSearch] = useState(filters.search);

  const tabs = [
    { id: 'search', label: 'Search', icon: MagnifyingGlassIcon },
    { id: 'tags', label: 'Tags', icon: FunnelIcon },
    { id: 'price', label: 'Price', icon: AdjustmentsHorizontalIcon },
    { id: 'sort', label: 'Sort', icon: AdjustmentsHorizontalIcon },
  ];

  const handleTagToggle = (tag: string) => {
    const newTags = new Set(filters.tags);
    if (newTags.has(tag)) {
      newTags.delete(tag);
    } else {
      newTags.add(tag);
    }
    onFiltersChange({ ...filters, tags: newTags });
  };

  const handleClearAll = () => {
    onFiltersChange({
      search: '',
      tags: new Set(),
      priceRange: [0, 1000000] as [number, number],
      sortBy: 'newest',
      showExpired: true,
    });
    setLocalSearch('');
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.tags.size > 0) count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000000) count++;
    if (!filters.showExpired) count++;
    return count;
  }, [filters]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="bg-[var(--color-background-card)]/95 backdrop-blur-lg border border-[var(--color-border)] rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-[var(--color-text)] flex items-center gap-2">
                  <FunnelIcon className="w-6 h-6 text-[var(--color-primary)]" />
                  Filter Perks
                </h2>
                <div className="text-sm text-[var(--color-text-muted)] mt-1">
                  Showing {filteredPerks} of {totalPerks} perks
                  {activeFiltersCount > 0 && (
                    <span className="ml-2 text-[var(--color-primary)]">
                      • {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} active
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                <XMarkIcon className="w-6 h-6" />
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-[var(--color-background)]/50 p-1 rounded-xl">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium relative ${
                      activeTab === tab.id
                        ? 'text-[var(--color-primary)] bg-[var(--color-background-card)] shadow-sm'
                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-[var(--color-primary)]/10 rounded-lg"
                        transition={{ type: "spring", duration: 0.3 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'search' && (
                    <div className="space-y-4">
                      <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-3 w-5 h-5 text-[var(--color-text-muted)]" />
                        <input
                          type="text"
                          placeholder="Search perks by name, description, or company..."
                          value={localSearch}
                          onChange={(e) => setLocalSearch(e.target.value)}
                          className="w-full bg-[var(--color-background)]/50 border border-[var(--color-border)] rounded-xl pl-10 pr-4 py-3 text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-colors"
                        />
                      </div>
                      <Button
                        onClick={() => onFiltersChange({ ...filters, search: localSearch })}
                        className="w-full"
                        disabled={localSearch === filters.search}
                      >
                        Apply Search
                      </Button>
                    </div>
                  )}

                  {activeTab === 'tags' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-[var(--color-text-muted)]">
                          Select tags to filter perks
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onFiltersChange({ ...filters, tags: new Set() })}
                          disabled={filters.tags.size === 0}
                        >
                          Clear All
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                        {availableTags.map((tag) => (
                          <motion.button
                            key={tag}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleTagToggle(tag)}
                            className={`p-3 rounded-lg border transition-all duration-200 text-sm font-medium text-left ${
                              filters.tags.has(tag)
                                ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary)]'
                                : 'bg-[var(--color-background)]/50 border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/50'
                            }`}
                          >
                            {tag}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'price' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                          Price Range (Alpha Points)
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-[var(--color-text-muted)] mb-1">Min</label>
                            <input
                              type="number"
                              value={filters.priceRange[0]}
                              onChange={(e) => onFiltersChange({
                                ...filters,
                                priceRange: [Number(e.target.value), filters.priceRange[1]]
                              })}
                              className="w-full bg-[var(--color-background)]/50 border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-text)]"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-[var(--color-text-muted)] mb-1">Max</label>
                            <input
                              type="number"
                              value={filters.priceRange[1]}
                              onChange={(e) => onFiltersChange({
                                ...filters,
                                priceRange: [filters.priceRange[0], Number(e.target.value)]
                              })}
                              className="w-full bg-[var(--color-background)]/50 border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-text)]"
                              min="0"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-[var(--color-background)]/50 rounded-lg">
                        <span className="text-sm text-[var(--color-text)]">Show expired perks</span>
                        <button
                          onClick={() => onFiltersChange({ ...filters, showExpired: !filters.showExpired })}
                          className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                            filters.showExpired ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
                          }`}
                        >
                          <motion.div
                            animate={{ x: filters.showExpired ? 24 : 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm"
                          />
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'sort' && (
                    <div className="space-y-2">
                      {[
                        { value: 'newest', label: 'Newest First' },
                        { value: 'alphabetical', label: 'Alphabetical' },
                        { value: 'price-low', label: 'Price: Low to High' },
                        { value: 'price-high', label: 'Price: High to Low' },
                        { value: 'claims', label: 'Most Popular' },
                      ].map((option) => (
                        <motion.button
                          key={option.value}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => onFiltersChange({ ...filters, sortBy: option.value as any })}
                          className={`w-full p-3 rounded-lg border transition-all duration-200 text-left ${
                            filters.sortBy === option.value
                              ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary)]'
                              : 'bg-[var(--color-background)]/50 border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-primary)]/50'
                          }`}
                        >
                          {option.label}
                        </motion.button>
                      ))}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-[var(--color-border)]">
              <Button
                variant="secondary"
                onClick={handleClearAll}
                disabled={activeFiltersCount === 0}
                className="flex-1"
              >
                Clear All Filters
              </Button>
              <Button
                onClick={onClose}
                className="flex-1"
              >
                Apply Filters
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 