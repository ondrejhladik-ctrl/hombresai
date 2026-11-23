// Turn a fragmented MP4 (what the browser's MediaRecorder makes) into a flat, progressive MP4 that
// video editors (DaVinci Resolve, Premiere…) can import and that the browser can seek. It's lossless:
// the same H.264 / AAC bytes are re-containered, not re-encoded. Runs in the browser and in Node.
//
// A MediaRecorder MP4 keeps its frames in moof+mdat fragments and leaves the moov's sample tables
// empty, so editors that read the moov find no frames and silently reject the file. This rebuilds a
// real moov (stts/stsc/stsz/stco/stss…) from the fragments and writes moov before mdat (faststart).
//
// FxRemux.remux(bytes) -> Uint8Array (progressive MP4), or null when the input isn't a remuxable fMP4
// (already progressive, or not an MP4) – the caller then keeps the original.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FxRemux = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const str = (dv, p) => String.fromCharCode(dv.getUint8(p), dv.getUint8(p + 1), dv.getUint8(p + 2), dv.getUint8(p + 3));

  // Top-level/child boxes in [start,end): [{type, start, end, body}] (body = first byte after the header).
  function boxes(dv, start, end) {
    const out = [];
    let p = start;
    while (p + 8 <= end) {
      let size = dv.getUint32(p);
      const type = str(dv, p + 4);
      let header = 8;
      if (size === 1) { size = Number(dv.getBigUint64(p + 8)); header = 16; } else if (size === 0) { size = end - p; }
      if (size < header || p + size > end) break;
      out.push({ type, start: p, end: p + size, body: p + header });
      p += size;
    }
    return out;
  }
  const find = (list, type) => list.find(b => b.type === type);
  const children = (dv, box) => boxes(dv, box.body, box.end);

  // ── Read the fragments: every sample of every track, in order ──────────────
  function readTracks(dv, moov, fileEnd) {
    const mvex = find(children(dv, moov), 'mvex');
    const trex = {};
    if (mvex) for (const b of children(dv, mvex)) if (b.type === 'trex') {
      trex[dv.getUint32(b.body + 4)] = { dur: dv.getUint32(b.body + 12), size: dv.getUint32(b.body + 16), flags: dv.getUint32(b.body + 20) };
    }
    const tracks = {}; // id -> { samples: [{offset,size,dur,sync}] }
    for (const moof of boxes(dv, 0, fileEnd).filter(b => b.type === 'moof')) {
      for (const traf of children(dv, moof).filter(b => b.type === 'traf')) {
        const kids = children(dv, traf);
        const tfhd = find(kids, 'tfhd');
        if (!tfhd) continue;
        const tf = dv.getUint32(tfhd.body) & 0xffffff;
        const trackId = dv.getUint32(tfhd.body + 4);
        let q = tfhd.body + 8;
        let baseOffset = moof.start;                 // default-base-is-moof (0x20000) or absent → moof start
        if (tf & 0x01) { baseOffset = Number(dv.getBigUint64(q)); q += 8; }
        if (tf & 0x02) q += 4;                        // sample-description-index
        const defDur = tf & 0x08 ? dv.getUint32((q += 4) - 4) : (trex[trackId]?.dur || 0);
        const defSize = tf & 0x10 ? dv.getUint32((q += 4) - 4) : (trex[trackId]?.size || 0);
        const defFlags = tf & 0x20 ? dv.getUint32((q += 4) - 4) : (trex[trackId]?.flags || 0);
        const track = (tracks[trackId] ||= { samples: [] });
        for (const trun of kids.filter(b => b.type === 'trun')) {
          const fl = dv.getUint32(trun.body) & 0xffffff;
          const count = dv.getUint32(trun.body + 4);
          let r = trun.body + 8;
          let dataOffset = baseOffset;
          if (fl & 0x001) { dataOffset = baseOffset + dv.getInt32(r); r += 4; }
          let firstFlags = null;
          if (fl & 0x004) { firstFlags = dv.getUint32(r); r += 4; }
          let off = dataOffset;
          for (let i = 0; i < count; i++) {
            const dur = fl & 0x100 ? dv.getUint32((r += 4) - 4) : defDur;
            const size = fl & 0x200 ? dv.getUint32((r += 4) - 4) : defSize;
            const flags = fl & 0x400 ? dv.getUint32((r += 4) - 4) : (i === 0 && firstFlags !== null ? firstFlags : defFlags);
            const cto = fl & 0x800 ? dv.getInt32((r += 4) - 4) : 0;
            track.samples.push({ offset: off, size, dur, sync: !(flags & 0x00010000), cto });
            off += size;
          }
        }
      }
    }
    return tracks;
  }

  // ── Write the new moov ─────────────────────────────────────────────────────
  const enc = s => { const a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; };
  function box(type, ...parts) {
    let len = 8;
    for (const p of parts) len += p.length;
    const head = new Uint8Array(8);
    new DataView(head.buffer).setUint32(0, len);
    head.set(enc(type), 4);
    return concat([head, ...parts]);
  }
  function concat(arrs) {
    let n = 0; for (const a of arrs) n += a.length;
    const out = new Uint8Array(n); let o = 0;
    for (const a of arrs) { out.set(a, o); o += a.length; }
    return out;
  }
  const u32 = n => { const a = new Uint8Array(4); new DataView(a.buffer).setUint32(0, n >>> 0); return a; };
  const table = (type, version, entries, entrySize, fill) => {
    const a = new Uint8Array(8 + entries.length * entrySize);
    const dv = new DataView(a.buffer);
    dv.setUint32(0, version << 24); // version + flags 0
    dv.setUint32(4, entries.length);
    entries.forEach((e, i) => fill(dv, 8 + i * entrySize, e));
    return box(type, a);
  };

  function buildStbl(stsdBox, samples, mdatOffset) {
    // stts: run-length of sample durations
    const stts = [];
    for (const s of samples) { const last = stts[stts.length - 1]; if (last && last.dur === s.dur) last.count++; else stts.push({ count: 1, dur: s.dur }); }
    // ctts: composition offsets, only if any non-zero
    const hasCto = samples.some(s => s.cto);
    const ctts = [];
    if (hasCto) for (const s of samples) { const last = ctts[ctts.length - 1]; if (last && last.off === s.cto) last.count++; else ctts.push({ count: 1, off: s.cto }); }
    // stss: sync sample indices (omit when every sample is a sync sample)
    const sync = [];
    samples.forEach((s, i) => { if (s.sync) sync.push(i + 1); });
    const allSync = sync.length === samples.length;
    const parts = [
      stsdBox,
      table('stts', 0, stts, 8, (dv, o, e) => { dv.setUint32(o, e.count); dv.setUint32(o + 4, e.dur); }),
      ...(hasCto ? [table('ctts', 1, ctts, 8, (dv, o, e) => { dv.setUint32(o, e.count); dv.setInt32(o + 4, e.off); })] : []),
      ...(allSync ? [] : [table('stss', 0, sync, 4, (dv, o, e) => dv.setUint32(o, e))]),
      // one chunk holds all of this track's samples: stsc = {first_chunk:1, samples_per_chunk:N, desc:1}
      table('stsc', 0, [0], 12, (dv, o) => { dv.setUint32(o, 1); dv.setUint32(o + 4, samples.length); dv.setUint32(o + 8, 1); }),
      (() => {
        const a = new Uint8Array(12 + samples.length * 4);
        const d = new DataView(a.buffer);
        d.setUint32(0, 0);                 // version + flags
        d.setUint32(4, 0);                 // sample_size 0 → sizes listed per sample
        d.setUint32(8, samples.length);    // sample_count
        samples.forEach((s, i) => d.setUint32(12 + i * 4, s.size));
        return box('stsz', a);
      })(),
      table('stco', 0, [mdatOffset], 4, (dv, o, e) => dv.setUint32(o, e >>> 0)),
    ];
    return box('stbl', ...parts);
  }

  // Replace a 32-bit field at `off` inside a copied box (for durations in mvhd/tkhd/mdhd).
  function setDurations(trak, dv, movieTimescale, movieDuration) {
    // caller handles via rebuild below; kept simple – we rebuild these boxes' duration fields in place
  }

  function remux(input) {
    const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const top = boxes(dv, 0, bytes.length);
    const ftyp = find(top, 'ftyp');
    const moov = find(top, 'moov');
    if (!ftyp || !moov) return null;
    const moovKids = children(dv, moov);
    if (!find(moovKids, 'mvex')) return null; // not fragmented → already progressive, keep as is
    const tracks = readTracks(dv, moov, bytes.length);
    if (!Object.values(tracks).some(t => t.samples.length)) return null;

    const slice = b => bytes.subarray(b.start, b.end);
    const mvhd = find(moovKids, 'mvhd');
    if (!mvhd) return null;
    const mvhdVer = dv.getUint8(mvhd.body);
    const movieTimescale = mvhdVer ? dv.getUint32(mvhd.body + 20) : dv.getUint32(mvhd.body + 12);

    // Lay out the new mdat (all samples, track by track) and remember each track's first-byte offset.
    // We only know absolute chunk offsets after we know the moov size, so build moov first with a
    // placeholder, then patch stco. Simpler: compute moov with offsets relative to mdat, then add the
    // real base once sizes are known.
    const trakBoxes = [];
    const mdatChunks = [];
    let mdatRel = 0;                     // running offset inside mdat payload
    const stcoPatches = [];              // {trakIndex, relOffset}
    let maxDurationSec = 0;

    const originalTraks = moovKids.filter(b => b.type === 'trak');
    for (const trak of originalTraks) {
      const tkKids = children(dv, trak);
      const tkhd = find(tkKids, 'tkhd');
      const trackId = tkhd ? (dv.getUint8(tkhd.body) ? dv.getUint32(tkhd.body + 20) : dv.getUint32(tkhd.body + 12)) : null;
      const samples = tracks[trackId]?.samples || [];
      const mdia = find(tkKids, 'mdia');
      const mdKids = children(dv, mdia);
      const mdhd = find(mdKids, 'mdhd');
      const mdVer = dv.getUint8(mdhd.body);
      const mediaTimescale = mdVer ? dv.getUint32(mdhd.body + 20) : dv.getUint32(mdhd.body + 12);
      const minf = find(mdKids, 'minf');
      const minfKids = children(dv, minf);
      const stbl = find(minfKids, 'stbl');
      const stsd = find(children(dv, stbl), 'stsd');

      const trackDurUnits = samples.reduce((n, s) => n + s.dur, 0);
      maxDurationSec = Math.max(maxDurationSec, mediaTimescale ? trackDurUnits / mediaTimescale : 0);

      // copy this track's sample bytes into the mdat, contiguously
      const chunkStartRel = mdatRel;
      for (const s of samples) { mdatChunks.push(bytes.subarray(s.offset, s.offset + s.size)); mdatRel += s.size; }

      // rebuild mdhd / tkhd with the real media duration; keep everything else verbatim
      const newMdhd = patchDuration(slice(mdhd), mdVer, mdVer ? 24 : 16, trackDurUnits, mdVer);
      const movieTrackDur = movieTimescale && mediaTimescale ? Math.round(trackDurUnits * movieTimescale / mediaTimescale) : trackDurUnits;
      const tkVer = dv.getUint8(tkhd.body);
      const newTkhd = patchDuration(slice(tkhd), tkVer, tkVer ? 28 : 20, movieTrackDur, tkVer);

      const newStbl = buildStbl(slice(stsd), samples, 0); // stco offset patched later
      stcoPatches.push({ trakIndex: trakBoxes.length, relOffset: chunkStartRel });

      const newMinf = box('minf', ...minfKids.map(b => (b.type === 'stbl' ? newStbl : slice(b))));
      const newMdia = box('mdia', ...mdKids.map(b => (b.type === 'mdhd' ? newMdhd : b.type === 'minf' ? newMinf : slice(b))));
      const newTrak = box('trak', ...tkKids.map(b => (b.type === 'tkhd' ? newTkhd : b.type === 'mdia' ? newMdia : slice(b))));
      trakBoxes.push(newTrak);
    }

    // movie duration in mvhd timescale
    const movieDurUnits = Math.round(maxDurationSec * movieTimescale);
    const newMvhd = patchDuration(slice(mvhd), mvhdVer, mvhdVer ? 24 : 16, movieDurUnits, mvhdVer);

    // moov = mvhd + traks (udta etc. kept, mvex dropped)
    const moovParts = [newMvhd, ...trakBoxes, ...moovKids.filter(b => !['mvhd', 'trak', 'mvex'].includes(b.type)).map(slice)];
    let moovBytes = box('moov', ...moovParts);

    // Now the mdat payload offset is known: ftyp + moov + mdat header(8).
    const mdatHeaderOffset = ftyp.end - ftyp.start === 0 ? 0 : (ftyp.end - ftyp.start);
    const ftypBytes = slice(ftyp);
    const base = ftypBytes.length + moovBytes.length + 8; // first byte of mdat payload
    // patch each stco (one entry per track) to base + relOffset
    moovBytes = patchStco(moovBytes, stcoPatches, base);

    const mdatPayload = concat(mdatChunks);
    const mdat = box('mdat', mdatPayload);
    return concat([ftypBytes, moovBytes, mdat]);
  }

  // Copy a full-box and overwrite its 32-bit (or 64-bit) duration field at payload offset `durOff`.
  function patchDuration(boxBytes, version, durOff, value) {
    const out = boxBytes.slice();
    const dv = new DataView(out.buffer, out.byteOffset, out.byteLength);
    const p = 8 + durOff; // 8 = box header
    if (version) dv.setBigUint64(p, BigInt(Math.max(0, Math.round(value)))); else dv.setUint32(p, Math.max(0, Math.round(value)) >>> 0);
    return out;
  }

  // Re-scan the freshly built moov for each track's stco and set its single entry.
  function patchStco(moovBytes, patches, base) {
    const dv = new DataView(moovBytes.buffer, moovBytes.byteOffset, moovBytes.byteLength);
    const stcos = [];
    (function scan(start, end) {
      let p = start;
      while (p + 8 <= end) {
        const size = dv.getUint32(p); const type = str(dv, p + 4);
        if (size < 8 || p + size > end) break;
        if (type === 'stco') stcos.push(p);
        if (['moov', 'trak', 'mdia', 'minf', 'stbl'].includes(type)) scan(p + 8, p + size);
        p += size;
      }
    })(0, moovBytes.length);
    stcos.forEach((p, i) => { const patch = patches[i]; if (patch) dv.setUint32(p + 16, (base + patch.relOffset) >>> 0); });
    return moovBytes;
  }

  return { remux };
});
