import Image from 'next/image';
import Link from 'next/link';

interface EditorialCardProps {
  href: string;
  date: string;
  axis: string;
  eyebrow?: string;
  title: string;
  summary?: string;
  imageUrl?: string;
  className?: string;
  priority?: boolean;
  doorLabel?: string;
}

export default function EditorialCard({
  href,
  date,
  axis,
  eyebrow,
  title,
  summary,
  imageUrl,
  className = '',
  priority = false,
  doorLabel = 'ENTER ↗',
}: EditorialCardProps) {
  return (
    <Link
      className={`wall-card${imageUrl ? ' wall-card--with-image' : ''} ${className}`.trimEnd()}
      data-axis={axis}
      href={href}
    >
      {imageUrl && (
        <Image
          className="wall-card__image"
          src={imageUrl}
          alt=""
          width={900}
          height={650}
          sizes="(max-width: 520px) 100vw, (max-width: 900px) 66vw, 58vw"
          priority={priority}
        />
      )}
      <div className="wall-card__body">
        <div className="wall-card__meta">
          <time className="wall-card__date" dateTime={date}>
            <span className="sr-only">발행일 {date.replaceAll('-', '.')}</span>
            <span className="wall-card__date-visual" aria-hidden="true">
              {date.split('-').map((part, partIndex) => (
                <span className="wall-card__date-part" key={`${part}-${partIndex}`}>{part}</span>
              ))}
            </span>
          </time>
          {eyebrow && <span className="wall-card__eyebrow">{eyebrow}</span>}
          <span className="wall-card__axis">{axis}</span>
        </div>
        <h2>{title}</h2>
        {summary && <p>{summary}</p>}
        <span className="wall-card__door" aria-hidden="true">{doorLabel}</span>
      </div>
    </Link>
  );
}
