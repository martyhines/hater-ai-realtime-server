import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UpgradeType } from '../components/auth/UpgradePrompt';

interface UpgradePromptState {
  isVisible: boolean;
  type: UpgradeType;
  data?: any;
  onUpgrade?: () => void;
  onDismiss?: () => void;
}

export const useUpgradePrompt = () => {
  const { isAnonymous, isAuthenticated } = useAuth();
  const [promptState, setPromptState] = useState<UpgradePromptState>({
    isVisible: false,
    type: 'streak'
  });

  // Track which prompts have been shown to avoid spam
  const [shownPrompts, setShownPrompts] = useState<Set<string>>(new Set());

  const showUpgradePrompt = useCallback((
    type: UpgradeType,
    data?: any,
    onUpgrade?: () => void,
    onDismiss?: () => void
  ) => {
    // Don't show if user is already authenticated
    if (isAuthenticated && !isAnonymous) {
      return;
    }

    // Create a unique key for this prompt type + context
    const promptKey = `${type}_${JSON.stringify(data || {})}`;

    // Don't show the same prompt repeatedly
    if (shownPrompts.has(promptKey)) {
      return;
    }

    setPromptState({
      isVisible: true,
      type,
      data,
      onUpgrade,
      onDismiss
    });

    // Mark this prompt as shown
    setShownPrompts(prev => new Set(prev).add(promptKey));
  }, [isAuthenticated, isAnonymous, shownPrompts]);

  const hideUpgradePrompt = useCallback(() => {
    setPromptState(prev => ({
      ...prev,
      isVisible: false
    }));
  }, []);

  const dismissPrompt = useCallback(() => {
    hideUpgradePrompt();
    promptState.onDismiss?.();
  }, [hideUpgradePrompt, promptState]);

  const upgradePrompt = useCallback(() => {
    hideUpgradePrompt();
    promptState.onUpgrade?.();
  }, [hideUpgradePrompt, promptState]);

  // Specific prompt triggers
  const showStreakPrompt = useCallback((streakCount: number) => {
    showUpgradePrompt('streak', { streakCount });
  }, [showUpgradePrompt]);

  const showPurchasePrompt = useCallback(() => {
    showUpgradePrompt('purchase');
  }, [showUpgradePrompt]);

  const showSyncPrompt = useCallback(() => {
    showUpgradePrompt('sync');
  }, [showUpgradePrompt]);

  const showBackupPrompt = useCallback(() => {
    showUpgradePrompt('backup');
  }, [showUpgradePrompt]);

  // Reset shown prompts (useful for testing or after account creation)
  const resetShownPrompts = useCallback(() => {
    setShownPrompts(new Set());
  }, []);

  return {
    // State
    promptState,

    // Actions
    showUpgradePrompt,
    hideUpgradePrompt,
    dismissPrompt,
    upgradePrompt,

    // Specific triggers
    showStreakPrompt,
    showPurchasePrompt,
    showSyncPrompt,
    showBackupPrompt,

    // Utilities
    resetShownPrompts,
    hasShownPrompt: (type: UpgradeType, data?: any) => {
      const promptKey = `${type}_${JSON.stringify(data || {})}`;
      return shownPrompts.has(promptKey);
    }
  };
};
