import { useTranslations, type Locale } from '@/lib/i18n';

interface FooterProps {
  locale: Locale;
}

export function Footer({ locale }: FooterProps) {
  const t = useTranslations(locale);

  return (
    <footer className="bg-black text-white border-t-4 border-black mt-8 sm:mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0 text-xs font-serif">
          <p>© 2025-2026 MyRSSPress</p>
          <p className="text-center">{t.footerTagline}</p>
        </div>
      </div>
    </footer>
  );
}
