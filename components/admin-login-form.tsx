"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLanguageToggle from "@/components/admin-language-toggle";
import { ADMIN_LANG_STORAGE_KEY, normalizeAdminLang, t, type AdminLang } from "@/lib/i18n";

export default function AdminLoginForm() {
  const router = useRouter();
  const [lang, setLang] = useState<AdminLang>("fr");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = normalizeAdminLang(window.localStorage.getItem(ADMIN_LANG_STORAGE_KEY));
    setLang(stored);
  }, []);

  function toggleLanguage() {
    const nextLang: AdminLang = lang === "fr" ? "en" : "fr";
    setLang(nextLang);
    window.localStorage.setItem(ADMIN_LANG_STORAGE_KEY, nextLang);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ password })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(payload?.error ?? t(lang, "loginFailed"));
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError(t(lang, "networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="login-card" onSubmit={onSubmit}>
      <div className="login-card-head">
        <h1>{t(lang, "loginTitle")}</h1>
        <AdminLanguageToggle lang={lang} onToggle={toggleLanguage} ariaLabel={t(lang, "languageToggleAria")} />
      </div>
      <p>{t(lang, "loginSubtitle")}</p>
      <label htmlFor="password">{t(lang, "loginPasswordLabel")}</label>
      <input
        id="password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? t(lang, "loginSubmitting") : t(lang, "loginSubmit")}
      </button>
      {error ? <p className="error-text">{error}</p> : null}
    </form>
  );
}
