"use client";

import { useEffect, useRef, useState } from "react";
import type { AdminLang } from "@/lib/i18n";

interface AdminLanguageToggleProps {
  lang: AdminLang;
  onChange: (nextLang: AdminLang) => void;
  ariaLabel: string;
}

function getLanguageLabel(lang: AdminLang): string {
  return lang === "fr" ? "Francais" : "English";
}

function getLanguageCode(lang: AdminLang): string {
  return lang === "fr" ? "Fr" : "Gb";
}

export default function AdminLanguageToggle({ lang, onChange, ariaLabel }: AdminLanguageToggleProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  function selectLanguage(nextLang: AdminLang) {
    if (nextLang !== lang) {
      onChange(nextLang);
    }
    setOpen(false);
  }

  return (
    <div className={`language-toggle ${open ? "open" : ""}`} ref={rootRef}>
      <button
        type="button"
        className="language-toggle-trigger"
        onClick={() => setOpen((current) => !current)}
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
        </svg>
        <span className="language-code">{getLanguageCode(lang)}</span>
        <span className="language-name">{getLanguageLabel(lang)}</span>
      </button>

      {open ? (
        <div className="language-toggle-menu" role="menu" aria-label={ariaLabel}>
          <button
            type="button"
            role="menuitemradio"
            aria-checked={lang === "fr"}
            className={`language-option ${lang === "fr" ? "active" : ""}`}
            onClick={() => selectLanguage("fr")}
          >
            <span className="language-option-code">FR</span>
            <span className="language-option-name">Francais</span>
            <span className="language-option-check" aria-hidden="true">
              {lang === "fr" ? "✓" : ""}
            </span>
          </button>
          <button
            type="button"
            role="menuitemradio"
            aria-checked={lang === "en"}
            className={`language-option ${lang === "en" ? "active" : ""}`}
            onClick={() => selectLanguage("en")}
          >
            <span className="language-option-code">GB</span>
            <span className="language-option-name">English</span>
            <span className="language-option-check" aria-hidden="true">
              {lang === "en" ? "✓" : ""}
            </span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
