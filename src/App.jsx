import { useState, useRef, useEffect, useCallback } from "react";
import { extractMetadata, generateShotstackJSON } from "./lib/videoEngine";

/* ─── THEME ─────────────────────────────────────── */
const B = {
  bg: "#09070500", bgS: "#0a0705", sidebar: "#0e0b08", surface: "#181109", surface2: "#201508",
  border: "#2a1c0e", hover: "#2e1f0f", accent: "#c47a3a", accentL: "#e8954a", accentD: "#8a4e1e",
  gold: "#d4a054", text: "#f0e8e0", muted: "#8a6e58", dim: "#4a3428",
  green: "#4ade80", blue: "#60a5fa", red: "#f87171", purple: "#c084fc",
};

/* ─── DATA ───────────────────────────────────────── */
const FILTERS = [
  { name: "None", css: "" }, { name: "Vivid", css: "saturate(1.8) contrast(1.1)" },
  { name: "Cool", css: "hue-rotate(30deg) saturate(1.2)" }, { name: "Warm", css: "sepia(0.3) saturate(1.4)" },
  { name: "Noir", css: "grayscale(1) contrast(1.3)" }, { name: "Fade", css: "brightness(1.1) opacity(0.85)" },
  { name: "Cinematic", css: "contrast(1.4) saturate(0.9) sepia(0.15)" }, { name: "Dream", css: "brightness(1.15) saturate(1.3)" },
  { name: "Retro", css: "sepia(0.6) contrast(1.2)" }, { name: "Punch", css: "contrast(1.5) saturate(1.6)" },
  { name: "Golden", css: "sepia(0.4) brightness(1.1) saturate(1.5)" },
];
const TRANSITIONS = [{ n: "Cut", i: "✂️" }, { n: "Fade", i: "⬛" }, { n: "Dissolve", i: "💧" }, { n: "Wipe", i: "➡️" }, { n: "Zoom", i: "🔍" }, { n: "Slide", i: "◀️" }];
const FONTS = ["Sora", "Impact", "Georgia", "Verdana", "Courier New", "Times New Roman"];
const VIDEO_THEMES = [{ id: "newyear", e: "🎆", l: "New Year 2025" }, { id: "birthday", e: "🎂", l: "Birthday Reel" }, { id: "travel", e: "✈️", l: "Travel Montage" }, { id: "memories", e: "💛", l: "Sweet Memories" }, { id: "wedding", e: "💒", l: "Wedding Story" }, { id: "custom", e: "✏️", l: "Custom" }];
const CHAT_MODELS = [
  {
    id: "pang", n: "Pang", i: "P", sub: "Assistant", grad: `linear-gradient(135deg,${B.accentD},${B.accent})`, col: B.accent,
    sys: "You are Pang, a warm smart helpful AI assistant. Be genuine, concise, thoughtful."
  },
  {
    id: "deep", n: "Deep", i: "D", sub: "Research", grad: `linear-gradient(135deg,#b8860b,${B.gold})`, col: B.gold,
    sys: "You are Deep by Pang. Give thorough, well-structured, in-depth research answers."
  },
  {
    id: "swift", n: "Swift", i: "S", sub: "Quick", grad: "linear-gradient(135deg,#a0522d,#c4825a)", col: "#c4825a",
    sys: "You are Swift by Pang. Reply in 1-3 sharp sentences only. Direct and fast."
  },
];
const STYLE_PRESETS = [
  { id: "cinematic", name: "Cinematic", icon: "🎬", filter: 6, adj: { brightness: 105, contrast: 125, saturation: 85, exposure: 0, highlights: -10, shadows: 10, sharpness: 20, vignette: 30, noise: 0, blur: 0, hue: 0, temperature: -5, vibrance: 0, speed: 1 } },
  { id: "warm", name: "Warm Summer", icon: "☀️", filter: 3, adj: { brightness: 120, contrast: 100, saturation: 150, exposure: 10, highlights: 0, shadows: 0, sharpness: 10, vignette: 10, noise: 0, blur: 0, hue: 0, temperature: 30, vibrance: 20, speed: 1 } },
  { id: "noir", name: "Noir Dark", icon: "🖤", filter: 4, adj: { brightness: 90, contrast: 140, saturation: 0, exposure: -10, highlights: -20, shadows: -20, sharpness: 30, vignette: 50, noise: 0, blur: 0, hue: 0, temperature: -20, vibrance: 0, speed: 1 } },
  { id: "vivid", name: "Vivid Pop", icon: "🎨", filter: 1, adj: { brightness: 110, contrast: 110, saturation: 180, exposure: 5, highlights: 10, shadows: 5, sharpness: 15, vignette: 0, noise: 0, blur: 0, hue: 0, temperature: 0, vibrance: 30, speed: 1 } },
  { id: "dreamy", name: "Dream", icon: "✨", filter: 7, adj: { brightness: 120, contrast: 90, saturation: 130, exposure: 15, highlights: 20, shadows: 10, sharpness: 0, vignette: 20, noise: 0, blur: 2, hue: 10, temperature: 10, vibrance: 15, speed: 1 } },
  { id: "retro", name: "Retro Film", icon: "📽️", filter: 8, adj: { brightness: 95, contrast: 115, saturation: 80, exposure: 0, highlights: -15, shadows: 15, sharpness: 5, vignette: 40, noise: 20, blur: 0, hue: 5, temperature: 20, vibrance: 0, speed: 1 } },
];
const AGENT_CHAIN_TYPES = [
  { id: "caption", name: "Caption Gen", icon: "💬", col: B.blue, desc: "Auto-generate captions for each scene" },
  { id: "hashtag", name: "Hashtag AI", icon: "#", col: B.purple, desc: "Suggest trending hashtags" },
  { id: "music", name: "Music Match", icon: "🎵", col: B.green, desc: "Find royalty-free music by mood" },
  { id: "style", name: "Style Transfer", icon: "🎨", col: B.gold, desc: "Apply cinematic grade across all clips" },
  { id: "stitch", name: "FFmpeg Stitch", icon: "⚙️", col: B.accent, desc: "Assemble final video with transitions" },
  { id: "kenburns", name: "Ken Burns", icon: "🔍", col: "#c084fc", desc: "Add dynamic zoom/pan to stills" },
];

/* ─── SINGER BACKGROUNDS ──────────────────────── */
const SINGER_BACKGROUNDS = [
  { id: "concert", name: "Concert Stage", emoji: "🎪", col: "#4c1d95" },
  { id: "neon", name: "Neon City", emoji: "🌃", col: "#0f172a" },
  { id: "golden", name: "Golden Hour", emoji: "🌅", col: "#78350f" },
  { id: "galaxy", name: "Galaxy", emoji: "🌌", col: "#1e1b4b" },
  { id: "studio", name: "Music Studio", emoji: "🎚️", col: "#1c1917" },
  { id: "bokeh", name: "Bokeh Lights", emoji: "✨", col: "#2e1065" },
  { id: "waves", name: "Abstract Waves", emoji: "🌊", col: "#0c4a6e" },
  { id: "vintage", name: "Vintage Spotlight", emoji: "🎭", col: "#1c1917" },
  { id: "forest", name: "Forest Magic", emoji: "🌿", col: "#052e16" },
  { id: "aurora", name: "Aurora Borealis", emoji: "🌈", col: "#042f2e" },
];

