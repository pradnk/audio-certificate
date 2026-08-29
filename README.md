# Taali — certificates that speak

*Taali* (ताली) means applause.

A paper certificate is something a visually impaired awardee cannot appreciate on
their own. Taali makes the certificate itself the experience: a recording of
about forty-five seconds that names the person, says what they did and announces
their award, set against real applause — so being recognised is something they
hear, not something they are told about afterwards.

Every certificate gives you three things:

- **a sound file** you can send on WhatsApp, which is how most families will
  actually receive it;
- **a web link** that reads the certificate aloud and also shows every word in
  large, high-contrast text;
- **a printable certificate** with a QR code that opens the recording.

---

# Part 1 — Using Taali

**You do not need to be technical to use Taali, and you do not need to set
anything up.** Everything technical is already configured. This part is the
whole job, start to finish. Part 2 is only there for whoever maintains the site.

## What you need before you start

- The **web address** of your Taali site.
- The **team passcode**. Everyone on your team uses the same one.
- Your list of award recipients, ideally already in Excel or Google Sheets.
- Your organisation's **logo** as an image file, if you want one on the
  certificates.

## Step 1 — Sign in

Open the web address, click **Team sign in**, type the passcode and click
**Sign in**. You will stay signed in on that device for about a month.

## Step 2 — Create your event

An "event" is one awards ceremony — for example *Annual Science Awards 2026*.
All the recipients for that ceremony live inside it.

On the Events page, fill in **Start a new event**:

- **Event name** — this is spoken aloud at the start of every certificate, so
  write it the way you would say it out loud.
- **Organisation** — who is presenting the awards. Also spoken aloud.
- **Organisation logo** *(optional)* — choose an image file, then pick which
  corner it sits in. A small preview shows you where it will land on the printed
  certificate. The same choice applies to the web page.

Click **Create event**.

> If you have run an event before, Taali carries over the organisation name,
> wording, prize categories, voice and language from the last one, so you are
> not retyping it every year.

## Step 3 — Check the voice and the wording

Creating an event drops you straight onto its **Students** page. Click
**Settings** at the top right to get here. (From the Events list, the same page
is the **Settings** button next to your event.)

**Voice.** Pick the reading voice. Then click **♪ Test this voice** — it reads
*"This certificate is awarded to Ravi Kumar. First Prize."* so you can hear
whether it handles your recipients' names properly. **Do this before making
dozens of certificates**, not after.

**Prize categories.** The list of prizes this event hands out — *First Prize*,
*Special Mention*, and so on. Edit any of them, click **Add a category** for a
new one, or **Remove** for one you do not give out. **Restore the standard list**
puts the original five back.

