# First Light ☀

A daily morning-ritual PWA: open it, breathe, receive one affirmation chosen for the day, and step into the world.

**Live:** https://surferyogi.github.io/first-light/
**Repo:** https://github.com/Surferyogi/first-light
**Current version:** `v2026:07:08-10:35` · Service-worker cache `first-light-v14`

---

## The daily ritual

1. **Open the app.** The scene fades in and box breathing (4·4·4·4, 3 cycles) starts automatically. No quote is shown yet.
2. **Breathe.** The sphere counts each phase down 4→3→2→1. A full singing-bowl strike marks the start of every phase; soft ticks mark counts 3, 2, 1. *(iOS note below — tap 🔔 for guaranteed sound.)*
3. **Receive the quote.** After the final exhale (or **Skip**), the day's affirmation reveals word by word, then floats gently on a slow drift.
4. **Rate it.** 👍 keeps it coming back more often. 👎 replaces it instantly and bans it forever. ★ saves it to your list.
5. **☀ I'm Ready for the World** — bowl strike, send-off screen ("Go get it."), done.

There is deliberately no "next quote" button: **👎 is the only way to change the quote.** One morning, one line — unless it doesn't serve you.

---

## Features

### Affirmations
- **140 built-in lines**, exactly 20 in each of 7 frameworks: NLP, CBT, Stoic, Mindfulness, Buddhist, Japanese, Chinese. Each line is tagged with its framework.
- **Plain-language style:** lines say the idea in small, concrete words (a door, a river, a blank page) rather than naming a concept. The framework word (e.g. *Kaizen*, *Wu wei*) lives in the **tag under the line**, never as a prefix in the line itself — so the wisdom is *felt*, not name-dropped.
- **Bold morning voice:** the library leans toward first-person power statements (~48% of lines open with "I …", 15 with "I am …") — e.g. *"I am the calm the storm respects."* Boldness must be **earned** with a concrete image, never hollow hype ("unstoppable", "limitless"). Mindfulness stays gentle and Buddhist/Chinese stay non-attached on purpose — those frameworks lose their meaning if forced into ego declarations.
- **Daily line** is date-seeded (same line all day, changes at midnight) and always skips anything you've disliked.
- **AI-fresh lines (optional):** once per day the app asks the `first-light` Supabase Edge Function for ~21 new lines across all 7 frameworks, tagged "✨ fresh today". If the function or network is unavailable, the app silently uses the built-in library — the ritual never breaks offline.

### The learning loop (👍 / 👎)
- Ratings live in `localStorage` on the device (per-device; not synced).
- 👎 → the line is removed from the rotation pool, the daily pick, cached AI batches, *and* your Saved list, permanently.
- 👍 → the line is double-weighted in rotation.
- Each daily AI request POSTs your 12 most recent likes and dislikes; the Edge Function prompts Claude to *match the energy of the liked lines and avoid the style of the rejected ones*, and hard-filters any exact rejected text from its output.
- Honest limit: exact-text exclusion is guaranteed; a *paraphrase* of a rejected idea is deterred only by prompt instruction.

### Scenes (one per launch, locked for the session)
The scene is chosen by matching the day's affirmation keywords, else by a daily seed. Six scenes plus one seasonal:

| Scene | Signature details |
|---|---|
| First Light (sunrise) | Sun renders oblate at the horizon (atmospheric refraction) and rounds as it rises; shimmer; 3 gliding birds; breathing horizon glow |
| Golden Hour (sunset) | Warm-tinted clouds; breathing glow; low oblate sun |
| Tranquil Lake | Smooth waterline (pixel-verified, no banding); 5 breathing sheen swells with true perspective; moonlight as a 34-fragment glitter path widening toward the viewer; clip-free specular glow |
| Passing Clouds | 3-altitude parallax (near/far/cirrus, strictly ordered speeds); clouds brighten/dim as they drift |
| Bamboo Grove | 9 desynchronized sway phases; 2 breathing light shafts; tumbling leaves; mist |
| Morning Breeze | Canopies flutter more than trunks (16 independent phases); ground mist; falling leaves |
| Quiet Snow *(Dec–Feb only)* | 3 depth layers (12 far / 46 mid / 8 near-blurred); S-path flutter; bigger flakes fall faster; overcast drift |

All motion is transform/opacity/filter only (GPU-friendly), and **`prefers-reduced-motion` disables every scene animation**. Palettes are red-green colorblind-safe; breathing-cycle dots use a shape cue (hollow ring → filled), not color alone.

### Sound
- Synthesized singing bowl (Web Audio, no audio files): full strike per breathing phase, soft tick per count, closing strike on the send-off.
- **iOS law (no workaround exists):** browsers block all audio until the first touch. The auto-started first round is therefore silent until you tap. **🔔 Breathe always restarts the round from count one, fully sounded** — that tap is also what unlocks audio.

### PWA
- Installable (manifest + icons incl. maskable), fully offline after first load via service worker.
- Everything is **one file**: `index.html` contains all CSS and JS inline. `sw.js` is the only other code file.

---

## Repository layout

```
first-light/
├── index.html              ← the entire app (HTML + CSS + JS inline)
├── sw.js                   ← service worker (cache name = update trigger)
├── manifest.webmanifest
├── icon-192.png
├── icon-512.png
├── icon-512-maskable.png
├── apple-touch-icon.png
└── README.md
```

---

## Backend: the `first-light` Edge Function

