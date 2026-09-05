import React from "react";

export type ImmersivePatternCode =
  | "interview"
  | "zoom_dive"
  | "spotlight"
  | "editorial";

export type ImmersiveChapter = {
  key: string;
  label: string;
  body: string;
};

export type ImmersiveLink = {
  label: string;
  url: string;
};

export type ImmersiveAction = {
  reason: string;
  label: string;
  href: string;
};

export type ImmersiveArtist = {
  name: string;
  tagline: string | null;
  heroImageUrl: string;
  genres: string[];
  activityInfo: string | null;
  chapters: ImmersiveChapter[];
  links: ImmersiveLink[];
  primaryAction: ImmersiveAction | null;
};

type ArtistImmersiveProfileProps = {
  pattern: ImmersivePatternCode;
  artist: ImmersiveArtist;
  onLinkClick?: (label: string) => void;
};

const HOOK_MAX_LENGTH = 40;

const paragraphs = (body: string): string[] =>
  body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

const FIRST_SENTENCE = /^[^。！？!?]*[。！？!?]?/;

const hookOf = (body: string): string => {
  const firstLine = body.split("\n").find((line) => line.trim().length > 0);
  if (!firstLine) return "";
  const matched = FIRST_SENTENCE.exec(firstLine.trim());
  const sentence = matched ? matched[0].trim() : firstLine.trim();
  return sentence.length > HOOK_MAX_LENGTH
    ? `${sentence.slice(0, HOOK_MAX_LENGTH)}…`
    : sentence;
};

const CHAPTER_STAGES = [
  {
    filter: "grayscale(1) contrast(1.15)",
    position: "30% 35%",
    focus: { x: "32%", y: "26%" },
  },
  {
    filter: "grayscale(0.5) contrast(1.1)",
    position: "58% 35%",
    focus: { x: "46%", y: "42%" },
  },
  {
    filter: "grayscale(0) contrast(1.1) saturate(1.35)",
    position: "40% 45%",
    focus: { x: "62%", y: "54%" },
  },
] as const;

const stageOf = (index: number) =>
  CHAPTER_STAGES[Math.min(index, CHAPTER_STAGES.length - 1)];

const css = `
@keyframes riseIn { from { opacity:0; transform:translateY(24px); filter:blur(6px);} to { opacity:1; transform:none; filter:blur(0);} }
@keyframes dropIn { from { opacity:0; transform:scale(1.35); filter:blur(14px);} to { opacity:1; transform:scale(1); filter:blur(0);} }
@keyframes pulseRing { 0% { transform:scale(1); opacity:.5;} 100% { transform:scale(1.8); opacity:0;} }
@keyframes drift { from { transform:scale(1.06) translateY(0);} to { transform:scale(1.14) translateY(-2%);} }
.imm-rise { animation: riseIn .8s cubic-bezier(.2,.8,.2,1) both; }
.imm-drop { animation: dropIn .6s cubic-bezier(.2,.8,.2,1) both; }
.imm-drift { animation: drift 9s ease-out both; }
.imm-ring { animation: pulseRing 1.6s ease-out infinite; }
.imm-reveal { opacity:0; transform:translateY(28px); filter:blur(8px); transition: opacity .8s, transform .8s, filter .8s; }
.imm-reveal.in { opacity:1; transform:none; filter:blur(0); }
`;

const ImmersiveStyle = () => <style>{css}</style>;

const Genres = ({ artist }: { artist: ImmersiveArtist }) => (
  <div className="flex flex-wrap items-center gap-3">
    {artist.genres.map((genre) => (
      <span
        key={genre}
        className="rounded-full border border-white/20 px-3 py-1 text-xs font-medium uppercase tracking-widest text-white/80"
      >
        {genre}
      </span>
    ))}
    {artist.activityInfo && (
      <span className="text-xs text-white/50">{artist.activityInfo}</span>
    )}
  </div>
);

type ActionProps = {
  artist: ImmersiveArtist;
  onLinkClick?: (label: string) => void;
};

