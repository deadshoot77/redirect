"use client";

import { FormEvent, useMemo, useState } from "react";
import { t, type AdminLang } from "@/lib/i18n";
import type { PixelType, RedirectRule, RedirectStatus } from "@/lib/types";

type PixelTypeOption = PixelType | "none";

interface AdminRulesManagerProps {
  initialRules: RedirectRule[];
  lang: AdminLang;
}

interface RuleFormState {
  slug: string;
  target_url: string;
  status_code: RedirectStatus;
  is_active: boolean;
  pixel_enabled: boolean;
  pixel_type: PixelTypeOption;
  pixel_config: string;
}

interface RulePayload {
  slug: string;
  target_url: string;
  status_code: RedirectStatus;
  is_active: boolean;
  pixel_enabled: boolean;
  pixel_type: PixelType | null;
  pixel_config: unknown | null;
}

interface ApiIssue {
  message?: string;
}

interface ApiErrorPayload {
  error?: string;
  issues?: ApiIssue[];
  rules?: RedirectRule[];
}

interface MessageState {
  type: "success" | "error";
  text: string;
}

function createDefaultFormState(): RuleFormState {
  return {
    slug: "",
    target_url: "",
    status_code: 302,
    is_active: true,
    pixel_enabled: false,
    pixel_type: "none",
    pixel_config: ""
  };
}

