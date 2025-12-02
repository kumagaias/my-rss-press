import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';
import type { NewspaperSettings, Locale } from '@/types';
import { useTranslations } from '@/lib/i18n';

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
  }, [isOpen, defaultName]);

  // Generate default newspaper name based on current date
  useEffect(() => {
    if (isOpen && !newspaperName && !defaultName) {
      const now = new Date();
      const dateStr = now.toLocaleDateString(locale === 'ja' ? 'ja-JP' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const defaultNewspaperName = locale === 'ja' 
        ? `${dateStr}の新聞`
        : `${dateStr} Newspaper`;
      setNewspaperName(defaultNewspaperName);
    }
  }, [isOpen, locale]);

  const handleSave = () => {
    const settings: NewspaperSettings = {
      newspaperName: newspaperName.trim() || getDefaultName(),
      userName: userName.trim(),
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
    const dateStr = now.toLocaleDateString(locale === 'ja' ? 'ja-JP' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    return locale === 'ja' ? `${dateStr}の新聞` : `${dateStr} Newspaper`;
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
            {locale === 'ja' 
              ? '空欄の場合、デフォルト名が使用されます'
              : 'Default name will be used if left empty'}
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
            placeholder={locale === 'ja' ? 'あなたの名前（任意）' : 'Your name (optional)'}
          />
          <p className="mt-1 text-xs text-gray-500">
            {locale === 'ja' 
              ? '空欄の場合、「匿名」として表示されます'
              : 'Will be displayed as "Anonymous" if left empty'}
          </p>
        </div>

        <div>
          <Checkbox
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            label={t.makePublic}
          />
          <p className="mt-1 text-xs text-gray-500 ml-6">
            {locale === 'ja' 
              ? '公開すると、他のユーザーがあなたの新聞を閲覧できます'
              : 'When public, other users can view your newspaper'}
          </p>
        </div>

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
