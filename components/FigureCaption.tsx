import { t, type Locale } from '@/lib/i18n';

/**
 * Design review idea 3 (2026-10-27): every post image carries the same caption order —
 * a numbered label (자료 01 / Figure 01), then the original source link.
 * Only facts the archive actually holds are shown: the image number and the Telegram
 * message it came from. No description is written for an image unless the data has one.
 */
export default function FigureCaption({
  index,
  total,
  locale,
  sourceMsgId,
}: {
  index: number;
  total: number;
  locale: Locale;
  sourceMsgId?: number;
}) {
  const L = t(locale);
  return (
    <figcaption className="post-figcaption">
      <span className="post-figcaption__label">
        {L.figureLabel(index)}
        {total > 1 && <span className="post-figcaption__total"> / {String(total).padStart(2, '0')}</span>}
      </span>
      {sourceMsgId ? (
        <span className="post-figcaption__source">
          {L.figureSource}{' '}
          <a href={`https://t.me/carrotcave/${sourceMsgId}`} target="_blank" rel="noopener noreferrer">
            {L.figureSourceName(sourceMsgId)}
          </a>
        </span>
      ) : null}
    </figcaption>
  );
}