These categories are what the **Award** box suggests when you add someone, and
what a pasted spreadsheet is checked against. They are suggestions, not a
straitjacket: an award typed straight into the box still works even if it is not
on the list, so a prize decided on the morning of the ceremony never needs a
settings change first. See *[Adding a new kind of prize](#adding-a-new-kind-of-prize)*.

**Other organisations.** If the event is run with partners, or supported by
them, add their logos here. Click **Add a logo**, choose the image file, and type
the organisation's name next to it. Use ↑ and ↓ to put them in the order you want
them to appear, and **Remove** to take one off. Up to six.

The name you type is never printed — it is what a screen reader reads out in
place of the logo, which is the only way somebody who cannot see it learns who
was involved. A logo with no name is dropped when you save, and Taali says so on
the row.

The logos appear in a row at the foot of the printed certificate and on the
certificate page. **They are never spoken.** The recording stays about the person
receiving the award — see *[Adding other organisations'
logos](#adding-other-organisations-logos)*.

**What the certificate says.** This is the actual wording. You can change any of
it. Words in `{{double braces}}` are filled in automatically — `{{name}}`
becomes the person's name, `{{award}}` becomes their award, and so on. Text
inside `[[double brackets]]` disappears if its details are missing, so one line
covers a recipient with a school and one without.

Click **Save settings** when you are done.

## Step 4 — Add the people

Go back to the event's **Students** page. You have two ways in:

**One at a time** — fill in the form. Only **Student's name** and **Award** are
required; everything else is optional. The **Award** box suggests your event's
prize categories as you type.

**Paste a list or upload a file** — select the cells in your spreadsheet, copy
them, and paste them into the big box. Or upload a CSV file. Taali shows you
what it understood **before** anything is added, so you can fix the sheet and
paste again as many times as you like. There is a **Download a template
spreadsheet** link that gives you the columns already laid out with one example
row in them.

### The spreadsheet format

**One row per person. Nine columns, in this order:**

| # | Column | Required | What goes in it |
|---|---|---|---|
| 1 | **Name** | **Yes** | The name as it should be spelled on the certificate — `Ravi Kumar`. This is also what the voice reads, unless column 2 says otherwise. |
| 2 | **Say it like** | no | A sounds-like spelling, used *only* by the voice — `RUH-vee KOO-mar`. The certificate still shows the real spelling. Leave it empty unless the voice gets the name wrong. |
| 3 | **School** | no | `ACTS Secondary School`. Spoken as part of "from …". |
| 4 | **City** | no | `Bengaluru`. Joined onto the school when both are given. |
| 5 | **Class** | no | `Class 8`. Free text — write it however you say it. |
| 6 | **Project title** | no | What they showed or did — `Talking Thermometer`. |
| 7 | **Description** | no | One sentence about it. One sentence really is plenty; it is read aloud. |
| 8 | **Award** | **Yes** | The prize — `First Prize`. See *[Awards in the sheet](#awards-in-the-sheet)* below. |
| 9 | **Language** | no | Which language the certificate is spoken in. Empty means the event's default. See *[Languages in the sheet](#languages-in-the-sheet)* below. |

A cell you have nothing for is left empty. An empty cell is not an error — the
wording closes up around missing details, so a recipient with no school does not
get a certificate that says "from ,".

**A header row is optional, but recommended.** If the first row looks like column
headings, Taali uses it and your columns can then be in *any* order, with columns
you do not need left out entirely. Without a header row Taali assumes exactly the
nine columns above, in that order.

For a header row to be recognised, at least two of its cells must be names Taali
knows. It is not fussy about capitals, spaces, hyphens or underscores, and it
accepts the obvious synonyms:

| Column | Headings accepted |
|---|---|
| Name | `Name` · `Student` · `Student name` · `Full name` |
| Say it like | `Say it like` · `Pronunciation` · `Pronounce` · `Phonetic` · `Say as` |
| School | `School` · `Institution` |
| City | `City` · `Town` · `Place` |
| Class | `Class` · `Grade` · `Std` · `Standard` |
| Project title | `Project title` · `Project` · `Exhibit` · `Title` · `Experiment` |
| Description | `Description` · `Blurb` · `About` · `Details` · `One line` · `Summary` |
| Award | `Award` · `Prize` · `Result` · `Position` |
| Language | `Language` · `Lang` |

Any column whose heading Taali does not recognise — an internal ID, a phone
number, a tick box — is ignored rather than treated as an error, so you can
usually paste your working sheet as it is.

#### Awards in the sheet

The Award column is matched against your event's prize categories
(Settings → **Prize categories**), ignoring capitals and extra spaces. So a
column reading `first prize` is stored, printed and spoken as `First Prize` —
whatever spelling you set in Settings is the one that reaches the certificate.

An award that is *not* one of the categories is still accepted and used exactly
as you typed it; Taali just points it out in the preview, because an award that
is not on the list is usually a typo and occasionally a genuine one-off. Either
way the import goes ahead.

If a row has no award at all, it is skipped — **unless** you fill in **Award for
rows that do not have one**, below the paste box. That is the quick way in when
the whole list is participation certificates: leave the Award column out
altogether and set it once.

#### Languages in the sheet

Write the language however is natural — the tag (`hi`), the
English name (`Hindi`), the name in its own script (`हिन्दी`), or just enough of
the English name to be unambiguous (`Kan` → Kannada). The nine accepted values
are `en-IN` English (India), `hi` Hindi, `kn` Kannada, `ta` Tamil, `te` Telugu,
`ml` Malayalam, `mr` Marathi, `bn` Bengali and `gu` Gujarati. Anything Taali does
not recognise quietly falls back to the event's default language rather than
failing the row — so check the preview if you have used this column.

Remember that each language also needs its own wording in Settings, written by
somebody who speaks it. See *[Recipients can each have their own
language](#recipients-can-each-have-their-own-language)*.

#### Saving a file rather than pasting

- Save as **CSV** — in Excel or Numbers, *Save as* / *Export* → *CSV*; in Google
  Sheets, *File → Download → Comma-separated values*.
- Use **commas** as the separator. A semicolon-separated file — which some
  European Excel installations produce by default — will not be read correctly.
  Pasting the cells straight from the spreadsheet avoids the question entirely
  and is the shortest route.
- Save as **UTF-8** so names and Indian-language text survive. Google Sheets and
  Numbers do this already; Excel on Windows may offer *CSV UTF-8* as a separate
  choice — pick it.
- A cell containing a comma, a quotation mark or a line break must be wrapped in
  `"double quotes"`, with any quotation mark inside it doubled (`""`).
  Spreadsheets do this for you when they export.
- Completely blank lines are ignored, so a trailing newline at the end of the
  file is fine.

**A complete example**, header row included:

```csv
Name,Say it like,School,City,Class,Project title,Description,Award,Language
Ravi Kumar,RUH-vee KOO-mar,ACTS Secondary School,Bengaluru,Class 8,Talking Thermometer,"It measures the temperature, and announces it aloud",First Prize,English (India)
Meera Nair,,St Anne's High School,Kochi,Class 9,Braille Sorter,,Second Prize,Malayalam
Arjun Rao,,,,,,,Certificate of Participation,
```

Meera has no sounds-like spelling and no description; Arjun is a name and an
award and nothing else, which is a perfectly good certificate. Note that their
empty cells still need their commas — it is a value's *position* that says which
column it belongs to, header row or not.

**What the preview tells you.** Before anything is saved, Taali shows how many
people it is about to add, whether it found a header row, the first few names
with their awards, and a line for anything it could not use. A row with no name,
or with no award and no default set, is listed as skipped and everything else
still goes in. Nothing is added until you click **Add N students** — and if the
preview looks wrong, edit your sheet and paste again.

**Adding more later.** Importing again appends to the list; it does not replace
it. Taali does not match on names, so pasting the same list twice gives you each
person twice — remove the duplicates with the **Remove** button on each row.

## Step 5 — Check every name *(the important one)*

Click **♪ Check every name**. Taali plays every recipient's name in turn so one
person can listen through the whole list in a couple of minutes.

When the voice gets a name wrong, type how it *sounds* into the **Say it like**
box for that person — for example `RUH-vee KOO-mar` for Ravi Kumar. Only the
recording uses that spelling; the certificate page and the printed sheet still
show the name spelled correctly.

Use **♪ Hear name** on a single row to re-check just that one.

> This is the single most valuable minute you will spend in Taali. A certificate
> meant to honour someone, which mispronounces their name, is worse than no
> certificate at all.

## Step 6 — Make the certificates

Click **Make N certificates**. Each row moves through *Not made yet* →
*Making…* → *Ready*.

**Keep the browser tab open while this runs.** The certificates are being
created in your browser, not on a server. It is fine to switch to another
window, but do not close the tab. If you do, nothing is lost — reopen the page
and click Make again, and it only picks up the ones still outstanding.

If a row says **Failed**, it will tell you why. Fix the problem and click
**Retry** on just that row.

## Step 7 — Listen, then tick

Click **Open** on a row to hear the finished certificate, then tick **Listened**
for that person. The tick is your own record of what has been checked — nothing
depends on it, but it is how you know you did not skip anyone.

Listen on a **phone speaker**, not headphones. That is how families will hear it.

## Step 8 — Send them out

- **Copy links** puts a table of every name, award and link on your clipboard.
  Paste it straight into a spreadsheet for a WhatsApp broadcast or a mail merge.
- **Download all as ZIP** gives you all the sound files, named after each
  recipient, ready to attach or forward.
- **Print all** opens every certificate, one per page, ready to print or save as
  a single PDF.

> **When printing:** in your browser's print dialog choose *Save as PDF* and
> switch on **Background graphics**. Without it the coloured border and the
> award will not print.

## Step 9 — Finish up

When the ceremony is over and everything is sent, open **Settings** and click
**Mark event as complete**.

The event moves to a *Completed* section and is locked, so nobody can change it
by accident months later. You can still download, copy links and print. Click
**Reopen event** if you need to change something.

**The certificate links keep working forever.** Marking an event complete only
closes your side of it — a family who was sent a link in 2026 can still open it
in 2036.

---

## Things worth knowing

### Recipients can each have their own language

Every person has a **Language** setting. Taali supports English, Hindi, Kannada,
Tamil, Telugu, Malayalam, Marathi, Bengali and Gujarati.

There is a catch worth understanding: the voice works out which language to
speak **from the words themselves**. There is no switch that turns English into
Hindi. So each language you use needs its own wording, written in Settings by
somebody who actually speaks it.

English and Hindi come with wording already filled in. The Hindi is a first
draft and Taali says so on screen — please have a fluent speaker read it before
an event. Other languages start empty on purpose: wording that reads awkwardly
at an awards ceremony is worse than wording a real speaker wrote.

### Adding a new kind of prize

Open the event's **Settings** and find **Prize categories**. Click **Add a
category**, type the name of the prize — `Best Team Effort`, `Judges' Choice`,
`Long Service Award` — and click **Save settings**. It is offered from then on
wherever an award is asked for, and pasted spreadsheets are checked against it.

Write it exactly as it should be **heard**, because it is read aloud on every
certificate that uses it, and exactly as it should be **printed**, because that
is the spelling that reaches the page.

A few things worth knowing:

- **The categories belong to the event, not to the whole site.** A sports day
  and a science fair each get their own list. A new event starts with the
  previous event's list, so next year's ceremony already has last year's prizes.
- **They are suggestions, not a fixed set.** An award typed straight into the
  **Award** box is accepted even if it is not a category — nothing about adding
  a person is blocked by the settings page.
- **Renaming a category does not rename anyone's award.** Certificates already
  made keep the wording they were made with. Change those on the rows themselves
  and click **Make** again.
- **Removing a category does not remove anyone's award** either. It only stops
  Taali suggesting it.
- Blank rows and repeats are dropped when you save.

### Changing someone's details

If you edit a recipient after their certificate is made, the certificate is
marked *Not made yet* again. That is deliberate — otherwise the recording would
say one thing and the printed page another. Just click **Make** again.

### The logo

Change it at any time in **Settings**, including which corner it sits in.
Existing certificate pages pick up the new logo immediately; anything already
printed obviously does not.

### Adding other organisations' logos

Co-organisers and supporters go under **Settings → Other organisations**. They
show up as a row at the foot of the printed certificate, under the words
*Presented by*, and beneath the *Presented by…* line on the certificate page.

A few things worth knowing:

- **They are never read aloud**, so adding or changing them does not invalidate a
  single recording. Certificates already made pick the logos up straight away
  with nothing to remake.
- **A transparent or white background works best.** The certificate is pure
  white, so a logo saved with a light grey background will show as a faint box
  around it.
- **Give each one plenty of resolution** — 600 pixels across or more, or an SVG.
  A logo is printed about 14mm tall, and a small image looks visibly fuzzy on
  paper even though it looks fine on screen.
- **They belong to the event**, so a sports day and a science fair can have
  different ones, and next year's event starts with this year's list.
- The row is sized so that all logos come out at roughly equal visual weight
  whatever their shape — a tall square mark and a wide wordmark both fit.

---

## If something goes wrong

| What you see | What it means |
|---|---|
| **The voice says a name wrong** | Put a sounds-like spelling in **Say it like** for that person and click **Make** again. |
| **"… is not one of this event's prize categories"** | Only a note on the import preview, not an error — the row will be added with the award exactly as you wrote it. If it is a typo, fix the sheet and paste again. If it is a real prize you will use often, add it under Settings → **Prize categories**. |
| **A row says Failed** | The message on the row says why. The most common causes are the voice service being briefly busy — click **Retry** — or the account running out of credits. |
| **"Free users cannot use library voices"** | The voice chosen needs a paid ElevenLabs plan. Either upgrade the plan, or pick a different voice in Settings and press **♪ Test this voice** to confirm it works. |
| **"This event is marked complete"** | The event is locked. Open **Settings** and click **Reopen event**. |
| **"Your session has expired"** | Sign in again. |
| **"N certificates will not fit on one sheet"** | The content runs past the border and would spill onto a second page. It is almost always a long description — shorten it on the students page. A very long name can do it too. The named certificates are the only ones affected. |
| **The link asks me to sign in to Vercel** | Deployment Protection is switched on for the project, so every certificate link is private. In the Vercel dashboard: **Project → Settings → Deployment Protection → Vercel Authentication → Disabled**. Certificate pages are meant to be public — that is the whole point of handing the link to a family. |
| **"Do not print — these QR codes will stop working"** | `NEXT_PUBLIC_SITE_URL` is set to one deployment's own address rather than the project's. Set it to the permanent address and redeploy — see the settings table in Part 2. |
| **The QR codes do not scan** | Taali warns you on the print page when this will happen. Do not print until that warning is gone — ask whoever maintains the site. |
| **A certificate page says "not ready yet"** | That certificate has not been made yet. Go to the event's Students page and click **Make**. |
| **Nothing happens when I click Make** | Check the tab is still open and you are still signed in. Reload the page and try again; nothing is lost. |

---

## Before a real event — a short checklist

- [ ] Make one real certificate and listen to it on a phone speaker.
- [ ] Run **♪ Check every name** through the whole list.
- [ ] Send one sound file to yourself on WhatsApp and check it plays.
- [ ] Print one certificate and scan its QR code with a phone — **on mobile data, not
      wifi**, so you are testing the address a family will actually use.
- [ ] Open a certificate link in a private browsing window. If it asks you to sign
      in to anything, it is not public yet.
- [ ] Open a certificate link on a phone and check the **Play** button works.

---
---

# Part 2 — Advanced configuration

**Everything in this part is already set up. If you are using Taali to make
certificates, you can stop reading here — there is nothing for you to do.**

This part is for whoever maintains the site: the accounts it depends on, what
each setting does, and how to change them.

## The accounts Taali uses

| Service | What it does | Roughly |
|---|---|---|
| **Vercel** | Hosts the site and stores the finished sound files | Free tier |
| **Neon** | The database — events and recipients | Free tier |
| **ElevenLabs** | Turns the wording into speech | ~$5/month |

Total running cost is about **$5 a month**.

## The ElevenLabs voice key — already configured

Taali uses [ElevenLabs](https://elevenlabs.io) to produce the spoken narration.
**This is already set up and connected. Nobody needs to do anything with it to
use the app.**

It is documented here only so that whoever maintains the site knows where it
lives and what to do if it ever needs changing.

**Where the key is stored.** In the Vercel project, under
*Settings → Environment Variables*, as `ELEVENLABS_API_KEY`. It is never sent to
the browser — narration is requested by the server, and there is a build check
confirming the key does not appear in any file the browser downloads.

**Replacing the key.** Create a new key at ElevenLabs under *Profile → API
Keys*, update `ELEVENLABS_API_KEY` in Vercel, and redeploy. Nothing else
changes; existing certificates are unaffected because their audio is already
saved.

**About the plan.** Voices added from the ElevenLabs *Voice Library* — which is
where you find Indian, and other non-default, accents — **cannot be used at all
on a free ElevenLabs plan**. Synthesis fails with *"Free users cannot use
library voices via the API"*. The **Starter plan (~$5/month)** lifts this. The
stock voices that come with every account do work on the free plan, if you only
want to try things out.

**Adding a voice.** Open the
[Voice Library](https://elevenlabs.io/app/voice-library), find a voice whose
accent matches the people being named, and click **Add**. It appears in Taali's
Settings page on the next page load. For an Indian event,
[filter by Indian accent](https://elevenlabs.io/app/voice-library?accent=indian) —
Taali shows a warning in Settings until an Indian-accented voice is available,
and falls back to the closest alternative in the meantime.

**What it costs to run.** A certificate is roughly 450 characters of speech, but
the opening and closing lines are identical for everyone at an event, so they
are produced once rather than once per person. Every clip is also cached, so
re-running a batch after a failure costs nothing for the parts that already
worked. A 45-person event comfortably fits inside the Starter plan.

## The other settings

All of these live in the Vercel project under *Settings → Environment
Variables*.

| Setting | What it is |
|---|---|
| `ADMIN_PASSCODE` | The team passcode. At least 12 characters — use a passphrase, not a word. Change it here and redeploy. |
| `SESSION_SECRET` | Signs the sign-in cookie. Changing it signs everyone out. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. |
| `DATABASE_URL` | The Neon database connection string. Use the **pooled** one. |
| `ELEVENLABS_API_KEY` | The voice key, above. |
| `BLOB_READ_WRITE_TOKEN` | Storage for the finished sound files. Added automatically when the Blob store is connected to the project. |
| `NEXT_PUBLIC_SITE_URL` | The address every QR code encodes. **Must be the project's permanent address** — a custom domain, or the Vercel address *without* a deployment hash in it (`project-team.vercel.app`, not `project-a1b2c3d4e-team.vercel.app`). A deployment address works when you test it and disappears on the next deploy, taking every printed code with it; Taali refuses to let you print quietly in that state. **Baked in at build time — set it, then redeploy.** |

## Running it on your own machine

```bash
npm install
npm run assets:generate     # creates the applause, chime, room tone and riser
cp .env.example .env.local  # then fill in the settings above
npm run db:migrate          # creates the database tables
npm run dev
```

> **A warning about QR codes in local development.** QR codes encode whatever
> address the site is served from. Running locally, that is `localhost`, which
> on a phone means *the phone itself* — so those codes can never work. The print
> pages refuse to let this pass silently, but never print real certificates from
> a local server.

## Deploying

Import the repository into Vercel, add a **Neon Postgres** database and a
**Blob** store from the Storage tab, set the environment variables above, and
deploy. Run `npm run db:migrate` once against the production database.

Make sure the Vercel project's **Framework Preset is Next.js** — if it is unset,
Vercel serves the static files and every page returns 404.

Also switch **Deployment Protection** off (*Settings → Deployment Protection →
Vercel Authentication → Disabled*). It is on by default on some plans, and it
makes every certificate link ask the visitor to sign in to Vercel — which no
family can do.

## Checking the audio after a change

```bash
npm run sample        # renders a certificate with test narration, spends nothing
npm run sample:real   # renders a real one, using real narration and credits
```

Both write a sound file you can play. `npm run sample` also prints the
measurements — expect about −16 LUFS loudness, a peak just under −1 dBFS, and
the name sitting roughly 44 dB above the silence around it.

**Play the file.** The numbers confirm the mix is correct; only listening
confirms it is good.

```bash
npm run typecheck && npm run lint && npm run build
```

---
---

# Part 3 — How it works

For developers. None of this is needed to use or run Taali.

## The score

The timeline lives in [`src/lib/audio/score.ts`](src/lib/audio/score.ts) as
data; adjust the feel of the piece by editing the numbers in `TIMING`.

| | |
|---|---|
| 0.0 s | Signature chime — the same three notes on every Taali certificate |
| 0.5 s | Hall ambience fades in at −26 dB and runs underneath throughout |
| 2.4 s | **"Annual Science Awards 2026, presented by the Example Trust."** — your wording, from Settings |
| ~10 s | **"This certificate is awarded to"** — no full stop, so it leads into the name |
| ~12.5 s | *silence* → **THE NAME**, alone, slowed to 0.9× → *silence* |
| ~14.6 s | **"…from Lakeside School, Bengaluru — for the Talking Thermometer…"** |
| ~23 s | Riser swells → **"First Prize."** lands inside its tail |
| ~26 s | **Applause**, surging, with the room to itself for 4.2 s |
| ~30 s | **"Congratulations, and very well done."** over ducked applause |
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
tones), then soft-limited to −1 dBFS. MP3 decoding overshoots the samples it was
encoded from, so that headroom is what stops a certificate distorting on a cheap
phone speaker.

## The applause

Synthesised, not sampled — see
[`scripts/generate-audio-assets.mjs`](scripts/generate-audio-assets.mjs) and
[`public/audio/CREDITS.md`](public/audio/CREDITS.md). A charity should not have
to defend the provenance of a sound file, and the generator is seeded so it
reproduces exactly.

The thing to understand before changing it: applause is **not** a random scatter
of claps. That was the first attempt and it sounds like rain on a window. It is
roughly a hundred people each clapping *periodically* at their own tempo,
drifting against one another, at different distances, in a room that smears the
whole thing together. Those four properties are modelled explicitly, and it is
what makes the ear hear a crowd rather than noise.

## Where the work happens

Mixing runs **in the browser**, on `OfflineAudioContext`, not on the server.
A 45-second piece renders in well under a second, and a batch of forty
certificates costs no serverless function time and cannot hit a timeout. The
server is only asked for the script, for synthesised speech, and to record the
result. The trade-off is that the tab must stay open during a batch — so batches
are resumable, and re-running only picks up rows that are pending or failed.

## Accessibility decisions worth not "fixing"

- **The certificate page does not autoplay.** A visually impaired visitor's
  screen reader begins announcing the page on load; audio starting on top of
  that talks over the very thing telling them whose certificate it is.
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
- **Taali brands the tool, never the certificate.** The mark and name appear on
  the landing page, sign-in and admin screens, and nowhere under `/c` — not in
  the page, not in the title, not in the meta description. A certificate belongs
  to its recipient and to the organisation presenting it.

## Deliberately not included

- **No server-generated PDF.** Printing is done from the browser instead. A PDF
  toolkit needs every script's font registered up front, and a name written in
  Kannada or Tamil would come out as a row of empty boxes. The browser already
  shapes those scripts correctly.
- **No per-certificate image** for sharing. The sound file is the artefact that
  matters on WhatsApp.
- **Rate limiting on the login route is in-memory**, so on serverless it only
  limits one warm instance. The real defence is the fixed one-second cost on
  every failed attempt, plus a passphrase-length passcode. Move to Vercel KV if
  the site ever becomes a target.
- **The admin vocabulary assumes an education setting.** Recipients are called
  *students*, with *School* and *Class* fields. Nothing enforces it — the fields
  are optional free text, so "School" happily holds a company or a chapter name
  — but the labels do say student. The labels live in
  `src/app/admin/events/[id]/students/add-students.tsx` and
  `students-client.tsx`; the database columns would not have to change.

## Layout

```
src/lib/audio/     score.ts (the timeline), mix.ts (the audio graph),
                   loudness.ts (BS.1770), encode.worker.ts (MP3, off-thread)
src/lib/script.ts  turns event wording + one recipient into the spoken clips
src/lib/languages.ts  language list, per-language wording, engine selection
src/lib/awards.ts  per-event prize categories, and matching a pasted award to one
src/lib/partners.ts  co-organiser logos shown at the foot, never spoken
src/lib/paste-parse.ts  reads a pasted or uploaded recipient list
src/lib/logo.ts    logo positions, shared by the web page and the print sheet
src/app/c/         the public certificate page and its printable version
src/app/admin/     events, recipients, batch generation
scripts/           asset generator and the verification renders
```
