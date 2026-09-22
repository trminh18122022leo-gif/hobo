'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { OpportunityCard } from '@/types';

interface CompareContextType {
  selectedOpps: OpportunityCard[];
  addToCompare: (opp: OpportunityCard) => boolean;
  removeFromCompare: (id: number) => void;
  clearCompare: () => void;
  isInCompare: (id: number) => boolean;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

const STORAGE_KEY = 'hocbong_compare_items_v2';

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [selectedOpps, setSelectedOpps] = useState<OpportunityCard[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setSelectedOpps(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveToStorage = (items: OpportunityCard[]) => {
    setSelectedOpps(items);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  };

  const addToCompare = (opp: OpportunityCard): boolean => {
    if (selectedOpps.some((item) => item.id === opp.id)) {
      removeFromCompare(opp.id);
      return false;
    }
    if (selectedOpps.length >= 4) {
      alert('Bạn chỉ có thể so sánh tối đa 4 học bổng cùng lúc.');
      return false;
    }
    const updated = [...selectedOpps, opp];
    saveToStorage(updated);
    return true;
  };

  const removeFromCompare = (id: number) => {
    const updated = selectedOpps.filter((item) => item.id !== id);
    saveToStorage(updated);
  };

  const clearCompare = () => {
    saveToStorage([]);
  };

  const isInCompare = (id: number): boolean => {
    return selectedOpps.some((item) => item.id === id);
  };

  return (
    <CompareContext.Provider
      value={{ selectedOpps, addToCompare, removeFromCompare, clearCompare, isInCompare }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
}
