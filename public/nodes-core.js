// hombresai Nodes – the shared core. The browser, the server and the Claude connector all use this file.
// A node graph describes a shot (camera, lens, exposure, light, composition, motion…). Compiling it turns the
// graph into prose for the prompt plus the same specification as XML, JSON and Markdown, appended to the prompt.
//
// Graph: { id, name, kind: 'image'|'video', nodes: [{ id, type, x, y, values }], edges: [{ id, from: { node, port },
// to: { node, port } }], formats: { prose, xml, json, markdown } }

(function (root, factory) {
  const core = factory();
  if (typeof module === 'object' && module.exports) module.exports = core;
  else root.NodesCore = core;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  'use strict';

  const o = (id, label, text, extra) => ({ id, label, text: text ?? label.toLowerCase(), ...extra });

  // ── Option lists ─────────────────────────────────────────────────────────

  const CAMERAS = [
    o('ff', 'Full-frame mirrorless', 'a full-frame mirrorless camera', { sensor: 'full frame (36 × 24 mm)', crop: 1 }),
    o('ff_dslr', 'Full-frame DSLR', 'a full-frame DSLR', { sensor: 'full frame (36 × 24 mm)', crop: 1 }),
    o('mf', 'Medium format digital', 'a medium-format digital camera', { sensor: 'medium format (44 × 33 mm)', crop: 0.79 }),
    o('apsc', 'APS-C mirrorless', 'an APS-C mirrorless camera', { sensor: 'APS-C', crop: 1.5 }),
    o('m43', 'Micro Four Thirds', 'a Micro Four Thirds camera', { sensor: 'Micro Four Thirds', crop: 2 }),
    o('cinema', 'Cinema camera (Super 35)', 'an ARRI Alexa 35 cinema camera', { sensor: 'Super 35', crop: 1.4 }),
    o('cinema_lf', 'Large-format cinema', 'an ARRI Alexa LF large-format cinema camera', { sensor: 'large format', crop: 0.85 }),
    o('film35', '35 mm film SLR', 'a 35 mm film SLR', { sensor: '35 mm film', crop: 1 }),
    o('film120', 'Medium format film (6×7)', 'a 6×7 medium-format film camera', { sensor: '120 film (6×7)', crop: 0.5 }),
    o('large', 'Large format 4×5', 'a 4×5 large-format view camera', { sensor: '4×5 inch sheet film', crop: 0.28 }),
    o('phone', 'Smartphone', 'a modern smartphone camera', { sensor: 'small smartphone sensor', crop: 1, dof: 5 }),
    o('action', 'Action camera', 'an action camera', { sensor: 'small action-cam sensor', crop: 1, dof: 6 }),
    o('drone', 'Drone camera', 'a camera drone', { sensor: '1-inch sensor', crop: 1, dof: 2.7 }),
    o('instant', 'Instant film', 'an instant film camera', { sensor: 'instant film', crop: 0.85 }),
    o('disposable', 'Disposable film camera', 'a disposable 35 mm camera with on-camera flash', { sensor: '35 mm film', crop: 1 }),
    o('cctv', 'Security camera', 'a security CCTV camera', { sensor: 'tiny surveillance sensor', crop: 1, dof: 8 }),
  ];

  const LENS_TYPES = [
    o('prime', 'Prime', 'prime lens'),
    o('zoom', 'Zoom', 'zoom lens'),
    o('cine', 'Cine prime', 'cinema prime lens', { look: 'smooth focus fall-off' }),
    o('anamorphic', 'Anamorphic 2×', 'anamorphic lens', { look: 'oval bokeh and horizontal blue lens flares' }),
    o('macro', 'Macro 1:1', 'macro lens', { look: 'life-size magnification with a wafer-thin plane of focus' }),
    o('fisheye', 'Fisheye', 'fisheye lens', { look: 'strong barrel distortion and a curved horizon' }),
    o('tiltshift', 'Tilt-shift', 'tilt-shift lens', { look: 'a tilted plane of focus that gives a miniature effect' }),
    o('vintage', 'Vintage', 'vintage lens', { look: 'soft glow, lower contrast, swirly bokeh and gentle vignetting' }),
    o('pinhole', 'Pinhole', 'pinhole aperture', { look: 'overall softness, infinite depth of field and heavy vignetting' }),
  ];
  const FOCALS = [8, 12, 14, 16, 18, 20, 24, 28, 35, 40, 50, 58, 70, 85, 100, 105, 135, 180, 200, 300, 400, 600, 800];
  const ISOS = [50, 64, 100, 125, 160, 200, 400, 800, 1600, 3200, 6400, 12800, 25600, 51200];
  const APERTURES = [0.95, 1.2, 1.4, 1.8, 2, 2.8, 4, 5.6, 8, 11, 16, 22, 32];
  const SHUTTERS = ['1/8000', '1/4000', '1/2000', '1/1000', '1/500', '1/250', '1/125', '1/60', '1/50', '1/30', '1/15', '1/8', '1/4', '1/2', '1', '2', '4', '8', '15', '30'];

  const FOCUS_TARGETS = [o('eyes', 'Eyes', 'the eyes'), o('face', 'Face', 'the face'), o('subject', 'Main subject', 'the main subject'), o('foreground', 'Foreground', 'the foreground'), o('background', 'Background', 'the background'), o('everything', 'Everything (hyperfocal)', 'everything from near to far')];
  const DOF_OVERRIDES = [o('auto', 'From aperture', ''), o('razor', 'Razor-thin', 'razor-thin'), o('shallow', 'Shallow', 'shallow'), o('moderate', 'Moderate', 'moderate'), o('deep', 'Deep', 'deep'), o('infinite', 'Everything sharp', 'everything sharp')];
  const BOKEH = [o('none', '—', ''), o('creamy', 'Creamy round', 'creamy round'), o('swirly', 'Swirly', 'swirly'), o('oval', 'Oval (anamorphic)', 'oval anamorphic'), o('bubble', 'Soap bubble', 'soap-bubble'), o('catseye', "Cat's eye", "cat's-eye"), o('hexagon', 'Hexagonal', 'hexagonal')];

  const FILM_STOCKS = [
    o('digital', 'Clean digital', 'a clean digital image'),
    o('portra400', 'Kodak Portra 400', 'Kodak Portra 400 film with soft pastel tones and natural skin'),
    o('ektar100', 'Kodak Ektar 100', 'Kodak Ektar 100 film with vivid saturated colors and fine grain'),
    o('gold200', 'Kodak Gold 200', 'Kodak Gold 200 film with warm golden tones'),
    o('fuji400h', 'Fujifilm Pro 400H', 'Fujifilm Pro 400H film with airy pastel greens'),
    o('velvia50', 'Fujifilm Velvia 50', 'Fujifilm Velvia 50 slide film with intense saturation and deep contrast'),
    o('cinestill800t', 'CineStill 800T', 'CineStill 800T tungsten film with red halation around highlights'),
    o('vision3', 'Kodak Vision3 500T', 'Kodak Vision3 500T motion-picture film with rich shadows'),
    o('trix400', 'Kodak Tri-X 400 (B&W)', 'Kodak Tri-X 400 black-and-white film with punchy grain'),
    o('hp5', 'Ilford HP5 (B&W)', 'Ilford HP5 black-and-white film with soft gradation'),
    o('polaroid', 'Polaroid', 'Polaroid instant film with soft colors and a dreamy shift'),
  ];
  const GRAIN = [o('auto', 'From stock / ISO', ''), o('none', 'None', 'no grain'), o('fine', 'Fine', 'fine grain'), o('medium', 'Medium', 'medium grain'), o('heavy', 'Heavy', 'heavy grain')];

  const SHOT_SIZES = [
    o('ecu', 'Extreme close-up', 'extreme close-up'), o('cu', 'Close-up', 'close-up'), o('mcu', 'Medium close-up', 'medium close-up'),
    o('ms', 'Medium shot', 'medium shot'), o('cowboy', 'Cowboy shot', 'cowboy shot (mid-thigh up)'), o('fs', 'Full shot', 'full-body shot'),
    o('ws', 'Wide shot', 'wide shot'), o('ews', 'Extreme wide / establishing', 'extreme wide establishing shot'), o('macro', 'Macro detail', 'macro detail shot'),
  ];
  const ANGLES = [
    o('eye', 'Eye level', 'at eye level'), o('low', 'Low angle', 'from a low angle'), o('high', 'High angle', 'from a high angle'),
    o('top', "Bird's eye / top-down", 'from directly above'), o('worm', "Worm's eye", "from a worm's-eye view"), o('dutch', 'Dutch angle', 'with a tilted dutch angle'),
    o('ots', 'Over the shoulder', 'over the shoulder'), o('pov', 'POV', 'from a first-person point of view'), o('profile', 'Profile', 'in profile'),
  ];
  const COMPOSITIONS = [
    o('thirds', 'Rule of thirds', 'rule-of-thirds composition'), o('center', 'Centered, symmetrical', 'centered symmetrical composition'),
    o('lines', 'Leading lines', 'leading lines toward the subject'), o('frame', 'Frame within a frame', 'a frame within the frame'),
    o('negative', 'Negative space', 'generous negative space'), o('golden', 'Golden ratio', 'golden-ratio composition'),
    o('layers', 'Foreground layers', 'layered foreground, midground and background'), o('free', 'Free', ''),
  ];

  const LIGHT_SETUPS = [
    o('natural', 'Natural daylight', 'natural daylight'), o('window', 'Soft window light', 'soft window light'),
    o('golden', 'Golden hour sun', 'warm low golden-hour sun'), o('blue', 'Blue hour', 'cool blue-hour twilight'),
    o('overcast', 'Overcast', 'soft overcast light'), o('midday', 'Hard midday sun', 'hard midday sun with crisp shadows'),
    o('softbox', 'Studio softbox', 'large studio softbox'), o('rembrandt', 'Rembrandt', 'Rembrandt lighting with a triangle of light on the cheek'),
    o('butterfly', 'Butterfly / Paramount', 'butterfly lighting from above the camera'), o('split', 'Split light', 'split lighting'),
    o('rim', 'Rim / backlight', 'strong rim backlight'), o('highkey', 'High-key', 'bright high-key lighting'), o('lowkey', 'Low-key', 'moody low-key lighting'),
    o('neon', 'Neon practicals', 'colored neon practical lights'), o('candle', 'Candlelight', 'flickering candlelight'),
    o('moon', 'Moonlight', 'cool moonlight'), o('flash', 'Direct flash', 'direct on-camera flash'), o('godrays', 'Volumetric god rays', 'volumetric god rays through haze'),
  ];
  const LIGHT_DIRECTIONS = [o('any', '—', ''), o('front', 'Front', 'from the front'), o('side45', '45° side', 'from 45° to the side'), o('side', 'Side', 'from the side'), o('back', 'Back', 'from behind'), o('top', 'Top', 'from above'), o('under', 'Under', 'from below')];
  const LIGHT_QUALITY = [o('soft', 'Soft', 'soft, diffused'), o('hard', 'Hard', 'hard, crisp'), o('mixed', 'Mixed', 'mixed soft and hard')];
  const KELVINS = [1900, 2700, 3200, 4300, 5000, 5600, 6500, 7500, 10000];
  const CONTRASTS = [o('low', 'Low', 'low contrast'), o('medium', 'Medium', 'medium contrast'), o('high', 'High', 'high contrast')];
  const HAZE = [o('none', 'None', ''), o('light', 'Light', 'light atmospheric haze'), o('heavy', 'Heavy', 'thick haze and fog')];

  const TIMES = [o('any', '—', ''), o('dawn', 'Dawn'), o('morning', 'Morning'), o('noon', 'Midday'), o('afternoon', 'Afternoon'), o('golden', 'Golden hour'), o('dusk', 'Dusk'), o('bluehour', 'Blue hour'), o('night', 'Night')];
  const WEATHER = [o('any', '—', ''), o('clear', 'Clear', 'under a clear sky'), o('cloudy', 'Cloudy', 'under cloudy skies'), o('fog', 'Fog', 'in fog'), o('rain', 'Rain', 'in the rain'), o('snow', 'Snow', 'in falling snow'), o('storm', 'Storm', 'in a storm'), o('wind', 'Windy', 'on a windy day')];
  const SEASONS = [o('any', '—', ''), o('spring', 'Spring'), o('summer', 'Summer'), o('autumn', 'Autumn'), o('winter', 'Winter')];

  const GRADES = [
    o('natural', 'Natural', 'natural true-to-life color'), o('warm', 'Warm', 'warm color grade'), o('cool', 'Cool', 'cool color grade'),
    o('tealorange', 'Teal & orange', 'teal-and-orange cinematic grade'), o('bleach', 'Bleach bypass', 'desaturated bleach-bypass look'),
    o('pastel', 'Pastel', 'soft pastel palette'), o('vivid', 'Vivid', 'vivid saturated colors'), o('muted', 'Muted', 'muted, desaturated colors'),
    o('mono', 'Black & white', 'black-and-white'), o('sepia', 'Sepia', 'sepia toning'), o('cross', 'Cross-processed', 'cross-processed color shifts'),
  ];
  const SATURATION = [o('muted', 'Muted'), o('natural', 'Natural'), o('vivid', 'Vivid')];

  const MEDIUMS = [
    o('photo', 'Photograph', 'photograph'), o('cinematic', 'Cinematic still', 'cinematic film still'), o('editorial', 'Editorial', 'editorial photograph'),
    o('documentary', 'Documentary', 'documentary photograph'), o('commercial', 'Commercial', 'commercial advertising photograph'),
    o('render3d', '3D render', 'physically based 3D render'), o('illustration', 'Illustration', 'digital illustration'), o('oil', 'Oil painting', 'oil painting'),
    o('watercolor', 'Watercolor', 'watercolor painting'), o('anime', 'Anime', 'anime illustration'), o('comic', 'Comic', 'comic book art'),
    o('pixel', 'Pixel art', 'pixel art'), o('vector', 'Flat vector', 'flat vector illustration'), o('clay', 'Claymation', 'claymation'),
  ];
  const ERAS = [o('any', '—', ''), o('now', 'Contemporary', 'contemporary'), o('1920s', '1920s'), o('1950s', '1950s'), o('1970s', '1970s'), o('1980s', '1980s'), o('1990s', '1990s'), o('y2k', 'Y2K'), o('future', 'Near future', 'near-future')];
  const MOODS = [o('any', '—', ''), o('serene', 'Serene'), o('dramatic', 'Dramatic'), o('mysterious', 'Mysterious'), o('joyful', 'Joyful'), o('melancholic', 'Melancholic'), o('tense', 'Tense'), o('romantic', 'Romantic'), o('epic', 'Epic'), o('cozy', 'Cozy'), o('eerie', 'Eerie')];
  const EXPRESSIONS = [o('any', '—', ''), o('neutral', 'Neutral'), o('smile', 'Gentle smile', 'a gentle smile'), o('laugh', 'Laughing'), o('serious', 'Serious'), o('pensive', 'Pensive'), o('surprised', 'Surprised'), o('intense', 'Intense gaze', 'an intense gaze')];

  const CAMERA_MOVES = [
    o('static', 'Static (locked off)', 'a locked-off static camera'), o('pushin', 'Push in (dolly in)', 'a dolly push-in'),
    o('pullout', 'Pull out (dolly out)', 'a dolly pull-out'), o('panl', 'Pan left', 'a pan to the left'), o('panr', 'Pan right', 'a pan to the right'),
    o('tiltup', 'Tilt up', 'a tilt up'), o('tiltdown', 'Tilt down', 'a tilt down'), o('track', 'Tracking / follow', 'a tracking shot following the subject'),
    o('orbit', 'Orbit / arc', 'an orbiting arc around the subject'), o('craneup', 'Crane up', 'a rising crane move'), o('cranedown', 'Crane down', 'a descending crane move'),
    o('handheld', 'Handheld', 'organic handheld camera'), o('gimbal', 'Gimbal / steadicam', 'a smooth steadicam glide'),
    o('fpv', 'FPV drone fly-through', 'a fast FPV drone fly-through'), o('aerial', 'Aerial drone', 'a sweeping aerial drone shot'),
    o('whip', 'Whip pan', 'a whip pan'), o('zoomin', 'Zoom in', 'a slow optical zoom in'), o('zoomout', 'Zoom out', 'a zoom out'),
    o('dollyzoom', 'Dolly zoom (vertigo)', 'a dolly-zoom vertigo effect'), o('rackfocus', 'Rack focus', 'a rack focus between foreground and background'),
  ];
  const SPEEDS = [o('veryslow', 'Very slow'), o('slow', 'Slow'), o('medium', 'Medium', 'moderate'), o('fast', 'Fast')];
  const PACING = [o('realtime', 'Real time', ''), o('slowmo', 'Slow motion', 'slow motion'), o('timelapse', 'Time-lapse', 'time-lapse'), o('ramp', 'Speed ramp', 'a speed ramp')];
  const MUSIC = [o('none', 'No music', ''), o('ambient', 'Ambient pads', 'ambient pads'), o('score', 'Cinematic score', 'a cinematic orchestral score'), o('piano', 'Solo piano', 'a soft solo piano'), o('electronic', 'Electronic', 'an electronic beat'), o('upbeat', 'Upbeat pop', 'upbeat pop music'), o('tension', 'Tension drones', 'tense low drones')];

  const MODEL_FALLBACK = [o('gemini-nano-banana-2.1', 'Nano Banana 2.1', '')];
  const IMAGE_RATIOS = ['auto', '1:1', '4:5', '3:4', '2:3', '9:16', '5:4', '4:3', '3:2', '16:9', '21:9'];
  const IMAGE_SIZES = ['1K', '2K', '4K'];
  const VIDEO_MODELS = [
    o('gemini-omni-1.1-flash', 'Gemini Omni Flash', ''),
    o('wan-2.2', 'Wan 2.2 (free, up to 5 s)', '', { free: true }),
    o('ltx-2.3', 'LTX-2.3 (free, with sound)', '', { free: true }),
    o('ltx-video', 'LTX-Video (free, fast)', '', { free: true }),
  ];
  const VIDEO_RATIOS = ['16:9', '9:16'];
  const VIDEO_RESOLUTIONS = ['360p', '720p', '1080p', '4k'];

  const REF_ROLES = [o('auto', 'Auto', ''), o('character', 'Character'), o('object', 'Object / product'), o('style', 'Style'), o('scene', 'Scene'), o('pose', 'Pose'), o('edit', 'Edit this')];

  // ── Helpers ──────────────────────────────────────────────────────────────

  const find = (list, id) => list.find(x => String(x.id) === String(id));
  const textOf = (list, id) => find(list, id)?.text || '';
  const labelOf = (list, id) => find(list, id)?.label || '';
  const clean = v => String(v ?? '').trim();
  const article = w => (/^[aeiou8]|^1[18]\b/i.test(String(w)) ? 'an' : 'a');
  const sentence = t => { const s = clean(t); return s ? s[0].toUpperCase() + s.slice(1) + (/[.!?…]$/.test(s) ? '' : '.') : ''; };
  const list = arr => (arr.length < 2 ? arr.join('') : `${arr.slice(0, -1).join(', ')} and ${arr[arr.length - 1]}`);
  const fstop = n => `f/${Number(n)}`;
  const shutterSeconds = s => { const [a, b] = String(s).split('/').map(Number); return b ? a / b : a; };
  const shutterLabel = s => (String(s).includes('/') ? `${s} s` : `${s} s`);
  const opts = arr => arr.map(x => (typeof x === 'object' ? { value: String(x.id), label: x.label } : { value: String(x), label: String(x) }));

  // ── Node types ───────────────────────────────────────────────────────────
  // Each spec node returns { base?, spec, prose? } from build(values); the compiler merges them in graph order.

  const SPEC_IN = [{ id: 'in', type: 'spec', multi: true, label: 'in' }];
  const SPEC_OUT = [{ id: 'out', type: 'spec', label: 'out' }];

  const CATEGORIES = [
    { id: 'input', label: 'Prompt & references' },
    { id: 'camera', label: 'Camera' },
    { id: 'composition', label: 'Composition' },
    { id: 'light', label: 'Light & scene' },
    { id: 'look', label: 'Look' },
    { id: 'subject', label: 'Subject' },
    { id: 'motion', label: 'Motion (video)' },
    { id: 'audio', label: 'Sound (video)' },
    { id: 'output', label: 'Generate' },
    { id: 'utility', label: 'Utility' },
  ];

  const NODE_TYPES = {
    prompt: {
      title: 'Prompt', category: 'input', kinds: ['image', 'video'], inputs: SPEC_IN, outputs: SPEC_OUT,
      help: 'What the picture or clip shows. It becomes the start of the prompt.',
      fields: [{ id: 'text', label: 'Prompt', type: 'textarea', rows: 4, default: '', placeholder: 'An old fisherman on a pier at dawn…' }],
      build: v => ({ base: clean(v.text), spec: clean(v.text) ? { subject: { description: clean(v.text).slice(0, 600) } } : {} }),
      chips: v => (clean(v.text) ? [clean(v.text).slice(0, 28) + (clean(v.text).length > 28 ? '…' : '')] : []),
    },
    reference: {
      title: 'Reference image', category: 'input', kinds: ['image', 'video'], inputs: [], outputs: [{ id: 'image', type: 'image', label: 'image' }],
      help: 'An image from your gallery or computer – a reference for Generate image, or the first/last frame of a video.',
      fields: [
        { id: 'image', label: 'Image', type: 'image', default: null },
        { id: 'role', label: 'Use as', type: 'select', options: opts(REF_ROLES), default: 'auto' },
      ],
      chips: v => (v.image ? [labelOf(REF_ROLES, v.role) || 'Reference'] : ['no image']),
    },
    camera: {
      title: 'Camera body', category: 'camera', kinds: ['image', 'video'], inputs: SPEC_IN, outputs: SPEC_OUT,
      help: 'The camera and its sensor size – it changes depth of field and the overall rendering.',
      fields: [
        { id: 'body', label: 'Camera', type: 'select', options: opts(CAMERAS), default: 'ff' },
        { id: 'model', label: 'Exact model (optional)', type: 'text', default: '', placeholder: 'e.g. Sony A7R V, Leica M11' },
      ],
      build: v => {
        const c = find(CAMERAS, v.body) || CAMERAS[0];
        const model = clean(v.model);
        return {
          spec: { camera: { body: model || c.label, sensor: c.sensor, crop_factor: c.crop } },
          prose: { camera: model ? `${article(model)} ${model} (${c.sensor})` : c.text },
          meta: { crop: c.crop, dof: c.dof || 1 },
        };
      },
      chips: v => [clean(v.model) || labelOf(CAMERAS, v.body)],
    },
    lens: {
      title: 'Lens', category: 'camera', kinds: ['image', 'video'], inputs: SPEC_IN, outputs: SPEC_OUT,
      help: 'Focal length sets the field of view and perspective; the lens type adds its character.',
      fields: [
        { id: 'focal', label: 'Focal length', type: 'select', options: FOCALS.map(f => ({ value: String(f), label: `${f} mm` })), default: '50' },
        { id: 'type', label: 'Type', type: 'select', options: opts(LENS_TYPES), default: 'prime' },
        { id: 'model', label: 'Exact lens (optional)', type: 'text', default: '', placeholder: 'e.g. Zeiss Otus 85 mm' },
      ],
      build: v => {
        const t = find(LENS_TYPES, v.type) || LENS_TYPES[0];
        const focal = Number(v.focal) || 50;
        const model = clean(v.model);
        return {
          spec: { lens: { focal_length_mm: focal, type: t.label, ...(model ? { model } : {}), ...(t.look ? { character: t.look } : {}) } },
          prose: { lens: model ? `${article(model)} ${model} at ${focal} mm` : `${article(focal)} ${focal} mm ${t.text}`, lensLook: t.look },
          meta: { focal, lensType: t.id },
        };
      },
      chips: v => [`${v.focal} mm`, v.type !== 'prime' ? labelOf(LENS_TYPES, v.type) : null].filter(Boolean),
    },
    exposure: {
      title: 'Exposure', category: 'camera', kinds: ['image', 'video'], inputs: SPEC_IN, outputs: SPEC_OUT,
      help: 'ISO, aperture and shutter speed. They decide depth of field, motion blur, noise and how bright the scene must be.',
      fields: [
        { id: 'iso', label: 'ISO', type: 'select', options: ISOS.map(i => ({ value: String(i), label: `ISO ${i}` })), default: '100' },
        { id: 'aperture', label: 'Aperture', type: 'select', options: APERTURES.map(a => ({ value: String(a), label: fstop(a) })), default: '2.8' },
        { id: 'shutter', label: 'Shutter speed', type: 'select', options: SHUTTERS.map(s => ({ value: s, label: `${s} s` })), default: '1/250' },
        { id: 'ev', label: 'Exposure compensation', type: 'select', options: ['-2', '-1', '-0.7', '-0.3', '0', '+0.3', '+0.7', '+1', '+2'].map(x => ({ value: x, label: `${x} EV` })), default: '0' },
      ],
      build: v => ({
        spec: { exposure: { iso: Number(v.iso), aperture: fstop(v.aperture), shutter_speed: shutterLabel(v.shutter), ...(v.ev && v.ev !== '0' ? { exposure_compensation: `${v.ev} EV` } : {}) } },
        meta: { iso: Number(v.iso), aperture: Number(v.aperture), shutter: shutterSeconds(v.shutter), ev: Number(v.ev) || 0 },
      }),
      chips: v => [fstop(v.aperture), `${v.shutter} s`, `ISO ${v.iso}`],
    },
    focus: {
      title: 'Focus & bokeh', category: 'camera', kinds: ['image', 'video'], inputs: SPEC_IN, outputs: SPEC_OUT,
      help: 'Where the focus sits and how the out-of-focus areas look.',
      fields: [
        { id: 'target', label: 'Focus on', type: 'select', options: opts(FOCUS_TARGETS), default: 'subject' },
        { id: 'dof', label: 'Depth of field', type: 'select', options: opts(DOF_OVERRIDES), default: 'auto' },
        { id: 'bokeh', label: 'Bokeh', type: 'select', options: opts(BOKEH), default: 'none' },
      ],
      build: v => {
        const dof = textOf(DOF_OVERRIDES, v.dof);
        const bokeh = textOf(BOKEH, v.bokeh);
        return {
          spec: { focus: { target: labelOf(FOCUS_TARGETS, v.target), ...(dof ? { depth_of_field: dof } : {}), ...(bokeh ? { bokeh } : {}) } },
          say: [40, `Sharp focus on ${textOf(FOCUS_TARGETS, v.target)}${dof ? `, ${dof} depth of field` : ''}${bokeh ? `, ${bokeh} bokeh` : ''}`],
          meta: dof ? { dofOverride: v.dof } : {},
        };
      },
      chips: v => [labelOf(FOCUS_TARGETS, v.target), v.dof !== 'auto' ? labelOf(DOF_OVERRIDES, v.dof) : null].filter(Boolean),
    },
    film: {
      title: 'Film stock & grain', category: 'camera', kinds: ['image', 'video'], inputs: SPEC_IN, outputs: SPEC_OUT,
      help: 'The emulsion or digital look: colors, contrast, grain and halation.',
      fields: [
        { id: 'stock', label: 'Stock', type: 'select', options: opts(FILM_STOCKS), default: 'portra400' },
        { id: 'grain', label: 'Grain', type: 'select', options: opts(GRAIN), default: 'auto' },
        { id: 'halation', label: 'Halation', type: 'toggle', default: false },
      ],
      build: v => {
        const grain = textOf(GRAIN, v.grain);
        return {
          spec: { film: { stock: labelOf(FILM_STOCKS, v.stock), ...(grain ? { grain } : {}), ...(v.halation ? { halation: true } : {}) } },
          say: [45, `The look of ${textOf(FILM_STOCKS, v.stock)}${grain ? `, ${grain}` : ''}${v.halation && !/halation/.test(textOf(FILM_STOCKS, v.stock)) ? ', soft red halation around bright highlights' : ''}`],
          meta: { grain: v.grain },
        };
      },
      chips: v => [labelOf(FILM_STOCKS, v.stock)],
    },
    shot: {
      title: 'Shot & angle', category: 'composition', kinds: ['image', 'video'], inputs: SPEC_IN, outputs: SPEC_OUT,
      help: 'Shot size, camera angle and composition.',
      fields: [
        { id: 'size', label: 'Shot size', type: 'select', options: opts(SHOT_SIZES), default: 'mcu' },
        { id: 'angle', label: 'Angle', type: 'select', options: opts(ANGLES), default: 'eye' },
        { id: 'composition', label: 'Composition', type: 'select', options: opts(COMPOSITIONS), default: 'thirds' },
      ],
      build: v => {
        const comp = textOf(COMPOSITIONS, v.composition);
        return {
          spec: { composition: { shot_size: labelOf(SHOT_SIZES, v.size), angle: labelOf(ANGLES, v.angle), ...(comp ? { framing: labelOf(COMPOSITIONS, v.composition) } : {}) } },
          say: [50, `${textOf(SHOT_SIZES, v.size)} ${textOf(ANGLES, v.angle)}${comp ? `, ${comp}` : ''}`],
        };
      },
      chips: v => [labelOf(SHOT_SIZES, v.size), labelOf(ANGLES, v.angle)],
    },
    lighting: {
      title: 'Lighting', category: 'light', kinds: ['image', 'video'], inputs: SPEC_IN, outputs: SPEC_OUT,
      help: 'Light source, direction, quality, color temperature and atmosphere.',
      fields: [
        { id: 'setup', label: 'Light', type: 'select', options: opts(LIGHT_SETUPS), default: 'window' },
        { id: 'direction', label: 'Direction', type: 'select', options: opts(LIGHT_DIRECTIONS), default: 'side45' },
        { id: 'quality', label: 'Quality', type: 'select', options: opts(LIGHT_QUALITY), default: 'soft' },
        { id: 'kelvin', label: 'Color temperature', type: 'select', options: KELVINS.map(k => ({ value: String(k), label: `${k} K` })), default: '5600' },
        { id: 'contrast', label: 'Contrast', type: 'select', options: opts(CONTRASTS), default: 'medium' },
        { id: 'haze', label: 'Atmosphere', type: 'select', options: opts(HAZE), default: 'none' },
      ],
      build: v => {
        const k = Number(v.kelvin);
        const warmth = k <= 3300 ? 'warm' : k >= 6500 ? 'cool' : 'neutral';
        const dir = textOf(LIGHT_DIRECTIONS, v.direction);
        const haze = textOf(HAZE, v.haze);
        return {
          spec: { lighting: { setup: labelOf(LIGHT_SETUPS, v.setup), ...(dir ? { direction: labelOf(LIGHT_DIRECTIONS, v.direction) } : {}), quality: labelOf(LIGHT_QUALITY, v.quality), color_temperature_k: k, contrast: labelOf(CONTRASTS, v.contrast), ...(haze ? { atmosphere: haze } : {}) } },
          say: [60, `Lit by ${textOf(LIGHT_SETUPS, v.setup)}${dir ? ` ${dir}` : ''} – ${textOf(LIGHT_QUALITY, v.quality)} light, ${warmth} ${k} K, ${textOf(CONTRASTS, v.contrast)}${haze ? `, ${haze}` : ''}`],
          meta: { light: v.setup },
        };
      },
      chips: v => [labelOf(LIGHT_SETUPS, v.setup), `${v.kelvin} K`],
    },
    scene: {
      title: 'Time & place', category: 'light', kinds: ['image', 'video'], inputs: SPEC_IN, outputs: SPEC_OUT,
      help: 'Where and when: location, time of day, weather and season.',
      fields: [
        { id: 'location', label: 'Location', type: 'text', default: '', placeholder: 'e.g. a rainy Prague side street' },
        { id: 'time', label: 'Time of day', type: 'select', options: opts(TIMES), default: 'any' },
        { id: 'weather', label: 'Weather', type: 'select', options: opts(WEATHER), default: 'any' },
        { id: 'season', label: 'Season', type: 'select', options: opts(SEASONS), default: 'any' },
      ],
      build: v => {
        const parts = [clean(v.location), textOf(TIMES, v.time) && `at ${textOf(TIMES, v.time)}`, textOf(WEATHER, v.weather), textOf(SEASONS, v.season) && `in ${textOf(SEASONS, v.season)}`].filter(Boolean);
        const data = { ...(clean(v.location) ? { location: clean(v.location) } : {}), ...(v.time !== 'any' ? { time_of_day: labelOf(TIMES, v.time) } : {}), ...(v.weather !== 'any' ? { weather: labelOf(WEATHER, v.weather) } : {}), ...(v.season !== 'any' ? { season: labelOf(SEASONS, v.season) } : {}) };
        return { spec: Object.keys(data).length ? { scene: data } : {}, say: parts.length ? [20, `Setting: ${parts.join(', ')}`] : null, meta: { time: v.time } };
      },
      chips: v => [clean(v.location).slice(0, 20), v.time !== 'any' ? labelOf(TIMES, v.time) : null].filter(Boolean),
    },
    color: {
      title: 'Color grade', category: 'look', kinds: ['image', 'video'], inputs: SPEC_IN, outputs: SPEC_OUT,
      help: 'Color grade, palette and saturation.',
      fields: [
        { id: 'grade', label: 'Grade', type: 'select', options: opts(GRADES), default: 'natural' },
        { id: 'palette', label: 'Palette (optional)', type: 'text', default: '', placeholder: 'e.g. navy, cream and rust' },
        { id: 'saturation', label: 'Saturation', type: 'select', options: opts(SATURATION), default: 'natural' },
      ],
      build: v => ({
        spec: { color: { grade: labelOf(GRADES, v.grade), ...(clean(v.palette) ? { palette: clean(v.palette) } : {}), saturation: labelOf(SATURATION, v.saturation) } },
        say: [70, `Color: ${textOf(GRADES, v.grade)}${clean(v.palette) ? `, palette of ${clean(v.palette)}` : ''}${v.saturation !== 'natural' ? `, ${textOf(SATURATION, v.saturation)} saturation` : ''}`],
      }),
      chips: v => [labelOf(GRADES, v.grade)],
    },
    style: {
      title: 'Style & mood', category: 'look', kinds: ['image', 'video'], inputs: SPEC_IN, outputs: SPEC_OUT,
      help: 'The medium, the era and the emotional tone.',
      fields: [
        { id: 'medium', label: 'Medium', type: 'select', options: opts(MEDIUMS), default: 'photo' },
        { id: 'era', label: 'Era', type: 'select', options: opts(ERAS), default: 'any' },
        { id: 'mood', label: 'Mood', type: 'select', options: opts(MOODS), default: 'any' },
      ],
      build: v => ({
        spec: { style: { medium: labelOf(MEDIUMS, v.medium), ...(v.era !== 'any' ? { era: labelOf(ERAS, v.era) } : {}), ...(v.mood !== 'any' ? { mood: labelOf(MOODS, v.mood) } : {}) } },
        say: [10, `${article(textOf(MEDIUMS, v.medium))} ${textOf(MEDIUMS, v.medium)}${v.era !== 'any' ? ` with a ${textOf(ERAS, v.era)} feel` : ''}${v.mood !== 'any' ? `, ${textOf(MOODS, v.mood)} mood` : ''}`],
      }),
      chips: v => [labelOf(MEDIUMS, v.medium), v.mood !== 'any' ? labelOf(MOODS, v.mood) : null].filter(Boolean),
    },
    subject: {
      title: 'Subject details', category: 'subject', kinds: ['image', 'video'], inputs: SPEC_IN, outputs: SPEC_OUT,
      help: 'Who or what is in the frame, what they do and wear.',
      fields: [
        { id: 'who', label: 'Subject', type: 'text', default: '', placeholder: 'e.g. a woman in her 30s with short red hair' },
        { id: 'action', label: 'Pose / action', type: 'text', default: '', placeholder: 'e.g. leaning on a railing, looking away' },
        { id: 'expression', label: 'Expression', type: 'select', options: opts(EXPRESSIONS), default: 'any' },
        { id: 'wardrobe', label: 'Wardrobe', type: 'text', default: '', placeholder: 'e.g. oversized wool coat' },
      ],
      build: v => {
        const data = { ...(clean(v.who) ? { who: clean(v.who) } : {}), ...(clean(v.action) ? { pose_action: clean(v.action) } : {}), ...(v.expression !== 'any' ? { expression: labelOf(EXPRESSIONS, v.expression) } : {}), ...(clean(v.wardrobe) ? { wardrobe: clean(v.wardrobe) } : {}) };
        const parts = [clean(v.who), clean(v.action), v.expression !== 'any' && `with ${textOf(EXPRESSIONS, v.expression)}`, clean(v.wardrobe) && `wearing ${clean(v.wardrobe)}`].filter(Boolean);
        return { spec: Object.keys(data).length ? { subject: data } : {}, say: parts.length ? [15, parts.join(', ')] : null };
      },
      chips: v => [clean(v.who).slice(0, 24)].filter(Boolean),
    },
    camera_move: {
      title: 'Camera movement', category: 'motion', kinds: ['video'], inputs: SPEC_IN, outputs: SPEC_OUT,
      help: 'How the camera moves during the clip.',
      fields: [
        { id: 'move', label: 'Movement', type: 'select', options: opts(CAMERA_MOVES), default: 'pushin' },
        { id: 'speed', label: 'Speed', type: 'select', options: opts(SPEEDS), default: 'slow' },
        { id: 'stabilization', label: 'Feel', type: 'select', options: [{ value: 'smooth', label: 'Smooth' }, { value: 'organic', label: 'Organic' }, { value: 'shaky', label: 'Shaky' }], default: 'smooth' },
      ],
      build: v => ({
        spec: { motion: { camera_movement: labelOf(CAMERA_MOVES, v.move), speed: labelOf(SPEEDS, v.speed), feel: v.stabilization } },
        say: [80, `Camera: ${textOf(CAMERA_MOVES, v.move)}, ${textOf(SPEEDS, v.speed)} and ${v.stabilization}`],
      }),
      chips: v => [labelOf(CAMERA_MOVES, v.move)],
    },
    action: {
      title: 'Action & timing', category: 'motion', kinds: ['video'], inputs: SPEC_IN, outputs: SPEC_OUT,
      help: 'What happens, beat by beat. One line per beat, optionally with times like “0–3s: …”.',
      fields: [
        { id: 'beats', label: 'Beats', type: 'textarea', rows: 4, default: '', placeholder: '0–3s: she turns toward the window\n3–6s: rain starts, she smiles' },
        { id: 'pacing', label: 'Pacing', type: 'select', options: opts(PACING), default: 'realtime' },
      ],
      build: v => {
        const beats = clean(v.beats).split(/\r?\n/).map(clean).filter(Boolean);
        const pacing = textOf(PACING, v.pacing);
        return {
          spec: { motion: { ...(beats.length ? { beats } : {}), ...(pacing ? { pacing: labelOf(PACING, v.pacing) } : {}) } },
          say: beats.length || pacing ? [85, `${beats.length ? `Action: ${beats.join('; ')}` : ''}${beats.length && pacing ? '. ' : ''}${pacing ? `Played in ${pacing}` : ''}`] : null,
        };
      },
      chips: v => [clean(v.beats).split(/\r?\n/).filter(Boolean).length ? `${clean(v.beats).split(/\r?\n/).filter(Boolean).length} beats` : null, v.pacing !== 'realtime' ? labelOf(PACING, v.pacing) : null].filter(Boolean),
    },
    audio: {
      title: 'Sound', category: 'audio', kinds: ['video'], inputs: SPEC_IN, outputs: SPEC_OUT,
      help: 'Dialogue, ambience, effects and music. The video model creates the sound from this.',
      fields: [
        { id: 'dialogue', label: 'Dialogue', type: 'textarea', rows: 2, default: '', placeholder: 'Speaker: "Line of dialogue"' },
        { id: 'ambience', label: 'Ambience', type: 'text', default: '', placeholder: 'e.g. distant traffic, light rain' },
        { id: 'sfx', label: 'Sound effects', type: 'text', default: '', placeholder: 'e.g. footsteps on gravel' },
        { id: 'music', label: 'Music', type: 'select', options: opts(MUSIC), default: 'none' },
      ],
      build: v => {
        const data = { ...(clean(v.dialogue) ? { dialogue: clean(v.dialogue) } : { dialogue: 'none' }), ...(clean(v.ambience) ? { ambience: clean(v.ambience) } : {}), ...(clean(v.sfx) ? { sound_effects: clean(v.sfx) } : {}), music: labelOf(MUSIC, v.music) };
        const parts = [clean(v.dialogue) ? `dialogue: ${clean(v.dialogue)}` : 'no dialogue', clean(v.ambience) && `ambience of ${clean(v.ambience)}`, clean(v.sfx) && `sound effects: ${clean(v.sfx)}`, textOf(MUSIC, v.music) ? `music: ${textOf(MUSIC, v.music)}` : 'no music'].filter(Boolean);
        return { spec: { audio: data }, say: [90, `Sound – ${parts.join('; ')}`] };
      },
      chips: v => [clean(v.dialogue) ? 'Dialogue' : null, v.music !== 'none' ? labelOf(MUSIC, v.music) : null].filter(Boolean),
    },
    avoid: {
      title: 'Avoid', category: 'utility', kinds: ['image', 'video'], inputs: SPEC_IN, outputs: SPEC_OUT,
      help: 'Things that must not appear (models without a negative prompt read it as an instruction).',
      fields: [{ id: 'text', label: 'Avoid', type: 'text', default: 'text, watermarks, logos', placeholder: 'comma-separated' }],
      build: v => {
        const items = clean(v.text).split(',').map(clean).filter(Boolean);
        return items.length ? { spec: { avoid: items }, say: [98, `Avoid ${list(items)}`] } : {};
      },
      chips: v => [clean(v.text) ? 'Avoid list' : null].filter(Boolean),
    },
    instruction: {
      title: 'Extra instruction', category: 'utility', kinds: ['image', 'video'], inputs: SPEC_IN, outputs: SPEC_OUT,
      help: 'Any extra instruction that should be part of the prompt.',
      fields: [{ id: 'text', label: 'Instruction', type: 'textarea', rows: 3, default: '', placeholder: 'e.g. keep the logo exactly as in the reference' }],
      build: v => (clean(v.text) ? { spec: { notes: [clean(v.text)] }, say: [95, clean(v.text)] } : {}),
      chips: v => [clean(v.text).slice(0, 24)].filter(Boolean),
    },
    note: {
      title: 'Note', category: 'utility', kinds: ['image', 'video'], inputs: [], outputs: [],
      help: 'A comment on the canvas – it is not sent anywhere.',
      fields: [{ id: 'text', label: 'Note', type: 'textarea', rows: 3, default: '' }],
      chips: () => [],
    },
    generate_image: {
      title: 'Generate image', category: 'output', kinds: ['image'], output: 'image',
      inputs: [{ id: 'spec', type: 'spec', multi: true, label: 'shot' }, { id: 'refs', type: 'image', multi: true, label: 'references' }],
      outputs: [{ id: 'image', type: 'image', label: 'image' }],
      help: 'Generates images from everything connected to it. The images also land in your gallery.',
      fields: [
        { id: 'model', label: 'Model', type: 'model', default: 'gemini-nano-banana-2.1', options: opts(MODEL_FALLBACK) },
        { id: 'ratio', label: 'Aspect ratio', type: 'select', options: opts(IMAGE_RATIOS), default: '1:1' },
        { id: 'size', label: 'Resolution', type: 'select', options: opts(IMAGE_SIZES), default: '1K' },
        { id: 'count', label: 'Images', type: 'select', options: ['1', '2', '3', '4'].map(n => ({ value: n, label: n })), default: '1' },
      ],
      chips: v => [v.ratio, `${v.count}×`],
    },
    generate_video: {
      title: 'Generate video', category: 'output', kinds: ['video'], output: 'video',
      inputs: [
        { id: 'spec', type: 'spec', multi: true, label: 'shot' },
        { id: 'first', type: 'image', label: 'first frame' },
        { id: 'last', type: 'image', label: 'last frame' },
        { id: 'refs', type: 'image', multi: true, label: 'references' },
      ],
      outputs: [{ id: 'video', type: 'video', label: 'video' }],
      help: 'Generates a video clip with Gemini Omni Flash, or for free with an open model on Hugging Face (Wan 2.2, LTX-2.3, LTX-Video). First and last frames anchor the start and end.',
      fields: [
        { id: 'model', label: 'Model', type: 'select', options: opts(VIDEO_MODELS), default: 'gemini-omni-1.1-flash' },
        { id: 'ratio', label: 'Aspect ratio', type: 'select', options: opts(VIDEO_RATIOS), default: '16:9' },
        { id: 'resolution', label: 'Resolution', type: 'select', options: opts(VIDEO_RESOLUTIONS), default: '720p' },
        { id: 'duration', label: 'Length', type: 'select', options: ['2', '3', '4', '5', '6', '7', '8', '9', '10'].map(n => ({ value: n, label: `${n} s` })), default: '6' },
        { id: 'sound', label: 'Sound', type: 'toggle', default: true },
      ],
      chips: v => {
        const free = VIDEO_MODELS.find(m => m.id === v.model && m.free);
        return [free && free.label.replace(/ \(.*$/, ''), v.ratio, !free && v.resolution, `${v.duration} s`].filter(Boolean);
      },
    },
  };

  const isOutput = type => Boolean(NODE_TYPES[type]?.output);

  // ── Optics: what the settings mean for the picture ───────────────────────

  function derive(meta, spec, kind) {
    const out = {};
    const warnings = [];
    const crop = meta.crop || 1;
    const dofFactor = meta.dof || 1;
    if (meta.focal) {
      const eq = meta.focal * crop;
      const fov = Math.round((2 * Math.atan(36 / (2 * eq)) * 180) / Math.PI);
      out.field_of_view = `${fov}° horizontal (${Math.round(eq)} mm full-frame equivalent)`;
      out.perspective = eq < 20 ? 'ultra-wide with strong perspective distortion and exaggerated depth'
        : eq < 30 ? 'wide-angle with expansive perspective'
        : eq < 45 ? 'slightly wide, natural documentary perspective'
        : eq < 65 ? 'normal perspective close to human vision'
        : eq < 115 ? 'short-telephoto compression with a flattering, calm perspective'
        : eq < 220 ? 'telephoto compression that pulls the background closer'
        : 'super-telephoto compression with an isolated subject';
      if (meta.lensType === 'fisheye') out.perspective = 'fisheye distortion with a curved horizon';
    }
    if (meta.aperture && !meta.dofOverride) {
      const eqN = meta.aperture * crop * dofFactor;
      const eqF = (meta.focal || 50) * crop;
      const score = meta.lensType === 'pinhole' ? 999 : eqN * (50 / eqF) ** 2 * (meta.lensType === 'macro' ? 0.15 : 1);
      out.depth_of_field = score < 0.8 ? 'razor-thin depth of field, background melts into creamy bokeh'
        : score < 2 ? 'very shallow depth of field with a strongly blurred background'
        : score < 5 ? 'shallow depth of field with a softly blurred background'
        : score < 12 ? 'moderate depth of field, background recognizable but soft'
        : score < 30 ? 'deep depth of field, most of the scene sharp'
        : 'everything sharp from foreground to background';
    }
    if (meta.shutter) {
      const t = meta.shutter;
      out.motion = kind === 'video'
        ? (t <= 1 / 500 ? 'very crisp, staccato motion with little motion blur per frame' : t <= 1 / 40 ? 'natural cinematic motion blur (about a 180° shutter)' : 'smeared, dreamy motion blur')
        : t <= 1 / 2000 ? 'freezes even very fast motion such as splashes and sports'
        : t <= 1 / 500 ? 'crisp, frozen motion'
        : t <= 1 / 125 ? 'natural rendering, slight blur only on fast movement'
        : t <= 1 / 30 ? 'visible motion blur on moving subjects'
        : t <= 1 / 4 ? 'strong motion blur and streaking movement'
        : 'long exposure: silky water, light trails and ghosted moving people, camera on a tripod';
    }
    if (meta.iso) {
      const iso = meta.iso;
      const grainSet = meta.grain && meta.grain !== 'auto';
      if (!grainSet) {
        out.noise = iso <= 200 ? 'clean, noise-free image' : iso <= 800 ? 'very slight noise' : iso <= 3200 ? 'visible fine grain' : iso <= 12800 ? 'pronounced grain typical of low light' : 'heavy, gritty grain';
      }
    }
    if (meta.aperture && meta.shutter && meta.iso) {
      const ev = Math.log2((meta.aperture * meta.aperture) / meta.shutter) - Math.log2(meta.iso / 100) + (meta.ev || 0);
      const light = ev >= 15 ? 'bright direct sunlight' : ev >= 13 ? 'daylight or light overcast' : ev >= 11 ? 'open shade or heavy overcast' : ev >= 8 ? 'a bright interior or dusk' : ev >= 5 ? 'a dim interior or evening' : ev >= 2 ? 'night streets or candlelight' : 'a very dark night or moonlight';
      out.scene_brightness = `EV ${Math.round(ev)} – matches ${light}`;
      const time = meta.time;
      const lightSetup = meta.light;
      const dark = time === 'night' || ['moon', 'candle'].includes(lightSetup);
      const bright = time === 'noon' || lightSetup === 'midday';
      if (dark && ev > 11) warnings.push(`The exposure (EV ${Math.round(ev)}) is far too dark for a night or candlelit scene – open the aperture, slow the shutter or raise the ISO.`);
      if (bright && ev < 9) warnings.push(`The exposure (EV ${Math.round(ev)}) would blow out a sunny midday scene – stop down, use a faster shutter or a lower ISO.`);
    }
    if (meta.shutter && meta.shutter >= 1 / 8 && kind !== 'video') warnings.push('Shutter speeds of 1/8 s and slower blur anything that moves – fine for long exposures, not for sharp portraits.');
    return { rendering: out, warnings };
  }

  // ── Graph utilities ──────────────────────────────────────────────────────

  const uid = () => Math.random().toString(36).slice(2, 10);

  function defaults(type) {
    const t = NODE_TYPES[type];
    const values = {};
    for (const f of t?.fields || []) values[f.id] = f.default;
    return values;
  }

  function newNode(type, x = 0, y = 0, values = {}) {
    return { id: `n${uid()}`, type, x: Math.round(x), y: Math.round(y), values: { ...defaults(type), ...values } };
  }

  function newGraph(kind = 'image', name = 'Untitled') {
    return { id: `g${uid()}`, name, kind, nodes: [], edges: [], formats: { prose: true, xml: true, json: true, markdown: true }, updatedAt: new Date().toISOString() };
  }

  function portOf(type, side, id) {
    const t = NODE_TYPES[type];
    return (side === 'in' ? t?.inputs : t?.outputs)?.find(p => p.id === id) || null;
  }

  function canConnect(graph, from, to) {
    if (from.node === to.node) return false;
    const a = graph.nodes.find(n => n.id === from.node), b = graph.nodes.find(n => n.id === to.node);
    const pa = a && portOf(a.type, 'out', from.port), pb = b && portOf(b.type, 'in', to.port);
    if (!pa || !pb || pa.type !== pb.type) return false;
    // no cycles: `to` must not already feed `from`
    const feeds = (src, dst, seen = new Set()) => {
      if (src === dst) return true;
      if (seen.has(src)) return false;
      seen.add(src);
      return graph.edges.filter(e => e.from.node === src).some(e => feeds(e.to.node, dst, seen));
    };
    return !feeds(to.node, from.node);
  }

  function connect(graph, from, to) {
    if (!canConnect(graph, from, to)) return null;
    const b = graph.nodes.find(n => n.id === to.node);
    const pb = portOf(b.type, 'in', to.port);
    if (!pb.multi) graph.edges = graph.edges.filter(e => !(e.to.node === to.node && e.to.port === to.port));
    if (graph.edges.some(e => e.from.node === from.node && e.from.port === from.port && e.to.node === to.node && e.to.port === to.port)) return null;
    const edge = { id: `e${uid()}`, from: { ...from }, to: { ...to } };
    graph.edges.push(edge);
    return edge;
  }

  // Validates a graph from the outside (server, Claude): known node types, known field values, sane sizes.
  function sanitizeGraph(input) {
    const g = input && typeof input === 'object' ? input : {};
    const nodes = (Array.isArray(g.nodes) ? g.nodes : []).slice(0, 200).filter(n => n && NODE_TYPES[n.type]).map(n => {
      const t = NODE_TYPES[n.type];
      const values = defaults(n.type);
      for (const f of t.fields) {
        const v = n.values?.[f.id];
        if (v === undefined) continue;
        if (f.type === 'toggle') values[f.id] = Boolean(v);
        else if (f.type === 'image') values[f.id] = v && typeof v === 'object' ? { path: String(v.path || '').slice(0, 200), itemId: v.itemId ? String(v.itemId).slice(0, 60) : undefined, url: v.url ? String(v.url).slice(0, 300) : undefined } : null;
        else if (f.type === 'select' && f.id !== 'model') values[f.id] = f.options.some(op => op.value === String(v)) ? String(v) : f.default;
        else values[f.id] = String(v).slice(0, 4000);
      }
      return { id: String(n.id || `n${uid()}`).slice(0, 40), type: n.type, x: Math.round(Number(n.x) || 0), y: Math.round(Number(n.y) || 0), values };
    });
    const ids = new Set(nodes.map(n => n.id));
    const graph = {
      id: String(g.id || `g${uid()}`).replace(/[^\w-]/g, '').slice(0, 40) || `g${uid()}`,
      name: String(g.name || 'Untitled').slice(0, 80),
      kind: g.kind === 'video' ? 'video' : 'image',
      nodes,
      edges: [],
      formats: { prose: g.formats?.prose !== false, xml: g.formats?.xml !== false, json: g.formats?.json !== false, markdown: g.formats?.markdown !== false },
      updatedAt: new Date().toISOString(),
    };
    for (const e of (Array.isArray(g.edges) ? g.edges : []).slice(0, 600)) {
      if (!e?.from || !e?.to || !ids.has(e.from.node) || !ids.has(e.to.node)) continue;
      connect(graph, { node: String(e.from.node), port: String(e.from.port) }, { node: String(e.to.node), port: String(e.to.port) });
    }
    return graph;
  }

  // ── Compile ──────────────────────────────────────────────────────────────

  const isPlain = v => v && typeof v === 'object' && !Array.isArray(v);
  function merge(a, b) {
    for (const [k, v] of Object.entries(b)) {
      if (isPlain(v) && isPlain(a[k])) merge(a[k], v);
      else if (Array.isArray(v) && Array.isArray(a[k])) a[k] = [...a[k], ...v];
      else a[k] = isPlain(v) ? merge({}, v) : v;
    }
    return a;
  }

  const SECTION_ORDER = ['subject', 'scene', 'style', 'camera', 'lens', 'exposure', 'focus', 'film', 'composition', 'lighting', 'color', 'motion', 'audio', 'rendering', 'output', 'avoid', 'notes'];
  const byPosition = (a, b) => a.y - b.y || a.x - b.x;

  function outputNodes(graph) {
    return graph.nodes.filter(n => isOutput(n.type)).sort(byPosition);
  }

  // The nodes that feed `target` (through spec ports), sources first. Without a target: every spec node.
  function upstream(graph, target) {
    const byId = new Map(graph.nodes.map(n => [n.id, n]));
    const order = [];
    const seen = new Set();
    const visit = id => {
      if (seen.has(id)) return;
      seen.add(id);
      const parents = graph.edges.filter(e => e.to.node === id && portOf(byId.get(id)?.type, 'in', e.to.port)?.type === 'spec')
        .map(e => byId.get(e.from.node)).filter(Boolean).sort(byPosition);
      for (const p of parents) visit(p.id);
      order.push(id);
    };
    if (target) visit(target.id);
    else graph.nodes.filter(n => NODE_TYPES[n.type]?.build).sort(byPosition).forEach(n => visit(n.id));
    return order.map(id => byId.get(id)).filter(n => n && n !== target && NODE_TYPES[n.type]?.build);
  }

  function imageInputs(graph, target) {
    const byId = new Map(graph.nodes.map(n => [n.id, n]));
    const res = {};
    if (!target) return res;
    for (const e of graph.edges.filter(x => x.to.node === target.id)) {
      const port = portOf(target.type, 'in', e.to.port);
      if (!port || port.type !== 'image') continue;
      const src = byId.get(e.from.node);
      if (!src) continue;
      const entry = src.type === 'reference'
        ? { node: src.id, kind: 'reference', image: src.values.image || null, role: src.values.role || 'auto' }
        : { node: src.id, kind: 'generated', from: src.type };
      if (port.multi) (res[e.to.port] ||= []).push(entry);
      else res[e.to.port] = entry;
    }
    return res;
  }

  function compile(graph, options = {}) {
    const g = graph || newGraph();
    // default target: the first output of the graph's own kind (a video graph may also hold a Generate image node)
    const outputs = outputNodes(g);
    const ownKind = outputs.find(n => NODE_TYPES[n.type].output === (g.kind || 'image'));
    const target = options.target === null ? null : (options.target ? g.nodes.find(n => n.id === options.target) : ownKind || outputs[0]) || null;
    const kind = options.only || (target ? (NODE_TYPES[target.type].output === 'video' ? 'video' : 'image') : (g.kind || 'image'));
    // `skip`: node types to leave out (Create skips the graph's own Prompt); `only`: keep nodes made for that kind
    const skip = new Set(options.skip || []);
    const nodes = upstream(g, target).filter(n => !skip.has(n.type) && (!options.only || NODE_TYPES[n.type].kinds.includes(options.only)));
    const spec = {};
    const prose = {};
    const meta = {};
    const says = [];
    const bases = [];
    const chips = [];
    for (const n of nodes) {
      const t = NODE_TYPES[n.type];
      const r = t.build(n.values || {}) || {};
      if (r.base) bases.push(r.base);
      if (r.spec) merge(spec, r.spec);
      if (r.prose) Object.assign(prose, r.prose);
      if (r.meta) Object.assign(meta, r.meta);
      if (r.say && r.say[1]) says.push(r.say);
      chips.push(...(t.chips?.(n.values || {}) || []));
    }
    const { rendering, warnings } = derive(meta, spec, kind);
    if (Object.keys(rendering).length) spec.rendering = rendering;
    if (target) {
      const v = target.values || {};
      spec.output = kind === 'video'
        ? { type: 'video clip', aspect_ratio: v.ratio, resolution: v.resolution, duration_seconds: Number(v.duration) || undefined, sound: v.sound !== false }
        : { type: 'image', aspect_ratio: v.ratio };
    }

    // the camera sentence: body + lens + exposure in one line
    const exp = spec.exposure;
    if (prose.camera || prose.lens || exp) {
      let t = kind === 'video' ? 'Filmed' : 'Shot';
      if (prose.camera) t += ` on ${prose.camera}`;
      if (prose.lens) t += ` with ${prose.lens}`;
      const e = exp ? [exp.aperture, exp.shutter_speed, `ISO ${exp.iso}`].filter(Boolean) : [];
      if (e.length) t += ` at ${list(e)}`;
      if (exp?.exposure_compensation) t += ` (${exp.exposure_compensation})`;
      says.push([30, t]);
      if (prose.lensLook) says.push([31, `The lens gives ${prose.lensLook}`]);
    }
    if (spec.rendering) {
      const r = spec.rendering;
      const parts = [r.depth_of_field, r.perspective, r.motion, r.noise].filter(Boolean);
      if (parts.length) says.push([35, `Optical result: ${parts.join('; ')}`]);
      if (r.scene_brightness) {
        const [, ev, light] = r.scene_brightness.match(/^EV (-?\d+) – matches (.*)$/) || [];
        if (light) says.push([36, `Light level consistent with ${light} (EV ${ev})`]);
      }
    }
    if (kind === 'video' && target) {
      const v = target.values || {};
      says.push([92, `${v.duration ? `About ${v.duration} seconds long` : 'A short clip'}${v.sound === false ? ', silent – no audio' : ''}`]);
    }
    says.sort((a, b) => a[0] - b[0]);
    const sentences = says.map(s => sentence(s[1])).filter(Boolean);

    const ordered = {};
    for (const k of SECTION_ORDER) if (spec[k] !== undefined) ordered[k] = spec[k];
    const root = kind === 'video' ? 'video_specification' : 'shot_specification';
    const xml = Object.keys(ordered).length ? toXml(root, ordered) : '';
    const json = Object.keys(ordered).length ? JSON.stringify(ordered, null, 2) : '';
    const markdown = Object.keys(ordered).length ? toMarkdown(kind === 'video' ? 'Video specification' : 'Shot specification', ordered) : '';
    const base = [clean(options.prompt), ...bases].filter(Boolean).join('\n\n');
    const formats = { ...{ prose: true, xml: true, json: true, markdown: true }, ...(g.formats || {}), ...(options.formats || {}) };
    const parts = { base, prose: sentences.join(' '), xml, json, markdown };
    // nodes that feed no output at all (a node feeding another output isn't unused)
    const used = new Set(outputs.flatMap(out => upstream(g, out)).map(n => n.id));
    const unconnected = target ? g.nodes.filter(n => NODE_TYPES[n.type]?.build && !used.has(n.id)).length : 0;
    if (unconnected) warnings.push(`${unconnected} ${unconnected === 1 ? 'node isn’t' : 'nodes aren’t'} connected to “${NODE_TYPES[target.type].title}” and ${unconnected === 1 ? 'is' : 'are'} left out.`);
    return {
      kind,
      target: target ? target.id : null,
      prompt: assemble(parts, formats, kind),
      addition: assemble({ ...parts, base: '' }, formats, kind),
      parts,
      spec: ordered,
      settings: target ? { ...target.values } : null,
      inputs: imageInputs(g, target),
      chips: [...new Set(chips.filter(Boolean))],
      warnings,
      nodes: nodes.map(n => n.id),
    };
  }

  function assemble(parts, formats, kind) {
    const blocks = [];
    if (parts.base) blocks.push(parts.base);
    if (formats.prose && parts.prose) blocks.push(parts.prose);
    const structured = [];
    if (formats.xml && parts.xml) structured.push(parts.xml);
    if (formats.json && parts.json) structured.push('```json\n' + parts.json + '\n```');
    if (formats.markdown && parts.markdown) structured.push(parts.markdown);
    if (structured.length) {
      blocks.push(`${kind === 'video' ? 'Video' : 'Shot'} specification – follow every value exactly. The same values are given as ${list([formats.xml && parts.xml && 'XML', formats.json && parts.json && 'JSON', formats.markdown && parts.markdown && 'Markdown'].filter(Boolean))}:`);
      blocks.push(...structured);
    }
    return blocks.join('\n\n');
  }

  // ── Renderers ────────────────────────────────────────────────────────────

  const xmlEscape = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const tag = k => String(k).replace(/[^a-zA-Z0-9_]/g, '_').replace(/^(\d)/, '_$1');
  function toXml(rootName, obj, depth = 0) {
    const pad = '  '.repeat(depth);
    const body = Object.entries(obj).map(([k, v]) => {
      const t = tag(k);
      if (Array.isArray(v)) {
        const item = t.endsWith('s') ? t.slice(0, -1) : 'item';
        return `${pad}  <${t}>\n${v.map(x => `${pad}    <${item}>${xmlEscape(x)}</${item}>`).join('\n')}\n${pad}  </${t}>`;
      }
      if (isPlain(v)) return toXml(t, v, depth + 1);
      return `${pad}  <${t}>${xmlEscape(v)}</${t}>`;
    }).join('\n');
    return `${pad}<${rootName}>\n${body}\n${pad}</${rootName}>`;
  }

  const human = k => (k === 'iso' ? 'ISO' : k).replace(/_/g, ' ').replace(/\bmm\b/, '(mm)').replace(/\bk\b/, '(K)').replace(/^./, c => c.toUpperCase());
  function toMarkdown(title, obj) {
    const lines = [`## ${title}`];
    for (const [section, v] of Object.entries(obj)) {
      lines.push('', `### ${human(section)}`);
      if (Array.isArray(v)) lines.push(...v.map(x => `- ${x}`));
      else if (isPlain(v)) {
        for (const [k, x] of Object.entries(v)) lines.push(`- **${human(k)}:** ${Array.isArray(x) ? x.join('; ') : x}`);
      } else lines.push(String(v));
    }
    return lines.join('\n');
  }

  // ── Templates ────────────────────────────────────────────────────────────

  function template(name, kind, rows, edges) {
    const g = newGraph(kind, name);
    const ids = {};
    rows.forEach(([key, type, x, y, values]) => {
      const n = newNode(type, x, y, values);
      ids[key] = n.id;
      g.nodes.push(n);
    });
    for (const [a, b, port = 'in', fromPort] of edges) {
      const from = g.nodes.find(n => n.id === ids[a]);
      connect(g, { node: ids[a], port: fromPort || NODE_TYPES[from.type].outputs[0].id }, { node: ids[b], port });
    }
    return g;
  }

  const chain = (keys, last, lastPort = 'spec') => keys.slice(0, -1).map((k, i) => [k, keys[i + 1]]).concat([[keys[keys.length - 1], last, lastPort]]);

  const TEMPLATES = [
    {
      id: 'portrait85', name: 'Portrait · 85 mm', kind: 'image',
      build: () => template('Portrait · 85 mm', 'image', [
        ['p', 'prompt', 0, 0, { text: 'Portrait of an old fisherman on a pier at dawn' }],
        ['c', 'camera', 0, 230, { body: 'ff' }],
        ['l', 'lens', 300, 0, { focal: '85', type: 'prime' }],
        ['e', 'exposure', 300, 230, { iso: '100', aperture: '1.8', shutter: '1/500' }],
        ['s', 'shot', 600, 0, { size: 'mcu', angle: 'eye', composition: 'thirds' }],
        ['li', 'lighting', 600, 230, { setup: 'golden', direction: 'side45', quality: 'soft', kelvin: '3200', contrast: 'low', haze: 'light' }],
        ['g', 'generate_image', 920, 80, { ratio: '4:5' }],
      ], chain(['p', 'c', 'l', 'e', 's', 'li'], 'g')),
    },
    {
      id: 'street35', name: 'Night street · 35 mm film', kind: 'image',
      build: () => template('Night street · 35 mm film', 'image', [
        ['p', 'prompt', 0, 0, { text: 'A rainy side street at night, a cyclist passing a glowing noodle bar' }],
        ['c', 'camera', 0, 230, { body: 'film35' }],
        ['l', 'lens', 300, 0, { focal: '35', type: 'prime' }],
        ['e', 'exposure', 300, 230, { iso: '800', aperture: '1.4', shutter: '1/60' }],
        ['f', 'film', 600, 0, { stock: 'cinestill800t', grain: 'auto', halation: true }],
        ['sc', 'scene', 600, 230, { location: 'old town side street', time: 'night', weather: 'rain', season: 'any' }],
        ['g', 'generate_image', 920, 80, { ratio: '3:2' }],
      ], chain(['p', 'c', 'l', 'e', 'f', 'sc'], 'g')),
    },
    {
      id: 'product100', name: 'Product · macro 100 mm', kind: 'image',
      build: () => template('Product · macro 100 mm', 'image', [
        ['p', 'prompt', 0, 0, { text: 'A luxury perfume bottle on wet black stone with water droplets' }],
        ['l', 'lens', 300, 0, { focal: '100', type: 'macro' }],
        ['e', 'exposure', 300, 230, { iso: '100', aperture: '8', shutter: '1/160' }],
        ['s', 'shot', 600, 0, { size: 'cu', angle: 'eye', composition: 'center' }],
        ['li', 'lighting', 600, 230, { setup: 'softbox', direction: 'side', quality: 'soft', kelvin: '5600', contrast: 'high', haze: 'none' }],
        ['a', 'avoid', 0, 230, { text: 'text, watermarks, fingerprints, dust' }],
        ['g', 'generate_image', 920, 80, { ratio: '4:5' }],
      ], chain(['p', 'a', 'l', 'e', 's', 'li'], 'g')),
    },
    {
      id: 'landscape16', name: 'Landscape · 16 mm', kind: 'image',
      build: () => template('Landscape · 16 mm', 'image', [
        ['p', 'prompt', 0, 0, { text: 'Mountain lake with a lone wooden boat, peaks reflected in still water' }],
        ['l', 'lens', 300, 0, { focal: '16', type: 'zoom' }],
        ['e', 'exposure', 300, 230, { iso: '100', aperture: '11', shutter: '1/125' }],
        ['sc', 'scene', 600, 0, { location: 'alpine lake', time: 'golden', weather: 'clear', season: 'autumn' }],
        ['co', 'color', 600, 230, { grade: 'warm', saturation: 'vivid' }],
        ['g', 'generate_image', 920, 80, { ratio: '16:9' }],
      ], chain(['p', 'l', 'e', 'sc', 'co'], 'g')),
    },
    {
      id: 'cine_anamorphic', name: 'Cinematic shot · anamorphic', kind: 'video',
      build: () => template('Cinematic shot · anamorphic', 'video', [
        ['p', 'prompt', 0, 0, { text: 'A woman in a red coat walks through a foggy train station' }],
        ['c', 'camera', 0, 230, { body: 'cinema' }],
        ['l', 'lens', 300, 0, { focal: '40', type: 'anamorphic' }],
        ['e', 'exposure', 300, 230, { iso: '800', aperture: '2.8', shutter: '1/50' }],
        ['m', 'camera_move', 600, 0, { move: 'track', speed: 'slow', stabilization: 'smooth' }],
        ['co', 'color', 600, 230, { grade: 'tealorange', saturation: 'natural' }],
        ['au', 'audio', 900, 0, { ambience: 'echoing station hall, distant announcements', sfx: 'heels on stone', music: 'score' }],
        ['g', 'generate_video', 1220, 80, { ratio: '16:9', resolution: '720p', duration: '6' }],
      ], chain(['p', 'c', 'l', 'e', 'm', 'co', 'au'], 'g')),
    },
    {
      id: 'image_to_video', name: 'Image → video', kind: 'video',
      build: () => template('Image → video', 'video', [
        ['p', 'prompt', 0, 0, { text: 'A paper boat drifting on a rain puddle, city lights reflected' }],
        ['l', 'lens', 300, 0, { focal: '50', type: 'macro' }],
        ['gi', 'generate_image', 600, 0, { ratio: '16:9', count: '1' }],
        ['m', 'camera_move', 300, 260, { move: 'pushin', speed: 'veryslow', stabilization: 'smooth' }],
        ['au', 'audio', 600, 300, { ambience: 'soft rain, distant traffic', music: 'none' }],
        ['gv', 'generate_video', 920, 160, { ratio: '16:9', resolution: '720p', duration: '6' }],
      ], [['p', 'l'], ['l', 'gi', 'spec'], ['p', 'm'], ['m', 'au'], ['au', 'gv', 'spec'], ['gi', 'gv', 'first', 'image']]),
    },
  ];

  return {
    VERSION: 1,
    NODE_TYPES,
    CATEGORIES,
    TEMPLATES,
    VIDEO_MODELS,
    newGraph,
    newNode,
    defaults,
    portOf,
    canConnect,
    connect,
    sanitizeGraph,
    compile,
    outputNodes,
    upstream,
    toXml,
    toMarkdown,
  };
});
