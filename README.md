# hombresai

A local studio for generating images with the **Gemini API** (Nano Banana models) and **open-source models**
(FLUX, Z-Image), plus an **Effects** studio with procedural GPU effects (dithering, halftone, ASCII, glitch…) for
images, videos and the camera. It runs only on your computer and needs nothing installed except Node.js.
(The project folder is still called `myhighsfield` – that’s fine.)

## Starting it

Double-click the **hombresai** shortcut on the desktop (or **`start.bat`** in this folder). The server starts in a
minimized window and the app opens in your browser at `http://127.0.0.1:4848`. If it’s already running, the shortcut
just opens it again. Keep the server window open – closing it stops the app.

## Keys and billing

**Gemini (Nano Banana models)**
1. On [aistudio.google.com/apikey](https://aistudio.google.com/apikey), click **Create API key**.
2. **Enable billing** – Nano Banana image models aren’t in the Free Tier.
   Click **Set up billing** on your project and link a card. Then you only pay for what you generate.
3. Paste the key into the app (Settings).

**Open-source models (via Pollinations)** – free daily credit, no Google billing involved
1. Sign in at [enter.pollinations.ai/keys](https://enter.pollinations.ai/keys) (free).
2. Create a **secret key** (`sk_…`) and paste it into Settings → Open-source models.

**Free video models (via Hugging Face)** – optional token
- Wan 2.2, LTX-2.3 and LTX-Video work without any account: 2 minutes of free GPU time a day.
- A free account’s token (type *Read*, from [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens))
  in Settings → Hugging Face raises it to 5 minutes a day.

Keys are stored only in `%USERPROFILE%\.hombresai\config.json` – outside OneDrive.

**Enhance prompt** uses a cheap Gemini text model – one enhancement costs about CZK 0.01–0.02.

Tip: set up *Budgets & alerts* in [Google Cloud Billing](https://console.cloud.google.com/billing).

### Models

| Model | Type | Price per image (incl. 21% VAT) |
|---|---|---|
| Nano Banana 2.1 (recommended) | Gemini | 1K CZK 0.89 · 2K CZK 1.33 · 4K CZK 2.98 |
| Nano Banana 2 Lite | Gemini | 1K CZK 0.89 |
| Nano Banana Pro | Gemini | 1K/2K CZK 3.53 · 4K CZK 6.33 |
| Nano Banana 2 (older) | Gemini | 512 px CZK 1.19 · 1K CZK 1.77 · 2K CZK 2.66 · 4K CZK 3.98 |
| Z-Image Turbo | open source (Apache 2.0) | free tier – text only |
| FLUX.2 klein | open source (Apache 2.0) | free tier – also edits with references, works with Effects |
| FLUX.1 schnell | open source (Apache 2.0) | free tier – text only |

Gemini prices are converted from USD at the CNB rate of CZK 21.782/USD (26 Oct 2026); the app downloads the current
rate by itself and shows an estimate next to the Generate button plus today’s spending. Without VAT (businesses with a
valid VAT ID) it’s 21% less – VAT can be switched off in Settings. Your exact spending is in AI Studio.

## What it can do

- **Create** – 1–8 variants per prompt, generated in parallel; “Each line = separate prompt” for whole lists.
- **References** – up to 14 images (drag & drop, Ctrl+V, the + button, or from the gallery), each with a role:
  *Character*, *Object / product*, *Style*, *Scene*, *Pose*, *Edit this*. Refer to them as “image 1”, “image 2”…
- **Edits** – click the pencil on an image and describe what to change.
- Styles, aspect ratios (including 1:4, 4:1, 1:8, 8:1), resolution up to 4K, the model’s thinking level.
- **Enhance prompt** – turns a short idea (in any language) into a detailed English prompt.
- A gallery with history, search, favorites, full-screen view (←/→), download and “generate again”.
- Automatic retries when an API is overloaded or rate-limited.

## Nodes

Build a shot from nodes – camera body, lens, exposure (ISO, aperture, shutter), focus, film stock, lighting, scene,
color, style, and for video camera movement, action and sound. The graph turns into a written description plus the
same values as XML, JSON and Markdown, added to the prompt. Use a graph in Create or Video, or run it right there.

Saving: graphs save themselves on this computer as you work (the status next to the name says when). **Save** or
**Ctrl+S** saves right away, **Save as…** makes a copy under a new name. **Export…** (under the graph list) saves the
graph as a `.hombresai-nodes.json` file with its reference images inside; **Open file…** – or dropping the file on
the canvas – opens it again, also on another computer.

Templates: **Save this graph as a template…** (under Templates) keeps a graph – nodes, settings and the images of its
Reference nodes – as a starting point; your templates are listed first, with a small picture. Click one for a new
graph from it; × (clicked twice) deletes it.

## Video

Generate clips and cut them on a timeline: split, trim, reorder, regenerate one part from the frames around it (it
keeps the context of the rest; the old version stays under *Takes*), then export the edit.

| Model | Price | Notes |
|---|---|---|
| Gemini Omni Flash | about CZK 2.6 per second at 720p (incl. VAT) | best quality, with sound, 3–10 s |
| Wan 2.2 | free (Hugging Face) | best free quality, silent, up to 5 s; draws its own first frame if you don’t pick one |
| LTX-2.3 | free (Hugging Face) | with sound, up to 10 s |
| LTX-Video | free (Hugging Face) | fast, silent, up to 8 s, straight from text |

## Connect Claude

Claude can use the whole app (images, videos, node graphs, the gallery) through the hombresai connector – see
Settings → Connect Claude for the one-line setup. In Claude Code, this folder’s `.mcp.json` sets it up already.

## Effects

The **Effects** button in the left rail opens an effect studio. Effects are procedural – small GPU programs that
run live in the browser, free and without AI – on:

- **images** – your generated images (the strip under the canvas, or the wand button on any image), or any file;
- **videos** – MP4 / WebM from your computer, with play / pause / seek;
- **the camera** – live, with recording.

What’s inside:

- **Dithering** – 16 error-diffusion algorithms (Floyd–Steinberg, Atkinson, Jarvis–Judice–Ninke, Stucki, Burkes,
  Sierra, Fan, Shiau–Fan, Stevenson–Arce, Riemersma along a Hilbert curve…) with modulation that turns them into
  lines, waves, rings, dots or flowing lines; ordered and pattern dithering (Bayer up to 16×16, real blue noise,
  clustered dots, lines, crosses, rings, waves, checker, diamonds – with an animated shimmer); grain dithering –
  all at any pixel size.
- **Print, lines and text** – halftone, CMYK halftone, line screen, waveform, crosshatch, ASCII (character sets or
  your own text).
- **Glitch** – glitch, JPEG glitch, chromatic aberration, bit crush, signal jitter, VHS, pixel smear.
- **Pixel, color, edges, distort** – pixel art, LED wall, stained glass, gradient map, neon edges, contour map,
  relief, distort (swirl, ripple, bulge, pinch, waves), kaleidoscope.
- **Layers** – stack up to 7 effects: each one works on the result of the one before (e.g. a dither, then
  chromatic aberration and a JPEG glitch on top); switch them off, reorder them, tune each one separately.
- **Palettes** – mono, neon and retro palettes (Game Boy, CGA, PICO-8, C64…), **colors taken from your image**,
  original colors, or your own colors. Plus brightness / contrast / gamma, glow, scan lines, vignette, grain and a
  transparent background.
- **Export** – PNG / JPG / WebP at 1×, 2× or 4× (download, or “Save to gallery” = Google Drive); videos and camera
  recordings as MP4 (or WebM).

### Your own effects

Every effect is a plain `.glsl` file – the built-in ones are in `effects/`, yours in `effects/custom/`. The format
and all helpers are described in [`effects/README.md`](effects/README.md); every `uniform … // @param` line becomes
a slider.

- **New with AI** – describe a look and an AI coder writes the effect. The open-source coders (DeepSeek V4 Flash,
  GLM 5.3 Flash, gpt-oss 20B) run through Pollinations, free with your Pollinations key; Gemini also works with
  your Gemini key. If the code doesn’t compile, the app sends the error back to the AI to fix it.
- **Remix with AI** – change an existing effect in words.
- **Code** – edit the effect directly (errors show the line number, Ctrl+Enter runs, Ctrl+S saves).
- The files can also be edited in any editor or coding agent (e.g. opencode) – the app reloads them when you come
  back to its window. Deleted effects go to `effects/custom/.trash`.

## Where files are stored

Generated images are saved **only to Google Drive** – in the `hombresai` folder (one subfolder per day).
The file description on Drive contains the prompt, so you can search for it on Drive.

On your computer (in `%USERPROFILE%\.hombresai`, outside OneDrive) only these stay:
- `history.json` – history with prompts and settings
- `cache\thumbs` – small thumbnails for a fast gallery
- `cache\refs` – uploaded references (downscaled to max 1536 px)
- `cache\pending` – images still waiting to be uploaded (e.g. while Drive isn’t available); deleted after upload

Deleting an image in the app moves it to the Google Drive trash (it can be restored for 30 days).

### Connecting Google Drive (one-off)

1. In [Google Cloud Console](https://console.cloud.google.com/), enable the **Google Drive API** for your project
   (it’s still named **myhighsfield** there).
2. In **Google Auth Platform**, set up the app (type *External*) and publish it under **Audience** (*Publish app*) –
   otherwise the sign-in would expire every 7 days.
3. Under **Clients**, create a client of type **Desktop app** and copy the *Client ID* and *Client secret*
   (Google shows the secret only once).
4. In the app: Settings → Google Drive → paste both → **Connect Google Drive** → allow access.

The app has the `drive.file` permission – it sees only the files it created itself, not the rest of your Drive.

## Privacy

Requests go straight from your PC to Google (Gemini) or Pollinations (open-source models). By default the app sends
`store: false` to Gemini, so prompts and references aren’t saved in your project’s logs in AI Studio (this can be
turned on in Settings). On the paid tier, Google doesn’t use your data to improve its products.
Photos you use with the open-source models are sent to Pollinations and the model provider it routes to.
Effects never leave your computer – only the text you type for the AI coder (and the effect code) is sent to it.