- **Supabase project:** `ckyshjxznltdkxfvhfdy` · function slug `first-light` (currently **v6**), deployed with `verify_jwt = false`. It is fully isolated — it touches no database tables and is separate from `smart-api`.
- **API:** `POST https://ckyshjxznltdkxfvhfdy.supabase.co/functions/v1/first-light` with optional JSON body `{ n, likes: string[], dislikes: string[] }`. Returns `{ lines: [{t, f}], model, ... }` or an honest error.
- **Prompt bar (v6):** demands plain, everyday words and a concrete image; hard-bans foreign-term/concept-label prefixes; and **prefers bold first-person "I am" declarations that are earned (concrete, never hollow hype)** — except Buddhist/Taoist lines, where a grounded image beats a forced ego "I am". The framework stays a hidden category.
- **Models:** tries `claude-haiku-4-5-20251001`, falls back to `claude-sonnet-4-6`.
- **Key lookup:** `ANTHROPIC_API_KEY`, then `CLAUDE_API_KEY`.

### ⚠ One-time setup still pending
The function currently returns *"No Anthropic key found"* because no key secret has been added (verified at deploy time). To activate AI affirmations:

1. Supabase Dashboard → project `ckyshjxznltdkxfvhfdy` → **Edge Functions → Secrets**
2. Add secret: name `ANTHROPIC_API_KEY`, value = your Anthropic API key
3. No redeploy needed. Verify:
   ```bash
   curl -s -X POST "https://ckyshjxznltdkxfvhfdy.supabase.co/functions/v1/first-light" \
     -H "Content-Type: application/json" -d '{"n":8}'
   ```
   Success looks like `{"lines":[...]}`. Until then the app quietly uses its built-in 140 lines.

Note: the function is public (no JWT), matching the project's existing pattern; abuse exposure is bounded by its small `max_tokens`.

---

## How to update the app (the two-file rule)

Every change ships as **`index.html` + `sw.js` together**:

1. Edit `index.html`.
2. **Bump the in-app version stamp** inside `index.html` to `vYYYY:MM:DD-HH:MM` (it renders at the bottom of the app — this is how you confirm the phone is running the new build).
3. **Bump the cache name in `sw.js`** (e.g. `first-light-v12` → `first-light-v13`). This is what makes installed phones fetch the new version automatically on next launch.
4. Replace both files in the repo (root, `main` branch). GitHub Pages redeploys automatically.
5. On the phone: close and reopen the installed app; check the version stamp. If it's stale, force-refresh once in Safari/Chrome, or clear site data.

Skipping step 3 is the classic mistake — the phone will keep serving the old cached app indefinitely.

---

## localStorage keys (on-device data)

| Key | Purpose |
|---|---|
| `fl_rate` | `{likes:[], dislikes:[]}` — the learning loop |
| `fl_saved` | Saved quotes (plain text array) |
| `fl_ai2` | Today's cached AI batch `{date, lines}` (refetched daily) |
| `fl_streak` | Orphaned (streak feature removed); harmless |

All per-device. Clearing site data resets ratings, saves, and the AI cache.

---

## Engineering lessons baked into this codebase

Recorded so future patches don't relearn them:

1. **CSS custom properties require `style.setProperty()`.** `Object.assign(el.style, {'--x': …})` silently does nothing in Chromium. This bug hid from v3–v8 (all per-element scene variance was riding fallback values) and is fixed at the single `el()` helper. Any new builder must go through `el()`.
2. **`clip-path` defeats `blur()`.** Filters paint first, then the clip slices the blur off, producing hard straight edges — the reason the original moonlight "cone" looked like a beam. Soft light must come from gradient falloff or masks, never clipped shapes.
3. **Dislike filtering has four paths** and all must stay covered: rotation pool (including at boot, before any AI fetch — the offline case), the daily date-hash pick, AI fetch + cache normalization, and the Saved list purge.
4. **The AI batch is cached once per day by design** (`fl_ai2`); a reload does not re-POST. Tests (and debugging) must clear the cache to observe a fresh request.
5. **Transform conflicts:** an element gets one transform animation. The quote's swap animation is opacity-only so it can coexist with the float drift; the sun's shimmer is filter-only so it can't fight the rise *transition*.
6. **Every new animated class goes into the `prefers-reduced-motion` kill list.**
7. **iOS audio unlocks only on first touch** — design flows so a user tap (🔔) can always restart sound-critical sequences from the beginning.
8. Scene keyword lists may legitimately contain words that look like removed features (e.g. `'ripple'` remains a lake-matching keyword after the ripple visuals were removed).
9. **Plain words beat concept-labels.** A line that opens with an untranslated term (`Kaizen:`, `Wu wei:`) reads as name-dropping, not wisdom. Put the idea in a concrete image with small words; let the framework identity live in the tag. This applies to the AI prompt too (Edge Function v6 hard-bans such prefixes).
10. **Bold, but earned — and not in every framework.** Morning affirmations want first-person "I am" power statements, but boldness needs a concrete anchor or it curdles into hype. And Buddhist/Taoist lines are about *letting go* of the grasping "I" — forcing "I am unstoppable" there betrays the idea. Push bold in Stoic/NLP/CBT/Japanese; keep Mindfulness gentle and Buddhist/Chinese grounded.

---

## Testing

Each release was verified with headless-Chromium (Playwright) suites asserting real computed values: DOM structure, per-element animation variables, physics invariants (e.g. bigger snowflakes strictly faster; cloud layers strictly speed-ordered), pixel-level luminance scans of the waterline and glitter path (no hard banding/edges), the 👎 exclusion across all four paths, the 🔔 mid-round restart, and the 140-line 20×7 library balance. The final arbiter for visual quality is a phone screenshot.

---

*Built with zero frameworks, zero build step, zero audio files — one HTML file, a service worker, and a Supabase Edge Function.*
