function opGlyph(op) {
  const common = 'style="display:inline-block;vertical-align:middle;margin:0 3px;"';
  if (op === "+") {
    return `<svg width="13" height="13" viewBox="0 0 12 12" ${common} aria-hidden="true"><rect x="5" y="1" width="2" height="10" rx="1" fill="currentColor"/><rect x="1" y="5" width="10" height="2" rx="1" fill="currentColor"/></svg>`;
  }
  if (op === "-") {
    return `<svg width="13" height="13" viewBox="0 0 12 12" ${common} aria-hidden="true"><rect x="1" y="5" width="10" height="2" rx="1" fill="currentColor"/></svg>`;
  }
  if (op === "*" || op === "×") {
    return `<svg width="13" height="13" viewBox="0 0 12 12" ${common} aria-hidden="true"><line x1="1.5" y1="1.5" x2="10.5" y2="10.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="10.5" y1="1.5" x2="1.5" y2="10.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
  }
  if (op === "/" || op === "÷") {
    return `<svg width="13" height="13" viewBox="0 0 12 12" ${common} aria-hidden="true"><circle cx="6" cy="2.6" r="1.3" fill="currentColor"/><rect x="1" y="5" width="10" height="2" rx="1" fill="currentColor"/><circle cx="6" cy="9.4" r="1.3" fill="currentColor"/></svg>`;
  }
  return op;
}

function escapeHTML(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

// ---------- Huffman core (generic over any key: characters OR gray levels) ----------
function buildFrequencyMap(values) {
  const freq = {};
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    freq[v] = (freq[v] || 0) + 1;
  }
  return freq;
}

function buildHuffmanTree(freq) {
  let nodes = Object.entries(freq).map(([key, f]) => ({ key, freq: f, left: null, right: null }));
  if (nodes.length === 0) return null;
  if (nodes.length === 1) {
    nodes.push({ key: null, freq: 0, left: null, right: null, placeholder: true });
  }
  while (nodes.length > 1) {
    nodes.sort((a, b) => a.freq - b.freq);
    const left = nodes.shift();
    const right = nodes.shift();
    nodes.push({ key: null, freq: left.freq + right.freq, left, right });
  }
  return nodes[0];
}

function buildCodes(node, prefix = "", codes = {}) {
  if (!node) return codes;
  if (node.key !== null && node.key !== undefined) {
    codes[node.key] = prefix || "0";
    return codes;
  }
  buildCodes(node.left, prefix + "0", codes);
  buildCodes(node.right, prefix + "1", codes);
  return codes;
}

// ---------- Tree layout + SVG (illustrative subtree only - see note below) ----------
function layoutTree(root) {
  let leafIndex = 0;
  const positions = new Map();
  function assignX(node, depth) {
    if (!node) return;
    const isLeaf = !node.left && !node.right;
    if (isLeaf) {
      positions.set(node, { x: leafIndex, y: depth });
      leafIndex++;
      return;
    }
    assignX(node.left, depth + 1);
    assignX(node.right, depth + 1);
    const lx = node.left ? positions.get(node.left)?.x : undefined;
    const rx = node.right ? positions.get(node.right)?.x : undefined;
    const x = lx !== undefined && rx !== undefined ? (lx + rx) / 2 : (lx ?? rx ?? 0);
    positions.set(node, { x, y: depth });
  }
  assignX(root, 0);
  return positions;
}

function renderHuffmanTreeSVG(root) {
  if (!root) return "<p>No data to build a tree from.</p>";
  const positions = layoutTree(root);
  const entries = Array.from(positions.values());
  const maxX = Math.max(0, ...entries.map((p) => p.x));
  const maxY = Math.max(0, ...entries.map((p) => p.y));

  const spacingX = 62;
  const spacingY = 82;
  const padX = 44;
  const padY = 34;
  const width = maxX * spacingX + padX * 2 + 20;
  const height = maxY * spacingY + padY * 2 + 30;

  const px = (p) => padX + p.x * spacingX;
  const py = (p) => padY + p.y * spacingY;

  let edges = "";
  let nodesSvg = "";

  function walk(node) {
    if (!node || node.placeholder) return;
    const p = positions.get(node);

    if (node.left && !node.left.placeholder) {
      const lp = positions.get(node.left);
      edges += `<line x1="${px(p)}" y1="${py(p)}" x2="${px(lp)}" y2="${py(lp)}" stroke="#94a3b8" stroke-width="2"/>`;
      edges += `<text x="${(px(p) + px(lp)) / 2 - 10}" y="${(py(p) + py(lp)) / 2}" font-size="12" fill="#1f2937" font-weight="700">0</text>`;
      walk(node.left);
    }
    if (node.right && !node.right.placeholder) {
      const rp = positions.get(node.right);
      edges += `<line x1="${px(p)}" y1="${py(p)}" x2="${px(rp)}" y2="${py(rp)}" stroke="#94a3b8" stroke-width="2"/>`;
      edges += `<text x="${(px(p) + px(rp)) / 2 + 6}" y="${(py(p) + py(rp)) / 2}" font-size="12" fill="#1f2937" font-weight="700">1</text>`;
      walk(node.right);
    }

    const isLeaf = !node.left && !node.right;
    if (isLeaf) {
      nodesSvg += `<circle cx="${px(p)}" cy="${py(p)}" r="18" fill="#1f2937" stroke="#1f2937" stroke-width="1.5"/>`;
      nodesSvg += `<text x="${px(p)}" y="${py(p) + 4}" font-size="12" font-weight="700" fill="#ffffff" text-anchor="middle">${escapeHTML(node.key)}</text>`;
      nodesSvg += `<text x="${px(p)}" y="${py(p) + 32}" font-size="10" fill="#4b5563" text-anchor="middle">${node.freq}</text>`;
    } else {
      nodesSvg += `<circle cx="${px(p)}" cy="${py(p)}" r="14" fill="#ffffff" stroke="#1f2937" stroke-width="1.5"/>`;
      nodesSvg += `<text x="${px(p)}" y="${py(p) + 3}" font-size="9" fill="#111827" text-anchor="middle">${node.freq}</text>`;
    }
  }
  walk(root);

  return `<svg viewBox="0 0 ${width} ${height}" width="100%" height="${Math.max(200, height)}" xmlns="http://www.w3.org/2000/svg">${edges}${nodesSvg}</svg>`;
}

/**
 * Builds the full report HTML (Huffman Tree + Frequency Table + Compression
 * Statistics) from the quantized (compressed) image's grayscale pixel data,
 * saves it into the localStorage key progressreport.html already reads from,
 * and notifies the Progress Report page to refresh.
 *
 * @param {Object} params
 * @param {Uint8Array|number[]} params.pixelData - grayscale bytes (0-255) of
 *   the QUANTIZED image (call this BEFORE quantized.delete() in OpenCV code).
 * @param {number} params.width
 * @param {number} params.height
 * @param {number} params.qfactor - the Quantization Factor used
 * @param {string} params.imageName - display name of the image processed
 * @param {number} params.lossyCompressionRatio - the (8 - log2(q))/8 ratio
 *   you already compute in lossyHuffmanEncode(), passed through for context
 */
export function generateLossyHuffmanReport({
  pixelData,
  width,
  height,
  qfactor,
  imageName,
  lossyCompressionRatio,
}) {
  if (!pixelData || !pixelData.length) {
    console.warn("generateLossyHuffmanReport: no pixel data supplied.");
    return null;
  }

  // Full histogram over every gray level actually present -> tree/codes/stats
  // computed here are numerically accurate for the whole image.
  const freq = buildFrequencyMap(pixelData);
  const tree = buildHuffmanTree(freq);
  const codes = buildCodes(tree);

  const totalPixels = pixelData.length;
  const originalBits = totalPixels * 8;
  const compressedBits = Object.entries(freq).reduce(
    (sum, [val, f]) => sum + f * (codes[val] ? codes[val].length : 0),
    0
  );
  const huffmanRatio = originalBits ? compressedBits / originalBits : 0;
  const huffmanSavedPercent = (1 - huffmanRatio) * 100;
  const savedBits = originalBits - compressedBits;

  // Full sorted list, for the frequency table + illustrative tree.
  const sortedEntries = Object.entries(freq).sort((a, b) => b[1] - a[1]);

  // Table: show the top 20 gray levels by frequency; summarize the rest so
  // nothing is silently hidden.
  const TOP_N_TABLE = 20;
  const topForTable = sortedEntries.slice(0, TOP_N_TABLE);
  const remainingCount = sortedEntries.length - topForTable.length;
  const remainingPixelSum = sortedEntries
    .slice(TOP_N_TABLE)
    .reduce((sum, [, f]) => sum + f, 0);

  const freqRows = topForTable
    .map(([val, f]) => {
      const code = codes[val] || "-";
      return `<tr>
        <td class="cell-strong">${val}</td>
        <td>${f}</td>
        <td><code>${code}</code></td>
        <td>${code.length} bits</td>
      </tr>`;
    })
    .join("");

  const remainingRow = remainingCount > 0
    ? `<tr><td colspan="4" style="color:#4b5563;font-style:italic;">+ ${remainingCount} more gray levels (${remainingPixelSum} pixels total) not shown here, but included in the statistics below.</td></tr>`
    : "";

  // Tree: a 256-leaf tree is unreadable, so the SVG only illustrates the
  // TOP_N_TREE most frequent gray levels as their own small Huffman tree.
  // The Compression Statistics above/below still reflect the REAL, full
  // histogram - the diagram is for visual intuition only.
  const TOP_N_TREE = 10;
  const topFreqForTree = {};
  sortedEntries.slice(0, TOP_N_TREE).forEach(([val, f]) => { topFreqForTree[val] = f; });
  const illustrativeTree = buildHuffmanTree(topFreqForTree);
  const treeSvg = renderHuffmanTreeSVG(illustrativeTree);

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  body { font-family:'Inter',sans-serif; margin:0; color:#111827; background:#fff; }
  .report-page { padding:20px 4px 28px; }
  h2 { font-size:18px; margin:0 0 10px; color:#111827; }
  p.desc { color:#4b5563; font-size:13px; margin:0 0 14px; }
  table { width:100%; border-collapse:collapse; font-size:14px; }
  th, td { border-bottom:1px solid #e5e7eb; padding:8px 10px; text-align:left; }
  th { background:#f9fafb; font-weight:600; }
  .cell-strong { font-weight:600; }
  code { background:#f3f4f6; padding:1px 6px; border-radius:4px; font-size:13px; }
  .stat-row { display:flex; align-items:center; gap:4px; font-size:14px; margin:8px 0; flex-wrap:wrap; }
  .stat-label { font-weight:600; min-width:200px; }
  .stat-highlight { font-size:22px; font-weight:700; margin-top:4px; }
  .tree-wrap { border:1px solid #d1d5db; border-radius:6px; padding:10px; background:#ffffff; }
  .meta-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px 16px; font-size:14px; margin-bottom:14px; }
</style>
</head>
<body>
<div id="report-root">

  <div class="report-page">
    <h2>Image &amp; Quantization Details</h2>
    <div class="meta-grid">
      <div><strong>Image:</strong> ${escapeHTML(imageName || "Sample Image")}</div>
      <div><strong>Dimensions:</strong> ${width} ${opGlyph("×")} ${height} px</div>
      <div><strong>Quantization Factor:</strong> ${escapeHTML(qfactor)}</div>
      <div><strong>Lossy Compression Ratio:</strong> ${Number(lossyCompressionRatio || 0).toFixed(4)}</div>
    </div>
    <h2>Huffman Tree (Top ${Math.min(TOP_N_TREE, sortedEntries.length)} Gray Levels)</h2>
    <p class="desc">Built from the quantized image's gray-level histogram. Left edge = 0, right edge = 1; each leaf shows a gray-level value and its pixel frequency. Only the most frequent levels are drawn here for readability - the statistics below reflect the complete histogram.</p>
    <div class="tree-wrap">${treeSvg}</div>
  </div>

  <div class="report-page">
    <h2>Frequency Table</h2>
    <p class="desc">Pixel frequency of each gray level (0${opGlyph("-")}255) in the quantized image and its assigned Huffman code.</p>
    <table>
      <thead><tr><th>Gray Level</th><th>Pixel Frequency</th><th>Huffman Code</th><th>Code Length</th></tr></thead>
      <tbody>${freqRows}${remainingRow}</tbody>
    </table>
  </div>

  <div class="report-page">
    <h2>Compression Statistics</h2>
    <div class="stat-row"><span class="stat-label">Total Pixels</span><span>${totalPixels}</span></div>
    <div class="stat-row">
      <span class="stat-label">Original Size</span>
      <span>${totalPixels} ${opGlyph("×")} 8 bits = ${originalBits} bits</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Huffman-Compressed Size</span>
      <span>&#931; (frequency ${opGlyph("×")} code length) = ${compressedBits} bits</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Space Saved</span>
      <span>${originalBits} ${opGlyph("-")} ${compressedBits} = ${savedBits} bits</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Huffman Compression Ratio</span>
      <span>${compressedBits} ${opGlyph("/")} ${originalBits} ${opGlyph("×")} 100 = ${huffmanRatio > 0 ? (huffmanRatio * 100).toFixed(2) : "0.00"}%</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Quantization Compression Ratio</span>
      <span>${Number(lossyCompressionRatio || 0).toFixed(4)}</span>
    </div>
    <div class="stat-highlight">${huffmanSavedPercent.toFixed(2)}% space saved (Huffman coding on quantized data)</div>
  </div>

</div>
</body></html>`;

  try {
   window.parent.postMessage({
  type: 'vlab:simulation_report_generated',
  html: html,
  updatedAt: String(Date.now())  
}, window.location.origin); 
  } catch (e) {
    console.error("Could not save Huffman report to localStorage", e);
  }

  // Notify whichever host actually exists - popup opener OR parent iframe -
  // instead of assuming only window.opener (which silently no-ops when this
  // page is embedded as an iframe rather than opened as a popup).
  try {
    if (window.opener) {
      window.opener.postMessage({ type: "vlab:simulation_report_generated" }, "*");
    }
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: "vlab:simulation_report_generated" }, "*");
    }
  } catch (e) {}

  return html;
}