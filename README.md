# Audio Certificates — Vividha Trust

Certificates that speak, built for **Curious Minds**, the National STEM Challenge
for students with visual impairment and their teachers, presented by
[Vividha Trust](https://vividhatrust.org).

A paper certificate is something a blind student cannot appreciate on their own.
This makes the certificate itself an experience: a ~45-second recording that
names the student, says what they exhibited and announces their prize — set
against real applause, so they hear the moment of recognition rather than being
told about it afterwards.

Each certificate produces three things:

- **an MP3** (~700 KB) that forwards over WhatsApp, which is how families
  actually receive things;
- **a web page** built for screen readers and low vision, with the full
  transcript;
- **a printable certificate** with a QR code back to the audio.

---

## How the audio is put together

The score lives in [`src/lib/audio/score.ts`](src/lib/audio/score.ts) as data;
adjust the feel of the piece by editing the numbers in `TIMING`.

| | |
|---|---|
| 0.0 s | Signature chime — the same three notes on every Vividha certificate |
| 0.5 s | Hall ambience fades in at −26 dB and runs underneath throughout |
| 2.4 s | **"Curious Minds 2026. A National STEM Challenge for students with visual impairment and their teachers, presented by Vividha Trust."** |
| ~10 s | **"This certificate is awarded to"** — no full stop, so it leads into the name |
| ~12.5 s | *silence* → **THE NAME**, alone, slowed to 0.9× → *silence* |
| ~14.6 s | **"…from ACTS Secondary School, Bengaluru — for their exhibit, 'Talking Thermometer'…"** |
| ~23 s | Riser swells → **"First Prize."** lands inside its tail |
| ~26 s | **Applause**, surging, with the room to itself for 4.2 s |
| ~30 s | **"Congratulations. Keep asking questions, keep being curious."** over ducked applause |
| ~36 s | Applause swells back, fades out |

Three decisions do most of the work:

**The name is isolated.** It is its own clip, spoken slowly, with silence either
side. Measured on a real render, the name sits at −14.7 dB between −59 dB
silences — a 44 dB gap. It is the moment the certificate exists for, and nothing
is allowed to crowd it.

**Applause never masks speech.** Everything except the chime passes through a
single ducking bus, pulled down 17 dB for the exact duration of every spoken
line and released afterwards. Adjacent clips are merged into one region first,
so the crowd does not surge back up in the gap between two sentences.

**Every certificate is the same loudness.** The mix is normalised to −16 LUFS
using a real ITU-R BS.1770-4 implementation
([`loudness.ts`](src/lib/audio/loudness.ts), verified against the EBU reference
tones), then soft-limited. A certificate never arrives jarringly louder or
quieter than the message before it in a chat.

### Where the work happens

Mixing runs **in the browser**, on `OfflineAudioContext`, not on the server.
A 45-second piece renders in well under a second, and a batch of forty
certificates costs no serverless function time and cannot hit a timeout. The
server is only asked for the script, for synthesised speech, and to record the
result. The trade-off is that the tab must stay open during a batch — so batches
are resumable, and re-running only picks up rows that are pending or failed.

---

## Setup

### 1. Install and generate the backing tracks

```bash
npm install
npm run assets:generate
```

The applause, chime, room tone and riser are **synthesised by
[`scripts/generate-audio-assets.mjs`](scripts/generate-audio-assets.mjs)**, not
downloaded. A charity should not have to defend the provenance of a sound file,
and the generator is seeded so it reproduces byte-identically. See
[`public/audio/CREDITS.md`](public/audio/CREDITS.md) to swap in real recordings.

### 2. Configure

```bash
cp .env.example .env.local
```

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | A free Postgres database at [neon.tech](https://console.neon.tech), or Vercel → Storage → Create Database |
| `ADMIN_PASSCODE` | Choose a passphrase, at least 12 characters |
| `SESSION_SECRET` | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `ELEVENLABS_API_KEY` | [elevenlabs.io](https://elevenlabs.io) → Profile → API Keys |
| `BLOB_READ_WRITE_TOKEN` | Vercel → Storage → Create Blob store (local development only) |

### 3. Add an Indian English voice

ElevenLabs accounts start with only American, British and Australian voices,
none of which put the stress in the right place on Indian names. Open the
[Voice Library](https://elevenlabs.io/app/voice-library?accent=indian), find an
Indian English voice and click **Add**. Event settings will warn you until you
do, and picks the closest available voice (British) in the meantime.

> **This needs a paid ElevenLabs plan.** Free accounts can add Voice Library
> voices in the web app but cannot use them *over the API* — synthesis fails
> with `Free users cannot use library voices via the API`. The Starter plan
> (~$5/month) lifts this, and is what the cost estimate below assumes. Stock
> voices such as George work on the free plan if you want to try the pipeline
> first. Use **Test this voice** in Event settings to check before running a
> batch.

### 4. Create the tables and run

```bash
npm run db:migrate
npm run dev
```

### Deploying to Vercel

Import the repository, add a **Neon Postgres** database and a **Blob** store
from the Storage tab, then set `ADMIN_PASSCODE`, `SESSION_SECRET` and
`ELEVENLABS_API_KEY` as environment variables. Run `npm run db:migrate` once
against the production database. Set `NEXT_PUBLIC_SITE_URL` to your custom
domain so that QR codes printed on certificates keep working after a deployment
URL rotates.

---

## Using it

1. **Create an event** and open **Event settings** — pick a voice, and check the
   wording.
2. **Add students.** Paste a block of cells straight from Excel or Google
   Sheets, upload a CSV, or type them one at a time. Only *Name* and *Award* are
   required.
3. **Check every name.** The single most valuable button on the page. It plays
   each name in turn so one person can audit a whole list in a couple of
   minutes. Where the voice gets a name wrong, fill in **Say it like** with a
   phonetic respelling — `RUH-vee KOO-mar` — which is used only for the audio;
   the real spelling is what appears on the page and in print.
4. **Make the certificates**, then tick **Listened** as you check each one.
5. **Copy links** into a spreadsheet for a WhatsApp broadcast, **Download all as
   ZIP** for the MP3s, and **Print all certificates** for one PDF of the whole
   event, one per page.

### Languages

Each student has their own language. The voice engine works out which language
to speak from the words themselves, so **each language needs its own wording**,
written in Event settings. English and Hindi ship with defaults; the Hindi is a
starting draft and the app says so. Other languages start empty on purpose —
machine-translated wording that reads awkwardly at an awards ceremony is worse
than wording a speaker of the language wrote.

The engine is chosen per language automatically: Multilingual v2 where it
reaches (English, Hindi, Tamil), because it can slow the name down; v3 for
Kannada, Telugu, Malayalam, Marathi, Bengali and Gujarati, which nothing else
speaks. v3 ignores the speed setting, so the score gives those languages extra
silence around the name instead.

### Cost

About **$5/month**: Vercel Hobby, Neon and Blob free tiers, plus an ElevenLabs
Starter plan. The event intro and closing are identical for every student, so
they are synthesised once per event rather than once per certificate, and every
clip is cached by content — re-running a failed batch re-bills nothing that
already succeeded.

---

## Verifying it

```bash
npm run sample
```

Renders a certificate through the real mixing engine with synthesised narration
(no credits spent), writes `sample-certificate.mp3`, and prints the
measurements. Expect roughly:

```
  duration       41.25 s
  final peak     -1.39 dBFS      (no clipping)
  final loudness -16.00 LUFS     (on target)
  applause pushed down by 16.8 dB (score asks for 17)
  name: -14.7 dB between -59 dB silences
```

**Play the file.** Numbers confirm the mix is correct; only listening confirms
it is good. Use a phone speaker, not headphones — that is how families will hear
it.

```bash
npm run typecheck && npm run lint && npm run build
```

### Before an event

- **Set `NEXT_PUBLIC_SITE_URL` and check a printed QR code with a real phone.**
  QR codes encode whatever address the site is served from, so printing from a
  local dev server produces codes pointing at `localhost`, which resolve to the
  scanning phone itself and can never work. The print pages refuse to let this
  pass quietly, but check anyway — it is the one mistake that is invisible until
  the certificates are already printed and handed out.
- Generate one real certificate and listen to it on a phone.
- Run **Check every name** over the full list.
- Open a certificate page with **VoiceOver, NVDA or TalkBack**, audio muted, and
  confirm it is completely comprehensible.
- Check the page at 400% browser zoom and in Windows High Contrast mode.
- Forward an MP3 to yourself on WhatsApp and confirm it plays.

---

## Accessibility notes

The certificate page is the product, so a few choices there are deliberate and
worth not "fixing":

- **It does not autoplay.** A blind visitor's screen reader begins announcing
  the page on load; audio starting on top of that talks over the very thing
  telling them whose certificate it is.
- **It does not steal focus.** Moving focus to the play button on mount means a
  screen reader user hears "Play, button" before they hear the name. The button
  is one Tab away instead.
- **The transcript is verbatim and always shown**, repeating the name and award
  from the header on purpose, so the page is complete without audio.
- **[Atkinson Hyperlegible](https://brailleinstitute.org/freefont)** throughout —
  designed by the Braille Institute so that commonly-confused letterforms stay
  distinct at low contrast.
- Certificate URLs use an alphabet with **no look-alike characters** (no `0`/`O`,
  no `1`/`l`/`I`), because these get read aloud and typed under magnification.
- Body text is 18px, contrast is 7:1 (WCAG AAA), and the focus ring is amber so
  it never blends into a focused teal button.

---

## Not included

- **No server-generated PDF.** Printing is done from the browser instead. A PDF
  toolkit needs every script's font registered up front, and a student whose
  name is written in Kannada or Tamil would come out as a row of empty boxes.
  The browser already shapes those scripts correctly.
- **No per-certificate PNG** for image sharing. The MP3 is the artefact that
  matters on WhatsApp.
- **Rate limiting on the login route is in-memory**, so on serverless it only
  limits one warm instance. The real defence is the fixed one-second cost on
  every failed attempt, plus a passphrase-length passcode. Move to Vercel KV if
  the site ever becomes a target.

## Layout

```
src/lib/audio/     score.ts (the timeline), mix.ts (the audio graph),
                   loudness.ts (BS.1770), encode.worker.ts (MP3, off-thread)
src/lib/script.ts  turns event wording + one student into the spoken clips
src/lib/languages.ts  language list, per-language wording, engine selection
src/app/c/         the public certificate page and its printable version
src/app/admin/     events, students, batch generation
scripts/           asset generator and the verification render
```
