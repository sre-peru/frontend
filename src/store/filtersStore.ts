/**
 * Filters Store
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ProblemFilters } from '@/types/problem.types';

interface FiltersState {
  filters: ProblemFilters;
  
  // Actions
  setFilter: <K extends keyof ProblemFilters>(key: K, value: ProblemFilters[K]) => void;
  setFilters: (filters: Partial<ProblemFilters>) => void;
  clearFilters: () => void;
  clearFilter: (key: keyof ProblemFilters) => void;
  getActiveFilterCount: () => number;
  resetToDefaultFilters: () => void;
}

// Get date from 7 days ago
const getLastWeekDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return date.toISOString().split('T')[0];
};

// Get today's date
const getTodayDate = () => {
  return new Date().toISOString().split('T')[0];
};

const getDefaultFilters = (): ProblemFilters => ({
  dateFrom: getLastWeekDate(),
  dateTo: getTodayDate(),
});

// Start with default filters (last week)
const initialFilters: ProblemFilters = getDefaultFilters();

export const useFiltersStore = create<FiltersState>()(
  persist(
    (set, get) => ({
      filters: initialFilters,

      setFilter: (key, value) => {
        set((state) => ({
          filters: {
            ...state.filters,
            [key]: value,
          },
        }));
      },

      setFilters: (newFilters) => {
        set((state) => ({
          filters: {
            ...state.filters,
            ...newFilters,
          },
        }));
      },

      clearFilters: () => {
        set({ filters: {} });
      },

      clearFilter: (key) => {
        set((state) => {
          const newFilters = { ...state.filters };
          delete newFilters[key];
          return { filters: newFilters };
        });
      },

      resetToDefaultFilters: () => {
        set({ filters: getDefaultFilters() });
      },

      getActiveFilterCount: () => {
        const filters = get().filters;
        return Object.keys(filters).filter((key) => {
          const value = filters[key as keyof ProblemFilters];
          if (Array.isArray(value)) return value.length > 0;
          if (typeof value === 'boolean') return true;
          if (typeof value === 'string') return value.length > 0;
          if (typeof value === 'number') return true;
          return false;
        }).length;
      },
    }),
    {
      name: 'filters-storage',
    }
  )
);
