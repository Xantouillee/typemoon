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
import { BACKGROUNDS, MAX_SCRIM, MIN_SCRIM, backgroundUrl } from '../lib/backgrounds';

/** A neutral pangram-ish line: every setting has something to act on. */
const SAMPLE = 'the quick brown fox jumps over the lazy dog and never looks back';

const SECTIONS = [
  { id: 'sound', title: 'Sound', blurb: 'How the keyboard feels in your ears.' },
  { id: 'typing', title: 'Typing', blurb: 'What counts as a mistake, and what a mistake costs.' },
  { id: 'appearance', title: 'Appearance', blurb: 'How the words and the caret present themselves.' },
  { id: 'arcade', title: 'Arcade', blurb: 'The backdrop behind Ink Rush and the Anthology.' },
  { id: 'theme', title: 'Theme & language', blurb: 'The look of the page and the words you type.' },
];

/** A live sample you can type in — every setting on this page changes it immediately. */
function Preview() {
  const s = useSettings();
  const [nonce, setNonce] = useState(0);

  const typing = useTypingTest(SAMPLE, {
    sound: s.sound,
    soundTheme: s.soundTheme,
    errorSound: s.errorSound,
    difficulty: s.difficulty,
    stopOnError: s.stopOnError,
    confidence: s.confidence,
    freedom: s.freedom,
    lazy: s.lazy,
  });

  // loop the sample so the preview is always usable
  useEffect(() => {
    if (!typing.finished) return;
    const id = window.setTimeout(() => {
      typing.restart();
      setNonce((n) => n + 1);
    }, 900);
    return () => window.clearTimeout(id);
  }, [typing.finished, typing]);

  const speed = toSpeedUnit(typing.snapshot.wpm, s.speedUnit);

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
          live preview — type here
        </span>
        <span
          className="font-mono text-[11px]"
          style={{ color: 'rgb(var(--accent))', fontVariantNumeric: 'tabular-nums' }}
        >
          {speed} {s.speedUnit}
        </span>
      </div>
      <div className="px-4 py-3" {...typing.focusProps} key={nonce}>
        <TypingArea
          snapshot={typing.snapshot}
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
    </div>
  );
}

