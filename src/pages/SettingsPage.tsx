import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { LANGUAGES } from '../lib/content';
import { useSettings, toSpeedUnit } from '../store/settings';
import { useTypingTest } from '../hooks/useTypingTest';
import { TypingArea } from '../components/Typing/TypingArea';
import { Choice, Row, Section, Slider, Switch } from '../components/Settings/controls';
import { Signature } from '../components/Chrome/SoundMenu';
import {
  ERROR_SOUND_IDS,
  SOUND_TIERS,
  VOICE_META,
  errorKey,
  previewTheme,
  timeWarning as playTimeWarning,
  type SoundThemeId,
} from '../lib/sound';
import { t } from '../i18n/strings';
import { copy, type OptId, type SectionId } from '../i18n/copy';
import { BACKGROUNDS, MAX_SCRIM, MIN_SCRIM, backgroundUrl } from '../lib/backgrounds';

/**
 * The preview text, per language.
 *
 * Long enough that a rule has room to bite, and — for the languages that have
 * them — full of accented letters, because a preview that cannot demonstrate
 * lazy mode is a preview that lies about lazy mode.
 */
const SAMPLES: Record<string, string> = {
  en: 'the quick brown fox jumps over the lazy dog while the whole village watches from the bridge and nobody says a word about it',
  fr: 'le vif renard brun saute par-dessus le chien paresseux pendant que la clé de l’église rouille près du café où l’été s’étire',
  es: 'el veloz zorro marrón salta sobre el perro perezoso mientras la señora del rincón añade azúcar a su café sin decir nada',
  de: 'der flinke braune fuchs springt über den faulen hund während die schöne mühle am fluss größer wirkt als sie früher war',
};

const SECTION_IDS: SectionId[] = ['sound', 'typing', 'appearance', 'backdrop', 'theme'];

/** The preview runs on its own short clock, so the time warning has something to warn about. */
const PREVIEW_SECONDS = 20;

/**
 * A live sample you can type in.
 *
 * Every setting on this page changes it immediately — including the three that
 * used to be impossible to picture. Stop-on-error, Expert/Master and the time
 * warning all announce themselves here, in words, the moment they fire.
 */
function Preview() {
  const s = useSettings();
  const c = copy(s.language);
  const [nonce, setNonce] = useState(0);

  const sample = SAMPLES[s.language] ?? SAMPLES.en;

  const typing = useTypingTest(sample, {
    timeLimit: PREVIEW_SECONDS,
    sound: s.sound,
    soundTheme: s.soundTheme,
    errorSound: s.errorSound,
    timeWarning: s.timeWarning,
    difficulty: s.difficulty,
    stopOnError: s.stopOnError,
    confidence: s.confidence,
    freedom: s.freedom,
    lazy: s.lazy,
  });

  const restart = () => {
    typing.restart();
    setNonce((n) => n + 1);
  };

  // loop the sample so the preview is always usable — but hold a failure on
  // screen long enough to read the reason for it
  const { finished, snapshot } = typing;
  useEffect(() => {
    if (!finished) return;
    const id = window.setTimeout(
      () => {
        typing.restart();
        setNonce((n) => n + 1);
      },
      snapshot.failed ? 2400 : 1000,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished, snapshot.failed]);

  const speed = toSpeedUnit(snapshot.wpm, s.speedUnit);
  const warningDue =
    s.timeWarning > 0 &&
    typing.remaining != null &&
    typing.remaining <= s.timeWarning &&
    snapshot.started &&
    !finished;

  // What the preview is currently proving, in one sentence.
  const status = snapshot.failed
    ? { text: s.difficulty === 'master' ? c.previewFailedMaster : c.previewFailedExpert, bad: true }
    : snapshot.blocked
      ? { text: c.previewBlocked, bad: true }
      : warningDue
        ? { text: c.previewWarning, bad: false }
        : null;

  return (
    <div
      className="rounded-sm overflow-hidden"
      style={{
        background: 'rgb(var(--paper-2))',
        border: '1px solid rgb(var(--ink) / 0.14)',
        boxShadow: '0 18px 44px -30px rgb(var(--ink) / 0.5)',
      }}
    >
      <div
        className="flex items-center justify-between gap-4 px-4 py-2"
        style={{ borderBottom: '1px solid rgb(var(--ink) / 0.1)' }}
      >
        <span
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: 'rgb(var(--ink-faint))' }}
        >
          {c.previewLabel}
        </span>
        <span className="flex items-center gap-3">
          {typing.remaining != null && (
            <span
              className="font-mono text-[11px] tabular-nums"
              style={{
                color: warningDue ? 'rgb(var(--error))' : 'rgb(var(--ink-faint))',
              }}
            >
              {typing.remaining}s
            </span>
          )}
          <span
            className="font-mono text-[11px]"
            style={{ color: 'rgb(var(--accent))', fontVariantNumeric: 'tabular-nums' }}
          >
            {speed} {s.speedUnit}
          </span>
          <button
            onClick={restart}
            className="font-mono text-[10px] uppercase tracking-[0.14em] transition-colors"
            style={{ color: 'rgb(var(--ink-faint))' }}
          >
            ↻
            <span className="sr-only">{c.previewRestart}</span>
          </button>
        </span>
      </div>

      <div className="px-4 py-3" {...typing.focusProps} key={nonce}>
        <TypingArea
          snapshot={snapshot}
          focused
          onClick={typing.focus}
          hint=""
          caretStyle={s.caretStyle}
          smoothCaret={s.smoothCaret}
          highlightMode={s.highlightMode}
          typedEffect={s.typedEffect}
          indicateTypos={s.indicateTypos}
          fontScale={s.fontSize * 0.72}
        />
      </div>

      {/* the sentence that explains what just happened — the whole point of the panel */}
      <div
        className="px-4 h-8 flex items-center transition-colors"
        style={{
          borderTop: '1px solid rgb(var(--ink) / 0.1)',
          background: status?.bad ? 'rgb(var(--error) / 0.07)' : 'transparent',
        }}
      >
        {status && (
          <motion.span
            key={status.text}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            className="font-sans text-[12px]"
            style={{ color: status.bad ? 'rgb(var(--error))' : 'rgb(var(--ink-soft))' }}
          >
            {status.text}
          </motion.span>
        )}
      </div>
    </div>
  );
}

