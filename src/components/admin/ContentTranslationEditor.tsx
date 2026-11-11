import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import api from '@/apis/axios';
import { viewpointApi } from '@/apis/viewpoint/viewpointApi';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { BaseSuccessResponse } from '@/types/api/CommonTypes';

type Kind = 'landmark' | 'floor' | 'viewpoint';
type Translation = { title: string; description?: string };
type ContentOption = { id: string; name: string };
const inputClass = 'block w-full rounded border bg-background p-2';

export function ContentTranslationEditor({
  code,
  languageName,
  onClose,
}: {
  code: string;
  languageName: string;
  onClose: () => void;
}) {
  const [kind, setKind] = useState<Kind>('landmark');
  const [id, setId] = useState('');
  const [options, setOptions] = useState<ContentOption[]>([]);
  const [translation, setTranslation] = useState<Translation | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const endpoint = `/translations/${encodeURIComponent(code)}/${kind}/${encodeURIComponent(id)}`;

  useEffect(() => {
    let active = true;
    async function loadOptions(): Promise<ContentOption[]> {
      if (kind === 'viewpoint') {
        return (await viewpointApi.getAll()).map((item) => ({ id: item.id, name: item.title }));
      }
      if (kind === 'floor') {
        const { data } =
          await api.get<BaseSuccessResponse<{ floorId: string; displayName: string }[]>>('/floors');
        return data.data.map((item) => ({ id: item.floorId, name: item.displayName }));
      }
      const { data } = await api.get<BaseSuccessResponse<{ code: string; name: string }[]>>(
        '/landmarks',
        {
          params: { limit: 100 },
        }
      );
      return data.data.map((item) => ({ id: item.code, name: item.name }));
    }
    loadOptions()
      .then((items) => {
        if (active) setOptions(items);
      })
      .catch(() => {
        if (active) setError('Unable to load the tour content list.');
      });
    return () => {
      active = false;
    };
  }, [kind]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    api
      .get<BaseSuccessResponse<Translation | null>>(endpoint)
      .then(({ data }) => {
        if (active) setTranslation(data.data ?? { title: '', description: '' });
      })
      .catch(() => {
        if (active) setError('Unable to load the translation.');
      });
    return () => {
      active = false;
    };
  }, [endpoint, id]);

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">{languageName} translations</h2>
      <Button variant="outline" disabled={busy} onClick={onClose}>
        Back to languages
      </Button>
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      <label htmlFor="translation-content-type" className="block">
        Content type
        <Select
          value={kind}
          disabled={busy}
          onValueChange={(value) => {
            setKind(value as Kind);
            setId('');
            setOptions([]);
            setTranslation(null);
            setError('');
            setMessage('');
          }}
        >
          <SelectTrigger id="translation-content-type" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="landmark">Landmark</SelectItem>
            <SelectItem value="floor">Floor</SelectItem>
            <SelectItem value="viewpoint">Viewpoint</SelectItem>
          </SelectContent>
        </Select>
      </label>
      <label htmlFor="translation-tour-content" className="block">
        Tour content
        <Select
          value={id ? `content:${id}` : 'none'}
          disabled={busy}
          onValueChange={(value) => {
            setId(value === 'none' ? '' : value.slice('content:'.length));
            setTranslation(null);
            setError('');
            setMessage('');
          }}
        >
          <SelectTrigger id="translation-tour-content" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Choose content</SelectItem>
            {options.map((item) => (
              <SelectItem key={item.id} value={`content:${item.id}`}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      {translation && (
        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setError('');
            setMessage('');
            try {
              const { data } = await api.put<BaseSuccessResponse<Translation>>(
                endpoint,
                translation
              );
              setTranslation(data.data);
              setMessage('Translation saved.');
            } catch (reason) {
              setError(
                isAxiosError<{ message?: string }>(reason)
                  ? (reason.response?.data?.message ?? reason.message)
                  : 'Unable to save the translation.'
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <label className="block">
            Translated name or title
            <input
              className={inputClass}
              required
              maxLength={250}
              value={translation.title}
              disabled={busy}
              onChange={(event) => setTranslation({ ...translation, title: event.target.value })}
            />
          </label>
          {kind !== 'floor' && (
            <label className="block">
              {kind === 'viewpoint' ? 'Translated narration' : 'Translated description'}
              <textarea
                className={inputClass}
                rows={6}
                maxLength={12000}
                value={translation.description ?? ''}
                disabled={busy}
                onChange={(event) =>
                  setTranslation({ ...translation, description: event.target.value })
                }
              />
            </label>
          )}
          <Button disabled={busy} type="submit">
            {busy ? 'Saving…' : 'Save translation'}
          </Button>
        </form>
      )}
    </section>
  );
}
