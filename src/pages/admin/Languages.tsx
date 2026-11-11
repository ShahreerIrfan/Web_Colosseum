import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import api from '@/apis/axios';
import ModuleLoading from '@/components/admin/ModuleLoading';
import { Button } from '@/components/ui/button';
import { ContentTranslationEditor } from '@/components/admin/ContentTranslationEditor';
import type { BaseSuccessResponse } from '@/types/api/CommonTypes';
import { getUserPayload } from '@/utils/localStorageUtils';
import { getEffectiveRbac } from '@/utils/rbacUtils';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  ttsLocale?: string;
  isAvailable: boolean;
  displayOrder: number;
}

const blankLanguage: Language = {
  code: '',
  name: '',
  nativeName: '',
  ttsLocale: '',
  isAvailable: false,
  displayOrder: 0,
};
const inputClass = 'block w-full rounded border bg-background p-2';

function describeError(error: unknown) {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? error.message;
  }
  return error instanceof Error ? error.message : 'The request failed.';
}

export default function Languages() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [draft, setDraft] = useState<Language | null>(null);
  const [translationLanguage, setTranslationLanguage] = useState<Language | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const permissions = getEffectiveRbac(getUserPayload()).find(
    (item) => item['module name'] === 'Languages & Localization'
  );

  useEffect(() => {
    let active = true;
    api
      .get<BaseSuccessResponse<Language[]>>('/languages/catalog')
      .then(({ data }) => {
        if (active) setLanguages(data.data);
      })
      .catch((error: unknown) => {
        if (active) setError(describeError(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function save(language: Language) {
    setBusy(true);
    setError('');
    try {
      const endpoint = '/languages';
      const response = editing
        ? await api.patch<BaseSuccessResponse<Language>>(
            `${endpoint}/${encodeURIComponent(language.code)}`,
            language
          )
        : await api.post<BaseSuccessResponse<Language>>(endpoint, language);
      const saved = response.data.data;
      setLanguages((items) =>
        [...items.filter((item) => item.code !== saved.code), saved].sort(
          (a, b) => a.displayOrder - b.displayOrder || a.code.localeCompare(b.code)
        )
      );
      setDraft(null);
    } catch (error) {
      setError(describeError(error));
    } finally {
      setBusy(false);
    }
  }

  async function remove(language: Language) {
    if (!window.confirm(`Remove ${language.name} from the language catalog?`)) return;
    setBusy(true);
    setError('');
    try {
      await api.delete(`/languages/${encodeURIComponent(language.code)}`);
      setLanguages((items) => items.filter((item) => item.code !== language.code));
    } catch (error) {
      setError(describeError(error));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <ModuleLoading />;

  return (
    <section className="max-w-3xl space-y-4 p-6">
      <h1 className="text-2xl font-bold">Languages</h1>
      <p className="text-sm text-muted-foreground">
        Manage the language catalog and device TTS locales. The mobile app also checks whether its
        interface supports a language.
      </p>
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      {translationLanguage && (
        <ContentTranslationEditor
          code={translationLanguage.code}
          languageName={translationLanguage.name}
          onClose={() => setTranslationLanguage(null)}
        />
      )}
      {!draft && !translationLanguage && (
        <>
          {permissions?.Create === 'true' && (
            <Button
              disabled={busy}
              onClick={() => {
                setError('');
                setEditing(false);
                setDraft({ ...blankLanguage });
              }}
            >
              New language
            </Button>
          )}
          <ul className="divide-y">
            {languages.map((language) => (
              <li
                key={language.code}
                className="flex flex-wrap items-center justify-between gap-2 py-3"
              >
                <div>
                  <p className="font-semibold">
                    {language.name} · {language.nativeName}
                  </p>
                  <p className="text-sm">
                    {language.code} · {language.isAvailable ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
                <div className="flex gap-2">
                  {permissions?.Create === 'true' && language.code !== 'en' && (
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() => {
                        setError('');
                        setTranslationLanguage(language);
                      }}
                    >
                      Translations
                    </Button>
                  )}
                  {permissions?.Update === 'true' && (
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() => {
                        setError('');
                        setEditing(true);
                        setDraft({
                          ...language,
                          ttsLocale:
                            language.ttsLocale ??
                            (language.code === 'en' ? 'en-US' : language.code),
                        });
                      }}
                    >
                      Edit
                    </Button>
                  )}
                  {permissions?.Delete === 'true' && language.code !== 'en' && (
                    <Button
                      variant="destructive"
                      disabled={busy}
                      onClick={() => void remove(language)}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      {draft && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void save(draft);
          }}
        >
          <fieldset disabled={busy} className="space-y-3">
            {(
              [
                ['code', 'Language code'],
                ['name', 'Display name'],
                ['nativeName', 'Native name'],
                ['ttsLocale', 'TTS locale'],
              ] as const
            ).map(([field, label]) => (
              <label className="block" key={field}>
                {label}
                <input
                  className={inputClass}
                  required
                  value={draft[field] ?? ''}
                  readOnly={field === 'code' && editing}
                  onChange={(event) => setDraft({ ...draft, [field]: event.target.value })}
                />
              </label>
            ))}
            <label className="block">
              Display order
              <input
                className={inputClass}
                type="number"
                required
                min="0"
                max="999"
                step="1"
                value={Number.isFinite(draft.displayOrder) ? draft.displayOrder : ''}
                onChange={(event) =>
                  setDraft({ ...draft, displayOrder: event.currentTarget.valueAsNumber })
                }
              />
            </label>
            <label className="block">
              <input
                type="checkbox"
                checked={draft.isAvailable}
                disabled={editing && draft.code === 'en'}
                onChange={(event) => setDraft({ ...draft, isAvailable: event.target.checked })}
              />{' '}
              Enabled in the catalog
            </label>
            <div className="flex gap-2">
              <Button type="submit">{busy ? 'Saving…' : 'Save language'}</Button>
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setDraft(null);
                  setError('');
                }}
              >
                Cancel
              </Button>
            </div>
          </fieldset>
        </form>
      )}
    </section>
  );
}
