import React, { useMemo, useState } from 'react';
import { Camera, ExternalLink, FileText } from 'lucide-react';
import type { Equipment } from '@/types/auth';

type PreviewVariant = 'thumb' | 'panel';

interface Props {
  item: Pick<
    Equipment,
    | 'name'
    | 'photo_url'
    | 'photo_preview_url'
    | 'photo_thumbnail_url'
    | 'photo_preview_mode'
    | 'photo_preview_provider'
  >;
  variant?: PreviewVariant;
}

const DEFAULT_THUMBNAIL = {
  wrapper: 'w-10 h-10 rounded-lg',
  icon: 'w-4 h-4',
};

const PANEL_THUMBNAIL = {
  wrapper: 'w-full h-52 rounded-2xl',
  icon: 'w-8 h-8',
};

export const EquipmentMediaPreview: React.FC<Props> = ({ item, variant = 'thumb' }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const previewUrl = item.photo_preview_url || item.photo_url || null;
  const imageUrl = useMemo(() => {
    return item.photo_thumbnail_url
      || (item.photo_preview_mode === 'image' ? item.photo_preview_url : null)
      || item.photo_url
      || null;
  }, [item.photo_preview_mode, item.photo_preview_url, item.photo_thumbnail_url, item.photo_url]);

  const size = variant === 'panel' ? PANEL_THUMBNAIL : DEFAULT_THUMBNAIL;

  if (variant === 'panel') {
    if (!previewUrl) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 p-4">
          <div className="flex items-center justify-center h-40 rounded-xl bg-white/70 dark:bg-slate-900/60">
            <Camera className="w-10 h-10 text-slate-300 dark:text-slate-600" />
          </div>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Add a media URL to render a preview here.
          </p>
        </div>
      );
    }

    if (item.photo_preview_mode === 'iframe') {
      return (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 p-3">
          <iframe
            src={previewUrl}
            title={`${item.name} preview`}
            className="h-52 w-full rounded-xl bg-white dark:bg-slate-900"
            loading="lazy"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 capitalize">
              {item.photo_preview_provider || 'embedded preview'}
            </span>
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-300 hover:underline"
            >
              Open preview
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      );
    }

    if (!imageFailed && imageUrl) {
      return (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 p-3">
          <img
            src={imageUrl}
            alt={`${item.name} preview`}
            className="h-52 w-full rounded-xl object-cover bg-white dark:bg-slate-900"
            onError={() => setImageFailed(true)}
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 capitalize">
              {item.photo_preview_provider || 'preview ready'}
            </span>
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-300 hover:underline"
            >
              Open source
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 p-4">
        <div className="flex h-40 items-center justify-center rounded-xl bg-white/70 dark:bg-slate-900/60">
          <FileText className="w-10 h-10 text-slate-400 dark:text-slate-500" />
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 capitalize">
            {item.photo_preview_provider || 'external media'}
          </span>
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-300 hover:underline"
          >
            Open preview
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    );
  }

  if (!imageFailed && imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={item.name}
        className={`${size.wrapper} object-cover shrink-0 border border-slate-200 dark:border-slate-600`}
        onError={() => setImageFailed(true)}
      />
    );
  }

  if (previewUrl) {
    return (
      <a
        href={previewUrl}
        target="_blank"
        rel="noreferrer"
        className={`${size.wrapper} shrink-0 flex items-center justify-center border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-blue-600 dark:hover:text-blue-300 transition-colors`}
        title={`Open preview for ${item.name}`}
      >
        <FileText className={size.icon} />
      </a>
    );
  }

  return (
    <div className={`${size.wrapper} bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0`}>
      <Camera className={`${size.icon} text-slate-400`} />
    </div>
  );
};

export default EquipmentMediaPreview;
