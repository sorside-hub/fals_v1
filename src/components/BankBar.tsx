import React, { useState, useEffect } from 'react';
import { BarItem, BarCategory } from '../types';
import { BankBarListView } from './bank/BankBarListView';
import { BarEditorView } from './bank/BarEditorView';

interface BankBarProps {
  barItems: BarItem[];
  onAddBar: (bar: Omit<BarItem, 'id' | 'createdAt'> & { id?: string; createdAt?: number }) => BarItem | void;
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
  const [editingBar, setEditingBar] = useState<BarItem | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Sync editing bar if activeBarId changes via URL hash or popstate
  useEffect(() => {
    if (isEditorActive) {
      if (activeBarId === 'new') {
        const blankBar: BarItem = {
          id: `bar-${Date.now()}`,
          text: '',
          meaning: '',
          category: 'diksi',
          rhymeScheme: 'Free',
          syllableCount: 0,
          tags: [],
          createdAt: Date.now(),
        };
        setEditingBar(blankBar);
        setIsCreatingNew(true);
      } else if (activeBarId) {
        const found = barItems.find(b => b.id === activeBarId);
        if (found) {
          setEditingBar(found);
          setIsCreatingNew(false);
        }
      }
    } else {
      setEditingBar(null);
      setIsCreatingNew(false);
    }
  }, [isEditorActive, activeBarId, barItems]);

  const handleSelectBar = (bar: BarItem) => {
    if (onNavigateToEditor) {
      onNavigateToEditor(bar.id);
    } else {
      setEditingBar(bar);
      setIsCreatingNew(false);
    }
  };

  const handleCreateNewBar = () => {
    if (onNavigateToEditor) {
      onNavigateToEditor('new');
    } else {
      const blankBar: BarItem = {
        id: `bar-${Date.now()}`,
        text: '',
        meaning: '',
        category: 'diksi',
        rhymeScheme: 'Free',
        syllableCount: 0,
        tags: [],
        createdAt: Date.now(),
      };
      setEditingBar(blankBar);
      setIsCreatingNew(true);
    }
  };

  const handleSaveBar = (savedBar: BarItem) => {
    if (isCreatingNew) {
      if (!savedBar.text.trim() && !savedBar.meaning?.trim()) {
        return;
      }
      onAddBar({
        id: savedBar.id,
        text: savedBar.text,
        meaning: savedBar.meaning,
        category: savedBar.category,
        rhymeScheme: savedBar.rhymeScheme,
        syllableCount: savedBar.syllableCount,
        tags: savedBar.tags,
        createdAt: savedBar.createdAt || Date.now(),
      });
      setIsCreatingNew(false);
      setEditingBar(savedBar);
      if (onNavigateToEditor) {
        onNavigateToEditor(savedBar.id);
      }
    } else {
      if (onUpdateBar) {
        onUpdateBar(savedBar);
      }
    }
  };

  const handleBack = () => {
    if (onBackFromEditor) {
      onBackFromEditor();
    } else {
      setEditingBar(null);
      setIsCreatingNew(false);
    }
  };

  // If a bar is being edited, show full-page BarEditorView
  if (editingBar || isEditorActive) {
    const barToRender = editingBar || barItems.find(b => b.id === activeBarId) || barItems[0];
    if (barToRender) {
      return (
        <BarEditorView
          bar={barToRender}
          onSaveBar={handleSaveBar}
          onBack={handleBack}
          onSendToLyric={onSendToLyric}
        />
      );
    }
  }

  // Otherwise, show the gallery of bars
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
