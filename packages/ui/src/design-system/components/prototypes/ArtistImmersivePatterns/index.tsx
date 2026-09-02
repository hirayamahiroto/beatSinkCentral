import React from "react";

type ImmersiveChapter = {
  key: string;
  label: string;
  question: string;
  hook: string;
  body: string;
  imageUrl: string;
  pos: string;
  filter: string;
  focus: { x: string; y: string };
};

type ImmersiveArtist = {
  name: string;
  tagline: string;
  heroImageUrl: string;
  genres: string[];
  activityInfo: string;
  chapters: ImmersiveChapter[];
  primaryAction: { reason: string; label: string };
  links: string[];
};

export type { ImmersiveChapter, ImmersiveArtist };

export const sampleArtist: ImmersiveArtist = {
  name: "SAKU",
  tagline: "口ひとつで、フロアを揺らす。",
  heroImageUrl: "/image5.jpeg",
  genres: ["Beatbox", "Bass"],
  activityInfo: "東京 / ソロ",
  chapters: [
    {
      key: "origin",
      label: "始まり",
      question: "どうして始めたのか",
      hook: "鏡の前で、\n全然鳴らなかった夜。",
      body: "中学2年の帰り道、友達のスマホで見た動画が全部だった。機材も楽器もないのに、音が鳴っていた。\n\nその日の夜、洗面所の鏡の前で真似をして、全然鳴らなくて、それが悔しくて続いた。",
      imageUrl: "/image3.jpeg",
      pos: "30% 35%",
      filter: "grayscale(1) contrast(1.15)",
      focus: { x: "32%", y: "26%" },
    },
    {
      key: "turn",
      label: "転機",
      question: "変わった瞬間",
      hook: "初戦負けの帰り道、\nイヤホンの中で全部わかった。",
      body: "初めて出た大会は一回戦で負けた。帰りの電車で自分の録音を聴いたら、音が「速い」だけで「重く」なかった。\n\nその日から低音だけを一年やった。技の数を増やすのをやめた。",
      imageUrl: "/image7.jpeg",
      pos: "58% 35%",
      filter: "grayscale(0.5) contrast(1.1)",
      focus: { x: "46%", y: "42%" },
    },
    {
      key: "now",
      label: "いま",
      question: "いま目指していること",
      hook: "知らない人の前で、\n音だけで勝負したい。",
      body: "ビートボックスを「見せ物」ではなく「音楽」として聴いてもらう場所を、自分でつくりたい。\n\nまずは10月に、初めてのワンマンをやる。",
      imageUrl: "/image4.jpeg",
      pos: "40% 45%",
      filter: "grayscale(0) contrast(1.1) saturate(1.35)",
      focus: { x: "62%", y: "54%" },
    },
  ],
  primaryAction: {
    reason:
      "10月のワンマンに来てほしい。ここで話したことを、全部そこで鳴らす。",
    label: "ライブ情報を見る",
  },
  links: ["YouTube", "X", "Instagram"],
};

const paras = (body: string): string[] =>
  body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

const stop = (e: React.MouseEvent) => e.preventDefault();

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
    {artist.genres.map((g) => (
      <span
        key={g}
        className="rounded-full border border-white/20 px-3 py-1 text-xs font-medium uppercase tracking-widest text-white/80"
      >
        {g}
      </span>
    ))}
    <span className="text-xs text-white/50">{artist.activityInfo}</span>
  </div>
);

const CTA = ({ artist }: { artist: ImmersiveArtist }) => (
  <div className="flex flex-col gap-4">
    <p className="text-xs uppercase tracking-widest text-white/50">
      いま、と一つの行動
    </p>
    <p className="text-xl leading-relaxed text-white sm:text-2xl">
      {artist.primaryAction.reason}
    </p>
    <div className="flex flex-wrap items-center gap-4">
      <span className="relative inline-flex">
        <span className="imm-ring absolute inset-0 rounded-full bg-purple-500/40" />
        <a
          href="#"
          onClick={stop}
          className="relative inline-flex h-12 items-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 px-8 text-sm font-semibold text-white shadow-lg"
        >
          {artist.primaryAction.label}
        </a>
      </span>
      {artist.links.map((l) => (
        <a
          key={l}
          href="#"
          onClick={stop}
          className="text-sm text-white/60 underline-offset-4 hover:text-white hover:underline"
        >
          {l}
        </a>
      ))}
    </div>
  </div>
);

