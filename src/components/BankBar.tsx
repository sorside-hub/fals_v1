import React, { useMemo } from 'react';
import { BarItem } from '../types';
import { BankBarListView } from './bank/BankBarListView';
import { BarEditorView } from './bank/BarEditorView';

interface BankBarProps {
  barItems: BarItem[];
  onAddBar: (bar: Omit<BarItem, 'id' | 'createdAt'> & { id?: string; createdAt?: number }) => BarItem;
  onUpdateBar?: (bar: BarItem) => void;
  onDeleteBar: (id: string) => void;
  onSendToLyric?: (text: string) => void;
  isEditorActive?: boolean;
  activeBarId?: string | null;
  onNavigateToEditor?: (barId: string) => void;
  onBackFromEditor?: () => void;
}

export const BankBar: React.FC<BankBarProps> = ({
  barItems,
  onAddBar,
  onUpdateBar,
  onDeleteBar,
  onSendToLyric,
  isEditorActive,
  activeBarId,
  onNavigateToEditor,
  onBackFromEditor,
}) => {
  const activeBar = useMemo(() => {
    if (!isEditorActive || !activeBarId) return null;
    return barItems.find(b => b.id === activeBarId) || null;
  }, [isEditorActive, activeBarId, barItems]);

  const handleSelectBar = (bar: BarItem) => {
    if (onNavigateToEditor) {
      onNavigateToEditor(bar.id);
    }
  };

  const handleCreateNewBar = () => {
    const created = onAddBar({
      text: '',
      meaning: '',
      category: 'diksi',
      rhymeScheme: 'Free',
      syllableCount: 0,
      tags: [],
      createdAt: Date.now(),
    });
    if (created && onNavigateToEditor) {
      onNavigateToEditor(created.id);
    }
  };

  const handleSaveBar = (savedBar: BarItem) => {
    if (onUpdateBar) {
      onUpdateBar(savedBar);
    }
  };

  const handleBack = () => {
    if (activeBar && !activeBar.text.trim() && !activeBar.meaning?.trim()) {
      onDeleteBar(activeBar.id);
    }
    if (onBackFromEditor) {
      onBackFromEditor();
    }
  };

  // If editor route is active and we have an activeBar, render BarEditorView
  if (isEditorActive && activeBar) {
    return (
      <BarEditorView
        bar={activeBar}
        onSaveBar={handleSaveBar}
        onBack={handleBack}
        onSendToLyric={onSendToLyric}
      />
    );
  }

  // Otherwise, show the gallery list of bars
  return (
    <div className="max-w-5xl mx-auto">
      <BankBarListView
        barItems={barItems}
        onSelectBar={handleSelectBar}
        onCreateNewBar={handleCreateNewBar}
        onDeleteBar={onDeleteBar}
        onSendToLyric={onSendToLyric}
      />
    </div>
  );
};
