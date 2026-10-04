import { hostOf, prettyUrl, type LinkPreview } from '@/lib/link-preview';

type Props = { url: string; label?: string; preview?: LinkPreview };

function tidy(url: string, preview?: LinkPreview) {
  const host = hostOf(url);
  let title = preview?.title;
  let description = preview?.description;
  const gh = title?.match(/^GitHub - ([^:]+?)(?::\s*(.*))?$/);
  if (gh) {
    title = gh[1];
    description = gh[2] || description;
  }
  if (title && preview?.siteName) title = title.replace(new RegExp(`\\s*[·|\\-—]\\s*${preview.siteName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`), '');
  title = title?.replace(/\s*·\s*Luma$/, '');
  if (description && title && description.startsWith(title)) description = undefined;
  const site = preview?.siteName && preview.siteName.toLowerCase() !== host ? preview.siteName : undefined;
  return { host, title: title || prettyUrl(url, 60), description, site };
}

/** First visible letter of the site name, used when a page has no og:image. */
export function monogramOf(name: string) {
  const ch = [...name.replace(/^(?:www\.)/, '').trim()].find((c) => /[\p{L}\p{N}]/u.test(c)) ?? '•';
  return ch.toUpperCase();
}

export default function LinkCard({ url, label, preview }: Props) {
  const { host, title, description, site } = tidy(url, preview);
  const image = preview?.image;
  // Rule: every link card shows a thumbnail. Pages without og:image get a branded host tile.
  return (
    <a className="post-link-card post-link-card--media" href={url} target="_blank" rel="noopener noreferrer" aria-label={`${title} — ${site ?? host} (새 창에서 열기)`}>
      {image ? (
        <span className="post-link-card__media" aria-hidden="true">
          <img src={image} alt="" loading="lazy" decoding="async" />
        </span>
      ) : (
        <span className="post-link-card__media post-link-card__media--tile" aria-hidden="true">
          <span className="post-link-card__tile-mark">{monogramOf(site ?? host)}</span>
          <span className="post-link-card__tile-host">{site ?? host}</span>
        </span>
      )}
      <span className="post-link-card__main">
        <span className="post-link-card__body">
          {label ? <span className="post-link-card__label">{label}</span> : null}
          <span className="post-link-card__title">{title}</span>
          {description ? <span className="post-link-card__desc">{description}</span> : null}
          <span className="post-link-card__foot">
            <span className="post-link-card__icon" aria-hidden="true">
              <img src={`https://www.google.com/s2/favicons?domain=${host}&sz=64`} alt="" width={16} height={16} loading="lazy" decoding="async" />
            </span>
            <span className="post-link-card__host">{site ? `${site} · ${host}` : host}</span>
            <span className="post-link-card__cta">
              열기
              <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
          </span>
        </span>
      </span>
    </a>
  );
}