/** The twelve voices, grouped, each auditioning on hover. */
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
            {tier.id}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {tier.voices.map((id: SoundThemeId) => {
              const active = s.soundTheme === id;
              return (
                <button
                  key={id}
                  onClick={() => {
                    s.setSoundTheme(id);
                    if (!s.sound) s.toggleSound();
                    previewTheme(id);
                  }}
                  onMouseEnter={() => s.sound && previewTheme(id)}
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
        const active = s.arcadeBg === b.id;
        return (
          <button
            key={b.id}
            onClick={() => s.setArcadeBg(b.id)}
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
                {/* the same cover the arcade will apply, so the card tells the truth */}
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
  const [active, setActive] = useState('sound');

  // highlight the section currently under the header
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const seen = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (seen) setActive(seen.target.id);
      },
      { rootMargin: '-96px 0px -60% 0px' },
    );
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const langOptions = useMemo(
    () => LANGUAGES.map((l) => ({ value: l.code, label: l.name })),
    [],
  );

  return (
    <div className="px-6 md:px-10 pb-24 max-w-[74rem] mx-auto w-full">
      <header className="pt-2 pb-6">
        <p
          className="font-mono text-[10px] uppercase tracking-[0.2em]"
          style={{ color: 'rgb(var(--ink-faint))' }}
        >
          {t(lang, 'allSettings')}
        </p>
        <h1
          className="font-display text-[2.4rem] leading-none mt-1"
          style={{ color: 'rgb(var(--ink))' }}
        >
          Set your hand.
        </h1>
      </header>

      <div className="mb-8">
        <Preview />
      </div>

      <div className="md:grid md:grid-cols-[10rem_1fr] md:gap-12">
        {/* section nav */}
        <nav className="hidden md:block">
          <div className="sticky top-6 flex flex-col gap-0.5">
            {SECTIONS.map((sec) => (
              <button
                key={sec.id}
                // NB: the app runs on a HashRouter, so an href="#id" anchor would be
                // read as a route and blank the page. Scroll the element instead.
                onClick={() =>
                  document
                    .getElementById(sec.id)
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
                className="px-3 py-1.5 rounded-full text-[13px] font-sans font-medium transition-colors text-left"
                style={{
                  color: active === sec.id ? 'rgb(var(--ink))' : 'rgb(var(--ink-faint))',
                  background: active === sec.id ? 'rgb(var(--ink) / 0.06)' : 'transparent',
                }}
              >
                {sec.title}
              </button>
            ))}
            <button
              onClick={() => {
                if (confirm('Reset every setting to its default?')) s.reset();
              }}
              className="mt-4 px-3 py-1.5 rounded-full text-[12px] font-sans text-left transition-colors"
              style={{ color: 'rgb(var(--error))' }}
            >
              Reset all
            </button>
          </div>
        </nav>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {/* ---------------- sound ---------------- */}
          <Section {...SECTIONS[0]}>
            <Row label="Keyboard sound" hint="Play a sound on every keystroke.">
              <Switch on={s.sound} onChange={() => s.toggleSound()} />
            </Row>
            <Row
              label="Voice"
              hint="What the keyboard is made of. Every voice is synthesised — nothing is downloaded. Hover to hear one."
              wide
            >
              <VoicePicker />
            </Row>
            <Row label="Volume" hint="How loud the keystrokes and effects are.">
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
            <Row
              label="Error sound"
              hint="What a wrong key sounds like. “Voice” keeps the mistake in the same material as the keyboard."
            >
              <Choice
                groupId="errorSound"
                value={s.errorSound}
                onChange={(v) => {
                  s.set('errorSound', v);
                  // audition it — otherwise these five words mean nothing
                  if (s.sound) errorKey(s.soundTheme, v);
                }}
                options={ERROR_SOUND_IDS.map((id) => ({ value: id, label: id }))}
              />
            </Row>
            <Row
              label="Time warning"
              hint="A double tick when a timed test is nearly over, so the end never surprises you."
            >
              <Choice
                groupId="timeWarning"
                value={s.timeWarning}
                onChange={(v) => {
                  s.set('timeWarning', v);
                  if (s.sound && v > 0) playTimeWarning();
                }}
                options={[
                  { value: 0, label: 'off' },
                  { value: 1, label: '1s' },
                  { value: 3, label: '3s' },
                  { value: 5, label: '5s' },
                  { value: 10, label: '10s' },
                ]}
              />
            </Row>
          </Section>

          {/* ---------------- typing ---------------- */}
          <Section {...SECTIONS[1]}>
            <Row
              label="Difficulty"
              hint="Expert ends the test if you submit a word containing a mistake. Master ends it on a single wrong key."
            >
              <Choice
                groupId="difficulty"
                value={s.difficulty}
                onChange={(v) => s.set('difficulty', v)}
                options={[
                  { value: 'normal', label: 'normal' },
                  { value: 'expert', label: 'expert' },
                  { value: 'master', label: 'master' },
                ]}
              />
            </Row>
            <Row
              label="Stop on error"
              hint="Refuse further input until a mistake is corrected. “Letter” stops instantly; “word” lets you finish the word first."
            >
              <Choice
                groupId="stopOnError"
                value={s.stopOnError}
                onChange={(v) => s.set('stopOnError', v)}
                options={[
                  { value: 'off', label: 'off' },
                  { value: 'letter', label: 'letter' },
                  { value: 'word', label: 'word' },
                ]}
              />
            </Row>
            <Row
              label="Confidence"
              hint="Limit how far back you can go. “On” keeps you inside the current word; “max” removes backspace entirely."
            >
              <Choice
                groupId="confidence"
                value={s.confidence}
                onChange={(v) => s.set('confidence', v)}
                options={[
                  { value: 'off', label: 'off' },
                  { value: 'on', label: 'on' },
                  { value: 'max', label: 'max' },
                ]}
              />
            </Row>
            <Row
              label="Freedom"
              hint="Allow deleting characters you already typed correctly. Off commits every correct keystroke."
            >
              <Switch on={s.freedom} onChange={(v) => s.set('freedom', v)} />
            </Row>
            <Row
              label="Lazy mode"
              hint="Accept a plain letter where the text wants an accent — type “e” for “é”. Useful in French, Spanish and German."
            >
              <Switch on={s.lazy} onChange={(v) => s.set('lazy', v)} />
            </Row>
            <Row
              label="Indicate typos"
              hint="Show the character you actually pressed. “Below” prints it under the word; “replace” swaps it in."
            >
              <Choice
                groupId="indicateTypos"
                value={s.indicateTypos}
                onChange={(v) => s.set('indicateTypos', v)}
                options={[
                  { value: 'off', label: 'off' },
                  { value: 'below', label: 'below' },
                  { value: 'replace', label: 'replace' },
                ]}
              />
            </Row>
          </Section>

          {/* ---------------- appearance ---------------- */}
          <Section {...SECTIONS[2]}>
            <Row label="Caret style" hint="The shape of the marker that tracks your position.">
              <Choice
                groupId="caretStyle"
                value={s.caretStyle}
                onChange={(v) => s.set('caretStyle', v)}
                options={[
                  { value: 'line', label: 'nib' },
                  { value: 'block', label: 'block' },
                  { value: 'outline', label: 'outline' },
                  { value: 'underline', label: 'under' },
                  { value: 'off', label: 'off' },
                ]}
              />
            </Row>
            <Row label="Caret motion" hint="How the caret travels between characters.">
              <Choice
                groupId="smoothCaret"
                value={s.smoothCaret}
                onChange={(v) => s.set('smoothCaret', v)}
                options={[
                  { value: 'off', label: 'snap' },
                  { value: 'slow', label: 'slow' },
                  { value: 'medium', label: 'medium' },
                  { value: 'fast', label: 'fast' },
                ]}
              />
            </Row>
            <Row
              label="Highlight"
              hint="Dim everything except what you are typing right now, to narrow your focus."
            >
              <Choice
                groupId="highlightMode"
                value={s.highlightMode}
                onChange={(v) => s.set('highlightMode', v)}
                options={[
                  { value: 'off', label: 'off' },
                  { value: 'letter', label: 'letter' },
                  { value: 'word', label: 'word' },
                ]}
              />
            </Row>
            <Row label="Typed text" hint="What happens to the words once you have passed them.">
              <Choice
                groupId="typedEffect"
                value={s.typedEffect}
                onChange={(v) => s.set('typedEffect', v)}
                options={[
                  { value: 'keep', label: 'keep' },
                  { value: 'fade', label: 'fade' },
                  { value: 'dots', label: 'dots' },
                  { value: 'hide', label: 'hide' },
                ]}
              />
            </Row>
            <Row label="Text size" hint="The size of the words in the typing area.">
              <Slider
                value={s.fontSize}
                min={0.75}
                max={1.4}
                step={0.05}
                onChange={(v) => s.set('fontSize', v)}
                format={(v) => `${Math.round(v * 100)}%`}
              />
            </Row>
            <Row
              label="Speed unit"
              hint="Words per minute, characters per minute, or words per second."
            >
              <Choice
                groupId="speedUnit"
                value={s.speedUnit}
                onChange={(v) => s.set('speedUnit', v)}
                options={[
                  { value: 'wpm', label: 'wpm' },
                  { value: 'cpm', label: 'cpm' },
                  { value: 'wps', label: 'wps' },
                ]}
              />
            </Row>
            <Row label="Caps lock warning" hint="Show a warning while caps lock is on.">
              <Switch on={s.capsWarning} onChange={(v) => s.set('capsWarning', v)} />
            </Row>
          </Section>

          {/* ---------------- arcade ---------------- */}
          <Section {...SECTIONS[3]}>
            <Row
              label="Backdrop"
              hint="A moving scene behind the arcade. Practice mode stays plain — nothing here touches it."
              wide
            >
              <BackdropPicker />
            </Row>
            <Row
              label="Cover"
              hint="How much of the page colour sits over the image. Raise it if anything is hard to read; it cannot go low enough to make text illegible."
            >
              <Slider
                value={s.arcadeScrim}
                min={MIN_SCRIM}
                max={MAX_SCRIM}
                step={0.05}
                onChange={(v) => s.set('arcadeScrim', v)}
                format={(v) => `${Math.round(v * 100)}%`}
              />
            </Row>
            <Row
              label="Blur"
              hint="Softens the image so its detail stops competing with the words. At zero the pixel art stays sharp."
            >
              <Slider
                value={s.arcadeBlur}
                min={0}
                max={16}
                step={1}
                onChange={(v) => s.set('arcadeBlur', v)}
                format={(v) => `${v}px`}
              />
            </Row>
          </Section>

          {/* ---------------- theme ---------------- */}
          <Section {...SECTIONS[4]}>
            <Row label="Page theme" hint="Ink on Cream by day, Midnight Ink by night.">
              <Choice
                groupId="pageTheme"
                value={s.theme}
                onChange={(v) => s.setTheme(v)}
                options={[
                  { value: 'light', label: 'ink on cream' },
                  { value: 'caramel', label: 'burnt caramel' },
                  { value: 'dark', label: 'midnight ink' },
                ]}
              />
            </Row>
            <Row
              label="Language"
              hint="Changes the words you type, and the language of the interface."
            >
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