/** The voices, grouped, each auditioning on click. */
function VoicePicker() {
  const s = useSettings();
  return (
    <div className="flex flex-col gap-4 w-full">
      {SOUND_TIERS.map((tier) => (
        <div key={tier.id}>
          <p
            className="font-mono text-[10px] uppercase tracking-[0.18em] mb-1.5"
            style={{ color: 'rgb(var(--ink-faint))' }}
          >
            {t(s.language, `tier_${tier.id}`)}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {tier.voices.map((id: SoundThemeId) => {
              const active = s.soundTheme === id;
              return (
                <button
                  key={id}
                  // Click, never hover: sweeping a mouse across the grid used to
                  // fire a dozen voices over the top of each other.
                  onClick={() => {
                    s.setSoundTheme(id);
                    if (!s.sound) s.toggleSound();
                    previewTheme(id);
                  }}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-sm text-left transition-colors"
                  style={{
                    background: active ? 'rgb(var(--accent) / 0.1)' : 'rgb(var(--ink) / 0.04)',
                    border: `1px solid ${active ? 'rgb(var(--accent) / 0.45)' : 'transparent'}`,
                  }}
                >
                  <span className="flex-1 min-w-0">
                    <span
                      className="block font-display text-[14px] leading-tight truncate"
                      style={{ color: active ? 'rgb(var(--accent))' : 'rgb(var(--ink))' }}
                    >
                      {VOICE_META[id].name}
                    </span>
                    <span
                      className="block font-mono text-[9px] uppercase tracking-[0.08em] truncate"
                      style={{ color: 'rgb(var(--ink-faint))' }}
                    >
                      {VOICE_META[id].material}
                    </span>
                  </span>
                  <Signature id={id} active={active} w={30} h={14} />
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Backdrop cards, each showing the real GIF behind the real scrim. */
function BackdropPicker() {
  const s = useSettings();
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full">
      {BACKGROUNDS.map((b) => {
        const active = s.bgId === b.id;
        return (
          <button
            key={b.id}
            onClick={() => s.setBg(b.id)}
            className="relative overflow-hidden rounded-sm text-left transition-all"
            style={{
              aspectRatio: '16 / 9',
              border: `1.5px solid ${active ? 'rgb(var(--accent))' : 'rgb(var(--ink) / 0.14)'}`,
              background: 'rgb(var(--ink) / 0.04)',
            }}
          >
            {b.file && (
              <>
                <img
                  src={backgroundUrl(b.file)}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 w-full h-full"
                  style={{ objectFit: 'cover', filter: 'saturate(0.85)' }}
                />
                {/* the same cover the page will apply, so the card tells the truth */}
                <div
                  className="absolute inset-0"
                  style={{ background: `rgb(var(--paper) / ${b.weight * 0.82})` }}
                />
              </>
            )}
            <span className="absolute inset-x-0 bottom-0 p-1.5 flex flex-col">
              <span
                className="font-display text-[13px] leading-tight"
                style={{ color: active ? 'rgb(var(--accent))' : 'rgb(var(--ink))' }}
              >
                {b.name}
              </span>
              <span
                className="font-mono text-[8.5px] uppercase tracking-[0.08em] truncate"
                style={{ color: 'rgb(var(--ink-soft))' }}
              >
                {b.scene}
                {b.kb > 0 && ` · ${b.kb} kB`}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function SettingsPage() {
  const s = useSettings();
  const lang = s.language;
  const c = copy(lang);
  const [active, setActive] = useState<SectionId>('sound');

  /** Option labels, translated. */
  const o = (id: OptId) => c.opt[id];
  const opts = <T extends string>(ids: readonly T[]) =>
    ids.map((id) => ({ value: id, label: o(id as OptId) }));

  // highlight the section currently under the header
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const seen = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (seen) setActive(seen.target.id as SectionId);
      },
      { rootMargin: '-96px 0px -60% 0px' },
    );
    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const langOptions = useMemo(() => LANGUAGES.map((l) => ({ value: l.code, label: l.name })), []);

  return (
    <div className="px-6 md:px-10 pb-24 max-w-[74rem] mx-auto w-full">
      <header className="pt-2 pb-6">
        <p
          className="font-mono text-[10px] uppercase tracking-[0.2em]"
          style={{ color: 'rgb(var(--ink-faint))' }}
        >
          {c.eyebrow}
        </p>
        <h1
          className="font-display text-[2.4rem] leading-none mt-1"
          style={{ color: 'rgb(var(--ink))' }}
        >
          {c.title}
        </h1>
      </header>

      <div className="mb-8">
        <Preview />
      </div>

      <div className="md:grid md:grid-cols-[10rem_1fr] md:gap-12">
        {/* section nav */}
        <nav className="hidden md:block">
          <div className="sticky top-6 flex flex-col gap-0.5">
            {SECTION_IDS.map((id) => (
              <button
                key={id}
                // NB: the app runs on a HashRouter, so an href="#id" anchor would be
                // read as a route and blank the page. Scroll the element instead.
                onClick={() =>
                  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
                className="px-3 py-1.5 rounded-full text-[13px] font-sans font-medium transition-colors text-left"
                style={{
                  color: active === id ? 'rgb(var(--ink))' : 'rgb(var(--ink-faint))',
                  background: active === id ? 'rgb(var(--ink) / 0.06)' : 'transparent',
                }}
              >
                {c.sections[id].title}
              </button>
            ))}
            <button
              onClick={() => {
                if (confirm(c.resetConfirm)) s.reset();
              }}
              className="mt-4 px-3 py-1.5 rounded-full text-[12px] font-sans text-left transition-colors"
              style={{ color: 'rgb(var(--error))' }}
            >
              {c.reset}
            </button>
          </div>
        </nav>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {/* ---------------- sound ---------------- */}
          <Section id="sound" {...c.sections.sound}>
            <Row {...c.rows.sound}>
              <Switch on={s.sound} onChange={() => s.toggleSound()} />
            </Row>
            <Row {...c.rows.voice} wide>
              <VoicePicker />
            </Row>
            <Row {...c.rows.volume}>
              <Slider
                value={s.soundVolume}
                min={0}
                max={1}
                step={0.05}
                onChange={(v) => {
                  s.set('soundVolume', v);
                  if (s.sound) previewTheme(s.soundTheme);
                }}
                format={(v) => `${Math.round(v * 100)}%`}
              />
            </Row>
            <Row {...c.rows.errorSound}>
              <Choice
                groupId="errorSound"
                value={s.errorSound}
                onChange={(v) => {
                  s.set('errorSound', v);
                  // audition it — otherwise these five words mean nothing
                  if (s.sound) errorKey(s.soundTheme, v);
                }}
                options={ERROR_SOUND_IDS.map((id) => ({ value: id, label: o(id as OptId) }))}
              />
            </Row>
            <Row {...c.rows.timeWarning}>
              <Choice
                groupId="timeWarning"
                value={s.timeWarning}
                onChange={(v) => {
                  s.set('timeWarning', v);
                  if (s.sound && v > 0) playTimeWarning();
                }}
                options={[
                  { value: 0, label: o('off') },
                  { value: 1, label: '1s' },
                  { value: 3, label: '3s' },
                  { value: 5, label: '5s' },
                  { value: 10, label: '10s' },
                ]}
              />
            </Row>
          </Section>

          {/* ---------------- typing ---------------- */}
          <Section id="typing" {...c.sections.typing}>
            <Row {...c.rows.difficulty}>
              <Choice
                groupId="difficulty"
                value={s.difficulty}
                onChange={(v) => s.set('difficulty', v)}
                options={opts(['normal', 'expert', 'master'] as const)}
              />
            </Row>
            <Row {...c.rows.stopOnError}>
              <Choice
                groupId="stopOnError"
                value={s.stopOnError}
                onChange={(v) => s.set('stopOnError', v)}
                options={opts(['off', 'letter', 'word'] as const)}
              />
            </Row>
            <Row {...c.rows.confidence}>
              <Choice
                groupId="confidence"
                value={s.confidence}
                onChange={(v) => s.set('confidence', v)}
                options={opts(['off', 'on', 'max'] as const)}
              />
            </Row>
            <Row {...c.rows.freedom}>
              <Switch on={s.freedom} onChange={(v) => s.set('freedom', v)} />
            </Row>
            <Row {...c.rows.lazy}>
              <Switch on={s.lazy} onChange={(v) => s.set('lazy', v)} />
            </Row>
            <Row {...c.rows.indicateTypos}>
              <Choice
                groupId="indicateTypos"
                value={s.indicateTypos}
                onChange={(v) => s.set('indicateTypos', v)}
                options={opts(['off', 'below', 'replace'] as const)}
              />
            </Row>
          </Section>

          {/* ---------------- appearance ---------------- */}
          <Section id="appearance" {...c.sections.appearance}>
            <Row {...c.rows.caretStyle}>
              <Choice
                groupId="caretStyle"
                value={s.caretStyle}
                onChange={(v) => s.set('caretStyle', v)}
                options={[
                  { value: 'line' as const, label: o('nib') },
                  { value: 'block' as const, label: o('block') },
                  { value: 'outline' as const, label: o('outline') },
                  { value: 'underline' as const, label: o('under') },
                  { value: 'off' as const, label: o('off') },
                ]}
              />
            </Row>
            <Row {...c.rows.caretMotion}>
              <Choice
                groupId="smoothCaret"
                value={s.smoothCaret}
                onChange={(v) => s.set('smoothCaret', v)}
                options={[
                  { value: 'off' as const, label: o('snap') },
                  { value: 'slow' as const, label: o('slow') },
                  { value: 'medium' as const, label: o('medium') },
                  { value: 'fast' as const, label: o('fast') },
                ]}
              />
            </Row>
            <Row {...c.rows.highlight}>
              <Choice
                groupId="highlightMode"
                value={s.highlightMode}
                onChange={(v) => s.set('highlightMode', v)}
                options={opts(['off', 'letter', 'word'] as const)}
              />
            </Row>
            <Row {...c.rows.typedText}>
              <Choice
                groupId="typedEffect"
                value={s.typedEffect}
                onChange={(v) => s.set('typedEffect', v)}
                options={opts(['keep', 'fade', 'dots', 'hide'] as const)}
              />
            </Row>
            <Row {...c.rows.textSize}>
              <Slider
                value={s.fontSize}
                min={0.75}
                max={1.4}
                step={0.05}
                onChange={(v) => s.set('fontSize', v)}
                format={(v) => `${Math.round(v * 100)}%`}
              />
            </Row>
            <Row {...c.rows.speedUnit}>
              <Choice
                groupId="speedUnit"
                value={s.speedUnit}
                onChange={(v) => s.set('speedUnit', v)}
                options={opts(['wpm', 'cpm', 'wps'] as const)}
              />
            </Row>
            <Row {...c.rows.capsWarning}>
              <Switch on={s.capsWarning} onChange={(v) => s.set('capsWarning', v)} />
            </Row>
          </Section>

          {/* ---------------- backdrop ---------------- */}
          <Section id="backdrop" {...c.sections.backdrop}>
            <Row {...c.rows.backdrop} wide>
              <BackdropPicker />
            </Row>
            <Row {...c.rows.bgVisible}>
              <Switch on={s.bgVisible} onChange={() => s.toggleBgVisible()} />
            </Row>
            <Row {...c.rows.cover}>
              <Slider
                value={s.bgScrim}
                min={MIN_SCRIM}
                max={MAX_SCRIM}
                step={0.05}
                onChange={(v) => s.set('bgScrim', v)}
                format={(v) => `${Math.round(v * 100)}%`}
              />
            </Row>
            <Row {...c.rows.blur}>
              <Slider
                value={s.bgBlur}
                min={0}
                max={16}
                step={1}
                onChange={(v) => s.set('bgBlur', v)}
                format={(v) => `${v}px`}
              />
            </Row>
          </Section>

          {/* ---------------- theme ---------------- */}
          <Section id="theme" {...c.sections.theme}>
            <Row {...c.rows.pageTheme}>
              <Choice
                groupId="pageTheme"
                value={s.theme}
                onChange={(v) => s.setTheme(v)}
                options={[
                  { value: 'light' as const, label: o('light') },
                  { value: 'caramel' as const, label: o('caramel') },
                  { value: 'dark' as const, label: o('dark') },
                ]}
              />
            </Row>
            <Row {...c.rows.language}>
              <Choice
                groupId="language"
                value={s.language}
                onChange={(v) => s.setLanguage(v)}
                options={langOptions}
              />
            </Row>
          </Section>
        </motion.div>
      </div>
    </div>
  );
}
