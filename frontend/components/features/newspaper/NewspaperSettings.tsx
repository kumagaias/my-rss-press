import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';
import type { NewspaperSettings, Locale } from '@/types';
import { useTranslations, formatDate } from '@/lib/i18n';

interface NewspaperSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: NewspaperSettings) => void;
  locale: Locale;
  defaultName?: string;
}

export function NewspaperSettingsModal({
  isOpen,
  onClose,
  onSave,
  locale,
  defaultName,
}: NewspaperSettingsProps) {
  const t = useTranslations(locale);
  const [newspaperName, setNewspaperName] = useState('');
  const [userName, setUserName] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  // Set default newspaper name when modal opens
  useEffect(() => {
    if (isOpen && defaultName && !newspaperName) {
      setNewspaperName(defaultName);
    }
  }, [isOpen, defaultName, newspaperName]);

  // Generate default newspaper name based on current date
  useEffect(() => {
    if (isOpen && !newspaperName && !defaultName) {
      const now = new Date();
      const dateStr = formatDate(now, locale);
      const defaultNewspaperName = t.defaultNewspaperName(dateStr);
      setNewspaperName(defaultNewspaperName);
    }
  }, [isOpen, locale, t, newspaperName, defaultName]);

  const handleSave = () => {
    const settings: NewspaperSettings = {
      newspaperName: newspaperName.trim() || getDefaultName(),
      userName: userName.trim() || 'Anonymous',
      isPublic,
    };
    onSave(settings);
    handleClose();
  };

  const handleClose = () => {
    // Reset form
    setNewspaperName('');
    setUserName('');
    setIsPublic(true);
    onClose();
  };

  const getDefaultName = (): string => {
    if (defaultName) return defaultName;
    const now = new Date();
    const dateStr = formatDate(now, locale);
    return t.defaultNewspaperName(dateStr);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t.newspaperSettings}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.newspaperName}
          </label>
          <Input
            type="text"
            value={newspaperName}
            onChange={(e) => setNewspaperName(e.target.value)}
            placeholder={getDefaultName()}
          />
          <p className="mt-1 text-xs text-gray-500">
            {t.defaultNameNote}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.userName}
          </label>
          <Input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder={t.userNamePlaceholder}
          />
          <p className="mt-1 text-xs text-gray-500">
            {t.anonymousNote}
          </p>
        </div>

        {/* TODO: Phase 2 - Add public/private toggle */}
        {/* <div>
          <Checkbox
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            label={t.makePublic}
          />
          <p className="mt-1 text-xs text-gray-500 ml-6">
            {t.publicNote}
          </p>
        </div> */}

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" size="md" onClick={handleClose}>
            {t.cancel}
          </Button>
          <Button variant="primary" size="md" onClick={handleSave}>
            {t.save}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