const useReveal = () => {
  const root = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const els = root.current?.querySelectorAll(".imm-reveal");
    if (!els) return;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("in");
        }),
      { threshold: 0.25 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return root;
};

export const PatternInterview = ({ artist }: { artist: ImmersiveArtist }) => {
  const root = useReveal();
  const [active, setActive] = React.useState(0);
  const sections = React.useRef<(HTMLElement | null)[]>([]);
  React.useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(Number(entry.target.getAttribute("data-i")));
          }
        }),
      { threshold: 0.5 },
    );
    sections.current.forEach((el) => {
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);
  return (
    <div ref={root} className="bg-black text-white">
      <ImmersiveStyle />
      <div className="mx-auto flex max-w-6xl">
        <div className="sticky top-0 hidden h-screen w-1/2 items-center p-10 md:flex">
          <div className="relative h-[80vh] w-full overflow-hidden rounded-3xl">
            {artist.chapters.map((c, i) => (
              <img
                key={c.key}
                src={c.imageUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover transition-all duration-1000"
                style={{
                  objectPosition: c.pos,
                  filter: c.filter,
                  opacity: i === active ? 1 : 0,
                }}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6">
              <p className="text-3xl font-extrabold tracking-tight">
                {artist.name}
              </p>
              <p className="mt-1 text-sm text-white/70">{artist.tagline}</p>
            </div>
            <div className="absolute right-5 top-5 flex flex-col gap-2">
              {artist.chapters.map((c, i) => (
                <span
                  key={c.key}
                  className={
                    "h-1.5 w-8 rounded-full transition-all duration-500 " +
                    (i === active ? "bg-white" : "bg-white/25")
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
            <p className="text-xl text-white/80">{artist.tagline}</p>
            <Genres artist={artist} />
          </section>
          <section className="hidden min-h-[40vh] flex-col justify-end p-10 md:flex">
            <p className="imm-reveal text-xs uppercase tracking-widest text-white/40">
              Interview
            </p>
            <p className="imm-reveal mt-3 text-lg leading-relaxed text-white/70">
              3つの問いに、本人が答えた。
            </p>
            <div className="imm-reveal mt-4">
              <Genres artist={artist} />
            </div>
          </section>

          {artist.chapters.map((c, i) => (
            <section
              key={c.key}
              data-i={i}
              ref={(el) => {
                sections.current[i] = el;
              }}
              className="flex min-h-screen flex-col justify-center border-l border-white/10 p-6 sm:p-10"
            >
              <p className="imm-reveal font-mono text-xs text-white/40">
                Q{i + 1} — {c.question}
              </p>
              <h2 className="imm-reveal mt-4 whitespace-pre-line text-3xl font-bold leading-snug tracking-tight sm:text-4xl">
                {c.hook}
              </h2>
              <div className="mt-8 flex flex-col gap-5 border-l-2 border-purple-400/50 pl-5">
                {paras(c.body).map((p, j) => (
                  <p
                    key={p}
                    className="imm-reveal leading-8 text-white/80"
                    style={{ transitionDelay: `${0.15 + j * 0.12}s` }}
                  >
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}

          <section className="flex min-h-[70vh] flex-col justify-center p-6 sm:p-10">
            <div className="imm-reveal rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md sm:p-8">
              <CTA artist={artist} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
PatternInterview.displayName = "PatternInterview";

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

export const PatternZoomDive = ({ artist }: { artist: ImmersiveArtist }) => {
  const container = React.useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = React.useState(0);
  React.useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = container.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const total = el.offsetHeight - window.innerHeight;
        if (total <= 0) return;
        setProgress(clamp(-rect.top / total, 0, 1));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const segments = artist.chapters.length + 2;
  const segFloat = progress * (segments - 1);
  const active = clamp(Math.round(segFloat), 0, segments - 1);
  const scale = 2.6 - 1.6 * progress;
  const grayscale = 1 - progress;
  const chapterIndex = active - 1;
  const chapter =
    chapterIndex >= 0 && chapterIndex < artist.chapters.length
      ? artist.chapters[chapterIndex]
      : null;
  const isCta = active === segments - 1;

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
              objectPosition: chapter
                ? `${chapter.focus.x} ${chapter.focus.y}`
                : "32% 24%",
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
            <p className="mt-3 text-2xl text-white/90">{artist.tagline}</p>
            <div className="mt-4">
              <Genres artist={artist} />
            </div>
            <p className="mt-8 text-xs uppercase tracking-widest text-white/40">
              ↓ 引いていくほど、この人がわかる
            </p>
          </div>

          {artist.chapters.map((c, i) => (
            <div
              key={c.key}
              className="absolute inset-x-0 bottom-0 p-6 transition-all duration-700 sm:p-12"
              style={{
                opacity: active === i + 1 ? 1 : 0,
                transform: active === i + 1 ? "none" : "translateY(24px)",
              }}
            >
              <div className="max-w-xl">
                <p className="text-xs uppercase tracking-widest text-white/50">
                  0{i + 1} · {c.question}
                </p>
                <h2 className="mt-3 whitespace-pre-line text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                  {c.hook}
                </h2>
                <p className="mt-5 max-w-lg leading-7 text-white/80">
                  {paras(c.body)[0]}
                </p>
              </div>
            </div>
          ))}

          <div
            className="absolute inset-0 flex items-center justify-center p-6 transition-all duration-700"
            style={{
              opacity: isCta ? 1 : 0,
              pointerEvents: isCta ? "auto" : "none",
            }}
          >
            <div className="max-w-xl rounded-2xl border border-white/10 bg-black/60 p-8 backdrop-blur-md">
              <CTA artist={artist} />
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
PatternZoomDive.displayName = "PatternZoomDive";

export const PatternSpotlight = ({ artist }: { artist: ImmersiveArtist }) => {
  const [i, setI] = React.useState(-1);
  const total = artist.chapters.length;
  const chapter = i >= 0 && i < total ? artist.chapters[i] : null;
  const isCta = i === total;
  const spot = chapter
    ? { x: chapter.focus.x, y: chapter.focus.y, size: 340 }
    : isCta
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
          filter: chapter ? chapter.filter : "grayscale(0.3) contrast(1.1)",
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
            {chapter ? `0${i + 1} / 0${total}` : isCta ? "encore" : "on stage"}
          </span>
        </div>

        <div className="flex flex-1 flex-col justify-end pb-10">
          {i === -1 && (
            <div key="hero" className="max-w-2xl">
              <h1
                className="imm-drop font-extrabold leading-none tracking-tighter"
                style={{ fontSize: "clamp(3.5rem, 12vw, 8rem)" }}
              >
                {artist.name}
              </h1>
              <p
                className="imm-rise mt-4 text-2xl text-white/90"
                style={{ animationDelay: ".2s" }}
              >
                {artist.tagline}
              </p>
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
                {chapter.question}
              </p>
              <h2 className="imm-drop mt-4 whitespace-pre-line text-4xl font-extrabold leading-tight tracking-tighter sm:text-6xl">
                {chapter.hook}
              </h2>
              <div className="mt-6 max-w-lg">
                {paras(chapter.body).map((p, j) => (
                  <p
                    key={p}
                    className="imm-rise leading-7 text-white/85"
                    style={{
                      animationDelay: `${0.35 + j * 0.15}s`,
                      marginTop: j > 0 ? "1rem" : 0,
                    }}
                  >
                    {p}
                  </p>
                ))}
              </div>
            </div>
          )}
          {isCta && (
            <div
              key="cta"
              className="imm-rise max-w-xl rounded-2xl border border-white/10 bg-black/60 p-6 backdrop-blur-md sm:p-8"
            >
              <CTA artist={artist} />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {i >= 0 && (
            <button
              onClick={() => setI(i - 1)}
              className="h-11 rounded-full border border-white/20 px-5 text-sm text-white/70 hover:bg-white/10"
            >
              ←
            </button>
          )}
          {!isCta && (
            <button
              onClick={() => setI(i + 1)}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-black hover:bg-white/90"
            >
              <span className="inline-block h-2 w-2 rounded-full bg-black" />
              {chapter
                ? i + 1 < total
                  ? `次：${artist.chapters[i + 1].label}`
                  : "ライトを全部つける"
                : "ライトを当てる"}
            </button>
          )}
          <div className="ml-auto flex gap-2">
            {artist.chapters.map((c, k) => (
              <button
                key={c.key}
                onClick={() => setI(k)}
                aria-label={c.label}
                className={
                  "h-1.5 w-8 rounded-full transition-colors " +
                  (k === i ? "bg-white" : "bg-white/20")
                }
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
PatternSpotlight.displayName = "PatternSpotlight";

export const PatternEditorial = ({ artist }: { artist: ImmersiveArtist }) => {
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
          <p
            className="imm-rise mt-6 max-w-xl text-xl italic leading-relaxed text-white/80"
            style={{ animationDelay: ".25s" }}
          >
            {artist.tagline}
          </p>
          <p
            className="imm-rise mt-8 text-xs tracking-widest text-white/40"
            style={{ animationDelay: ".4s" }}
          >
            {artist.genres.join(" / ")} — {artist.activityInfo}
          </p>
        </div>
      </header>

      {artist.chapters.map((c, i) => (
        <React.Fragment key={c.key}>
          <article className="mx-auto max-w-3xl px-6 py-24 sm:px-10 sm:py-32">
            <p className="imm-reveal text-xs uppercase tracking-[0.35em] text-white/40">
              {`Chapter 0${i + 1}`} — {c.label}
            </p>
            <blockquote
              className="imm-reveal mt-8 whitespace-pre-line border-l-2 border-[#c9a35f] pl-6 leading-tight"
              style={{
                fontSize: "clamp(2rem, 6vw, 3.5rem)",
                transitionDelay: ".1s",
              }}
            >
              {c.hook}
            </blockquote>
            <p
              className="imm-reveal mt-6 text-sm italic text-white/50"
              style={{ transitionDelay: ".2s" }}
            >
              — {c.question}
            </p>
            <div className="mt-12 flex flex-col gap-6 text-lg leading-9 text-white/85">
              {paras(c.body).map((p, j) => (
                <p
                  key={p}
                  className={
                    "imm-reveal " +
                    (j === 0
                      ? "first-letter:float-left first-letter:mr-3 first-letter:text-6xl first-letter:leading-[0.85] first-letter:text-[#c9a35f]"
                      : "")
                  }
                  style={{ transitionDelay: `${0.25 + j * 0.1}s` }}
                >
                  {p}
                </p>
              ))}
            </div>
          </article>
          <figure className="relative h-[70vh] overflow-hidden">
            <img
              src={c.imageUrl}
              alt=""
              className="h-full w-full object-cover"
              style={{ objectPosition: c.pos, filter: c.filter }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0d0c0a] via-transparent to-[#0d0c0a]" />
            <figcaption className="absolute bottom-8 left-1/2 w-full max-w-3xl -translate-x-1/2 px-6 text-xs tracking-widest text-white/50 sm:px-10">
              {artist.name} — {c.label}
            </figcaption>
          </figure>
        </React.Fragment>
      ))}

      <footer className="mx-auto max-w-3xl px-6 py-28 font-sans sm:px-10">
        <div className="imm-reveal rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-md">
          <CTA artist={artist} />
        </div>
        <p className="imm-reveal mt-10 text-center text-xs tracking-widest text-white/30">
          fin.
        </p>
      </footer>
    </div>
  );
};
PatternEditorial.displayName = "PatternEditorial";