function prettyJson(value: string | null): string {
  if (!value) return "";
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

function toPixelTypeOption(value: PixelType | null): PixelTypeOption {
  return value ?? "none";
}

function toFormState(rule: RedirectRule): RuleFormState {
  return {
    slug: rule.slug,
    target_url: rule.targetUrl,
    status_code: rule.statusCode,
    is_active: rule.isActive,
    pixel_enabled: rule.pixelEnabled,
    pixel_type: toPixelTypeOption(rule.pixelType),
    pixel_config: prettyJson(rule.pixelConfig)
  };
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function getApiErrorMessage(payload: ApiErrorPayload | null, fallback: string): string {
  if (!payload) return fallback;
  if (Array.isArray(payload.issues) && payload.issues.length > 0) {
    const issueMessage = payload.issues
      .map((issue) => issue.message)
      .filter((message): message is string => Boolean(message))
      .join(" ");
    if (issueMessage) return issueMessage;
  }
  return payload.error ?? fallback;
}

async function parseErrorResponse(response: Response, fallback: string): Promise<string> {
  const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;
  return getApiErrorMessage(payload, fallback);
}

function validateAndBuildPayload(form: RuleFormState, lang: AdminLang): { payload: RulePayload } | { error: string } {
  const slug = form.slug.trim().toLowerCase();
  if (!slug) {
    return { error: t(lang, "rulesValidationSlugRequired") };
  }
  if (/\s/.test(slug) || slug.includes("/")) {
    return { error: t(lang, "rulesValidationSlugInvalid") };
  }

  const targetUrl = form.target_url.trim();
  if (!targetUrl) {
    return { error: t(lang, "rulesValidationUrlRequired") };
  }
  if (!isHttpUrl(targetUrl)) {
    return { error: t(lang, "rulesValidationUrlInvalid") };
  }

  const pixelType = form.pixel_type === "none" ? null : form.pixel_type;
  const pixelEnabled = form.pixel_enabled && pixelType !== null;

  let pixelConfig: unknown | null = null;
  const pixelConfigText = form.pixel_config.trim();
  if (pixelConfigText) {
    try {
      pixelConfig = JSON.parse(pixelConfigText);
    } catch {
      return { error: t(lang, "rulesValidationPixelConfigInvalid") };
    }
  }

  return {
    payload: {
      slug,
      target_url: targetUrl,
      status_code: form.status_code,
      is_active: form.is_active,
      pixel_enabled: pixelEnabled,
      pixel_type: pixelEnabled ? pixelType : null,
      pixel_config: pixelEnabled ? (pixelConfig ?? {}) : null
    }
  };
}

export default function AdminRulesManager({ initialRules, lang }: AdminRulesManagerProps) {
  const [rules, setRules] = useState<RedirectRule[]>(initialRules);
  const [form, setForm] = useState<RuleFormState>(() => createDefaultFormState());
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [loadingRules, setLoadingRules] = useState(false);
  const [savingForm, setSavingForm] = useState(false);
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [message, setMessage] = useState<MessageState | null>(null);

  const pixelTypeOptions = useMemo(
    () => [
      { value: "none", label: t(lang, "pixelTypeNone") },
      { value: "meta", label: t(lang, "pixelTypeMeta") },
      { value: "tiktok", label: t(lang, "pixelTypeTikTok") },
      { value: "google", label: t(lang, "pixelTypeGoogle") },
      { value: "postback", label: t(lang, "pixelTypePostback") }
    ],
    [lang]
  );

  const isEditing = editingSlug !== null;
  const isBusy = savingForm || loadingRules;

  async function refreshRules() {
    setLoadingRules(true);
    try {
      const response = await fetch("/api/admin/rules", {
        method: "GET",
        cache: "no-store",
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error(await parseErrorResponse(response, t(lang, "rulesErrorLoad")));
      }

      const payload = (await response.json()) as ApiErrorPayload;
      setRules(Array.isArray(payload.rules) ? payload.rules : []);
    } finally {
      setLoadingRules(false);
    }
  }

  async function saveRule(payload: RulePayload): Promise<void> {
    const response = await fetch("/api/admin/rules", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(await parseErrorResponse(response, t(lang, "rulesErrorSave")));
    }
  }

  function resetForm() {
    setForm(createDefaultFormState());
    setEditingSlug(null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const validation = validateAndBuildPayload(form, lang);
    if ("error" in validation) {
      setMessage({ type: "error", text: validation.error });
      return;
    }

    setSavingForm(true);
    try {
      await saveRule(validation.payload);
      await refreshRules();
      setMessage({
        type: "success",
        text: isEditing ? t(lang, "rulesSaveSuccessUpdate") : t(lang, "rulesSaveSuccessCreate")
      });
      resetForm();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : t(lang, "rulesErrorSave")
      });
    } finally {
      setSavingForm(false);
    }
  }

  function onEdit(rule: RedirectRule) {
    setMessage(null);
    setEditingSlug(rule.slug);
    setForm(toFormState(rule));
  }

  async function onDelete(rule: RedirectRule) {
    if (!confirm(t(lang, "rulesDeleteConfirm", { slug: rule.slug }))) {
      return;
    }

    setMessage(null);
    setBusySlug(rule.slug);
    try {
      const response = await fetch(`/api/admin/rules?slug=${encodeURIComponent(rule.slug)}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error(await parseErrorResponse(response, t(lang, "rulesErrorDelete")));
      }

      await refreshRules();
      if (editingSlug === rule.slug) {
        resetForm();
      }
      setMessage({ type: "success", text: t(lang, "rulesDeleteSuccess") });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : t(lang, "rulesErrorDelete")
      });
    } finally {
      setBusySlug(null);
    }
  }

  async function onInlineUpdate(rule: RedirectRule, patch: Partial<RuleFormState>) {
    setMessage(null);
    setBusySlug(rule.slug);

    const draft = {
      ...toFormState(rule),
      ...patch
    };
    const validation = validateAndBuildPayload(draft, lang);
    if ("error" in validation) {
      setBusySlug(null);
      setMessage({ type: "error", text: validation.error });
      return;
    }

    try {
      await saveRule(validation.payload);
      await refreshRules();
      setMessage({ type: "success", text: t(lang, "rulesInlineUpdateSuccess") });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : t(lang, "rulesErrorInlineUpdate")
      });
    } finally {
      setBusySlug(null);
    }
  }

  return (
    <section className="rules-manager">
      <div className="rules-header">
        <h2>{t(lang, "rulesTitle")}</h2>
        <p>{t(lang, "rulesSubtitle")}</p>
      </div>

      {message ? (
        <p className={message.type === "error" ? "feedback error-text" : "feedback success-text"}>{message.text}</p>
      ) : null}

      <div className="rules-layout">
        <article className="card">
          <h3>{isEditing ? t(lang, "rulesFormEditTitle") : t(lang, "rulesFormAddTitle")}</h3>

          <form className="rules-form" onSubmit={onSubmit}>
            <label htmlFor="rule_slug">{t(lang, "rulesSlugLabel")}</label>
            <input
              id="rule_slug"
              type="text"
              value={form.slug}
              onChange={(event) => setForm((previous) => ({ ...previous, slug: event.target.value }))}
              required
              minLength={1}
            />

            <label htmlFor="rule_target">{t(lang, "rulesTargetUrlLabel")}</label>
            <input
              id="rule_target"
              type="url"
              value={form.target_url}
              onChange={(event) => setForm((previous) => ({ ...previous, target_url: event.target.value }))}
              required
            />

            <div className="rules-form-grid">
              <div>
                <label htmlFor="rule_status">{t(lang, "rulesStatusCodeLabel")}</label>
                <select
                  id="rule_status"
                  value={form.status_code}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      status_code: Number(event.target.value) as RedirectStatus
                    }))
                  }
                >
                  <option value={302}>302</option>
                  <option value={301}>301</option>
                </select>
              </div>

              <label className="inline-checkbox">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) => setForm((previous) => ({ ...previous, is_active: event.target.checked }))}
                />
                <span>{t(lang, "rulesIsActiveLabel")}</span>
              </label>
            </div>

            <div className="rules-form-grid">
              <label className="inline-checkbox">
                <input
                  type="checkbox"
                  checked={form.pixel_enabled}
                  onChange={(event) =>
                    setForm((previous) => {
                      const checked = event.target.checked;
                      return {
                        ...previous,
                        pixel_enabled: checked,
                        pixel_type: checked && previous.pixel_type === "none" ? "meta" : previous.pixel_type
                      };
                    })
                  }
                />
                <span>{t(lang, "rulesPixelEnabledLabel")}</span>
              </label>

              <div>
                <label htmlFor="rule_pixel_type">{t(lang, "rulesPixelTypeLabel")}</label>
                <select
                  id="rule_pixel_type"
                  value={form.pixel_type}
                  onChange={(event) =>
                    setForm((previous) => {
                      const nextType = event.target.value as PixelTypeOption;
                      return {
                        ...previous,
                        pixel_type: nextType,
                        pixel_enabled: nextType === "none" ? false : previous.pixel_enabled
                      };
                    })
                  }
                >
                  {pixelTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {form.pixel_enabled && form.pixel_type !== "none" ? (
              <>
                <label htmlFor="rule_pixel_config">{t(lang, "rulesPixelConfigLabel")}</label>
                <textarea
                  id="rule_pixel_config"
                  rows={6}
                  value={form.pixel_config}
                  onChange={(event) => setForm((previous) => ({ ...previous, pixel_config: event.target.value }))}
                  placeholder='{"id":"PIXEL_ID","event_name":"PageView"}'
                />
                <small className="field-hint">{t(lang, "rulesPixelConfigHint")}</small>
              </>
            ) : null}

            <div className="form-actions">
              <button type="submit" disabled={isBusy}>
                {savingForm ? t(lang, "rulesSavingButton") : t(lang, "rulesSaveButton")}
              </button>
              <button type="button" className="secondary-button" onClick={resetForm} disabled={isBusy}>
                {isEditing ? t(lang, "rulesCancelButton") : t(lang, "rulesResetButton")}
              </button>
            </div>
          </form>
        </article>

        <article className="card">
          <h3>{t(lang, "rulesTableTitle")}</h3>
          {loadingRules ? <p className="loading-text">{t(lang, "rulesLoading")}</p> : null}
          <table className="data-table">
            <thead>
              <tr>
                <th>{t(lang, "colSlug")}</th>
                <th>{t(lang, "rulesColTargetUrl")}</th>
                <th>{t(lang, "rulesColStatusCode")}</th>
                <th>{t(lang, "rulesColIsActive")}</th>
                <th>{t(lang, "rulesColPixelEnabled")}</th>
                <th>{t(lang, "rulesColPixelType")}</th>
                <th>{t(lang, "rulesColActions")}</th>
              </tr>
            </thead>
            <tbody>
              {rules.length === 0 ? (
                <tr>
                  <td colSpan={7}>{t(lang, "rulesEmpty")}</td>
                </tr>
              ) : (
                rules.map((rule) => {
                  const rowBusy = busySlug === rule.slug || savingForm;
                  const pixelTypeValue = toPixelTypeOption(rule.pixelType);

                  return (
                    <tr key={rule.id}>
                      <td>{rule.slug}</td>
                      <td className="cell-url">{rule.targetUrl}</td>
                      <td>
                        <select
                          value={rule.statusCode}
                          disabled={rowBusy}
                          onChange={(event) =>
                            void onInlineUpdate(rule, {
                              status_code: Number(event.target.value) as RedirectStatus
                            })
                          }
                        >
                          <option value={302}>302</option>
                          <option value={301}>301</option>
                        </select>
                      </td>
                      <td>
                        <label className="inline-checkbox compact">
                          <input
                            type="checkbox"
                            checked={rule.isActive}
                            disabled={rowBusy}
                            onChange={(event) =>
                              void onInlineUpdate(rule, {
                                is_active: event.target.checked
                              })
                            }
                          />
                          <span>{rule.isActive ? t(lang, "statusOnline") : t(lang, "statusOffline")}</span>
                        </label>
                      </td>
                      <td>
                        <label className="inline-checkbox compact">
                          <input
                            type="checkbox"
                            checked={rule.pixelEnabled}
                            disabled={rowBusy}
                            onChange={(event) => {
                              const checked = event.target.checked;
                              const nextType = checked ? (pixelTypeValue === "none" ? "meta" : pixelTypeValue) : "none";
                              void onInlineUpdate(rule, {
                                pixel_enabled: checked,
                                pixel_type: nextType
                              });
                            }}
                          />
                          <span>{rule.pixelEnabled ? t(lang, "statusOnline") : t(lang, "statusOffline")}</span>
                        </label>
                      </td>
                      <td>
                        <select
                          value={pixelTypeValue}
                          disabled={rowBusy}
                          onChange={(event) => {
                            const nextType = event.target.value as PixelTypeOption;
                            void onInlineUpdate(rule, {
                              pixel_type: nextType,
                              pixel_enabled: nextType === "none" ? false : true
                            });
                          }}
                        >
                          {pixelTypeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button type="button" className="secondary-button" onClick={() => onEdit(rule)} disabled={rowBusy}>
                            {t(lang, "rulesEdit")}
                          </button>
                          <button
                            type="button"
                            className="danger-button"
                            onClick={() => void onDelete(rule)}
                            disabled={rowBusy}
                          >
                            {t(lang, "rulesDelete")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </article>
      </div>
    </section>
  );
}