const Action = ({ artist, onLinkClick }: ActionProps) => (
  <div className="flex flex-col gap-4">
    <p className="text-xs uppercase tracking-widest text-white/50">
      {artist.primaryAction ? "いま、と一つの行動" : "応援する"}
    </p>
    {artist.primaryAction && (
      <p className="text-xl leading-relaxed text-white sm:text-2xl">
        {artist.primaryAction.reason}
      </p>
    )}
    <div className="flex flex-wrap items-center gap-4">
      {artist.primaryAction && (
        <span className="relative inline-flex">
          <span className="imm-ring absolute inset-0 rounded-full bg-purple-500/40" />
          <a
            href={artist.primaryAction.href}
            target="_blank"
            rel="noopener noreferrer"
            className="relative inline-flex h-12 items-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 px-8 text-sm font-semibold text-white shadow-lg"
          >
            {artist.primaryAction.label}
          </a>
        </span>
      )}
      {artist.links.map((link, index) => (
        <a
          key={`${index}-${link.url}`}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onLinkClick?.(link.label)}
          className="text-sm text-white/60 underline-offset-4 hover:text-white hover:underline"
        >
          {link.label}
        </a>
      ))}
    </div>
  </div>
);

const useReveal = () => {
  const root = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const elements = root.current?.querySelectorAll(".imm-reveal");
    if (!elements) return;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("in");
        }),
      { threshold: 0.25 },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);
  return root;
};