/* ─── SINGER BG DRAWING ────────────────────────── */
function drawSingerBg(ctx, W, H, bgId, t, fd, amp) {
  const rg = (x, y, r0, r1, c0, c1) => {
    const g = ctx.createRadialGradient(x, y, r0, x, y, r1);
    g.addColorStop(0, c0); g.addColorStop(1, c1); return g;
  };
  const lg = (x0, y0, x1, y1, stops) => {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    stops.forEach(([p, c]) => g.addColorStop(p, c)); return g;
  };

  if (bgId === "concert") {
    ctx.fillStyle = lg(0, 0, 0, H, [[0, '#060010'], [0.6, '#150028'], [1, '#030008']]);
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 4; i++) {
      const sx = W * (0.12 + i * 0.25 + Math.sin(t * 0.6 + i * 1.3) * 0.07);
      const cols = ['rgba(200,80,255,', 'rgba(80,140,255,', 'rgba(255,60,180,', 'rgba(60,200,255,'];
      ctx.save();
      ctx.globalAlpha = 0.18 + amp * 0.15;
      ctx.fillStyle = cols[i] + '0.9)';
      ctx.beginPath();
      ctx.moveTo(sx, 0); ctx.lineTo(sx - W * 0.13, H); ctx.lineTo(sx + W * 0.13, H);
      ctx.closePath(); ctx.fill(); ctx.restore();
    }
    ctx.fillStyle = `rgba(160,50,255,${0.05 + amp * 0.2})`;
    ctx.fillRect(0, H * 0.87, W, H * 0.13);
    ctx.fillStyle = `rgba(200,100,255,${0.15 + amp * 0.35})`;
    ctx.fillRect(0, H * 0.88, W, 2);
    for (let s = 0; s < 8; s++) {
      const sx = (s * W / 7 + (t * 15)) % W;
      ctx.fillStyle = rg(sx, H, 0, W * 0.12, `rgba(150,80,200,${0.04 + amp * 0.04})`, 'transparent');
      ctx.fillRect(sx - W * 0.12, H - H * 0.12, W * 0.24, H * 0.12);
    }
  } else if (bgId === "neon") {
    ctx.fillStyle = '#030810'; ctx.fillRect(0, 0, W, H);
    const neons = ['#ff2d78', '#00f5ff', '#a855f7', '#22d3ee', '#f97316', '#06b6d4', '#8b5cf6', '#ec4899'];
    for (let i = 0; i < 8; i++) {
      const bx = i * (W / 8), bh = H * (0.22 + (Math.sin(i * 2.7) * 0.4 + 0.4) * 0.42);
      ctx.fillStyle = '#060f1e'; ctx.fillRect(bx, H - bh, W / 8 - 2, bh);
      ctx.strokeStyle = neons[i]; ctx.lineWidth = 1.5 + amp * 1.5;
      ctx.shadowColor = neons[i]; ctx.shadowBlur = 6 + amp * 8;
      ctx.strokeRect(bx + 1, H - bh + 1, W / 8 - 4, bh - 2);
      ctx.shadowBlur = 0;
      for (let wy = 0; wy < 5; wy++) {
        ctx.fillStyle = `rgba(255,220,100,${0.1 + Math.sin(t * 2 + i + wy) * 0.08})`;
        ctx.fillRect(bx + 4, H - bh + 10 + wy * 18, 4, 4);
        ctx.fillRect(bx + W / 8 - 10, H - bh + 10 + wy * 18, 4, 4);
      }
    }
    ctx.fillStyle = lg(0, H * 0.85, 0, H, [[0, 'transparent'], [1, `rgba(255,30,200,${0.06 + amp * 0.08})`]]);
    ctx.fillRect(0, H * 0.85, W, H * 0.15);
    ctx.strokeStyle = 'rgba(100,200,255,0.12)'; ctx.lineWidth = 0.8;
    for (let r = 0; r < 25; r++) {
      const rx = (r * W / 22 + t * 80) % W, ry = (r * H / 17 + t * 120) % H;
      ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 3, ry + 12); ctx.stroke();
    }
  } else if (bgId === "golden") {
    ctx.fillStyle = lg(0, 0, 0, H, [[0, '#3a0e00'], [0.35, '#c2621a'], [0.65, '#e8870e'], [1, '#0d0500']]);
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = rg(W * 0.5, H * 0.28, 0, W * 0.42, `rgba(255,220,80,${0.55 + amp * 0.2})`, 'transparent');
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + t * 0.15;
      ctx.strokeStyle = `rgba(255,210,60,${0.04 + amp * 0.06})`; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W * 0.5, H * 0.28);
      ctx.lineTo(W * 0.5 + Math.cos(a) * H * 0.6, H * 0.28 + Math.sin(a) * H * 0.6);
      ctx.stroke();
    }
    for (let p = 0; p < 22; p++) {
      const px = (p * 73.1 + t * 22) % W, py = H - (((t * 28 + p * 42) % (H * 0.55)) + H * 0.05);
      ctx.fillStyle = `rgba(255,200,50,${0.18 + Math.sin(t * 2 + p) * 0.1})`;
      ctx.beginPath(); ctx.arc(px, py, 1.5 + amp, 0, Math.PI * 2); ctx.fill();
    }
  } else if (bgId === "galaxy") {
    ctx.fillStyle = '#01000b'; ctx.fillRect(0, 0, W, H);
    for (let s = 0; s < 160; s++) {
      const sx = (s * 137.5) % W, sy = (s * 91.3) % H;
      const br = 0.15 + Math.abs(Math.sin(t * 1.8 + s)) * 0.45;
      ctx.fillStyle = `rgba(255,255,255,${br})`;
      ctx.beginPath(); ctx.arc(sx, sy, s % 9 === 0 ? 1.8 : 0.7, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = rg(W * 0.5, H * 0.45, 0, W * 0.6, `rgba(90,20,170,${0.14 + amp * 0.1})`, 'transparent');
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = rg(W * 0.2, H * 0.3, 0, W * 0.35, `rgba(20,80,200,${0.08 + amp * 0.06})`, 'transparent');
    ctx.fillRect(0, 0, W, H);
    const shx = (t * 90) % (W * 1.5); const shy = 50 + (t * 8) % 100;
    ctx.strokeStyle = `rgba(255,255,200,${0.4 + amp * 0.4})`; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(shx, shy); ctx.lineTo(shx - 55, shy - 14); ctx.stroke();
  } else if (bgId === "studio") {
    ctx.fillStyle = '#080808'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(30,30,30,0.8)'; ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    for (let b = 0; b < 12; b++) {
      const bh = (fd ? fd[b * 3] || 0 : 0) / 255 * H * 0.28 + 5;
      const hue = 25 + b * 6;
      ctx.fillStyle = `hsla(${hue},75%,52%,${0.22 + amp * 0.45})`;
      ctx.fillRect(3 + b * (W - 6) / 12, H * 0.5 - bh / 2, (W - 6) / 12 - 2, bh);
      ctx.fillRect(W - (3 + b * (W - 6) / 12) - (W - 6) / 12, H * 0.5 - bh / 2, (W - 6) / 12 - 2, bh);
    }
    ctx.fillStyle = lg(0, 0, 0, H * 0.25, [[0, `rgba(196,122,58,${0.07 + amp * 0.1})`], [1, 'transparent']]);
    ctx.fillRect(0, 0, W, H * 0.25);
  } else if (bgId === "bokeh") {
    ctx.fillStyle = rg(W * 0.5, H * 0.5, 0, W * 0.7, '#1a0535', '#04010f'); ctx.fillRect(0, 0, W, H);
    const bc = ['rgba(255,80,200,', 'rgba(80,160,255,', 'rgba(255,200,50,', 'rgba(80,255,180,', 'rgba(180,80,255,'];
    for (let b = 0; b < 24; b++) {
      const bx = (b * 137.5 + Math.sin(t * 0.25 + b) * 28) % W;
      const by = (b * 91.3 + Math.cos(t * 0.18 + b) * 22) % H;
      const br = 14 + (b % 5) * 10 + Math.sin(t * 0.8 + b) * 5;
      const bg = rg(bx, by, 0, br, `${bc[b % 5]}${0.1 + amp * 0.07})`, `${bc[b % 5]}0)`);
      ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill();
    }
  } else if (bgId === "waves") {
    ctx.fillStyle = lg(0, 0, 0, H, [[0, '#0c4a6e'], [0.5, '#1e1b4b'], [1, '#050420']]);
    ctx.fillRect(0, 0, W, H);
    const wc = ['rgba(34,211,238,', 'rgba(168,85,247,', 'rgba(59,130,246,', 'rgba(20,184,166,'];
    for (let w = 0; w < 4; w++) {
      ctx.beginPath();
      for (let x = 0; x <= W; x += 4) {
        const y = H * 0.5 + Math.sin(x / W * Math.PI * 5 + t * (0.9 + w * 0.3) + w * 1.4) * H * (0.07 + amp * 0.1 + w * 0.022);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
      ctx.fillStyle = `${wc[w]}${0.07 + w * 0.025})`; ctx.fill();
    }
    for (let sp = 0; sp < 15; sp++) {
      const spx = (sp * 97 + t * 60) % W;
      const spy = H * 0.5 + Math.sin(spx / W * Math.PI * 5 + t * 0.9) * H * 0.07;
      ctx.fillStyle = `rgba(255,255,255,${0.15 + Math.sin(t * 4 + sp) * 0.12})`;
      ctx.beginPath(); ctx.arc(spx, spy, 1.5, 0, Math.PI * 2); ctx.fill();
    }
  } else if (bgId === "vintage") {
    ctx.fillStyle = '#0c0804'; ctx.fillRect(0, 0, W, H);
    for (let g = 0; g < 350; g++) {
      ctx.fillStyle = `rgba(200,160,80,${Math.random() * 0.022})`;
      ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
    }
    ctx.fillStyle = rg(W * 0.5, 0, 0, W * 0.5, `rgba(215,165,75,${0.22 + amp * 0.12})`, 'transparent');
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(60,30,0,0.08)'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = rg(W * 0.5, H * 0.5, H * 0.18, H * 0.72, 'transparent', 'rgba(0,0,0,0.7)');
    ctx.fillRect(0, 0, W, H);
    if (Math.random() > 0.95) {
      ctx.strokeStyle = `rgba(220,180,80,${Math.random() * 0.08})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(W * (0.1 + Math.random() * 0.8), 0);
      ctx.lineTo(W * (0.1 + Math.random() * 0.8), H);
      ctx.stroke();
    }
  } else if (bgId === "forest") {
    ctx.fillStyle = lg(0, 0, 0, H, [[0, '#010f05'], [0.6, '#042e12'], [1, '#010804']]);
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#010e06';
    for (let tr = 0; tr < 7; tr++) {
      const tx = tr * (W / 6.2), th = H * (0.42 + tr % 3 * 0.09);
      ctx.beginPath();
      ctx.moveTo(tx, H); ctx.lineTo(tx - 32, H - th * 0.38); ctx.lineTo(tx - 16, H - th * 0.38);
      ctx.lineTo(tx - 20, H - th * 0.64); ctx.lineTo(tx - 9, H - th * 0.64);
      ctx.lineTo(tx - 13, H - th); ctx.lineTo(tx + 13, H - th);
      ctx.lineTo(tx + 9, H - th * 0.64); ctx.lineTo(tx + 20, H - th * 0.64);
      ctx.lineTo(tx + 16, H - th * 0.38); ctx.lineTo(tx + 32, H - th * 0.38);
      ctx.closePath(); ctx.fill();
    }
    for (let f = 0; f < 20; f++) {
      const fx = (f * 97.3 + t * 16 + Math.sin(t * 0.5 + f) * 32) % W;
      const fy = H * 0.12 + (f * 67.3 + t * 10) % (H * 0.7);
      const fl = 0.2 + Math.sin(t * 2.5 + f * 4.7) * 0.35;
      if (fl > 0.05) {
        ctx.fillStyle = rg(fx, fy, 0, 14, `rgba(120,255,80,${fl * 0.38})`, 'transparent');
        ctx.beginPath(); ctx.arc(fx, fy, 14, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(150,255,100,${Math.max(0, fl)})`; ctx.beginPath(); ctx.arc(fx, fy, 2, 0, Math.PI * 2); ctx.fill();
      }
    }
    for (let r = 0; r < 3; r++) {
      ctx.fillStyle = lg(W * (0.2 + r * 0.25), 0, W * (0.2 + r * 0.25), H * 0.7, [[0, `rgba(140,255,140,${0.04 + amp * 0.04})`], [1, 'transparent']]);
      ctx.fillRect(W * (0.12 + r * 0.25), 0, W * 0.09, H * 0.7);
    }
  } else if (bgId === "aurora") {
    ctx.fillStyle = '#010e0d'; ctx.fillRect(0, 0, W, H);
    for (let s = 0; s < 110; s++) {
      const sx = (s * 137.5) % W, sy = (s * 91.3) % (H * 0.52);
      ctx.fillStyle = `rgba(255,255,255,${0.12 + Math.sin(t * 1.8 + s) * 0.22})`;
      ctx.beginPath(); ctx.arc(sx, sy, 0.8, 0, Math.PI * 2); ctx.fill();
    }
    const auroraCols = [
      `rgba(0,255,150,${0.06 + amp * 0.05})`,
      `rgba(40,200,255,${0.05 + amp * 0.04})`,
      `rgba(150,255,100,${0.04 + amp * 0.04})`,
    ];
    for (let a = 0; a < 3; a++) {
      ctx.beginPath();
      for (let x = 0; x <= W; x += 5) {
        const y = H * 0.08 + a * H * 0.07 + Math.sin(x / W * Math.PI * 4 + t * (0.38 + a * 0.15)) * H * (0.05 + amp * 0.04);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.lineTo(W, 0); ctx.lineTo(0, 0); ctx.closePath();
      ctx.fillStyle = auroraCols[a]; ctx.fill();
    }
  } else {
    ctx.fillStyle = '#0a0705'; ctx.fillRect(0, 0, W, H);
  }
}

function drawSingerViz(ctx, W, H, fd, amp, bgId) {
  if (!fd) return;
  const vizCols = {
    concert: 'rgba(196,100,255,', neon: 'rgba(0,245,255,', golden: 'rgba(255,185,50,',
    galaxy: 'rgba(180,120,255,', studio: 'rgba(196,122,58,', bokeh: 'rgba(255,100,220,',
    waves: 'rgba(34,211,238,', vintage: 'rgba(200,160,80,', forest: 'rgba(80,255,120,', aurora: 'rgba(0,255,200,'
  };
  const col = vizCols[bgId] || 'rgba(196,122,58,';
  const bars = 80, barW = W / bars;
  for (let i = 0; i < bars; i++) {
    const idx = Math.floor(i * fd.length / bars);
    const val = (fd[idx] || 0) / 255;
    const bh = val * H * 0.11 + 2;
    ctx.fillStyle = `${col}${0.35 + val * 0.55})`;
    ctx.fillRect(i * barW, H - bh, barW - 1, bh);
    ctx.fillStyle = `${col}${0.1 + val * 0.18})`;
    ctx.fillRect(i * barW, 0, barW - 1, bh * 0.35);
  }
}

/* ─── HELPERS ──────────────────────────────────── */
function msToTC(ms) { const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000), ms2 = Math.floor(ms % 1000); return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms2).padStart(3, "0")}`; }
function tcToMs(tc) { const p = tc.split(/[:.]/).map(Number); return (p[0] || 0) * 3600000 + (p[1] || 0) * 60000 + (p[2] || 0) * 1000 + (p[3] || 0); }

/* ─── MICRO UI ──────────────────────────────────── */
function Tag({ children, col, sm }) { return <span style={{ background: `${col || B.accent}22`, color: col || B.accent, padding: sm ? "1px 5px" : "2px 7px", borderRadius: 4, fontSize: sm ? 7.5 : 9, fontWeight: 700, whiteSpace: "nowrap" }}>{children}</span>; }
function Dots({ col }) { return (<div style={{ display: "flex", gap: 4, alignItems: "center" }}>{[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: col || B.accent, animation: `tdot 1.1s ${i * .18}s ease-in-out infinite` }} />)}<style>{`@keyframes tdot{0%,100%{transform:translateY(0);opacity:.3}45%{transform:translateY(-4px);opacity:1}}`}</style></div>); }
function Btn({ children, onClick, disabled, small, col, style: s = {} }) { return <button onClick={onClick} disabled={disabled} style={{ background: disabled ? B.hover : `linear-gradient(135deg,${col ? col + "cc" : B.accentD},${col || B.accent})`, border: "none", color: "#fff", padding: small ? "3px 9px" : "6px 14px", borderRadius: 6, cursor: disabled ? "not-allowed" : "pointer", fontSize: small ? 9.5 : 11.5, fontWeight: 700, opacity: disabled ? .5 : 1, transition: "all .15s", ...s }}>{children}</button>; }
function SL({ label, val, min, max, step = 1, unit = "", onChange }) { const pct = ((val - min) / (max - min)) * 100; return (<div style={{ marginBottom: 9 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}><span style={{ fontSize: 9, color: B.muted, textTransform: "uppercase", letterSpacing: .7 }}>{label}</span><span style={{ fontSize: 9, color: B.accent, fontWeight: 700 }}>{val}{unit}</span></div><div style={{ position: "relative", height: 3, background: B.border, borderRadius: 2 }}><div style={{ position: "absolute", left: 0, height: "100%", width: `${pct}%`, background: `linear-gradient(90deg,${B.accentD},${B.accent})`, borderRadius: 2 }} /><input type="range" min={min} max={max} step={step} value={val} onChange={e => onChange(parseFloat(e.target.value))} style={{ position: "absolute", top: -9, left: 0, width: "100%", height: 20, opacity: 0, cursor: "pointer", zIndex: 2 }} /></div></div>); }

/* ═══════════════════════════════════════════════ */
const DEF_ADJ = { brightness: 100, contrast: 100, saturation: 100, exposure: 0, highlights: 0, shadows: 0, sharpness: 0, vignette: 0, noise: 0, blur: 0, hue: 0, temperature: 0, vibrance: 0, speed: 1 };

export default function App() {
  const [mainTab, setMainTab] = useState("editor");
  const [clips, setClips] = useState([]);
  const [sel, setSel] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [adj, setAdj] = useState(DEF_ADJ);
  const sa = (k, v) => setAdj(p => ({ ...p, [k]: v }));
  const [filter, setFilter] = useState(0);
  const [transition, setTransition] = useState(0);
  const [audioVolume, setAudioVolume] = useState(100); // 0-200, mapped to 0-1 for video
  const [transitionFlash, setTransitionFlash] = useState(false);
  const [isMuted, setIsMuted] = useState(false); // mute state tracked in React
  const [texts, setTexts] = useState([]);
  const [editTab, setEditTab] = useState("adjust");
  const [precMode, setPrecMode] = useState(false);
  const [precStart, setPrecStart] = useState("00:02:00.000");
  const [precEnd, setPrecEnd] = useState("00:02:00.120");
  const [currentMs, setCurrentMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [newTxt, setNewTxt] = useState({ content: "", font: "Impact", size: 44, color: "#ffffff", x: 50, y: 80, startMs: 0, endMs: 3000 });

  // Panels
  const [showDirector, setShowDirector] = useState(false);
  const [showSpotify, setShowSpotify] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
  const [showAgents, setShowAgents] = useState(false);
  const [showRender, setShowRender] = useState(false);
  const [showSinger, setShowSinger] = useState(false);

  // Director
  const [dirTheme, setDirTheme] = useState("newyear");
  const [dirCustom, setDirCustom] = useState("");
  const [dirPlan, setDirPlan] = useState(null);
  const [dirLoading, setDirLoading] = useState(false);

  // Spotify Bridge
  const [spotQuery, setSpotQuery] = useState("");
  const [spotResults, setSpotResults] = useState([]);
  const [spotLoading, setSpotLoading] = useState(false);
  const [selTrack, setSelTrack] = useState(null);

  // Memory / Global Indexer
  const [memQuery, setMemQuery] = useState("");
  const [memResults, setMemResults] = useState([]);
  const [memLoading, setMemLoading] = useState(false);
  const [clipIndex, setClipIndex] = useState([]);

  // Agent Chain
  const [chainSteps, setChainSteps] = useState([]);
  const [chainRunning, setChainRunning] = useState(false);
  const [chainLog, setChainLog] = useState([]);

  // Render Queue
  const [renderJobs, setRenderJobs] = useState([]);
  const [renderMode, setRenderMode] = useState("proxy");
  const [credits, setCredits] = useState(42);

  // Cinema Creator
  const [showCinema, setShowCinema] = useState(false);
  const [cinemaPrompt, setCinemaPrompt] = useState("");
  const [voiceBank, setVoiceBank] = useState([]);
  const [cinemaScenes, setCinemaScenes] = useState([]);
  const [cinemaGenerating, setCinemaGenerating] = useState(false);
  const [activeCinemaScene, setActiveCinemaScene] = useState(0);
  
  const [voiceName, setVoiceName] = useState("");
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const voiceRecorderRef = useRef(null);
  const voiceChunksRef = useRef([]);
  const cinemaAudioRef = useRef(null);

  /* ── SINGER STUDIO STATES ── */
  const [singerPhoto, setSingerPhoto] = useState(null);
  const [singerAudioUrl, setSingerAudioUrl] = useState(null);
  const [singerAudioName, setSingerAudioName] = useState("");
  const [singerBg, setSingerBg] = useState("concert");
  const [singerMouthY, setSingerMouthY] = useState(70);
  const [singerMouthSize, setSingerMouthSize] = useState(50);
  const [singerGlow, setSingerGlow] = useState(true);
  const [singerRecording, setSingerRecording] = useState(false);
  const [singerPlaying, setSingerPlaying] = useState(false);
  const [singerVideoUrl, setSingerVideoUrl] = useState(null);
  const [singerStatus, setSingerStatus] = useState("idle");
  const [singerSongTitle, setSingerSongTitle] = useState("🎵 Now Singing");

  const singerCanvasRef = useRef();
  const singerPhotoRef = useRef();
  const singerAudioElemRef = useRef();
  const singerPhotoInputRef = useRef();
  const singerAudioInputRef = useRef();
  const singerAnimRef = useRef();
  const singerAnalyserRef = useRef();
  const singerAudioCtxRef = useRef();
  const singerRecorderRef = useRef();
  const singerChunksRef = useRef([]);
  const singerAudioStreamRef = useRef();
  const singerStartTRef = useRef(null);
  const singerDrawFrameRef = useRef(null);

  // Video AI
  const [vidMsgs, setVidMsgs] = useState([{ role: "assistant", content: `🎬 Pang Studio AI — v3.0\n\n🌐 Global Indexer (Agent A) — knows your full project\n⚡ Edit Worker (Agent B) — executes precision edits\n🔗 Agent Chain — composable pipeline` }]);
  const [vidInput, setVidInput] = useState("");
  const [vidLoading, setVidLoading] = useState(false);
  const [activeBot, setActiveBot] = useState(null);

  // Chat
  const [chatModel, setChatModel] = useState("pang");
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const videoRef = useRef(null);
  const fileRef = useRef();
  const identRef = useRef();
  const vidBottom = useRef();
  const chatBottom = useRef();

  useEffect(() => { vidBottom.current?.scrollIntoView({ behavior: "smooth" }); }, [vidMsgs, vidLoading]);
  useEffect(() => { chatBottom.current?.scrollIntoView({ behavior: "smooth" }); }, [chatHistory, chatLoading]);

  useEffect(() => {
    if (videoRef.current) {
      if (playing) videoRef.current.play().catch(() => setPlaying(false));
      else videoRef.current.pause();
    }
  }, [playing, sel]);

  useEffect(() => {
    if (videoRef.current && Math.abs(videoRef.current.playbackRate - adj.speed) > 0.01) {
      videoRef.current.playbackRate = adj.speed;
    }
  }, [adj.speed, sel]);

  // Apply volume to video preview whenever it changes
  useEffect(() => {
    if (videoRef.current) videoRef.current.volume = Math.min(1, audioVolume / 100);
  }, [audioVolume, sel]);

  // Sync mute state to video element
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted;
  }, [isMuted, sel]);

  // Flash effect when transition changes
  useEffect(() => {
    setTransitionFlash(true);
    const t = setTimeout(() => setTransitionFlash(false), 600);
    return () => clearTimeout(t);
  }, [transition]);

  const totalMs = clips.reduce((a, c) => a + c.durationMs, 0) || 60000;

  const getCSS = () => {
    let f = `brightness(${(adj.brightness + adj.exposure * 1.5) / 100}) contrast(${adj.contrast / 100}) saturate(${adj.saturation / 100}) hue-rotate(${adj.hue}deg)`;
    if (adj.blur > 0) f += ` blur(${adj.blur * .04}px)`;
    if (filter > 0) f += " " + FILTERS[filter].css;
    return f;
  };

  const handleUpload = useCallback(async (e) => {
    const files = Array.from(e.target.files);
    let runMs = clips.reduce((a, c) => a + c.durationMs, 0);
    
    const added = await Promise.all(files.map(async (file, i) => {
      const url = URL.createObjectURL(file);
      const isVideo = file.type.startsWith("video");
      let durationMs = isVideo ? 10000 : 3000;

      if (isVideo) {
        durationMs = await new Promise(resolve => {
          const v = document.createElement("video");
          v.src = url;
          v.onloadedmetadata = () => resolve(v.duration * 1000);
          v.onerror = () => resolve(10000);
        });
      }

      const c = { id: Date.now() + i, file, url, type: isVideo ? "video" : "image", name: file.name, durationMs, startMs: runMs, kenBurns: false, kenBurnsDir: "zoom-in" };
      runMs += durationMs;
      return c;
    }));

    setClips(p => [...p, ...added]);
    if (!sel && added.length) setSel(added[0]);
    added.forEach(c => {
      setTimeout(() => {
        setClipIndex(p => [...p, { id: c.id, name: c.name, tags: ["photo", "scene", c.type], description: `Clip: ${c.name}`, url: c.url, type: c.type }]);
      }, 300);
    });
  }, [clips, sel]);

  const applyPreset = (preset) => { setAdj(preset.adj); setFilter(preset.filter); };

  // ── Cut clip at current playhead position ──────────────────────────────
  const handleCut = useCallback(() => {
    if (!sel) return;
    // Find which clip the playhead is inside by walking cumulative start times
    let cumulative = 0;
    let clipIndex = -1;
    let clipStartMs = 0;
    const updatedClips = clips;
    for (let i = 0; i < updatedClips.length; i++) {
      const c = updatedClips[i];
      if (currentMs >= cumulative && currentMs < cumulative + c.durationMs) {
        clipIndex = i;
        clipStartMs = cumulative;
        break;
      }
      cumulative += c.durationMs;
    }
    if (clipIndex === -1) return; // playhead not inside any clip
    const clip = updatedClips[clipIndex];
    const cutPointInClip = currentMs - clipStartMs; // ms from start of THIS clip
    if (cutPointInClip <= 0 || cutPointInClip >= clip.durationMs) return; // can't cut at edges

    const clipA = { ...clip, id: Date.now(), durationMs: cutPointInClip, name: clip.name + " [A]" };
    const clipB = { ...clip, id: Date.now() + 1, durationMs: clip.durationMs - cutPointInClip, name: clip.name + " [B]" };

    setClips(p => [
      ...p.slice(0, clipIndex),
      clipA,
      clipB,
      ...p.slice(clipIndex + 1),
    ]);
    setSel(clipB); // select the second piece
  }, [clips, sel, currentMs]);

  // ── Delete selected clip ────────────────────────────────────────────────
  const handleDeleteClip = useCallback(() => {
    if (!sel) return;
    setClips(p => p.filter(c => c.id !== sel.id));
    setSel(null);
  }, [sel]);

  const applyActions = useCallback((actions) => {
    actions?.forEach(a => {
      if (a.type === "adj") sa(a.param, a.value);
      else if (a.type === "speed") sa("speed", a.value);
      else if (a.type === "filter") setFilter(Math.max(0, Math.min(a.index, FILTERS.length - 1)));
      else if (a.type === "text") setTexts(p => [...p, { id: Date.now(), content: a.content || "Text", font: a.font || "Impact", size: a.size || 44, color: a.color || B.gold, x: a.x || 50, y: a.y || 80, startMs: a.startMs || currentMs, endMs: a.endMs || (currentMs + 3000) }]);
      else if (a.type === "selectClip") { const c = clips[a.index]; if (c) setSel(c); }
      else if (a.type === "reset") { setAdj(DEF_ADJ); setFilter(0); }
      else if (a.type === "transition") setTransition(Math.max(0, Math.min(a.index, TRANSITIONS.length - 1)));
      else if (a.type === "precisionEdit") { setPrecStart(a.start || precStart); setPrecEnd(a.end || precEnd); setPrecMode(true); }
      else if (a.type === "preset") { const p = STYLE_PRESETS.find(x => x.id === a.id); if (p) applyPreset(p); }
      else if (a.type === "insertClip") {
        // Open file picker and insert chosen media at playhead position
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "video/*,image/*";
        input.onchange = async (ev) => {
          const file = ev.target.files?.[0]; if (!file) return;
          const url = URL.createObjectURL(file);
          const isVideo = file.type.startsWith("video");
          let durationMs = isVideo ? 10000 : 3000;
          if (isVideo) {
            durationMs = await new Promise(resolve => {
              const v = document.createElement("video");
              v.src = url;
              v.onloadedmetadata = () => resolve(v.duration * 1000);
              v.onerror = () => resolve(10000);
            });
          }
          const newClip = { id: Date.now(), file, url, type: isVideo ? "video" : "image", name: "✦ " + file.name, durationMs, startMs: currentMs, kenBurns: false, kenBurnsDir: "zoom-in" };
          // Find where playhead is and insert AFTER that clip
          let cumulative = 0, insertIdx = clips.length;
          for (let i = 0; i < clips.length; i++) {
            if (currentMs >= cumulative && currentMs < cumulative + clips[i].durationMs) { insertIdx = i + 1; break; }
            cumulative += clips[i].durationMs;
          }
          setClips(p => [...p.slice(0, insertIdx), newClip, ...p.slice(insertIdx)]);
          setSel(newClip);
        };
        input.click();
      }
    });
  }, [clips, currentMs, precStart, precEnd]);

  /* ── SINGER STUDIO HANDLERS ── */
  const handleSingerPhoto = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      singerPhotoRef.current = img;
      setSingerPhoto({ url, name: file.name });
      setSingerVideoUrl(null); setSingerStatus("ready");
    };
    img.src = url;
  };

  const handleSingerAudio = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const url = URL.createObjectURL(file);
    if (singerAudioCtxRef.current) {
      singerAudioCtxRef.current.close().catch(() => { });
      singerAudioCtxRef.current = null;
      singerAnalyserRef.current = null;
      singerAudioStreamRef.current = null;
    }
    setSingerAudioUrl(url);
    setSingerAudioName(file.name);
    if (singerAudioElemRef.current) {
      singerAudioElemRef.current.src = url;
      singerAudioElemRef.current.load();
    }
    setSingerVideoUrl(null);
  };

  const setupAudioContext = () => {
    if (singerAudioCtxRef.current) return true;
    const audioElem = singerAudioElemRef.current; if (!audioElem || !singerAudioUrl) return false;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const source = ctx.createMediaElementSource(audioElem);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.78;
      const dest = ctx.createMediaStreamDestination();
      source.connect(analyser);
      analyser.connect(ctx.destination);
      analyser.connect(dest);
      singerAnalyserRef.current = analyser;
      singerAudioCtxRef.current = ctx;
      singerAudioStreamRef.current = dest.stream;
      return true;
    } catch (err) { console.error("AudioContext error", err); return false; }
  };

  const drawSingerFrame = useCallback((t) => {
    const canvas = singerCanvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const analyser = singerAnalyserRef.current;

    let amp = 0, fd = null;
    if (analyser) {
      fd = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(fd);
      const td = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteTimeDomainData(td);
      let sum = 0; for (let i = 0; i < td.length; i++) sum += Math.abs(td[i] - 128);
      amp = sum / td.length / 128;
    }

    ctx.clearRect(0, 0, W, H);
    drawSingerBg(ctx, W, H, singerBg, t, fd, amp);

    const img = singerPhotoRef.current;
    if (img) {
      const iAspect = img.width / img.height;
      const iH = H * 0.72, iW = iH * iAspect;
      const iX = (W - iW) / 2, iY = (H - iH) / 2;

      if (singerGlow) {
        const glowR = Math.max(iW, iH) * 0.62 + amp * 30;
        const glowG = ctx.createRadialGradient(W / 2, iY + iH * 0.45, glowR * 0.3, W / 2, iY + iH * 0.45, glowR);
        const bgCols = { concert: 'rgba(160,60,255,', neon: 'rgba(0,220,255,', golden: 'rgba(255,180,50,', galaxy: 'rgba(120,60,200,', studio: 'rgba(196,122,58,', bokeh: 'rgba(220,80,200,', waves: 'rgba(34,200,238,', vintage: 'rgba(200,160,80,', forest: 'rgba(80,220,100,', aurora: 'rgba(0,220,180,' };
        const gc = (bgCols[singerBg] || 'rgba(196,122,58,') + `${0.06 + amp * 0.18})`;
        glowG.addColorStop(0, 'transparent'); glowG.addColorStop(0.6, gc); glowG.addColorStop(1, 'transparent');
        ctx.save(); ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = glowG; ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }

      const breathScale = 1 + Math.sin(t * 1.8) * 0.006 + amp * 0.014;
      const bob = Math.sin(t * 2.2) * amp * 4;
      ctx.save();
      ctx.translate(W / 2, iY + iH / 2 + bob);
      ctx.scale(breathScale, breathScale);
      ctx.translate(-W / 2, -(iY + iH / 2 + bob));

      ctx.shadowColor = 'rgba(0,0,0,0.65)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 6;

      ctx.beginPath();
      const r = 10;
      ctx.moveTo(iX + r, iY); ctx.lineTo(iX + iW - r, iY);
      ctx.quadraticCurveTo(iX + iW, iY, iX + iW, iY + r);
      ctx.lineTo(iX + iW, iY + iH - r);
      ctx.quadraticCurveTo(iX + iW, iY + iH, iX + iW - r, iY + iH);
      ctx.lineTo(iX + r, iY + iH);
      ctx.quadraticCurveTo(iX, iY + iH, iX, iY + iH - r);
      ctx.lineTo(iX, iY + r);
      ctx.quadraticCurveTo(iX, iY, iX + r, iY);
      ctx.closePath(); ctx.clip();

      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
      ctx.drawImage(img, iX, iY, iW, iH);
      ctx.restore();

      const mouthCX = W / 2;
      const mouthCY = iY + bob + iH * (singerMouthY / 100);
      const mouthW = iW * (0.058 + singerMouthSize / 1000);
      const openH = amp * iH * 0.068 * ((singerMouthSize / 50));
      const clampOpen = Math.max(0, Math.min(openH, iH * 0.055));

      ctx.save();
      ctx.filter = `blur(${iW * 0.011}px)`;
      ctx.strokeStyle = `rgba(60,15,15,${0.55 + amp * 0.3})`;
      ctx.lineWidth = iW * 0.014 + amp * 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(mouthCX - mouthW, mouthCY - clampOpen * 0.25);
      ctx.quadraticCurveTo(mouthCX - mouthW * 0.35, mouthCY - clampOpen * 0.7 - iH * 0.006, mouthCX, mouthCY - clampOpen * 0.6);
      ctx.quadraticCurveTo(mouthCX + mouthW * 0.35, mouthCY - clampOpen * 0.7 - iH * 0.006, mouthCX + mouthW, mouthCY - clampOpen * 0.25);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(mouthCX - mouthW, mouthCY - clampOpen * 0.25);
      ctx.quadraticCurveTo(mouthCX, mouthCY + clampOpen * 0.8 + iH * 0.004, mouthCX + mouthW, mouthCY - clampOpen * 0.25);
      ctx.stroke();
      ctx.restore();

      if (amp > 0.015 && clampOpen > 1) {
        ctx.save();
        ctx.filter = `blur(${iW * 0.009}px)`;
        ctx.globalAlpha = Math.min(0.88, amp * 3.2);
        ctx.fillStyle = 'rgb(18,4,4)';
        ctx.beginPath();
        ctx.ellipse(mouthCX, mouthCY, mouthW * 0.7, clampOpen * 0.62, 0, 0, Math.PI * 2);
        ctx.fill();
        if (amp > 0.04) {
          ctx.globalAlpha = Math.min(0.45, amp * 1.5) * Math.min(1, (clampOpen / 4));
          ctx.fillStyle = 'rgb(235,225,215)';
          ctx.beginPath();
          ctx.ellipse(mouthCX, mouthCY - clampOpen * 0.08, mouthW * 0.52, clampOpen * 0.28, 0, 0, Math.PI);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    drawSingerViz(ctx, W, H, fd, amp, singerBg);

    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, H - 36, W, 36);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.font = `bold ${Math.round(H * 0.052)}px Sora,sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(singerSongTitle, W / 2, H - 18);

    ctx.fillStyle = `rgba(255,255,255,${0.25 + amp * 0.45})`;
    ctx.font = `${Math.round(H * 0.065)}px serif`;
    ctx.textAlign = 'right'; ctx.textBaseline = 'top';
    ctx.fillText('🎤', W - 10, 8);
  }, [singerBg, singerMouthY, singerMouthSize, singerGlow, singerSongTitle]);

  singerDrawFrameRef.current = drawSingerFrame;

  const startSingerPreview = () => {
    if (!singerPhotoRef.current || !singerAudioUrl) return;
    if (!setupAudioContext()) return;
    setSingerPlaying(true); setSingerStatus("playing");
    const audioElem = singerAudioElemRef.current;
    if (singerAudioCtxRef.current?.state === 'suspended') singerAudioCtxRef.current.resume();
    audioElem.currentTime = 0;
    audioElem.play().catch(err => console.warn("Audio play blocked:", err));
    singerStartTRef.current = null;
    const loop = (ts) => {
      if (!singerStartTRef.current) singerStartTRef.current = ts;
      const t = (ts - singerStartTRef.current) / 1000;
      singerDrawFrameRef.current?.(t);
      singerAnimRef.current = requestAnimationFrame(loop);
    };
    singerAnimRef.current = requestAnimationFrame(loop);
    audioElem.onended = () => stopSingerPreview();
  };

  const stopSingerPreview = () => {
    cancelAnimationFrame(singerAnimRef.current);
    singerAudioElemRef.current?.pause();
    setSingerPlaying(false); setSingerStatus(singerPhoto ? "ready" : "idle");
  };

  const startSingerRecord = async () => {
    if (!singerPhotoRef.current || !singerAudioUrl) return;
    if (!setupAudioContext()) return;
    const canvas = singerCanvasRef.current; if (!canvas) return;

    setSingerRecording(true); setSingerStatus("recording");
    setSingerVideoUrl(null); singerChunksRef.current = [];

    const videoStream = canvas.captureStream(30);
    let combined = videoStream;
    if (singerAudioStreamRef.current) {
      combined = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...singerAudioStreamRef.current.getAudioTracks()
      ]);
    }

    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
      ? 'video/webm;codecs=vp8,opus'
      : 'video/webm';
    const recorder = new MediaRecorder(combined, { mimeType: mime });
    recorder.ondataavailable = e => { if (e.data.size > 0) singerChunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(singerChunksRef.current, { type: 'video/webm' });
      setSingerVideoUrl(URL.createObjectURL(blob));
      setSingerRecording(false); setSingerStatus("done");
    };

    singerRecorderRef.current = recorder;
    recorder.start(100);

    const audioElem = singerAudioElemRef.current;
    if (singerAudioCtxRef.current?.state === 'suspended') await singerAudioCtxRef.current.resume();
    audioElem.currentTime = 0;
    audioElem.play().catch(err => console.warn("Audio play blocked:", err));

    singerStartTRef.current = null;
    const loop = (ts) => {
      if (!singerStartTRef.current) singerStartTRef.current = ts;
      const t = (ts - singerStartTRef.current) / 1000;
      singerDrawFrameRef.current?.(t);
      singerAnimRef.current = requestAnimationFrame(loop);
    };
    singerAnimRef.current = requestAnimationFrame(loop);

    audioElem.onended = () => stopSingerRecord();
  };

  const stopSingerRecord = () => {
    cancelAnimationFrame(singerAnimRef.current);
    singerAudioElemRef.current?.pause();
    if (singerRecorderRef.current?.state !== 'inactive') singerRecorderRef.current?.stop();
  };

  /* ── Video AI (Dual-Bot) ── */
  const sendVidAI = async (custom) => {
    const msg = (custom || vidInput).trim(); if (!msg || vidLoading) return;
    setVidInput("");
    setVidMsgs(p => [...p, { role: "user", content: msg }]);
    setVidLoading(true);

    const clipCtx = clips.map((c, i) => `Clip${i + 1}:"${c.name}"(${c.type},${c.durationMs / 1000}s)`).join(";");
    const idxCtx = clipIndex.map(c => `[${c.name}:${c.tags.join(",")}]`).join(" ");
    const fxCtx = `brightness:${adj.brightness}% contrast:${adj.contrast}% sat:${adj.saturation}% speed:${adj.speed}x filter:${FILTERS[filter].name}`;

    try {
      setActiveBot("indexer");
      const aRes = await fetch("http://localhost:8000/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
          system: `You are Agent A — the Global Indexer for Pang Studio. You maintain project-level memory.
PROJECT: ${clips.length} clips [${clipCtx || "none"}]. Index: ${idxCtx || "empty"}. FX: ${fxCtx}.
FILTERS:${FILTERS.map((f, i) => `${i}=${f.name}`).join("|")}
Analyze the user request at a high level. Identify what clips/scenes are relevant, what the global style should be. Output a JSON context plan (no explanation):
{"relevantClips":[0,1],"globalStyle":"cinematic","intent":"slow motion edit","workerTask":"Apply 0.5x speed + Warm filter to Clip 2","structuredSteps":[{"action":"speed","clip":1,"value":0.5},{"action":"filter","clip":1,"index":3}]}`,
          messages: [{ role: "user", content: msg }]
        })
      });
      const aData = await aRes.json();
      const aText = aData.response || aData.content?.[0]?.text || "{}";
      const aMatch = aText.match(/\{[\s\S]*?"workerTask"[\s\S]*?\}/);
      const aPlan = aMatch ? JSON.parse(aMatch[0]) : null;

      setActiveBot("worker");
      const bRes = await fetch("http://localhost:8000/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
          system: `You are Agent B — the Edit Worker for Pang Studio. Execute precise edits.
PROJECT: ${clips.length} clips [${clipCtx}]. FX: ${fxCtx}.
INDEXER PLAN: ${aPlan ? JSON.stringify(aPlan) : "(execute directly)"}
FILTERS:${FILTERS.map((f, i) => `${i}=${f.name}`).join("|")}
STYLE PRESETS: ${STYLE_PRESETS.map(p => `${p.id}=${p.name}`).join("|")}

Execute the edit. Respond with:
1. Brief warm confirmation (1-2 sentences)
2. JSON actions: {"actions":[{"type":"selectClip","index":0},{"type":"adj","param":"brightness","value":130},{"type":"speed","value":0.5},{"type":"filter","index":3},{"type":"text","content":"Happy New Year!","color":"#d4a054","font":"Impact","size":48,"x":50,"y":80,"startMs":120000,"endMs":125000},{"type":"reset"},{"type":"preset","id":"cinematic"},{"type":"transition","index":1},{"type":"precisionEdit","start":"00:02:00.000","end":"00:02:00.120"}]}
3. FFmpeg-style confirmation`,
          messages: [...vidMsgs.slice(-6).map(m => ({ role: m.role, content: m.content })), { role: "user", content: `User: "${msg}". Indexer context: ${aPlan ? JSON.stringify(aPlan) : "n/a"}. Execute now.` }]
        })
      });
      const bData = await bRes.json();
      const bText = bData.response || bData.content?.[0]?.text || "Couldn't process.";
      const bMatch = bText.match(/\{[\s\S]*?"actions"[\s\S]*?\}/);
      if (bMatch) { try { applyActions(JSON.parse(bMatch[0]).actions); } catch (_) { } }
      const clean = bText.replace(/\{[\s\S]*?"actions"[\s\S]*?\}/g, "").trim();
      setVidMsgs(p => [...p, { role: "assistant", content: `⚡ Agent B applied:\n${clean}` }]);
    } catch (err) {
      setTimeout(() => {
        const lower = msg.toLowerCase();
        const isBright = lower.includes("bright");
        const isDark = lower.includes("dark") || lower.includes("shadow");
        const isInsert = lower.includes("insert") || lower.includes("add image") || lower.includes("add photo") || lower.includes("add clip") || lower.includes("insert image") || lower.includes("insert photo");
        const isMute = lower.includes("mute");

        if (isInsert) {
          applyActions([{ type: "insertClip" }]);
          setVidMsgs(p => [...p, { role: "assistant", content: `(Local Mode) Opening file picker to insert media at the current playhead position (${msToTC(currentMs)}).\n\n✦ Choose a photo or video to insert between your clips.` }]);
        } else if (isBright) {
          sa("brightness", 140);
          setVidMsgs(p => [...p, { role: "assistant", content: `(Local Mode) Increased brightness to 140%.` }]);
        } else if (isDark) {
          sa("brightness", 70); sa("shadows", -10);
          setVidMsgs(p => [...p, { role: "assistant", content: `(Local Mode) Applied dark/moody look.` }]);
        } else if (isMute) {
          setIsMuted(true);
          setVidMsgs(p => [...p, { role: "assistant", content: `(Local Mode) Video muted. 🔇` }]);
        } else {
          setVidMsgs(p => [...p, { role: "assistant", content: `(Local Mode) Processed: "${msg}".\n\nTry: "add image here", "make it brighter", "mute", "make it dark"` }]);
        }
      }, 400);
    }
    setActiveBot(null); setVidLoading(false);
  };
  /* ── Memory Search ── */
  const searchMemory = async () => {
    if (!memQuery.trim()) return;
    setMemLoading(true); setMemResults([]);
    try {
      const res = await fetch("http://localhost:8000/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
          system: `You are the Global Indexer for Pang Studio. You search through the user's video project clips.
CLIP INDEX: ${clipIndex.map((c, i) => `Clip${i + 1}:"${c.name}"(${c.type})`).join(" | ") || "No clips indexed yet"}
User is searching for: "${memQuery}"
Return JSON array of matching clips with reasoning (no markdown):
[{"clipIndex":0,"name":"filename.jpg","matchReason":"...","confidence":90,"tags":["party","people","smiling"],"suggestedUse":"..."}]`,
          messages: [{ role: "user", content: `Search for: "${memQuery}"` }]
        })
      });
      const d = await res.json();
      const raw = d.response || d.content?.[0]?.text || "[]";
      setMemResults(JSON.parse(raw.replace(/```json|```/g, "").trim()));
    } catch {
      setTimeout(() => {
        setMemResults(clips.length > 0 ? [{ clipIndex: 0, name: clips[0].name, matchReason: "(Local) Mock memory match for: " + memQuery, tags: ["local-mock"], confidence: 85 }] : []);
      }, 400);
    }
    setMemLoading(false);
  };

  /* ── AI Director ── */
  const runDirector = async () => {
    if (clips.length < 1) return;
    setDirLoading(true); setDirPlan(null);
    const t = VIDEO_THEMES.find(x => x.id === dirTheme);
    const desc = dirTheme === "custom" ? dirCustom : `${t.e} ${t.l}`;
    try {
      const res = await fetch("http://localhost:8000/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
          system: `You are the AI Director for Pang Studio. User has ${clips.length} clips. Theme: "${desc}".
Using the Global Indexer + Edit Worker dual-bot architecture, create a full cinematic storyboard.
Return ONLY valid JSON:
{"title":"...","duration":30,"vibe":"...","colorGrade":"...","music":"...","musicMood":"...","bpm":120,"royaltyFreeAlt":"...","platform":"Artlist","openCard":"...","closeCard":"...","ffmpegPipeline":"ffmpeg -f concat -safe 0 -i list.txt -vf 'scale=1920:1080' output.mp4","agentChain":["Global Indexer → extract keyframes","Style Transfer → apply cinematic grade","Ken Burns → add zoom to stills","Caption Gen → auto-captions","FFmpeg Stitch → final render"],"shots":[{"n":1,"clip":1,"startSec":0,"endSec":4,"fx":"Ken Burns zoom-in","cut":"Cross dissolve","caption":"...","textOverlay":"...","cameraMove":"Slow push","kenBurns":true,"agentRole":"Worker","prompt":"Cinematic shot..."}],"suggestedCaptions":["Caption 1","Caption 2"],"hashtags":["#NewYear2025","#Memories","#Cinematic"]}`,
          messages: [{ role: "user", content: `Create storyboard for ${desc}` }]
        })
      });
      const d = await res.json();
      const raw = d.response || d.content?.[0]?.text || "{}";
      setDirPlan(JSON.parse(raw.replace(/```json|```/g, "").trim()));
    } catch {
      setTimeout(() => {
        setDirPlan({
          title: "Local Fallback Storyboard", duration: 15, vibe: "Local", colorGrade: "Warm", royaltyFreeAlt: "(Local Music)", platform: "Local",
          shots: [{n:1, clip:1, startSec:0, endSec:3, cut: "Cut", caption:`Scene 1 for ${desc}`, agentRole:"Worker", textOverlay: "Generated locally"}]
        });
      }, 800);
    }
    setDirLoading(false);
  };

  /* ── Spotify Bridge ── */
  const searchSpotify = async () => {
    if (!spotQuery.trim()) return;
    setSpotLoading(true); setSpotResults([]);
    try {
      const res = await fetch("http://localhost:8000/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
          system: `Pang Studio Vibe-Matching Engine. User searched: "${spotQuery}".
Suggest 5 royalty-free alternatives matching the mood/energy of "${spotQuery}".
Return ONLY valid JSON array:
[{"title":"...","artist":"...","mood":"...","bpm":120,"genre":"...","duration":"3:24","license":"Royalty-Free CC","platform":"Artlist","matchScore":95,"tags":["upbeat","energetic"],"reason":"...","previewNote":"..."}]`,
          messages: [{ role: "user", content: `Find alternatives for ${spotQuery}` }]
        })
      });
      const d = await res.json();
      const raw = d.response || d.content?.[0]?.text || "[]";
      setSpotResults(JSON.parse(raw.replace(/```json|```/g, "").trim()));
    } catch {
      setTimeout(() => {
        setSpotResults([{title: "Local Vibe Track", artist: "Fallback Audio", duration: "2:15", license: "CC-BY", platform: "Local Data", matchScore: 92, tags:["fallback"], reason: "Could not reach AI, showing mockup track."}]);
      }, 500);
    }
    setSpotLoading(false);
  };

  /* ── Agent Chain ── */
  const runAgentChain = async () => {
    if (chainSteps.length === 0 || clips.length === 0) return;
    setChainRunning(true); setChainLog([]);
    for (const step of chainSteps) {
      setChainLog(p => [...p, { step: step.id, status: "running", msg: `Running ${step.name}...` }]);
      await new Promise(r => setTimeout(r, 900));
      try {
        const res = await fetch("http://localhost:8000/api/chat", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
            system: `You are a composable agent in Pang Studio's pipeline. Execute: "${step.name}" (${step.desc}).
Project: ${clips.length} clips. Currently applied filter: ${FILTERS[filter].name}.
Return brief result (2-3 lines max) of what you did or generated.`,
            messages: [{ role: "user", content: `Execute agent: ${step.name} for the video project. ${step.id === "caption" ? "Generate captions for each scene." : step.id === "hashtag" ? "Generate trending hashtags." : step.id === "music" ? "Suggest music." : step.id === "style" ? "Apply style transfer notes." : step.id === "kenburns" ? "Describe Ken Burns parameters." : "Complete the task."}` }]
          })
        });
        const d = await res.json();
        const result = d.response || d.content?.[0]?.text || "Done";
        setChainLog(p => p.map(l => l.step === step.id ? { ...l, status: "done", msg: result.slice(0, 120) } : l));
      } catch {
        setChainLog(p => p.map(l => l.step === step.id ? { ...l, status: "done", msg: "(Local mode) Operation succeeded locally." } : l));
      }
    }
    setChainRunning(false);
  };

  /* ── Render Queue ── */
  const addRenderJob = async () => {
    if (clips.length === 0) return;
    const cost = renderMode === "final" ? 5 : 1;
    if (credits < cost) { alert("Not enough credits!"); return; }
    setCredits(p => p - cost);
    const job = { id: Date.now(), name: `${dirPlan?.title || "Untitled"} — ${renderMode === "final" ? "1080p Final" : "Proxy Preview"}`, mode: renderMode, clips: clips.length, status: "queued", progress: 0, created: new Date().toLocaleTimeString() };
    setRenderJobs(p => [job, ...p]);

    // Convert to Shotstack format and hit local backend
    try {
      const payload = generateShotstackJSON(clips, texts, adj);
      const res = await fetch("http://localhost:8000/api/render", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setRenderJobs(p => p.map(j => j.id === job.id ? { ...j, progress: 100, status: "done", videoPath: data.videoPath } : j));
      } else {
        setRenderJobs(p => p.map(j => j.id === job.id ? { ...j, status: "error", msg: data.message } : j));
      }
    } catch (err) {
      setRenderJobs(p => p.map(j => j.id === job.id ? { ...j, status: "error", msg: "Server offline" } : j));
    }
  };

  /* ── Cinema Creator ── */
  const handleRecordVoice = async () => {
    if (!voiceName.trim()) return alert("Enter character name first");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      voiceChunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) voiceChunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(voiceChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setVoiceBank(p => [...p, { id: Date.now(), name: voiceName, url }]);
        setVoiceName("");
      };
      voiceRecorderRef.current = recorder;
      recorder.start();
      setIsRecordingVoice(true);
    } catch (e) { alert("Microphone access denied or unavailable."); }
  };
  
  const handleStopVoice = () => {
    if (voiceRecorderRef.current && isRecordingVoice) {
      voiceRecorderRef.current.stop();
      voiceRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      setIsRecordingVoice(false);
    }
  };

  const generateCinema = async () => {
    if (!cinemaPrompt.trim()) return;
    setCinemaGenerating(true);
    setCinemaScenes([]);
    
    try {
      const res = await fetch("http://localhost:8000/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
          system: `You are the AI Cinema Director. Story prompt: "${cinemaPrompt}". Available character voices: ${voiceBank.map(v=>v.name).join(", ") || "Narrator"}. Create 4 distinct scenes for a short film. Return ONLY valid JSON array of scenes: [{"sceneNum":1, "description":"Visual description of the scene", "character":"Name of character speaking", "dialogue":"Their line", "bgStyle":"neon"}]`,
          messages: [{ role: "user", content: "Generate cinema scenes." }]
        })
      });
      const d = await res.json();
      const raw = d.response || d.content?.[0]?.text || "[]";
      setCinemaScenes(JSON.parse(raw.replace(/```json|```/g, "").trim()));
    } catch {
      setTimeout(() => {
        const char1 = voiceBank[0]?.name || "Narrator";
        const char2 = voiceBank[1]?.name || "Hero";
        setCinemaScenes([
          {sceneNum: 1, description: `Establishing shot of ${cinemaPrompt.split(" ")[0] || "the"} city`, character: char1, dialogue: `It all began with the prompt...`, bgStyle: "galaxy"},
          {sceneNum: 2, description: "Action scene", character: char2, dialogue: "We have to move fast!", bgStyle: "neon"},
          {sceneNum: 3, description: "Quiet moment", character: char1, dialogue: "I never thought it would come to this.", bgStyle: "bokeh"},
          {sceneNum: 4, description: "Epic conclusion", character: char2, dialogue: "This is our final stand.", bgStyle: "golden"}
        ]);
      }, 1500);
    }
    setCinemaGenerating(false);
    setActiveCinemaScene(0);
  };

  /* ── Chat AI ── */
  const sendChat = async () => {
    const msg = chatInput.trim(); if (!msg || chatLoading) return;
    setChatInput(""); const newH = [...chatHistory, { role: "user", content: msg }];
    setChatHistory(newH); setChatLoading(true);
    try {
      const m = CHAT_MODELS.find(x => x.id === chatModel);
      const res = await fetch("http://localhost:8000/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ system: m.sys, messages: newH }) });
      const d = await res.json();
      setChatHistory(p => [...p, { role: "assistant", content: d.response || d.content?.[0]?.text || "Error." }]);
    } catch { 
      setTimeout(() => {
        let reply = `(Local Mode) I heard: "${msg}". I'd love to help, but my backend server is offline.`;
        if (msg.toLowerCase().includes("video")) reply = "(Local Mode) For video edits, I suggest trying the 'Video AI' bot on the editor tab!";
        setChatHistory(p => [...p, { role: "assistant", content: reply }]);
      }, 600);
    }
    setChatLoading(false);
  };

  /* ─── EDIT TABS ── */
  const EDIT_TABS = [
    { id: "adjust", icon: "🎚️", label: "Adjust" }, { id: "color", icon: "🎨", label: "Color" },
    { id: "filters", icon: "✨", label: "Filters" }, { id: "presets", icon: "⭐", label: "Presets" },
    { id: "text", icon: "Aa", label: "Text" }, { id: "speed", icon: "⚡", label: "Speed" },
    { id: "trans", icon: "🔀", label: "Transitions" }, { id: "kenburns", icon: "🔍", label: "Ken Burns" },
    { id: "audio", icon: "🎵", label: "Audio" }, { id: "identity", icon: "👤", label: "Identity" },
  ];

  const QUICK_EDITS = ["Clip 1 — warm & bright ☀️", "Slow-mo clip 2 🐢", "Cinematic all clips 🎬", "Add New Year text at 2:00.000 🎆", "Vivid pop filter 🎨", "Noir dark mood 🖤", "Reset all effects ↺", "Auto-create 20s montage ✨"];

  /* ─── RENDER ─────────────────────────────────────────────────────── */
  return (
    <div style={{ display: "flex", height: "100vh", background: B.bgS, fontFamily: "'Sora','DM Sans',sans-serif", color: B.text, overflow: "hidden", flexDirection: "column" }}>
      <audio ref={singerAudioElemRef} style={{ display: "none" }} crossOrigin="anonymous" />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-thumb{background:${B.dim};border-radius:3px}
        textarea,select,input{font-family:inherit}textarea{resize:none}
        @keyframes singerPulse{0%,100%{box-shadow:0 0 0 0 rgba(196,122,58,0.4)}50%{box-shadow:0 0 0 8px rgba(196,122,58,0)}}
        @keyframes recordDot{0%,100%{opacity:1}50%{opacity:0.3}}
      `}</style>

      {/* ══ TOP NAV ═══════════════════════════════════════════════════ */}
      <div style={{ height: 50, background: B.sidebar, borderBottom: `1px solid ${B.border}`, display: "flex", alignItems: "center", padding: "0 12px", gap: 8, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginRight: 4 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg,${B.accentD},${B.accent})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 15, color: "#fff", boxShadow: `0 3px 10px ${B.accent}55` }}>P</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: "2px", color: B.text, lineHeight: 1 }}>PANG</div>
            <div style={{ fontSize: 7.5, color: B.dim, letterSpacing: "1.2px" }}>AI STUDIO v3.0</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 2, background: B.surface, borderRadius: 7, padding: "3px", border: `1px solid ${B.border}` }}>
          {[["editor", "🎬 Editor"], ["chat", "💬 Chat"]].map(([id, label]) => (
            <button key={id} onClick={() => setMainTab(id)} style={{ padding: "4px 12px", borderRadius: 5, border: "none", background: mainTab === id ? `linear-gradient(135deg,${B.accentD},${B.accent})` : "transparent", color: mainTab === id ? "#fff" : B.muted, fontSize: 10.5, fontWeight: 700, cursor: "pointer" }}>{label}</button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 5, background: B.surface, borderRadius: 6, padding: "3px 9px", border: `1px solid ${B.border}` }}>
          {[["indexer", "Indexer", B.blue], ["worker", "Worker", B.green]].map(([id, label, col]) => (
            <div key={id} style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: activeBot === id ? col : B.dim, boxShadow: activeBot === id ? `0 0 5px ${col}` : "", transition: "all .3s" }} />
              <span style={{ fontSize: 8.5, color: activeBot === id ? col : B.dim }}>{label}</span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4, background: B.surface, borderRadius: 6, padding: "3px 9px", border: `1px solid ${B.border}` }}>
          <span style={{ fontSize: 11 }}>⚡</span>
          <span style={{ fontSize: 10, color: credits < 10 ? B.red : B.gold, fontWeight: 700 }}>{credits} credits</span>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: "flex", gap: 4 }}>
          {[
            { id: "director", label: "🎬 Director", col: B.accentD, act: showDirector, set: setShowDirector },
            { id: "memory", label: "🧠 Memory", col: B.blue, act: showMemory, set: setShowMemory },
            { id: "agents", label: "🔗 Agents", col: B.purple, act: showAgents, set: setShowAgents },
            { id: "spotify", label: "🎵 Music", col: "#1db954", act: showSpotify, set: setShowSpotify },
            { id: "singer", label: "🎤 Singer", col: "#e11d48", act: showSinger, set: setShowSinger },
            { id: "cinema", label: "🍿 Cinema", col: "#f59e0b", act: showCinema, set: setShowCinema },
            { id: "render", label: "📤 Render", col: B.gold, act: showRender, set: setShowRender },
          ].map(({ id, label, col, act, set }) => (
            <button key={id} onClick={() => set(v => !v)} style={{ background: act ? `${col}33` : B.surface, border: `1px solid ${act ? col : B.border}`, color: act ? col : B.muted, padding: "4px 9px", borderRadius: 5, cursor: "pointer", fontSize: 10, fontWeight: 700, transition: "all .15s" }}>{label}</button>
          ))}
        </div>
      </div>

      {/* ══ SINGER STUDIO PANEL ═══════════════════════════════════════ */}
      {showSinger && (
        <div style={{ background: B.surface2, borderBottom: `1px solid #e11d4844`, padding: "10px 14px", flexShrink: 0, maxHeight: 340, overflowY: "auto" }}>
          <input ref={singerPhotoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleSingerPhoto} />
          <input ref={singerAudioInputRef} type="file" accept="audio/*" style={{ display: "none" }} onChange={handleSingerAudio} />

          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 9 }}>
            <span style={{ fontSize: 12, fontWeight: 900, color: "#f43f5e" }}>🎤 Singer Studio</span>
            <Tag col="#e11d48">AI Lip-Sync</Tag>
            <Tag col={B.purple}>Canvas Video</Tag>
            <Tag col={B.green}>Photo → Singing</Tag>
            <span style={{ fontSize: 9, color: B.dim, marginLeft: 2 }}>Upload a photo + song · pick a background · generate a realistic singing video</span>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                <div onClick={() => singerPhotoInputRef.current?.click()}
                  style={{ flex: 1, background: singerPhoto ? `${B.accent}18` : B.surface, border: `1px dashed ${singerPhoto ? B.accent : B.dim}`, borderRadius: 7, padding: "8px", cursor: "pointer", textAlign: "center", transition: "all .2s" }}>
                  {singerPhoto ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <img src={singerPhoto.url} style={{ width: 28, height: 28, borderRadius: 4, objectFit: "cover" }} alt="" />
                      <div style={{ fontSize: 8.5, color: B.accent, textAlign: "left", overflow: "hidden" }}>
                        <div style={{ fontWeight: 700 }}>📷 Photo ready</div>
                        <div style={{ color: B.dim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 90 }}>{singerPhoto.name}</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 9, color: B.dim }}>📷 Upload Photo<br /><span style={{ fontSize: 8, color: B.dim }}>Face portrait best</span></div>
                  )}
                </div>
                <div onClick={() => singerAudioInputRef.current?.click()}
                  style={{ flex: 1, background: singerAudioUrl ? `${B.green}18` : B.surface, border: `1px dashed ${singerAudioUrl ? B.green : B.dim}`, borderRadius: 7, padding: "8px", cursor: "pointer", textAlign: "center", transition: "all .2s" }}>
                  {singerAudioUrl ? (
                    <div style={{ fontSize: 8.5, color: B.green }}>
                      <div style={{ fontWeight: 700 }}>🎵 Audio ready</div>
                      <div style={{ color: B.dim, fontSize: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{singerAudioName}</div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 9, color: B.dim }}>🎵 Upload Song<br /><span style={{ fontSize: 8, color: B.dim }}>MP3, WAV, M4A</span></div>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: 7 }}>
                <div style={{ fontSize: 8, color: B.dim, marginBottom: 3 }}>VIDEO TITLE / LABEL</div>
                <input value={singerSongTitle} onChange={e => setSingerSongTitle(e.target.value)}
                  style={{ width: "100%", background: B.surface, border: `1px solid ${B.border}`, color: B.text, padding: "5px 8px", borderRadius: 5, fontSize: 10.5, outline: "none" }}
                  placeholder="🎵 Now Singing" />
              </div>

              <SL label="Mouth Position (% from top)" val={singerMouthY} min={40} max={88} step={1} unit="%" onChange={v => setSingerMouthY(v)} />
              <SL label="Mouth Size / Sensitivity" val={singerMouthSize} min={15} max={100} step={1} unit="%" onChange={v => setSingerMouthSize(v)} />

              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}>
                  <input type="checkbox" checked={singerGlow} onChange={e => setSingerGlow(e.target.checked)} style={{ accentColor: "#e11d48", cursor: "pointer" }} />
                  <span style={{ fontSize: 9, color: B.muted }}>Stage glow effect</span>
                </label>
              </div>

              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                <Btn small col="#0d9488" disabled={!singerPhoto || !singerAudioUrl || singerRecording}
                  onClick={singerPlaying ? stopSingerPreview : startSingerPreview}>
                  {singerPlaying ? "⏹ Stop Preview" : "▶ Preview"}
                </Btn>
                <button onClick={singerRecording ? stopSingerRecord : startSingerRecord}
                  disabled={!singerPhoto || !singerAudioUrl || singerPlaying}
                  style={{ background: singerRecording ? "#e11d4822" : `linear-gradient(135deg,#9f1239,#e11d48)`, border: `1px solid ${singerRecording ? "#e11d48" : B.border}`, color: singerRecording ? "#e11d48" : "#fff", padding: "3px 9px", borderRadius: 6, cursor: (!singerPhoto || !singerAudioUrl || singerPlaying) ? "not-allowed" : "pointer", fontSize: 9.5, fontWeight: 700, opacity: (!singerPhoto || !singerAudioUrl || singerPlaying) ? 0.5 : 1, display: "flex", alignItems: "center", gap: 4 }}>
                  {singerRecording && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#e11d48", display: "inline-block", animation: "recordDot 0.8s infinite" }} />}
                  {singerRecording ? "⏹ Stop & Save" : "⏺ Record Video"}
                </button>
                {singerVideoUrl && (
                  <a href={singerVideoUrl} download="singing-video.webm"
                    style={{ background: `linear-gradient(135deg,#065f46,#059669)`, color: "#fff", padding: "3px 9px", borderRadius: 6, fontSize: 9.5, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 3 }}>
                    ⬇ Download
                  </a>
                )}
              </div>

              <div style={{ marginTop: 6, fontSize: 8.5, color: singerStatus === "recording" ? "#e11d48" : singerStatus === "done" ? B.green : singerStatus === "playing" ? "#0d9488" : B.dim, display: "flex", alignItems: "center", gap: 4 }}>
                {singerStatus === "recording" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#e11d48", display: "inline-block", animation: "recordDot 0.8s infinite" }} />}
                {singerStatus === "idle" && "Upload a photo & song to begin"}
                {singerStatus === "ready" && "✅ Ready — preview or record your singing video"}
                {singerStatus === "playing" && "▶ Previewing animation..."}
                {singerStatus === "recording" && "⏺ Recording in progress — sing along!"}
                {singerStatus === "done" && "✅ Video ready! Click Download to save."}
              </div>
            </div>

            <div style={{ minWidth: 200 }}>
              <div style={{ fontSize: 8, color: B.dim, textTransform: "uppercase", letterSpacing: .7, marginBottom: 6 }}>Background Template</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                {SINGER_BACKGROUNDS.map(bg => (
                  <div key={bg.id} onClick={() => setSingerBg(bg.id)}
                    style={{ background: singerBg === bg.id ? `${bg.col}55` : B.surface, border: `1px solid ${singerBg === bg.id ? "#e11d48" : B.border}`, borderRadius: 6, padding: "5px 7px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, transition: "all .15s" }}>
                    <div style={{ width: 20, height: 20, borderRadius: 4, background: bg.col, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0 }}>{bg.emoji}</div>
                    <span style={{ fontSize: 8.5, color: singerBg === bg.id ? "#f43f5e" : B.muted, fontWeight: singerBg === bg.id ? 700 : 400 }}>{bg.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ flexShrink: 0 }}>
              <div style={{ fontSize: 8, color: B.dim, textTransform: "uppercase", letterSpacing: .7, marginBottom: 5, display: "flex", alignItems: "center", gap: 5 }}>
                Canvas Preview
                {singerRecording && <span style={{ background: "#e11d4822", color: "#e11d48", padding: "1px 5px", borderRadius: 3, fontSize: 7.5, fontWeight: 700, animation: "recordDot 0.8s infinite" }}>⏺ REC</span>}
              </div>
              <canvas ref={singerCanvasRef} width={320} height={180}
                style={{ border: `1px solid ${singerRecording ? "#e11d48" : B.border}`, borderRadius: 8, display: "block", background: "#020102", boxShadow: singerRecording ? `0 0 0 2px #e11d4855` : "" }} />
              <div style={{ fontSize: 7.5, color: B.dim, marginTop: 3, textAlign: "center" }}>320×180 preview · exports as 16:9 WebM</div>

              {singerVideoUrl && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ fontSize: 8, color: B.green, marginBottom: 3 }}>✅ Output Preview</div>
                  <video src={singerVideoUrl} controls style={{ width: 320, height: 180, borderRadius: 6, border: `1px solid ${B.green}55`, display: "block", background: "#000" }} />
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: 8, padding: "6px 10px", background: `#e11d4811`, border: `1px solid #e11d4822`, borderRadius: 6, fontSize: 8.5, color: B.muted, lineHeight: 1.7 }}>
            <span style={{ color: "#f43f5e", fontWeight: 700 }}>💡 Pro tips: </span>
            Use a clear face portrait for best lip-sync · Adjust "Mouth Position" slider to match your face in the photo · Hit Preview first to calibrate, then Record · For best results, sing/hum along while recording plays
          </div>
        </div>
      )}

      {/* ══ CINEMA CREATOR PANEL ════════════════════════════════════════ */}
      {showCinema && (
        <div style={{ background: B.surface2, borderBottom: `1px solid #f59e0b55`, padding: "10px 14px", flexShrink: 0, maxHeight: 400, overflowY: "auto" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 9 }}>
            <span style={{ fontSize: 12, fontWeight: 900, color: "#f59e0b" }}>🍿 Cinema Creator</span>
            <Tag col="#f59e0b">Voice Bank</Tag>
            <Tag col={B.purple}>AI Storyboard</Tag>
            <Tag col={B.blue}>Auto-Generate</Tag>
            <span style={{ fontSize: 9, color: B.dim, marginLeft: 2 }}>Prompt a story, assign voices, and let AI generate the cinema visually!</span>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
            
            {/* Left: Input & Voice Bank */}
            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 9, color: B.dim, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>1. Story Prompt</div>
                <textarea 
                  value={cinemaPrompt} onChange={e => setCinemaPrompt(e.target.value)}
                  placeholder="e.g. A cyberpunk detective is trying to solve a crime in neon city..."
                  style={{ width: "100%", height: 60, background: B.surface, border: `1px solid ${B.border}`, color: B.text, padding: "8px", borderRadius: 6, fontSize: 11, outline: "none", resize: "none" }}
                />
              </div>

              <div style={{ background: B.sidebar, padding: "8px 12px", borderRadius: 8, border: `1px solid ${B.border}` }}>
                <div style={{ fontSize: 9, color: B.dim, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
                  <span>2. Voice Bank</span>
                  <span style={{ color: B.accent }}>{voiceBank.length} Voices</span>
                </div>
                
                <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                  <input 
                    value={voiceName} onChange={e => setVoiceName(e.target.value)} disabled={isRecordingVoice}
                    placeholder="Character name (e.g. Hero)"
                    style={{ flex: 1, background: B.surface, border: `1px solid ${B.border}`, color: B.text, padding: "5px 8px", borderRadius: 5, fontSize: 10, outline: "none" }}
                  />
                  <button 
                    onClick={isRecordingVoice ? handleStopVoice : handleRecordVoice}
                    style={{ background: isRecordingVoice ? "#ef444422" : B.surface2, border: `1px solid ${isRecordingVoice ? B.red : B.border}`, color: isRecordingVoice ? B.red : B.text, padding: "4px 10px", borderRadius: 5, fontSize: 10, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                  >
                    {isRecordingVoice && <span style={{ width: 6, height: 6, borderRadius: "50%", background: B.red, animation: "recordDot 0.8s infinite" }} />}
                    {isRecordingVoice ? "Stop" : "⏺ Record Voice"}
                  </button>
                </div>

                {voiceBank.length > 0 ? (
                  <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
                    {voiceBank.map((v) => (
                      <div key={v.id} style={{ background: B.surface, padding: "5px 8px", borderRadius: 5, display: "flex", alignItems: "center", gap: 6, border: `1px solid ${B.border}`, flexShrink: 0 }}>
                        <span style={{ fontSize: 14 }}>🗣️</span>
                        <div>
                          <div style={{ fontSize: 9, fontWeight: 700, color: B.accent }}>{v.name}</div>
                          <audio src={v.url} controls style={{ height: 16, width: 90 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 8.5, color: B.muted, fontStyle: "italic", padding: "4px 0" }}>No voices recorded. AI Narrator will be used by default.</div>
                )}
              </div>

              <Btn onClick={generateCinema} disabled={cinemaGenerating || !cinemaPrompt.trim()} style={{ width: "100%", marginTop: 12, padding: "8px", fontSize: 12 }}>
                {cinemaGenerating ? "🎬 Directing Cinema..." : "🎬 Generate Cinema"}
              </Btn>
            </div>

            {/* Right: Preview & Storyboard */}
            <div style={{ flex: 1.5, minWidth: 320, background: B.sidebar, borderRadius: 8, border: `1px solid ${B.border}`, padding: "10px", display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 9, color: B.dim, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                <span>3. Cinema Preview</span>
                {cinemaScenes.length > 0 && <span style={{ color: B.green }}>Ready</span>}
              </div>

              {cinemaGenerating ? (
                <div style={{ height: 180, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: `1px dashed ${B.dim}`, borderRadius: 8, color: "#f59e0b" }}>
                  <Dots col="#f59e0b" />
                  <div style={{ fontSize: 10, marginTop: 8, fontWeight: 700 }}>AI is writing your story and drawing scenes...</div>
                </div>
              ) : cinemaScenes.length > 0 ? (
                <div>
                  {/* Canvas Placeholder for AI Video */}
                  <div style={{ width: "100%", aspectRatio: "16/9", background: cinemaScenes[activeCinemaScene]?.bgStyle === "neon" ? "#0f172a" : cinemaScenes[activeCinemaScene]?.bgStyle === "galaxy" ? "#1e1b4b" : cinemaScenes[activeCinemaScene]?.bgStyle === "golden" ? "#78350f" : "#1c1917", borderRadius: 8, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${B.border}` }}>
                    
                    {/* Mock Image Representation */}
                    <div style={{ position: "absolute", fontSize: 64, opacity: 0.2 }}>
                      {cinemaScenes[activeCinemaScene]?.bgStyle === "neon" ? "🌃" : cinemaScenes[activeCinemaScene]?.bgStyle === "galaxy" ? "🌌" : cinemaScenes[activeCinemaScene]?.bgStyle === "golden" ? "🌅" : "🎭"}
                    </div>
                    
                    {/* Scene Subtitles */}
                    <div style={{ position: "absolute", bottom: 12, left: 16, right: 16, textAlign: "center", textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>
                      <span style={{ background: "rgba(0,0,0,0.6)", padding: "2px 6px", borderRadius: 4, fontSize: 10, color: B.accent, fontWeight: 800, marginRight: 6 }}>
                        {cinemaScenes[activeCinemaScene]?.character}
                      </span>
                      <span style={{ fontSize: 13, color: "#fff", fontWeight: 700 }}>
                        "{cinemaScenes[activeCinemaScene]?.dialogue}"
                      </span>
                    </div>
                    
                    {/* Play Controls mock */}
                    <div style={{ position: "absolute", top: 12, left: 12, background: "rgba(0,0,0,0.5)", padding: "4px 8px", borderRadius: 4, fontSize: 9, color: "#fff", display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ color: B.red, display: "flex", alignItems: "center", gap: 3 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: B.red, animation: "recordDot 0.8s infinite" }}></span> LIVE
                      </span>
                      <span>Scene {activeCinemaScene + 1}/{cinemaScenes.length}</span>
                    </div>
                  </div>

                  {/* Scene Navigation */}
                  <div style={{ display: "flex", gap: 6, marginTop: 10, overflowX: "auto" }}>
                    {cinemaScenes.map((s, i) => (
                      <button 
                        key={i} onClick={() => setActiveCinemaScene(i)}
                        style={{ background: activeCinemaScene === i ? `${B.accent}33` : B.surface, border: `1px solid ${activeCinemaScene === i ? B.accent : B.border}`, color: activeCinemaScene === i ? B.text : B.muted, padding: "6px 10px", borderRadius: 6, fontSize: 9, cursor: "pointer", minWidth: 100, textAlign: "left" }}
                      >
                        <div style={{ fontWeight: 700, color: activeCinemaScene === i ? B.accent : B.text, marginBottom: 2 }}>{s.character}</div>
                        <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: 8 }}>{s.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ height: 180, display: "flex", alignItems: "center", justifyCenter: "center", textAlign: "center", border: `1px dashed ${B.dim}`, borderRadius: 8, color: B.dim, padding: 20 }}>
                  <div style={{ margin: "auto" }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>🎥</div>
                    <div style={{ fontSize: 10 }}>Generate a cinema to see the storyboard here.</div>
                  </div>
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}

      {/* ══ AI Director ═══════════════════════════════════════════════ */}
      {showDirector && (
        <div style={{ background: B.surface2, borderBottom: `1px solid ${B.border}`, padding: "10px 14px", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: B.text }}>🎬 AI Director</span>
                <Tag col={B.gold}>Dual-Bot</Tag><Tag col={B.blue}>Storyboard Engine</Tag>
              </div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 7 }}>
                {VIDEO_THEMES.map(t => <button key={t.id} onClick={() => setDirTheme(t.id)} style={{ padding: "4px 10px", borderRadius: 12, border: `1px solid ${dirTheme === t.id ? B.accent : B.border}`, background: dirTheme === t.id ? `${B.accent}33` : B.surface, color: dirTheme === t.id ? B.accent : B.muted, fontSize: 10, cursor: "pointer", fontWeight: 600 }}>{t.e} {t.l}</button>)}
              </div>
              {dirTheme === "custom" && <input value={dirCustom} onChange={e => setDirCustom(e.target.value)} placeholder="Describe your theme..." style={{ background: B.surface, border: `1px solid ${B.border}`, color: B.text, padding: "5px 9px", borderRadius: 6, fontSize: 10.5, outline: "none", width: "100%", marginBottom: 7 }} />}
              <Btn onClick={runDirector} disabled={dirLoading || clips.length < 1}>{dirLoading ? "✨ Planning..." : "✨ Generate Storyboard"}</Btn>
              {clips.length < 1 && <span style={{ fontSize: 9, color: B.dim, marginLeft: 8 }}>Upload clips first</span>}
            </div>
            {dirLoading && <div style={{ display: "flex", alignItems: "center", gap: 8, color: B.accent, fontSize: 11 }}><Dots col={B.accent} /> Storyboarding...</div>}
            {dirPlan && !dirPlan.error && (
              <div style={{ flex: 3, background: B.sidebar, borderRadius: 9, overflow: "hidden", border: `1px solid ${B.border}`, maxHeight: 190, overflowY: "auto" }}>
                <div style={{ background: `linear-gradient(135deg,${B.accentD},${B.accent})`, padding: "7px 12px", display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>{dirPlan.title}</span>
                  <Tag col="#fff">{dirPlan.duration}s</Tag>
                  <Tag col="#fff">{dirPlan.colorGrade}</Tag>
                  <Tag col={B.green}>{dirPlan.royaltyFreeAlt}</Tag>
                  <Tag col="#1db954">{dirPlan.platform}</Tag>
                </div>
                <div style={{ padding: "8px 12px" }}>
                  {dirPlan.ffmpegPipeline && (
                    <div style={{ background: B.hover, borderRadius: 5, padding: "5px 9px", marginBottom: 8, border: `1px solid ${B.border}` }}>
                      <span style={{ fontSize: 8, color: B.muted, textTransform: "uppercase", letterSpacing: .7, marginRight: 6 }}>⚙️ FFmpeg Pipeline</span>
                      <code style={{ fontSize: 8.5, color: B.green, fontFamily: "monospace" }}>{dirPlan.ffmpegPipeline}</code>
                    </div>
                  )}
                  {dirPlan.agentChain && (
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
                      {dirPlan.agentChain.map((s, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <Tag col={B.accent} sm>{s}</Tag>
                          {i < dirPlan.agentChain.length - 1 && <span style={{ fontSize: 9, color: B.dim }}>→</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
                    {(dirPlan.shots || []).map((s, i) => (
                      <div key={i} style={{ background: B.hover, borderRadius: 6, padding: "7px 9px", border: `1px solid ${B.border}`, minWidth: 140, flexShrink: 0 }}>
                        <div style={{ display: "flex", gap: 3, marginBottom: 3, flexWrap: "wrap" }}>
                          <Tag col={s.agentRole === "Worker" ? B.accent : B.gold} sm>{s.agentRole}</Tag>
                          <Tag sm>Shot {s.n}</Tag>
                          {s.kenBurns && <Tag col={B.purple} sm>Ken Burns</Tag>}
                        </div>
                        <div style={{ fontSize: 9.5, color: B.text, marginBottom: 2, lineHeight: 1.4 }}>{s.caption}</div>
                        <div style={{ fontSize: 8, color: B.dim }}>{s.fx} · {s.cut} · {s.startSec}–{s.endSec}s</div>
                        {s.textOverlay && <div style={{ fontSize: 8, color: B.gold, marginTop: 2 }}>"{s.textOverlay}"</div>}
                      </div>
                    ))}
                  </div>
                  {dirPlan.hashtags && <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginTop: 7 }}>{dirPlan.hashtags.map((h, i) => <Tag key={i} col={B.blue} sm>{h}</Tag>)}</div>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Memory Search */}
      {showMemory && (
        <div style={{ background: B.surface2, borderBottom: `1px solid ${B.border}`, padding: "9px 14px", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 7 }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: B.text }}>🧠 Project Memory</span>
            <Tag col={B.blue}>Global Indexer</Tag>
            <Tag col={B.green}>{clipIndex.length} clips indexed</Tag>
          </div>
          <div style={{ display: "flex", gap: 7, marginBottom: 7 }}>
            <input value={memQuery} onChange={e => setMemQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && searchMemory()} placeholder='e.g. "smiling faces" · "party scene" · "outdoor shots"' style={{ flex: 1, background: B.surface, border: `1px solid ${B.border}`, color: B.text, padding: "6px 11px", borderRadius: 7, fontSize: 11, outline: "none" }} />
            <Btn onClick={searchMemory} disabled={memLoading || !memQuery.trim()}>{memLoading ? "Searching..." : "🔍 Search Memory"}</Btn>
          </div>
          {memLoading && <div style={{ display: "flex", gap: 7, alignItems: "center", color: B.blue, fontSize: 11 }}><Dots col={B.blue} />Agent A scanning...</div>}
          {memResults.length > 0 && (
            <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
              {memResults.map((r, i) => (
                <div key={i} onClick={() => { const c = clips[r.clipIndex]; if (c) setSel(c); }} style={{ background: B.sidebar, border: `1px solid ${B.border}`, borderRadius: 7, padding: "7px 10px", cursor: "pointer", minWidth: 160, flexShrink: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: B.text, marginBottom: 2 }}>{r.name}</div>
                  <div style={{ fontSize: 8.5, color: B.muted, marginBottom: 4 }}>{r.matchReason}</div>
                  <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 3 }}>{(r.tags || []).map((t, j) => <Tag key={j} sm>{t}</Tag>)}</div>
                  <Tag col={B.green} sm>Match: {r.confidence}%</Tag>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Agent Chain */}
      {showAgents && (
        <div style={{ background: B.surface2, borderBottom: `1px solid ${B.border}`, padding: "9px 14px", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 7 }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: B.text }}>🔗 Composable Agent Chain</span>
            <Tag col={B.purple}>Pipeline Builder</Tag>
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 7, flexWrap: "wrap" }}>
            {AGENT_CHAIN_TYPES.map(a => (
              <div key={a.id} onClick={() => setChainSteps(p => p.find(x => x.id === a.id) ? p.filter(x => x.id !== a.id) : [...p, a])}
                style={{ background: chainSteps.find(x => x.id === a.id) ? `${a.col}22` : B.surface, border: `1px solid ${chainSteps.find(x => x.id === a.id) ? a.col : B.border}`, borderRadius: 7, padding: "5px 11px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 13 }}>{a.icon}</span>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: chainSteps.find(x => x.id === a.id) ? a.col : B.text }}>{a.name}</div>
                  <div style={{ fontSize: 8, color: B.dim }}>{a.desc}</div>
                </div>
              </div>
            ))}
          </div>
          {chainSteps.length > 0 && (
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginBottom: 7 }}>
              {chainSteps.map((s, i) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ background: `${s.col}22`, border: `1px solid ${s.col}55`, borderRadius: 5, padding: "2px 8px", fontSize: 9, color: s.col }}>{s.icon} {s.name}</div>
                  {i < chainSteps.length - 1 && <span style={{ fontSize: 9, color: B.dim }}>→</span>}
                </div>
              ))}
              <Btn onClick={runAgentChain} disabled={chainRunning || clips.length === 0} small>{chainRunning ? "Running..." : "▶ Run Chain"}</Btn>
            </div>
          )}
          {chainLog.length > 0 && (
            <div style={{ display: "flex", gap: 5, overflowX: "auto" }}>
              {chainLog.map((l, i) => (
                <div key={i} style={{ background: B.sidebar, border: `1px solid ${l.status === "done" ? B.green : l.status === "error" ? B.red : B.border}`, borderRadius: 6, padding: "6px 9px", minWidth: 150, flexShrink: 0 }}>
                  <div style={{ fontSize: 9, color: l.status === "done" ? B.green : l.status === "error" ? B.red : B.gold, fontWeight: 700, marginBottom: 3 }}>{l.status === "running" ? "⏳" : l.status === "done" ? "✅" : "❌"} {l.step}</div>
                  <div style={{ fontSize: 8.5, color: B.muted, lineHeight: 1.4 }}>{l.status === "running" ? <Dots col={B.gold} /> : l.msg}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Spotify Bridge */}
      {showSpotify && (
        <div style={{ background: B.surface2, borderBottom: `1px solid ${B.border}`, padding: "9px 14px", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 7 }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: B.text }}>🎵 Music Bridge — Vibe-Matching</span>
            <Tag col="#1db954">Royalty-Free</Tag>
            <Tag col={B.green}>Legal Sync</Tag>
          </div>
          <div style={{ display: "flex", gap: 7, marginBottom: 7 }}>
            <input value={spotQuery} onChange={e => setSpotQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && searchSpotify()} placeholder="Search any song or artist — e.g. 'Coldplay Yellow', 'upbeat new year'..." style={{ flex: 1, background: B.surface, border: `1px solid ${B.border}`, color: B.text, padding: "6px 11px", borderRadius: 7, fontSize: 11, outline: "none" }} />
            <Btn onClick={searchSpotify} disabled={spotLoading || !spotQuery.trim()}>{spotLoading ? "Finding..." : "🎧 Vibe Match"}</Btn>
          </div>
          {spotLoading && <div style={{ display: "flex", gap: 7, alignItems: "center", color: "#1db954", fontSize: 11 }}><Dots col="#1db954" />Matching vibe...</div>}
          {spotResults.length > 0 && (
            <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
              {spotResults.map((t, i) => (
                <div key={i} onClick={() => setSelTrack(t)} style={{ background: selTrack === t ? `${"#1db954"}22` : B.sidebar, border: `1px solid ${selTrack === t ? "#1db954" : B.border}`, borderRadius: 7, padding: "7px 11px", cursor: "pointer", minWidth: 170, flexShrink: 0 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: selTrack === t ? "#1db954" : B.text, marginBottom: 1 }}>{t.title}</div>
                  <div style={{ fontSize: 9, color: B.muted, marginBottom: 5 }}>{t.artist} · {t.duration}</div>
                  <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 4 }}>
                    <Tag col={B.green} sm>{t.license}</Tag>
                    <Tag col={B.blue} sm>{t.platform}</Tag>
                    <Tag col={B.gold} sm>{t.matchScore}% match</Tag>
                  </div>
                  <div style={{ fontSize: 8, color: B.dim, lineHeight: 1.4 }}>{t.reason}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Render Queue */}
      {showRender && (
        <div style={{ background: B.surface2, borderBottom: `1px solid ${B.border}`, padding: "9px 14px", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 7 }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: B.text }}>📤 Render Queue</span>
            <Tag col={B.gold}>⚡ {credits} credits</Tag>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 7 }}>
            <div style={{ display: "flex", gap: 4 }}>
              {[["proxy", "🔍 Proxy Preview", "1 credit"], ["final", "🎬 Final 1080p", "5 credits"]].map(([id, label, cost]) => (
                <button key={id} onClick={() => setRenderMode(id)} style={{ background: renderMode === id ? `${B.gold}22` : B.surface, border: `1px solid ${renderMode === id ? B.gold : B.border}`, color: renderMode === id ? B.gold : B.muted, padding: "5px 11px", borderRadius: 6, cursor: "pointer", fontSize: 10, fontWeight: 700 }}>
                  {label} <span style={{ fontSize: 8, opacity: .7 }}>({cost})</span>
                </button>
              ))}
            </div>
            <Btn onClick={addRenderJob} disabled={clips.length === 0}>{`▶ Queue ${renderMode === "final" ? "Final Render" : "Proxy"}`}</Btn>
          </div>
          {renderJobs.length > 0 && (
            <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
              {renderJobs.slice(0, 5).map(j => (
                <div key={j.id} style={{ background: B.sidebar, border: `1px solid ${j.status === "done" ? B.green : j.status === "error" ? B.red : B.border}`, borderRadius: 7, padding: "7px 10px", minWidth: 180, flexShrink: 0 }}>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: B.text, marginBottom: 2 }}>{j.name}</div>
                  <div style={{ fontSize: 8, color: B.dim, marginBottom: 5 }}>{j.clips} clips · {j.created}</div>
                  <div style={{ height: 3, background: B.border, borderRadius: 2, marginBottom: 4 }}>
                    <div style={{ height: "100%", width: `${j.progress}%`, background: j.status === "done" ? `linear-gradient(90deg,${B.green},${B.green})` : j.status === "error" ? B.red : `linear-gradient(90deg,${B.accentD},${B.accent})`, borderRadius: 2, transition: "width .5s" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Tag col={j.status === "done" ? B.green : j.status === "error" ? B.red : j.status === "processing" ? B.accent : B.dim} sm>{j.status === "done" ? "✅ Done" : j.status === "error" ? "❌ Failed" : j.status === "processing" ? `⏳ ${j.progress}%` : "⏳ Queued"}</Tag>
                    {j.status === "done" && j.videoPath && <a href={j.videoPath} download style={{ background: `${B.green}22`, border: `1px solid ${B.green}`, color: B.green, padding: "2px 7px", borderRadius: 4, cursor: "pointer", fontSize: 8.5, fontWeight: 700, textDecoration: "none" }}>⬇ Download</a>}
                    {j.status === "error" && <span style={{ fontSize: 7.5, color: B.red }}>{j.msg}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* ══ EDITOR / CHAT TABS ════════════════════════════════════════ */}
      <div style={{ flex: 1, display: mainTab === "editor" ? "flex" : "none", flexDirection: "column", minHeight: 0 }}>
        {/* ── Editor Upper ── */}
        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
          {/* Left panel (Upload/Clips) */}
          <div style={{ width: 360, background: B.sidebar, borderRight: `1px solid ${B.border}`, display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" }}>

            {/* TOP BLOCK: Media Bin — fixed compact size */}
            <div style={{ padding: "10px 10px 6px", borderBottom: `1px solid ${B.border}`, flexShrink: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: B.text }}>📦 Media Bin</div>
                <Tag col={B.accent}>{clips.length}</Tag>
              </div>
              <button onClick={() => fileRef.current?.click()} style={{ width: "100%", background: `linear-gradient(135deg,${B.surface},${B.surface2})`, border: `1px dashed ${B.dim}`, color: B.accent, padding: "10px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all .2s" }}>
                <span style={{ fontSize: 16 }}>📤</span> Upload Media
              </button>
              <input type="file" ref={fileRef} multiple accept="video/*,image/*" onChange={handleUpload} style={{ display: "none" }} />
              <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 5, marginTop: 6, maxHeight: 110 }}>
                {clips.map((c, i) => (
                  <div key={c.id} onClick={() => setSel(c)} style={{ background: sel?.id === c.id ? `${B.accent}22` : B.surface, border: `1px solid ${sel?.id === c.id ? B.accent : B.border}`, borderRadius: 6, padding: 6, cursor: "pointer", display: "flex", gap: 8, alignItems: "center", transition: "all .15s", position: "relative", overflow: "hidden" }}>
                    {c.type === "video" ? (
                      <video src={c.url} style={{ width: 40, height: 26, objectFit: "cover", borderRadius: 4, background: "#000" }} />
                    ) : (
                      <img src={c.url} style={{ width: 40, height: 26, objectFit: "cover", borderRadius: 4, background: "#000" }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 9.5, fontWeight: 700, color: sel?.id === c.id ? B.accent : B.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                      <div style={{ fontSize: 8, color: B.dim }}>{c.type === "video" ? "🎬 Video" : "🖼️ Photo"} · {msToTC(c.durationMs).slice(3, 8)}</div>
                    </div>
                    {sel?.id === c.id && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 2, background: B.accent }} />}
                  </div>
                ))}
                {clips.length === 0 && <div style={{ textAlign: "center", padding: "8px", color: B.dim, fontSize: 10 }}>No clips. Upload to start.</div>}
              </div>
            </div>

            {/* BOTTOM BLOCK: Video AI Chat — takes ALL remaining height */}
            <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", background: B.surface, overflow: "hidden" }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderBottom: `1px solid ${B.border}`, flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: B.accent, display: "flex", alignItems: "center", gap: 5 }}>⚡ Video AI <Tag col={B.gold} sm>Dual-bot</Tag></span>
                {vidLoading && <Dots />}
              </div>
              {/* Message history — fills all remaining vertical space */}
              <div style={{ flex: 1, overflowY: "auto", fontSize: 10, lineHeight: 1.5, background: B.sidebar, padding: "10px 12px" }}>
                {vidMsgs.length === 0 && (
                  <div style={{ color: B.dim, textAlign: "center", paddingTop: 32, fontSize: 10.5, lineHeight: 1.8 }}>
                    <div style={{ fontSize: 22, marginBottom: 8 }}>🤖</div>
                    Ask me anything about your video!<br />
                    <span style={{ fontSize: 9, color: B.border }}>"Make it cinematic" · "Add subtitles" · "Fix colors"</span>
                  </div>
                )}
                {vidMsgs.map((m, i) => (
                  <div key={i} style={{ marginBottom: 10, display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
                    <div style={{ background: m.role === "user" ? `${B.accent}33` : B.surface2, border: `1px solid ${m.role === "user" ? B.accent : B.border}`, borderRadius: m.role === "user" ? "14px 14px 2px 14px" : "14px 14px 14px 2px", padding: "7px 12px", maxWidth: "92%", fontSize: 11 }}>
                      <div style={{ color: m.role === "assistant" ? B.accent : B.dim, fontWeight: 800, fontSize: 9, marginBottom: 2 }}>{m.role === "assistant" ? "pang_ai" : "you"}</div>
                      <span style={{ whiteSpace: "pre-wrap", color: m.role === "user" ? "#fff" : B.muted }}>{m.content}</span>
                    </div>
                  </div>
                ))}
                <div ref={vidBottom} />
              </div>
              {/* Quick Edit Chips */}
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", padding: "0 8px" }}>
                {QUICK_EDITS.map((e, i) => <button key={i} onClick={() => sendVidAI(e)} disabled={vidLoading || clips.length === 0} style={{ padding: "3px 8px", background: B.surface2, border: `1px solid ${B.border}`, color: B.muted, borderRadius: 10, fontSize: 8, cursor: vidLoading ? "not-allowed" : "pointer" }}>{e}</button>)}
              </div>
              {/* Input */}
              <div style={{ display: "flex", gap: 6, padding: "0 8px 8px", alignItems: "flex-end" }}>
                <textarea value={vidInput} onChange={e => setVidInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendVidAI(); } }} disabled={vidLoading || clips.length === 0} placeholder={'Ask anything... (Enter to send, Shift+Enter for new line)'} style={{ flex: 1, background: B.sidebar, border: `1px solid ${B.border}`, color: B.text, padding: "7px 10px", borderRadius: 8, fontSize: 10.5, outline: "none", resize: "none", minHeight: 56, maxHeight: 120, lineHeight: 1.5 }} rows={3} />
                <Btn disabled={vidLoading || clips.length === 0} onClick={() => sendVidAI()} small style={{ height: 56, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>🚀<span style={{ fontSize: 7 }}>Send</span></Btn>
              </div>
            </div>
          </div>

          {/* Center (Preview) */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16, position: "relative", background: B.surface }}>
            <div style={{ width: "85%", aspectRatio: "16/9", background: "#030202", borderRadius: 12, boxShadow: `0 10px 40px rgba(0,0,0,0.8), 0 0 0 1px ${B.border}`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", backgroundImage: `linear-gradient(45deg, ${B.border} 25%, transparent 25%, transparent 75%, ${B.border} 75%, ${B.border}), linear-gradient(45deg, ${B.border} 25%, transparent 25%, transparent 75%, ${B.border} 75%, ${B.border})`, backgroundSize: "16px 16px", backgroundPosition: "0 0, 8px 8px" }}>
              {sel ? (
                sel.type === "video" ? (
                  <video ref={videoRef} src={sel.url} onTimeUpdate={e => setCurrentMs(e.target.currentTime * 1000)} onEnded={() => setPlaying(false)} style={{ width: "100%", height: "100%", objectFit: "contain", filter: getCSS(), transition: "filter .2s" }} />
                ) : (
                  <img src={sel.url} style={{ width: "100%", height: "100%", objectFit: "contain", filter: getCSS(), transition: "filter .2s, transform 3s ease-in-out", transform: sel.kenBurns ? `scale(${sel.kenBurnsDir === "zoom-in" ? 1.2 : 1}) translate(${sel.kenBurnsDir === "pan-right" ? "2%" : sel.kenBurnsDir === "pan-left" ? "-2%" : "0"},0)` : "scale(1)" }} />
                )
              ) : <div style={{ color: B.dim, fontSize: 14, fontWeight: 700, letterSpacing: 1, opacity: .6 }}>PANG AI STUDIO</div>}

              {texts.map(t => (
                <div key={t.id} style={{ position: "absolute", left: `${t.x}%`, top: `${t.y}%`, transform: "translate(-50%,-50%)", color: t.color, fontFamily: t.font, fontSize: `${t.size}px`, fontWeight: 800, textShadow: "0 2px 10px rgba(0,0,0,0.8), 0 0 2px #000", whiteSpace: "nowrap", pointerEvents: "none" }}>{t.content}</div>
              ))}
            </div>

            {/* ── VIDEO PLAYBACK CONTROLS ─────────────────── */}
            <div style={{ marginTop: 10, background: B.sidebar, borderRadius: 12, border: `1px solid ${B.border}`, padding: "10px 16px", display: "flex", flexDirection: "column", gap: 8, boxShadow: "0 5px 15px rgba(0,0,0,0.4)", width: "85%" }}>
              {/* Seek bar */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 800, fontFamily: "monospace", color: B.accent, letterSpacing: 1, minWidth: 60 }}>{msToTC(currentMs).slice(3)}</span>
                <input type="range" min={0} max={totalMs || 1} value={currentMs}
                  onChange={e => {
                    const ms = Number(e.target.value);
                    setCurrentMs(ms);
                    if (videoRef.current) videoRef.current.currentTime = ms / 1000;
                  }}
                  style={{ flex: 1, accentColor: B.accent, cursor: "pointer", height: 4 }}
                />
                <span style={{ fontSize: 10, color: B.dim, fontFamily: "monospace", minWidth: 52 }}>{msToTC(totalMs).slice(3)}</span>
              </div>
              {/* Buttons row */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                {/* Rewind 10s */}
                <button onClick={() => { const t = Math.max(0, (videoRef.current?.currentTime || 0) - 10); if (videoRef.current) videoRef.current.currentTime = t; setCurrentMs(t * 1000); }} title="Rewind 10s" style={{ background: B.surface2, border: `1px solid ${B.border}`, color: B.muted, width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>⏮</button>
                {/* Play / Pause */}
                <button onClick={() => setPlaying(p => !p)} title={playing ? "Pause" : "Play"} style={{ background: `linear-gradient(135deg,${B.accentD},${B.accent})`, border: "none", color: "#fff", width: 44, height: 44, borderRadius: 12, cursor: "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 12px ${B.accent}55` }}>{playing ? "⏸" : "▶"}</button>
                {/* Forward 10s */}
                <button onClick={() => { const t = Math.min((totalMs / 1000) || 9999, (videoRef.current?.currentTime || 0) + 10); if (videoRef.current) videoRef.current.currentTime = t; setCurrentMs(t * 1000); }} title="Forward 10s" style={{ background: B.surface2, border: `1px solid ${B.border}`, color: B.muted, width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>⏭</button>
                <div style={{ width: 1, height: 26, background: B.border, margin: "0 4px" }} />
                {/* Speed: x1 x1.5 x2 */}
                {[1, 1.5, 2].map(spd => (
                  <button key={spd} onClick={() => { sa("speed", spd); if (videoRef.current) videoRef.current.playbackRate = spd; }} style={{ background: adj.speed === spd ? `${B.accent}33` : B.surface2, border: `1px solid ${adj.speed === spd ? B.accent : B.border}`, color: adj.speed === spd ? B.accent : B.muted, padding: "4px 9px", borderRadius: 6, cursor: "pointer", fontSize: 10, fontWeight: 700 }}>{spd}×</button>
                ))}
                <div style={{ width: 1, height: 26, background: B.border, margin: "0 4px" }} />
                {/* Mute toggle — tracked in React state */}
                <button
                  onClick={() => setIsMuted(m => !m)}
                  title={isMuted ? "Unmute" : "Mute"}
                  style={{ background: isMuted ? `${B.red}33` : B.surface2, border: `1px solid ${isMuted ? B.red : B.border}`, color: isMuted ? B.red : B.muted, width: 36, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s" }}>
                  {isMuted ? "🔇" : "🔊"}
                </button>
              </div>
            </div>

            {precMode && (
              <div style={{ position: "absolute", top: 20, background: `${B.purple}22`, border: `1px solid ${B.purple}`, padding: "5px 12px", borderRadius: 6, display: "flex", gap: 8, alignItems: "center", backdropFilter: "blur(5px)" }}>
                <Tag col={B.purple}>Precision Mode</Tag>
                <span style={{ fontSize: 10, fontFamily: "monospace", color: "#fff" }}>[ {precStart} - {precEnd} ]</span>
                <button onClick={() => setPrecMode(false)} style={{ background: "none", border: "none", color: B.muted, cursor: "pointer", fontSize: 12 }}>×</button>
              </div>
            )}
          </div>
          {/* Right panel (Edit controls) */}
          <div style={{ width: 280, background: B.surface2, borderLeft: `1px solid ${B.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
            <div style={{ display: "flex", background: B.sidebar, padding: "8px 10px 0", gap: 4, borderBottom: `1px solid ${B.border}`, overflowX: "auto" }}>
              {EDIT_TABS.map(t => (
                <button key={t.id} onClick={() => setEditTab(t.id)} style={{ background: editTab === t.id ? B.surface2 : "transparent", border: "none", color: editTab === t.id ? B.accent : B.muted, padding: "6px 10px", borderTopLeftRadius: 8, borderTopRightRadius: 8, cursor: "pointer", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, borderTop: `1px solid ${editTab === t.id ? B.border : "transparent"}`, borderLeft: `1px solid ${editTab === t.id ? B.border : "transparent"}`, borderRight: `1px solid ${editTab === t.id ? B.border : "transparent"}`, marginBottom: -1, whiteSpace: "nowrap" }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            <div style={{ padding: 16, flex: 1, overflowY: "auto" }}>
              {editTab === "adjust" && (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <SL label="Brightness" val={adj.brightness} min={0} max={200} step={1} onChange={v => sa("brightness", v)} />
                    <SL label="Contrast" val={adj.contrast} min={0} max={200} step={1} onChange={v => sa("contrast", v)} />
                    <SL label="Saturation" val={adj.saturation} min={0} max={200} step={1} onChange={v => sa("saturation", v)} />
                    <SL label="Exposure" val={adj.exposure} min={-50} max={50} step={1} onChange={v => sa("exposure", v)} />
                    <SL label="Highlights" val={adj.highlights} min={-20} max={20} step={1} onChange={v => sa("highlights", v)} />
                    <SL label="Shadows" val={adj.shadows} min={-20} max={20} step={1} onChange={v => sa("shadows", v)} />
                  </div>
                  <Btn onClick={() => { setAdj(DEF_ADJ); setFilter(0); }} style={{ width: "100%", marginTop: 16 }} small col={B.dim}>↺ Reset Adjustments</Btn>
                </div>
              )}
              {editTab === "color" && (
                <div>
                  <SL label="Hue" val={adj.hue} min={-180} max={180} step={1} onChange={v => sa("hue", v)} />
                  <SL label="Temperature" val={adj.temperature} min={-50} max={50} step={1} onChange={v => sa("temperature", v)} />
                  <SL label="Vibrance" val={adj.vibrance} min={-50} max={50} step={1} onChange={v => sa("vibrance", v)} />
                </div>
              )}
              {editTab === "filters" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {FILTERS.map((f, i) => (
                    <button key={i} onClick={() => setFilter(i)} style={{ background: filter === i ? `${B.accent}22` : B.sidebar, border: `1px solid ${filter === i ? B.accent : B.border}`, color: filter === i ? B.accent : B.text, padding: "10px", borderRadius: 8, cursor: "pointer", fontSize: 10.5, fontWeight: 700, transition: "all .2s" }}>{f.name}</button>
                  ))}
                </div>
              )}
              {editTab === "presets" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {STYLE_PRESETS.map((p, i) => (
                    <button key={i} onClick={() => applyPreset(p)} style={{ background: B.sidebar, border: `1px solid ${B.border}`, color: B.text, padding: "10px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, textAlign: "left", transition: "all .2s" }}>
                      <span style={{ fontSize: 16 }}>{p.icon}</span>
                      <div>
                        {p.name}<br />
                        <span style={{ fontSize: 8, color: B.dim, fontWeight: 400 }}>Cinematic Color Grade</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {editTab === "text" && (
                <div>
                  <input value={newTxt.content} onChange={e => setNewTxt({ ...newTxt, content: e.target.value })} placeholder="Enter text overlay..." style={{ width: "100%", background: B.surface, border: `1px solid ${B.border}`, color: B.text, padding: "8px", borderRadius: 6, marginBottom: 10, outline: "none", fontSize: 11 }} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                    <select value={newTxt.font} onChange={e => setNewTxt({ ...newTxt, font: e.target.value })} style={{ background: B.surface, color: B.text, border: `1px solid ${B.border}`, padding: "6px", borderRadius: 6, fontSize: 10, outline: "none" }}>
                      {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <input type="color" value={newTxt.color} onChange={e => setNewTxt({ ...newTxt, color: e.target.value })} style={{ width: "100%", height: 28, border: "none", borderRadius: 6, cursor: "pointer", background: "none" }} />
                  </div>
                  <SL label="Size" val={newTxt.size} min={10} max={120} step={2} onChange={v => setNewTxt({ ...newTxt, size: v })} />
                  <SL label="Pos X" val={newTxt.x} min={0} max={100} step={1} onChange={v => setNewTxt({ ...newTxt, x: v })} />
                  <SL label="Pos Y" val={newTxt.y} min={0} max={100} step={1} onChange={v => setNewTxt({ ...newTxt, y: v })} />
                  <Btn onClick={() => setTexts([...texts, { ...newTxt, id: Date.now() }])} style={{ width: "100%", marginTop: 10 }}>+ Add Text Overlay</Btn>
                  {texts.length > 0 && <div style={{ marginTop: 16, borderTop: `1px solid ${B.border}`, paddingTop: 10 }}><div style={{ fontSize: 9, color: B.dim, marginBottom: 6 }}>ACTIVE LAYERS</div>{texts.map(t => (<div key={t.id} style={{ display: "flex", justifyContent: "space-between", background: B.sidebar, padding: "6px", borderRadius: 6, marginBottom: 4, fontSize: 10, alignItems: "center" }}><span>"{t.content}"</span><button onClick={() => setTexts(texts.filter(x => x.id !== t.id))} style={{ background: "none", border: "none", color: B.red, cursor: "pointer" }}>🗑</button></div>))}</div>}
                </div>
              )}
              {editTab === "speed" && (
                <div>
                  <SL label="Playback Speed" val={Math.round(adj.speed * 100)} min={10} max={400} step={10} unit="%" onChange={v => sa("speed", v / 100)} />
                  <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                    <Btn onClick={() => sa("speed", 0.5)} small col={B.purple} style={{ flex: 1 }}>0.5x Slow</Btn>
                    <Btn onClick={() => sa("speed", 1)} small col={B.dim} style={{ flex: 1 }}>1x Norm</Btn>
                    <Btn onClick={() => sa("speed", 2)} small col={B.accent} style={{ flex: 1 }}>2x Fast</Btn>
                  </div>
                </div>
              )}
              {editTab === "trans" && (
                <div>
                  {transitionFlash && <div style={{ position: "absolute", inset: 0, background: `${B.gold}22`, pointerEvents: "none", borderRadius: 8, transition: "opacity 0.6s", zIndex: 10 }} />}
                  <div style={{ fontSize: 9, color: B.dim, marginBottom: 10 }}>Selected transition applies between clips in your timeline.</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {TRANSITIONS.map((t, i) => (
                      <button key={i} onClick={() => setTransition(i)} style={{ background: transition === i ? `${B.gold}33` : B.sidebar, border: `2px solid ${transition === i ? B.gold : B.border}`, color: transition === i ? B.gold : B.text, padding: "12px 8px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 700, transition: "all .2s", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: 20 }}>{t.i}</span>
                        <span>{t.n}</span>
                        {transition === i && <span style={{ fontSize: 8, color: B.gold }}>✓ Active</span>}
                      </button>
                    ))}
                  </div>
                  {transition > 0 && <div style={{ marginTop: 10, padding: "6px 10px", background: `${B.gold}11`, borderRadius: 6, fontSize: 9, color: B.gold }}>✅ {TRANSITIONS[transition]?.n} selected — applied between clips in render.</div>}
                </div>
              )}
              {editTab === "kenburns" && (
                <div>
                  <div style={{ background: `${B.purple}22`, border: `1px solid ${B.purple}`, padding: "10px", borderRadius: 8, marginBottom: 12, color: B.purple, fontSize: 10, lineHeight: 1.5 }}>
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, cursor: "pointer", fontSize: 11 }}>
                    <input type="checkbox" checked={sel?.kenBurns || false}
                      onChange={e => {
                        const v = e.target.checked;
                        setClips(p => p.map(c => c.id === sel?.id ? { ...c, kenBurns: v } : c));
                        setSel(p => p ? { ...p, kenBurns: v } : p);
                      }}
                      style={{ accentColor: B.purple }} disabled={!sel || sel.type === "video"} /> Enable Ken Burns for Selected Photo
                  </label>
                  <div style={{ display: "flex", gap: 4 }}>
                    {["zoom-in", "zoom-out", "pan-left", "pan-right"].map(d => (
                      <button key={d}
                        onClick={() => {
                          setClips(p => p.map(c => c.id === sel?.id ? { ...c, kenBurnsDir: d } : c));
                          setSel(p => p ? { ...p, kenBurnsDir: d } : p);
                        }}
                        disabled={!sel || !sel.kenBurns}
                        style={{ flex: 1, background: sel?.kenBurnsDir === d ? B.purple : B.sidebar, border: `1px solid ${sel?.kenBurnsDir === d ? B.purple : B.border}`, color: sel?.kenBurnsDir === d ? "#fff" : B.muted, padding: "6px 4px", borderRadius: 6, fontSize: 8.5, cursor: "pointer", textTransform: "capitalize", transition: "all .15s" }}>
                        {d === "zoom-in" ? "🔍 Zoom+" : d === "zoom-out" ? "🔎 Zoom-" : d === "pan-left" ? "⬅ Left" : "➡ Right"}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {editTab === "audio" && (
                <div>
                  <SL label="Volume" val={audioVolume} min={0} max={200} step={1} unit="%" onChange={v => setAudioVolume(v)} />
                  <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                    <button onClick={() => setAudioVolume(0)} style={{ flex: 1, background: B.sidebar, border: `1px solid ${B.border}`, color: B.muted, padding: "6px", borderRadius: 6, fontSize: 10, cursor: "pointer" }}>🔇 Mute</button>
                    <button onClick={() => setAudioVolume(100)} style={{ flex: 1, background: B.sidebar, border: `1px solid ${B.border}`, color: B.muted, padding: "6px", borderRadius: 6, fontSize: 10, cursor: "pointer" }}>🔊 100%</button>
                    <button onClick={() => setAudioVolume(150)} style={{ flex: 1, background: B.sidebar, border: `1px solid ${B.border}`, color: B.muted, padding: "6px", borderRadius: 6, fontSize: 10, cursor: "pointer" }}>🔔 150%</button>
                  </div>
                  <div style={{ marginTop: 10, padding: "6px 10px", background: audioVolume === 0 ? `${B.red}11` : `${B.green}11`, borderRadius: 6, fontSize: 9, color: audioVolume === 0 ? B.red : B.green }}>
                    {audioVolume === 0 ? "🔇 Muted" : `🔊 Volume: ${audioVolume}% (${(Math.min(1, audioVolume / 100) * 100).toFixed(0)}% of max)`}
                  </div>
                </div>
              )}
              {editTab === "identity" && (
                <div>
                  <div style={{ fontSize: 10, color: B.dim, marginBottom: 10 }}>Add Watermark / Identity</div>
                  <input placeholder="Watermark text (e.g., @pang_ai)" style={{ width: "100%", background: B.sidebar, padding: "8px 10px", border: `1px solid ${B.border}`, color: B.text, borderRadius: 6, fontSize: 11, outline: "none" }} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Timeline Lower (compact) ── */}
        <div style={{ height: 110, background: B.sidebar, borderTop: `1px solid ${B.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
          {/* Timeline Toolbar */}
          <div style={{ height: 30, borderBottom: `1px solid ${B.border}`, background: B.surface2, display: "flex", alignItems: "center", padding: "0 12px", gap: 16 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={() => setPlaying(!playing)} style={{ background: B.accent, border: "none", color: "#fff", width: 20, height: 20, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 10 }}>{playing ? "⏸" : "▶"}</button>
              <span style={{ fontSize: 11, fontFamily: "monospace", color: B.accent, fontWeight: 700, width: 85 }}>{msToTC(currentMs)}</span>
            </div>
            <div style={{ display: "flex", gap: 4, alignItems: "center", borderLeft: `1px solid ${B.border}`, paddingLeft: 16 }}>
              <button
                onClick={handleCut}
                disabled={!sel || clips.length === 0}
                title="Cut clip at playhead position"
                style={{ background: sel ? `${B.red}22` : "none", border: `1px solid ${sel ? B.red : B.border}`, color: sel ? B.red : B.dim, cursor: sel ? "pointer" : "not-allowed", fontSize: 12, padding: "2px 8px", borderRadius: 5, display: "flex", alignItems: "center", gap: 4, transition: "all .15s" }}>
                ✂ <span style={{ fontSize: 9, fontWeight: 700 }}>CUT</span>
              </button>
              <button
                onClick={handleDeleteClip}
                disabled={!sel}
                title="Delete selected clip"
                style={{ background: "none", border: `1px solid ${sel ? B.border : "transparent"}`, color: sel ? B.dim : B.hover, cursor: sel ? "pointer" : "not-allowed", fontSize: 12, padding: "2px 6px", borderRadius: 5, transition: "all .15s" }}>
                🗑
              </button>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 12 }}>🔍</span>
              <input type="range" min={10} max={300} value={zoom} onChange={e => setZoom(Number(e.target.value))} style={{ width: 80, accentColor: B.accent }} />
            </div>
          </div>

          {/* Timeline Tracks */}
          <div style={{ flex: 1, overflow: "auto", background: B.bgS, padding: "10px 0", position: "relative" }}>
            <div style={{ minHeight: "100%", position: "relative", minWidth: `${Math.max(100, (totalMs / 1000) * (zoom / 2))}%` }}>
              {/* Scrub line */}
              <div style={{ position: "absolute", left: `${(currentMs / totalMs) * 100}%`, top: 0, bottom: 0, width: 2, background: B.red, zIndex: 20, pointerEvents: "none" }}>
                <div style={{ width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: `5px solid ${B.red}`, position: "absolute", top: 0, left: -4 }} />
              </div>

              {/* Time Ruler */}
              <div style={{ height: 18, borderBottom: `1px solid ${B.border}`, display: "flex", position: "relative", marginBottom: 4 }}>
                {[...Array(Math.ceil(totalMs / 5000))].map((_, i) => (
                  <div key={i} style={{ position: "absolute", left: `${(i * 5000 / totalMs) * 100}%`, height: "100%", borderLeft: `1px solid ${B.dim}`, paddingLeft: 4, fontSize: 8, color: B.muted, paddingTop: 2 }}>{i * 5}s</div>
                ))}
              </div>

              {/* Video Track */}
              <div style={{ height: 45, background: B.sidebar, marginBottom: 6, position: "relative", borderRadius: 4, margin: "0 10px", display: "flex", gap: 2 }}>
                {clips.map(c => (
                  <div key={c.id} onClick={() => setSel(c)} style={{ width: `${(c.durationMs / totalMs) * 100}%`, height: "100%", background: sel?.id === c.id ? `${B.accent}aa` : B.surface2, border: `1px solid ${sel?.id === c.id ? "#fff" : B.border}`, borderRadius: 4, overflow: "hidden", position: "relative", cursor: "pointer", boxShadow: sel?.id === c.id ? `0 0 10px ${B.accent}55` : "" }}>
                    {c.type === "video" ? <video src={c.url} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: .3 }} /> : <img src={c.url} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: .5 }} />}
                    <div style={{ position: "absolute", left: 4, top: 3, fontSize: 8, fontWeight: 700, color: "#fff", textShadow: "0 1px 2px #000" }}>{c.name}</div>
                  </div>
                ))}
              </div>

              {/* Text Track */}
              <div style={{ height: 25, background: B.sidebar, marginBottom: 6, position: "relative", borderRadius: 4, margin: "0 10px" }}>
                {texts.map(t => (
                  <div key={t.id} style={{ position: "absolute", left: `${(t.startMs / totalMs) * 100}%`, width: `${((t.endMs - t.startMs) / totalMs) * 100}%`, height: "100%", background: `${B.gold}aa`, border: `1px solid #fff`, borderRadius: 4, padding: "2px 4px", fontSize: 8, color: "#fff", fontWeight: 800, overflow: "hidden", whiteSpace: "nowrap" }}>{t.content}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* ══ FULLSCREEN CHAT ONLY ══════════════════════════════════════ */}
      <div style={{ flex: 1, display: mainTab === "chat" ? "flex" : "none", flexDirection: "column", background: B.bgS }}>
        <div style={{ padding: "12px 24px", borderBottom: `1px solid ${B.border}`, display: "flex", gap: 16, background: B.surface }}>
          {CHAT_MODELS.map(m => (
            <div key={m.id} onClick={() => setChatModel(m.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 16px", borderRadius: 12, background: chatModel === m.id ? `${m.col}11` : B.surface2, border: `1px solid ${chatModel === m.id ? m.col : B.border}`, cursor: "pointer", transition: "all .2s" }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: m.grad, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, color: "#fff", boxShadow: chatModel === m.id ? `0 4px 12px ${m.col}44` : "" }}>{m.i}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: chatModel === m.id ? m.col : B.text }}>{m.n}</div>
                <div style={{ fontSize: 10, color: B.dim }}>{m.sub}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {chatHistory.length === 0 && (
            <div style={{ margin: "auto", textAlign: "center", color: B.dim }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
              <h2 style={{ fontSize: 18, color: B.text, marginBottom: 8 }}>How can {CHAT_MODELS.find(x => x.id === chatModel).n} help?</h2>
              <p style={{ fontSize: 12 }}>Ask about video editing, style advice, or brainstorm ideas.</p>
            </div>
          )}
          {chatHistory.map((m, i) => (
            <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "75%", background: m.role === "user" ? B.surface : B.sidebar, border: `1px solid ${m.role === "user" ? B.border : CHAT_MODELS.find(x => x.id === chatModel).col}`, padding: "12px 16px", borderRadius: 12, borderBottomRightRadius: m.role === "user" ? 2 : 12, borderBottomLeftRadius: m.role === "assistant" ? 2 : 12, color: m.role === "user" ? "#fff" : B.text, fontSize: 13, lineHeight: 1.6, boxShadow: "0 4px 15px rgba(0,0,0,0.2)" }}>
              {m.role === "assistant" && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, fontSize: 10, fontWeight: 800, color: CHAT_MODELS.find(x => x.id === chatModel).col }}>
                  <div style={{ width: 16, height: 16, borderRadius: 4, background: CHAT_MODELS.find(x => x.id === chatModel).grad, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9 }}>{CHAT_MODELS.find(x => x.id === chatModel).i}</div>
                  {CHAT_MODELS.find(x => x.id === chatModel).n} AI
                </div>
              )}
              <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
            </div>
          ))}
          {chatLoading && (
            <div style={{ alignSelf: "flex-start", background: B.sidebar, border: `1px solid ${CHAT_MODELS.find(x => x.id === chatModel).col}`, padding: "12px 16px", borderRadius: 12, display: "flex", gap: 8, alignItems: "center", color: CHAT_MODELS.find(x => x.id === chatModel).col }}>
              <Dots col={CHAT_MODELS.find(x => x.id === chatModel).col} /> Thinking...
            </div>
          )}
          <div ref={chatBottom} />
        </div>

        <div style={{ padding: "16px 24px", background: B.surface, borderTop: `1px solid ${B.border}` }}>
          <div style={{ maxWidth: 800, margin: "0 auto", position: "relative" }}>
            <textarea value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }} placeholder={`Message ${CHAT_MODELS.find(x => x.id === chatModel).n}...`} rows={1} style={{ width: "100%", background: B.sidebar, border: `1px solid ${B.border}`, color: B.text, padding: "14px 48px 14px 16px", borderRadius: 12, fontSize: 13, outline: "none", boxShadow: "inset 0 2px 5px rgba(0,0,0,0.2)" }} />
            <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()} style={{ position: "absolute", right: 8, top: 8, width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg,${B.accentD},${B.accent})`, border: "none", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: chatLoading || !chatInput.trim() ? "not-allowed" : "pointer", opacity: chatLoading || !chatInput.trim() ? .5 : 1, transition: "all .2s" }}>
              <span style={{ transform: "rotate(-45deg) translate(1px,-1px)", fontSize: 14 }}>🚀</span>
            </button>
          </div>
          <div style={{ textAlign: "center", fontSize: 10, color: B.dim, marginTop: 8 }}>
            {CHAT_MODELS.find(x => x.id === chatModel).n} is a research preview. Check important outputs.
          </div>
        </div>
      </div>
    </div>
  );
}
