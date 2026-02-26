"use client";

import type { AdminLang } from "@/lib/i18n";

interface AdminLanguageToggleProps {
  lang: AdminLang;
  onToggle: () => void;
  ariaLabel: string;
}

export default function AdminLanguageToggle({ lang, onToggle, ariaLabel }: AdminLanguageToggleProps) {
  return (
    <button type="button" className="language-toggle" onClick={onToggle} aria-label={ariaLabel}>
      <span className={lang === "fr" ? "active" : undefined}>FR</span>
      <span>/</span>
      <span className={lang === "en" ? "active" : undefined}>EN</span>
    </button>
  );
}