const PatternInterview = ({ artist, onLinkClick }: ActionProps) => {
  const root = useReveal();
  const [active, setActive] = React.useState(0);
  const sections = React.useRef<(HTMLElement | null)[]>([]);
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(Number(entry.target.getAttribute("data-i")));
          }
        }),
      { threshold: 0.5 },
    );
    sections.current.forEach((element) => {
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, []);
  const stage = stageOf(active);
  return (
    <div ref={root} className="bg-black text-white">
      <ImmersiveStyle />
      <div className="mx-auto flex max-w-6xl">
        <div className="sticky top-0 hidden h-screen w-1/2 items-center p-10 md:flex">
          <div className="relative h-[80vh] w-full overflow-hidden rounded-3xl">
            <img
              src={artist.heroImageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition-all duration-1000"
              style={{ objectPosition: stage.position, filter: stage.filter }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6">
              <p className="text-3xl font-extrabold tracking-tight">
                {artist.name}
              </p>
              {artist.tagline && (
                <p className="mt-1 text-sm text-white/70">{artist.tagline}</p>
              )}
            </div>
            <div className="absolute right-5 top-5 flex flex-col gap-2">
              {artist.chapters.map((chapter, index) => (
                <span
                  key={chapter.key}
                  className={
                    "h-1.5 w-8 rounded-full transition-all duration-500 " +
                    (index === active ? "bg-white" : "bg-white/25")
                  }
                />
              ))}
            </div>
          </div>
        </div>

        <div className="w-full md:w-1/2">
          <section className="flex min-h-[60vh] flex-col justify-end gap-4 p-6 pt-24 sm:p-10 md:hidden">
            <h1 className="text-6xl font-extrabold tracking-tighter">
              {artist.name}
            </h1>
            {artist.tagline && (
              <p className="text-xl text-white/80">{artist.tagline}</p>
            )}
            <Genres artist={artist} />
          </section>
          <section className="hidden min-h-[40vh] flex-col justify-end p-10 md:flex">
            <p className="imm-reveal text-xs uppercase tracking-widest text-white/40">
              Interview
            </p>
            <p className="imm-reveal mt-3 text-lg leading-relaxed text-white/70">
              {artist.chapters.length}つの問いに、本人が答えた。
            </p>
            <div className="imm-reveal mt-4">
              <Genres artist={artist} />
            </div>
          </section>

          {artist.chapters.map((chapter, index) => (
            <section
              key={chapter.key}
              data-i={index}
              ref={(element) => {
                sections.current[index] = element;
              }}
              className="flex min-h-screen flex-col justify-center border-l border-white/10 p-6 sm:p-10"
            >
              <p className="imm-reveal font-mono text-xs text-white/40">
                Q{index + 1} — {chapter.label}
              </p>
              <h2 className="imm-reveal mt-4 whitespace-pre-line text-3xl font-bold leading-snug tracking-tight sm:text-4xl">
                {hookOf(chapter.body)}
              </h2>
              <div className="mt-8 flex flex-col gap-5 border-l-2 border-purple-400/50 pl-5">
                {paragraphs(chapter.body).map((paragraph, j) => (
                  <p
                    key={`${chapter.key}-${j}`}
                    className="imm-reveal leading-8 text-white/80"
                    style={{ transitionDelay: `${0.15 + j * 0.12}s` }}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}

          <section className="flex min-h-[70vh] flex-col justify-center p-6 sm:p-10">
            <div className="imm-reveal rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md sm:p-8">
              <Action artist={artist} onLinkClick={onLinkClick} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const PatternZoomDive = ({ artist, onLinkClick }: ActionProps) => {
  const container = React.useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = React.useState(0);
  React.useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const element = container.current;
        if (!element) return;
        const rect = element.getBoundingClientRect();
        const total = element.offsetHeight - window.innerHeight;
        if (total <= 0) return;
        setProgress(clamp(-rect.top / total, 0, 1));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const segments = artist.chapters.length + 2;
  const active = clamp(Math.round(progress * (segments - 1)), 0, segments - 1);
  const scale = 2.6 - 1.6 * progress;
  const grayscale = 1 - progress;
  const chapterIndex = active - 1;
  const chapter =
    chapterIndex >= 0 && chapterIndex < artist.chapters.length
      ? artist.chapters[chapterIndex]
      : null;
  const focus = chapter ? stageOf(chapterIndex).focus : CHAPTER_STAGES[0].focus;
  const isAction = active === segments - 1;

  return (
    <div className="bg-black text-white">
      <ImmersiveStyle />
      <div ref={container} style={{ height: `${segments * 100}vh` }}>
        <div className="sticky top-0 h-screen overflow-hidden">
          <img
            src={artist.heroImageUrl}
            alt=""
            className="h-full w-full object-cover"
            style={{
              transform: `scale(${scale})`,
              filter: `grayscale(${grayscale}) contrast(1.1)`,
              objectPosition: `${focus.x} ${focus.y}`,
              transition: "object-position 1.2s ease-out",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/80" />

          <div
            className="absolute inset-x-0 bottom-0 p-6 transition-opacity duration-700 sm:p-12"
            style={{ opacity: active === 0 ? 1 : 0 }}
          >
            <h1
              className="font-extrabold leading-none tracking-tighter"
              style={{ fontSize: "clamp(4rem, 14vw, 9rem)" }}
            >
              {artist.name}
            </h1>
            {artist.tagline && (
              <p className="mt-3 text-2xl text-white/90">{artist.tagline}</p>
            )}
            <div className="mt-4">
              <Genres artist={artist} />
            </div>
            <p className="mt-8 text-xs uppercase tracking-widest text-white/40">
              ↓ 引いていくほど、この人がわかる
            </p>
          </div>

          {artist.chapters.map((entry, index) => (
            <div
              key={entry.key}
              className="absolute inset-x-0 bottom-0 p-6 transition-all duration-700 sm:p-12"
              style={{
                opacity: active === index + 1 ? 1 : 0,
                transform: active === index + 1 ? "none" : "translateY(24px)",
              }}
            >
              <div className="max-w-xl">
                <p className="text-xs uppercase tracking-widest text-white/50">
                  0{index + 1} · {entry.label}
                </p>
                <h2 className="mt-3 whitespace-pre-line text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                  {hookOf(entry.body)}
                </h2>
                <p className="mt-5 max-w-lg leading-7 text-white/80">
                  {paragraphs(entry.body)[0]}
                </p>
              </div>
            </div>
          ))}

          <div
            className="absolute inset-0 flex items-center justify-center p-6 transition-all duration-700"
            style={{
              opacity: isAction ? 1 : 0,
              pointerEvents: isAction ? "auto" : "none",
            }}
          >
            <div className="max-w-xl rounded-2xl border border-white/10 bg-black/60 p-8 backdrop-blur-md">
              <Action artist={artist} onLinkClick={onLinkClick} />
            </div>
          </div>

          <div className="absolute left-1/2 top-4 h-0.5 w-40 -translate-x-1/2 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full bg-white"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const PatternSpotlight = ({ artist, onLinkClick }: ActionProps) => {
  const [index, setIndex] = React.useState(-1);
  const total = artist.chapters.length;
  const chapter = index >= 0 && index < total ? artist.chapters[index] : null;
  const isAction = index === total;
  const stage = chapter ? stageOf(index) : null;
  const spot = stage
    ? { x: stage.focus.x, y: stage.focus.y, size: 340 }
    : isAction
      ? { x: "50%", y: "50%", size: 2400 }
      : { x: "32%", y: "26%", size: 260 };
  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <ImmersiveStyle />
      <img
        src={artist.heroImageUrl}
        alt=""
        className="absolute inset-0 h-full w-full object-cover transition-all duration-1000"
        style={{
          filter: stage ? stage.filter : "grayscale(0.3) contrast(1.1)",
          objectPosition: "50% 30%",
        }}
      />
      <div
        className="pointer-events-none absolute rounded-full"
        style={{
          left: spot.x,
          top: spot.y,
          width: spot.size,
          height: spot.size,
          transform: "translate(-50%, -50%)",
          boxShadow:
            "0 0 0 9999px rgba(0,0,0,0.94), inset 0 0 80px 30px rgba(0,0,0,0.4)",
          transition: "all 1.1s cubic-bezier(.2,.8,.2,1)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />

      <div className="relative flex min-h-screen flex-col p-6 sm:p-10">
        <div className="flex items-center justify-between text-xs uppercase tracking-widest text-white/50">
          <span>{artist.name}</span>
          <span className="tabular-nums">
            {chapter
              ? `0${index + 1} / 0${total}`
              : isAction
                ? "encore"
                : "on stage"}
          </span>
        </div>

        <div className="flex flex-1 flex-col justify-end pb-10">
          {index === -1 && (
            <div key="hero" className="max-w-2xl">
              <h1
                className="imm-drop font-extrabold leading-none tracking-tighter"
                style={{ fontSize: "clamp(3.5rem, 12vw, 8rem)" }}
              >
                {artist.name}
              </h1>
              {artist.tagline && (
                <p
                  className="imm-rise mt-4 text-2xl text-white/90"
                  style={{ animationDelay: ".2s" }}
                >
                  {artist.tagline}
                </p>
              )}
              <p
                className="imm-rise mt-6 text-sm text-white/50"
                style={{ animationDelay: ".4s" }}
              >
                客電が落ちています。ライトを当てて、この人を知ってください。
              </p>
            </div>
          )}
          {chapter && (
            <div key={chapter.key} className="max-w-2xl">
              <p className="imm-rise text-xs uppercase tracking-widest text-white/50">
                {chapter.label}
              </p>
              <h2 className="imm-drop mt-4 whitespace-pre-line text-4xl font-extrabold leading-tight tracking-tighter sm:text-6xl">
                {hookOf(chapter.body)}
              </h2>
              <div className="mt-6 max-w-lg">
                {paragraphs(chapter.body).map((paragraph, j) => (
                  <p
                    key={`${chapter.key}-${j}`}
                    className="imm-rise leading-7 text-white/85"
                    style={{
                      animationDelay: `${0.35 + j * 0.15}s`,
                      marginTop: j > 0 ? "1rem" : 0,
                    }}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          )}
          {isAction && (
            <div
              key="action"
              className="imm-rise max-w-xl rounded-2xl border border-white/10 bg-black/60 p-6 backdrop-blur-md sm:p-8"
            >
              <Action artist={artist} onLinkClick={onLinkClick} />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {index >= 0 && (
            <button
              type="button"
              onClick={() => setIndex(index - 1)}
              className="h-11 rounded-full border border-white/20 px-5 text-sm text-white/70 hover:bg-white/10"
            >
              ←
            </button>
          )}
          {!isAction && (
            <button
              type="button"
              onClick={() => setIndex(index + 1)}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-black hover:bg-white/90"
            >
              <span className="inline-block h-2 w-2 rounded-full bg-black" />
              {chapter
                ? index + 1 < total
                  ? `次：${artist.chapters[index + 1].label}`
                  : "ライトを全部つける"
                : "ライトを当てる"}
            </button>
          )}
          <div className="ml-auto flex gap-2">
            {artist.chapters.map((entry, k) => (
              <button
                type="button"
                key={entry.key}
                onClick={() => setIndex(k)}
                aria-label={entry.label}
                className={
                  "h-1.5 w-8 rounded-full transition-colors " +
                  (k === index ? "bg-white" : "bg-white/20")
                }
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const PatternEditorial = ({ artist, onLinkClick }: ActionProps) => {
  const root = useReveal();
  return (
    <div ref={root} className="bg-[#0d0c0a] font-serif text-[#efe9df]">
      <ImmersiveStyle />
      <header className="relative flex min-h-screen flex-col justify-end overflow-hidden">
        <img
          src={artist.heroImageUrl}
          alt=""
          className="imm-drift absolute inset-0 h-full w-full object-cover opacity-70"
          style={{
            objectPosition: "35% 25%",
            filter: "grayscale(0.8) contrast(1.15)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0d0c0a]/30 to-[#0d0c0a]" />
        <div className="relative mx-auto w-full max-w-3xl px-6 pb-16 sm:px-10">
          <p className="imm-rise text-xs uppercase tracking-[0.35em] text-white/50">
            Featured Artist
          </p>
          <h1
            className="imm-rise mt-4 leading-none tracking-tight"
            style={{
              fontSize: "clamp(4rem, 13vw, 8.5rem)",
              animationDelay: ".1s",
            }}
          >
            {artist.name}
          </h1>
          {artist.tagline && (
            <p
              className="imm-rise mt-6 max-w-xl text-xl italic leading-relaxed text-white/80"
              style={{ animationDelay: ".25s" }}
            >
              {artist.tagline}
            </p>
          )}
          <p
            className="imm-rise mt-8 text-xs tracking-widest text-white/40"
            style={{ animationDelay: ".4s" }}
          >
            {[artist.genres.join(" / "), artist.activityInfo]
              .filter((part) => part)
              .join(" — ")}
          </p>
        </div>
      </header>

      {artist.chapters.map((chapter, index) => (
        <React.Fragment key={chapter.key}>
          <article className="mx-auto max-w-3xl px-6 py-24 sm:px-10 sm:py-32">
            <p className="imm-reveal text-xs uppercase tracking-[0.35em] text-white/40">
              {`Chapter 0${index + 1}`} — {chapter.label}
            </p>
            <blockquote
              className="imm-reveal mt-8 whitespace-pre-line border-l-2 border-[#c9a35f] pl-6 leading-tight"
              style={{
                fontSize: "clamp(2rem, 6vw, 3.5rem)",
                transitionDelay: ".1s",
              }}
            >
              {hookOf(chapter.body)}
            </blockquote>
            <div className="mt-12 flex flex-col gap-6 text-lg leading-9 text-white/85">
              {paragraphs(chapter.body).map((paragraph, j) => (
                <p
                  key={`${chapter.key}-${j}`}
                  className={
                    "imm-reveal " +
                    (j === 0
                      ? "first-letter:float-left first-letter:mr-3 first-letter:text-6xl first-letter:leading-[0.85] first-letter:text-[#c9a35f]"
                      : "")
                  }
                  style={{ transitionDelay: `${0.25 + j * 0.1}s` }}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </article>
          <figure className="relative h-[70vh] overflow-hidden">
            <img
              src={artist.heroImageUrl}
              alt=""
              className="h-full w-full object-cover"
              style={{
                objectPosition: stageOf(index).position,
                filter: stageOf(index).filter,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0d0c0a] via-transparent to-[#0d0c0a]" />
            <figcaption className="absolute bottom-8 left-1/2 w-full max-w-3xl -translate-x-1/2 px-6 text-xs tracking-widest text-white/50 sm:px-10">
              {artist.name} — {chapter.label}
            </figcaption>
          </figure>
        </React.Fragment>
      ))}

      <footer className="mx-auto max-w-3xl px-6 py-28 font-sans sm:px-10">
        <div className="imm-reveal rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-md">
          <Action artist={artist} onLinkClick={onLinkClick} />
        </div>
        <p className="imm-reveal mt-10 text-center text-xs tracking-widest text-white/30">
          fin.
        </p>
      </footer>
    </div>
  );
};

const PATTERN_COMPONENTS: Record<
  ImmersivePatternCode,
  (props: ActionProps) => React.JSX.Element
> = {
  interview: PatternInterview,
  zoom_dive: PatternZoomDive,
  spotlight: PatternSpotlight,
  editorial: PatternEditorial,
};

export const ArtistImmersiveProfile = ({
  pattern,
  artist,
  onLinkClick,
}: ArtistImmersiveProfileProps) => {
  const Pattern = PATTERN_COMPONENTS[pattern];
  return <Pattern artist={artist} onLinkClick={onLinkClick} />;
};
ArtistImmersiveProfile.displayName = "ArtistImmersiveProfile";
