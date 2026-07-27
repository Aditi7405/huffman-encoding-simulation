import '../template.css'
import React from 'react';
import { Children, useEffect, useRef, useState } from 'react';
import { OpenCvProvider } from 'opencv-react';
import divide from '../assets/images/divide_sign.png';
import multiply from '../assets/images/x_sign.png';
import minus from '../assets/images/minus_sign.png';
import plus from '../assets/images/plus_sign.png';
import Tree from 'react-d3-tree';
import HuffmanTree from './hufftree';
import HuffmanTreeViewer from './htimage';
import Box from '@mui/material/Box';
import html2pdf from 'html2pdf.js';

class TreeErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: '#888', textAlign: 'center' }}>
          Tree rendering... click Next Step to continue.
        </div>
      );
    }
    return this.props.children;
  }
}

export default function HuffmanAnimation({
    symbolTextToggleRef, analyzeFreqRef, freqTableRef, generateBtnRef, 
  nextStepBtnRef, prevStepBtnRef, resetBtnRef, treeVisualizationRef,
  onSymbolSelected, onAnalyzeDone, onTextEntered, onRegisterReset,
  symbolBoxRef,textInputBoxRef, onGenerate, onReset, treeDescriptionRef,
  encodedTableRef,onStepsGenerated, onNextStepDone, onTreeComplete,
  onNewInput, onInputModeChange,
  preTestResult, postTestResult,
}) {
    const [image,setImage]=useState(0);
    const [original,setOriginal]=useState(null);
    const [tdata,setTdata]=useState('');
    const [frequencyData, setFrequencyData] = useState([]);
    const [text, setText] = useState("");
    const [steps, setSteps] = useState([]);
    const [tree, setTree] = useState(null);
    const [playing, setPlaying] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [showInitialNodes, setShowInitialNodes] = useState(false);
    const [encodedTable, setEncodedTable] = useState([]);
    const [encodedText, setEncodedText] = useState("");
    const [treeReady,setTreeReady] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [showEdgeExplanation, setShowEdgeExplanation] = useState(false);
    const [inputMode, setInputMode] = useState('symbol');

    const hasNotifiedTextRef = useRef(false);
    const experimentStartRef = useRef(null);
    const experimentEndRef = useRef(null);

    // Mark the experiment start the moment this simulation mounts,
    // so the report can show Start Time / End Time / Total Time Spent.
    useEffect(() => {
      experimentStartRef.current = Date.now();
    }, []);

    useEffect(() => {
      if (onRegisterReset) {
        onRegisterReset(() => {
          setCurrentStep(-1);
          setTree(null);
          setShowInitialNodes(false);
          setIsComplete(false);
          setFrequencyData([]);
          setTdata('');
          setShowEdgeExplanation(false);
          setEncodedTable([]);
          setEncodedText('');
          setTreeReady(false);
          setOriginal(null);
          setImage(0);
          experimentStartRef.current = Date.now();
          experimentEndRef.current = null;
        });
      }
    }, []);

    useEffect(() => {
        if (onInputModeChange) onInputModeChange(inputMode);
    }, [inputMode]);

    function convertNode(node) {
      if (!node) return null;
      const children = [
        node.left ? convertNode(node.left) : null,
        node.right ? convertNode(node.right) : null,
      ].filter(Boolean);

      return {
        name: `${node.char || '*'} (${node.freq})`,
        children: children, 
      };
    }

    
    function convertForestToD3(nodes) {
      if (!nodes || nodes.length === 0) return null;

      const converted = nodes
        .map(node => convertNode(node))
        .filter(Boolean);

      if (converted.length === 0) return null;

      if (converted.length === 1) {
        return {
          name: converted[0].name,
          children: converted[0].children?.length > 0 
          ? converted[0].children 
          : [{ name: 'leaf', children: [] }],
        };
      }

      return {
        name: "root",
        children: converted,
      };
    }

    function generateCodes(node, code = "", map = {}) {
      if (!node.left && !node.right) {
          map[node.char] = code || "0";
      }
      if (node.left) {
          generateCodes(node.left, code + "0", map);
      }
      if (node.right) {
          generateCodes(node.right, code + "1", map);
      }
      return map;
    }

    function generateHuffmanSteps(data) {
        let nodes = data.map(item => ({
            char: item.char,
            freq: item.freq,
            left: null,
            right: null
        }));

        let animationsteps = [];

        while (nodes.length > 1) {
            nodes.sort((a,b) => a.freq - b.freq);

            let currentForest = [...nodes];
            let left = nodes.shift();
            let right = nodes.shift();

            animationsteps.push({
                type: "select",
                left,
                right,
                forest: currentForest
            });

            let parent = {
                char: left.char + right.char,
                freq: left.freq + right.freq,
                left,
                right
            };
            nodes.push(parent);
            
            nodes.sort((a,b) => a.freq - b.freq);

            animationsteps.push({
                type: "merge",
                forest: [...nodes],
                parent, left, right
            });
        }
        return animationsteps;
    }    

    function handleAnalyze(){
  let freqMap = {};

  if(inputMode === 'symbol' && original){
    for (let row of original) {
      for (let cell of row) {
        const key = cell === 1 ? "1" : "0";
        freqMap[key] = (freqMap[key] || 0) + 1;
      }
    }
    if (onAnalyzeDone) onAnalyzeDone(); 
  } else {
    for (let char of tdata) {
      if (char !== " ") {
        freqMap[char] = (freqMap[char] || 0) + 1;
      }
    }
    if (onAnalyzeDone) onAnalyzeDone();
  }

      const result = Object.entries(freqMap).map(([char, freq]) => ({char, freq}));
      setFrequencyData(result);

      const generatedSteps = generateHuffmanSteps(result);
      setSteps(generatedSteps);
      setCurrentStep(-1);
      setTree(null);
      setShowInitialNodes(false);
      setEncodedTable([]);
      setEncodedText("");
      setTreeReady(false);
    }

    function handleGenerateTree(){
      if(!frequencyData || frequencyData.length === 0){
          return;
      }
      setCurrentStep(-1);
      setShowInitialNodes(true);

      const initialNodes = [...frequencyData]
      .sort((a,b) => a.freq - b.freq)
      .map(item => ({
          char: item.char,
          freq: item.freq,
          left: null,
          right: null
      }));

      setTree(convertForestToD3(initialNodes));

      let nodes = [...initialNodes];

      while(nodes.length > 1){
          nodes.sort((a,b) => a.freq - b.freq);
          let left = nodes.shift();
          let right = nodes.shift();
          let parent = {
              char: left.char + right.char,
              freq: left.freq + right.freq,
              left,
              right
          };
          nodes.push(parent);
      }

      const rootNode = nodes[0];
      const codeMap = generateCodes(rootNode);

      const tableData = Object.keys(codeMap).map((char) => ({
          char,
          freq: frequencyData.find(item => item.char === char)?.freq,
          code: codeMap[char]
      }));

      let finalEncoded = "";
      for (let ch of tdata) {
          if(ch !== " ") {
              finalEncoded += codeMap[ch] || "";
          }
      }

      setEncodedTable(tableData);
      setEncodedText(finalEncoded);
      setTreeReady(true);
      setIsComplete(false);
      if (onStepsGenerated) onStepsGenerated(steps.length);
    }
    function computeReportStats() {
  const totalSymbols = frequencyData.reduce((sum, item) => sum + item.freq, 0);
  const originalBitsPerSymbol = inputMode === 'symbol' ? 1 : 8; // bitmap = 1 bit/pixel, text = 8 bits/char (ASCII)
  const originalSizeBits = totalSymbols * originalBitsPerSymbol;

  const compressedSizeBits = encodedTable.reduce((sum, item) => {
    const freqItem = frequencyData.find(f => f.char === item.char);
    return sum + (freqItem ? freqItem.freq * item.code.length : 0);
  }, 0);

  const compressionRatio = originalSizeBits > 0 ? (compressedSizeBits / originalSizeBits) : 0;
  const spaceSaved = originalSizeBits > 0 ? (1 - compressionRatio) * 100 : 0;

  return { totalSymbols, originalSizeBits, compressedSizeBits, compressionRatio, spaceSaved };
}

// ---------- small inline SVG glyphs (avoid literal -, ×, ÷ characters) ----------
function opGlyph(op) {
  const common = 'style="display:inline-block;vertical-align:middle;margin:0 3px;"';
  if (op === "-") {
    return `<svg width="13" height="13" viewBox="0 0 12 12" ${common} aria-hidden="true"><rect x="1" y="5" width="10" height="2" rx="1" fill="currentColor"/></svg>`;
  }
  if (op === "×") {
    return `<svg width="13" height="13" viewBox="0 0 12 12" ${common} aria-hidden="true"><line x1="1.5" y1="1.5" x2="10.5" y2="10.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="10.5" y1="1.5" x2="1.5" y2="10.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
  }
  if (op === "÷") {
    return `<svg width="13" height="13" viewBox="0 0 12 12" ${common} aria-hidden="true"><circle cx="6" cy="2.6" r="1.3" fill="currentColor"/><rect x="1" y="5" width="10" height="2" rx="1" fill="currentColor"/><circle cx="6" cy="9.4" r="1.3" fill="currentColor"/></svg>`;
  }
  return op;
}

function escapeHTMLForReport(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

// ---------- timing helpers for the report (Start Time / End Time / Total Time Spent) ----------
function formatClockTime(ts) {
  if (!ts) return "--:--:--";
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function formatDuration(ms) {
  if (!ms || ms < 0) return "0 sec";
  const totalSec = Math.round(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min > 0) return `${min} min ${sec} sec`;
  return `${sec} sec`;
}

// Build a real Huffman tree from {char, freq} entries so the report shows
// the ACTUAL tree used for this run's codes, not an illustrative one.
function buildReportHuffmanTree(entries) {
  let nodes = entries.map(({ char, freq }) => ({ key: char, freq, left: null, right: null }));
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

function layoutReportTree(root) {
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

function renderReportHuffmanTreeSVG(root) {
  if (!root) return "<p>No data to build a tree from.</p>";
  const positions = layoutReportTree(root);
  const entries = Array.from(positions.values());
  const maxX = Math.max(0, ...entries.map((p) => p.x));
  const maxY = Math.max(0, ...entries.map((p) => p.y));

  const spacingX = 64;
  const spacingY = 84;
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
      nodesSvg += `<circle cx="${px(p)}" cy="${py(p)}" r="20" fill="#1d2a6d" stroke="#1d2a6d" stroke-width="1.5"/>`;
      nodesSvg += `<text x="${px(p)}" y="${py(p) + 4}" font-size="12" font-weight="700" fill="#ffffff" text-anchor="middle">${escapeHTMLForReport(node.key)}</text>`;
      nodesSvg += `<text x="${px(p)}" y="${py(p) + 34}" font-size="10" fill="#4b5563" text-anchor="middle">${node.freq}</text>`;
    } else {
      nodesSvg += `<circle cx="${px(p)}" cy="${py(p)}" r="15" fill="#ffffff" stroke="#1d2a6d" stroke-width="1.5"/>`;
      nodesSvg += `<text x="${px(p)}" y="${py(p) + 3}" font-size="9" fill="#111827" text-anchor="middle">${node.freq}</text>`;
    }
  }
  walk(root);

  return `<svg viewBox="0 0 ${width} ${height}" width="100%" height="${Math.max(220, height)}" xmlns="http://www.w3.org/2000/svg">${edges}${nodesSvg}</svg>`;
}

function buildReportHtmlString({ inputMode, image, tdata, encodedTable, stats, timing, preTest, postTest }) {
  const symbolLabels = ['Plus (+)', `Minus (${opGlyph("-")})`, 'Multiply (×)', 'Divide (÷)'];
  const inputLabel = inputMode === 'symbol'
    ? (symbolLabels[image] || 'Symbol')
    : `"${escapeHTMLForReport(tdata)}"`;

  const freqRows = encodedTable.map(item =>
    `<tr>
      <td>${escapeHTMLForReport(item.char)}</td>
      <td>${item.freq}</td>
      <td><code style="background:#f3f4f6;padding:1px 6px;border-radius:4px;">${item.code}</code></td>
      <td>${item.code.length} bits</td>
    </tr>`
  ).join('');

  const treeEntries = encodedTable.map(item => ({ char: item.char, freq: item.freq }));
  const reportTree = buildReportHuffmanTree(treeEntries);
  const treeSvg = renderReportHuffmanTreeSVG(reportTree);

  const savedBits = stats.originalSizeBits - stats.compressedSizeBits;
  const generatedOn = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const startLabel = formatClockTime(timing?.startTime);
  const endLabel = formatClockTime(timing?.endTime);
  const durationLabel = timing?.startTime && timing?.endTime
    ? formatDuration(timing.endTime - timing.startTime)
    : "--";

  function testCardHtml(label, test) {
    if (!test || typeof test.score !== "number" || typeof test.total !== "number") return "";
    const pct = test.total > 0 ? ((test.score / test.total) * 100).toFixed(1) : "0.0";
    return `
        <div class="results-card">
          <h3>${label}</h3>
          <div class="info-grid">
            <div class="info-card"><span class="label">Score:</span>${test.score} / ${test.total}</div>
            <div class="info-card"><span class="label">Percentage:</span>${pct}%</div>
          </div>
        </div>`;
  }

  const preTestHtml = testCardHtml("Pre-Test", preTest);
  const postTestHtml = testCardHtml("Post-Test", postTest);
  const testsSectionHtml = (preTestHtml || postTestHtml)
    ? `
    <div class="section results-section">
      <h2>Assessment</h2>
      <div class="results-stack">
        ${preTestHtml}
        ${postTestHtml}
      </div>
    </div>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
<style>
  body {
    font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
    background: linear-gradient(180deg, #eef4fb 0%, #f7f9fc 100%);
    color: #1f2d3d;
    margin: 0;
    padding: 30px 22px 44px;
    line-height: 1.65;
  }
  .report-page {
    max-width: 900px;
    margin: 0 auto 24px;
    padding: 34px 34px 30px;
    background-color: #ffffff;
    border-radius: 18px;
    border: 1px solid #dfe7f1;
    box-shadow: 0 18px 38px rgba(23, 50, 77, 0.12);
    box-sizing: border-box;
  }
  .report-page:last-of-type { margin-bottom: 0; }
  h1, h2, h3 { color: #1f2d3d; margin-top: 0; font-weight: 700; }
  h2 { font-size: 23px; margin-bottom: 16px; color: #243b53; }
  h3 { font-size: 17px; margin-bottom: 10px; color: #2d4b68; }
  p { margin: 0 0 12px; }
  li { margin-bottom: 6px; }

  .header-row {
    display: grid;
    grid-template-columns: 108px 1fr 108px;
    align-items: center;
    gap: 20px;
    margin-bottom: 24px;
  }
  .vl-logo { height: 84px; width: auto; max-width: 120px; object-fit: contain; flex-shrink: 0; justify-self: center; }
  .report-title-block { text-align: center; margin: 0; padding-bottom: 14px; border-bottom: 3px solid #2f7bfa; }
  .report-kicker { margin: 0 0 6px; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: #5d7794; font-weight: 700; }
  .report-subtitle { margin: 8px 0 0; font-size: 14px; color: #5c6f84; }

  .report-overview-top { display: flex; justify-content: space-between; align-items: center; gap: 14px; margin-bottom: 12px; }
  .badge { margin: 0; padding: 8px 14px; border-radius: 20px; background: #e8f1ff; color: #1f62d0; font-weight: 600; font-size: 13px; }
  .report-stamp { margin: 0; padding: 8px 12px; border-radius: 999px; background: #ffffff; border: 1px solid #dce5ef; color: #50657c; font-size: 13px; font-weight: 600; }
  .report-experiment-label { margin: 0 0 6px; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: #60778f; font-weight: 700; }
  .report-experiment-title { margin: 0 0 18px; font-size: 25px; line-height: 1.3; font-weight: 700; color: #16324b; }

  .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-top: 12px; }
  .info-card {
    background: #fff; border: 1px solid #e5e9f2; border-radius: 10px; padding: 12px 14px;
    box-shadow: 0 4px 10px rgba(31,45,61,0.05); font-size: 14px; min-height: 60px;
    display: flex; flex-direction: column; justify-content: center; gap: 4px;
  }
  .label { font-weight: 600; color: #1f2d3d; display: block; margin-bottom: 2px; }

  .section {
    background: linear-gradient(180deg, #f9fbfe 0%, #f4f7fb 100%);
    padding: 22px 24px; margin-bottom: 24px; border-radius: 14px;
    border: 1px solid #e0e8f2; box-shadow: 0 6px 16px rgba(31,45,61,0.05);
  }
  .section:last-child { margin-bottom: 0; }

  ul.two-column-list { column-count: 2; column-gap: 40px; list-style: disc; padding-left: 20px; margin-top: 10px; }

  .results-stack { display: grid; gap: 18px; }
  .results-card {
    background: #ffffff; border: 1px solid #dde6f0; border-radius: 14px; padding: 18px;
    box-shadow: 0 4px 12px rgba(31,45,61,0.05);
  }
  .results-card h3 { margin-bottom: 12px; text-align: left; }

  .table-shell { overflow: hidden; border: 1px solid #dce6f2; border-radius: 12px; }
  table.compact-table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-top: 0; }
  .compact-table th, .compact-table td { border: 1px solid #e5e9f2; padding: 10px 12px; text-align: center; font-size: 14px; vertical-align: middle; }
  .compact-table th { background: linear-gradient(135deg, #2f7bfa 0%, #1f62d0 100%); color: #fff; font-weight: 700; }
  .compact-table tr:nth-child(even) { background-color: #f8fbff; }

  .graph { text-align: center; margin-top: 0; }
  .report-graph-card { padding: 18px; }
  .tree-wrap {
    width: 100%; overflow-x: auto; display: flex; justify-content: center;
    background: linear-gradient(180deg, #f8fbfe 0%, #eef5fb 100%);
    border: 1px solid #dde8f3; border-radius: 12px; padding: 16px;
  }

  .report-actions { display: flex; justify-content: flex-end; gap: 12px; max-width: 900px; margin: 28px auto 0; }
  .print-btn, .download-btn {
    padding: 12px 24px; font-size: 15px; border: none; border-radius: 30px; color: white;
    cursor: pointer; transition: all 0.25s ease;
  }
  .print-btn { background: linear-gradient(to right, #2f7bfa, #1f62d0); }
  .download-btn { background: linear-gradient(to right, #28a745, #1f8d38); }
  .print-btn:hover, .download-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 14px rgba(31,45,61,0.12); }
  .print-btn:disabled, .download-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

  @media print {
    .print-btn, .download-btn, .report-actions { display: none !important; }
    body { margin: 0; padding: 0; background: #ffffff; }
    .report-page { margin: 0 0 14px; padding: 24px 26px 22px; border: none; box-shadow: none; border-radius: 0; }
  }
</style>
</head>
<body id="report-root">
  <div id="pdf-export-root">
    <div class="report-page">
      <div class="header-row">
        <img src="images/IITLOGO.png" class="vl-logo" ">
        <div class="report-title-block">
          <p class="report-kicker"></p>
          <h2>Virtual Labs Simulation Report</h2>
        </div>
        <img src="images/image.png" class="vl-logo" onerror="this.style.display='none'">
      </div>

      <div class="section report-overview">
        <div class="report-overview-top">
          <p class="badge">Image Processing Lab</p>
          <p class="report-stamp">Generated on ${generatedOn}</p>
        </div>
        <p class="report-experiment-label">Experiment Title</p>
        <p class="report-experiment-title">Huffman Coding for Lossless Image Compression</p>

        <div class="info-grid">
          <div class="info-card"><span class="label">Start Time:</span>${startLabel}</div>
          <div class="info-card"><span class="label">End Time:</span>${endLabel}</div>
          <div class="info-card"><span class="label">Total Time Spent:</span>${durationLabel}</div>
        </div>

      </div>

      <div class="section">
        <h2>Summary</h2>
        <h3>Aim</h3>
        <p>To study Huffman Coding for lossless data compression by analyzing symbol frequencies, constructing the Huffman tree, and generating optimal prefix codes.</p>
        <h3>Simulation Summary</h3>
        <p>The ${inputMode === 'symbol' ? 'selected symbol' : 'entered text'} was analyzed for symbol frequencies, a Huffman tree was constructed, and binary codes were assigned. The original data required ${stats.originalSizeBits} bits, while the Huffman-encoded data required only ${stats.compressedSizeBits} bits &mdash; a space saving of ${stats.spaceSaved.toFixed(1)}%.</p>
        <h3>Components and Key Parameters</h3>
        <ul class="two-column-list">
          <li>Input Mode: ${inputMode === 'symbol' ? 'Symbol' : 'Text'}</li>
          <li>Input Data: ${inputLabel}</li>
          <li>Total Symbols: ${stats.totalSymbols}</li>
          <li>Unique Symbols: ${encodedTable.length}</li>
          <li>Original Size: ${stats.originalSizeBits} bits</li>
          <li>Compressed Size: ${stats.compressedSizeBits} bits</li>
          <li>Bits Saved: ${savedBits} bits</li>
          <li>Space Saved: ${stats.spaceSaved.toFixed(1)}%</li>
        </ul>
      </div>
      ${testsSectionHtml}
    </div>

    <div class="report-page report-page--results">
      <div class="section results-section">
        <h2>Results</h2>
        <div class="results-stack">
          <div class="results-card">
            <h3>Frequency & Code Table</h3>
            <div class="table-shell">
              <table class="compact-table">
                <thead>
                  <tr><th>Character</th><th>Frequency</th><th>Code</th><th>Code Length</th></tr>
                </thead>
                <tbody>
                  ${freqRows}
                </tbody>
              </table>
            </div>
          </div>

          <div class="graph report-graph-card results-card">
            <h3>Huffman Tree</h3>
            <div class="tree-wrap">
              ${treeSvg}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="report-actions">
    <button class="download-btn" onclick="downloadPdfReport(this)">⬇ DOWNLOAD</button>
    <button class="print-btn" onclick="window.print()">PRINT</button>
  </div>

  <script>
    function downloadPdfReport(btn) {
      if (typeof html2pdf === 'undefined') {
        alert('PDF library abhi load ho rahi hai, thoda ruk kar dubara try karein.');
        return;
      }
      btn.disabled = true;
      var originalText = btn.textContent;
      btn.textContent = 'Preparing PDF...';

      html2pdf()
        .set({
          margin: 10,
          filename: 'huffman_simulation_report_' + Date.now() + '.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['css'], avoid: '.report-page' }
        })
        .from(document.getElementById('pdf-export-root'))
        .save()
        .then(function () {
          btn.disabled = false;
          btn.textContent = originalText;
        })
        .catch(function (err) {
          console.error('PDF generation failed:', err);
          alert('PDF banane mein error aayi: ' + err.message);
          btn.disabled = false;
          btn.textContent = originalText;
        });
    }
  </script>
</body>
</html>`;
}

function sendSimulationReport(ctx) {
  console.log("sendSimulationReport called, window.opener:", window.opener);
  if (!window.opener && window.parent === window) return; // no parent/opener to receive it

  const stats = computeReportStats();
  const reportHtml = buildReportHtmlString({
    inputMode: ctx.inputMode,
    image: ctx.image,
    tdata: ctx.tdata,
    encodedTable: ctx.encodedTable,
    stats,
    timing: {
      startTime: ctx.startTime,
      endTime: ctx.endTime
    },
    preTest: ctx.preTest,
    postTest: ctx.postTest
  });

  const updatedAt = String(Date.now());

  try {
    localStorage.setItem("vlab_exp2_simulation_report_html", reportHtml);
    localStorage.setItem("vlab_exp2_simulation_report_updated_at", updatedAt);
  } catch (e) {
    console.error("Failed to persist simulation report to localStorage:", e);
  }

  try {
    window.parent.postMessage({
      type: 'vlab:simulation_report_generated',
      html: reportHtml,
      updatedAt
    }, "*");
  } catch (e) {
    console.error("postMessage to parent failed:", e);
  }

  // Popup-window fallback (when this component runs in a window.open'd tab
  // instead of an iframe) — same event, same string-timestamp format so
  // progressreport.html's Number(value) parsing stays consistent either way.
  if (window.opener) {
    try {
      window.opener.postMessage({
        type: 'vlab:simulation_report_generated',
        html: reportHtml,
        updatedAt
      }, "*");
    } catch (e) {
      console.error("postMessage to opener failed:", e);
    }
  }
}

    // ---------- Download Report button handler (in-simulation) ----------
    function handleDownloadReport(){
      if (!encodedTable || encodedTable.length === 0) return;
      const stats = computeReportStats();
      const reportHtml = buildReportHtmlString({
        inputMode, image, tdata, encodedTable, stats,
        timing: {
          startTime: experimentStartRef.current,
          endTime: experimentEndRef.current
        },
        preTest: preTestResult,
        postTest: postTestResult
      });

      // Use a hidden iframe (not a bare div) so the report's own <style> tag
      // is actually applied — assigning the full HTML string to a div's
      // innerHTML silently strips <html>/<head>/<style>, which caused the
      // earlier "unstyled PDF" issue.
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.left = '-99999px';
      iframe.style.top = '0';
      iframe.style.width = '900px';
      iframe.style.height = '1400px';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);

      iframe.onload = () => {
        try {
          const doc = iframe.contentDocument;
          const root = doc.getElementById('pdf-export-root');
          if (!root) {
            document.body.removeChild(iframe);
            return;
          }
          html2pdf()
            .set({
              margin: 10,
              filename: `huffman_simulation_report_${Date.now()}.pdf`,
              image: { type: 'jpeg', quality: 0.98 },
              html2canvas: { scale: 2, useCORS: true },
              jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' },
              pagebreak: { mode: ['css'], avoid: '.report-page' }
            })
            .from(root)
            .save()
            .then(() => document.body.removeChild(iframe))
            .catch((err) => {
              console.error('PDF generation failed:', err);
              document.body.removeChild(iframe);
            });
        } catch (err) {
          console.error('PDF generation failed:', err);
          document.body.removeChild(iframe);
        }
      };

      iframe.srcdoc = reportHtml;
    }

    function handleNextStep(){
        if(currentStep >= steps.length - 1){
            setIsComplete(true);
            experimentEndRef.current = Date.now();
            if(onTreeComplete) onTreeComplete();
            sendSimulationReport({
                inputMode, image, tdata, encodedTable,
                startTime: experimentStartRef.current,
                endTime: experimentEndRef.current,
                preTest: preTestResult,
                postTest: postTestResult
            });
            return;
        }
        const next = currentStep + 1;
        setCurrentStep(next);
        if (onNextStepDone) onNextStepDone(next, steps.length);
        const step = steps[next];

        if(step.type === "select"){
            const leftName = `${step.left.char} (${step.left.freq})`;
            const rightName = `${step.right.char} (${step.right.freq})`;

            const allNodes = step.forest.map(node => {    
                const nodeName = `${node.char} (${node.freq})`;
                const isOrange = nodeName === leftName || nodeName === rightName;
            
                if(isOrange){       
                    return convertNode(node);
                } else {
                    return { name: nodeName, children: [] };
                }
            }); 
        
            setTree({
                name: "virtual_root",
                children: allNodes.filter(Boolean),
            });
            setShowEdgeExplanation(false);
        }
        else if(step.type === "merge"){
            setTree(convertForestToD3(steps[next].forest));
            setShowEdgeExplanation(true);
        }
    }

    const current = tree && steps.length > 0 ? steps[currentStep] : null;

    const initialNodes = [...frequencyData]
    .sort((a,b) => a.freq - b.freq)
    .map(item => ({
        char: item.char,
        freq: item.freq
    }));                
    
    function handlePreviousStep(){
        if(currentStep <= -1){
            return;
        }
        if(currentStep === 0){
            setCurrentStep(-1);
            setTree(null);
            setShowEdgeExplanation(false);
            setIsComplete(false);
            return;
        }

        const prev = currentStep - 1;
        setCurrentStep(prev);
        const step = steps[prev];
        setIsComplete(false);

        if (step.type === "select"){
            const leftName = `${step.left.char} (${step.left.freq})`;
            const rightName = `${step.right.char} (${step.right.freq})`;

            const allNodes = step.forest.map(node => {
                const nodeName = `${node.char} (${node.freq})`;
                const isSelected = nodeName === leftName || nodeName === rightName;

                if(isSelected){
                    return convertNode(node);
                } else {
                    return { name: nodeName, children: [] };
                }
            });    
            
            setTree({
                name: "virtual_root",
                children: allNodes.filter(Boolean),
            });
            setShowEdgeExplanation(false);
        }
        else if(step.type === "merge"){
            setTree(convertForestToD3(step.forest));
            setShowEdgeExplanation(true);
        }
    }

    function handleImage(x){
    console.log('handleImage called, onNewInput exists:', !!onNewInput);
      if (onNewInput) onNewInput();
      setCurrentStep(-1);
      setTree(null);
      setShowInitialNodes(false);
      setIsComplete(false);
      setFrequencyData([]);
      setEncodedTable([]);
      setEncodedText('');
      setShowEdgeExplanation(false);
      setTreeReady(false);

      setImage(x);
      const signs = [
          [
              [0, 0, 0, 1, 0, 0, 0],
              [0, 0, 0, 1, 0, 0, 0],
              [0, 0, 0, 1, 0, 0, 0],
              [1, 1, 1, 1, 1, 1, 1],
              [0, 0, 0, 1, 0, 0, 0],
              [0, 0, 0, 1, 0, 0, 0],
              [0, 0, 0, 1, 0, 0, 0],
          ], // Plus
          [
              [0, 0, 0, 0, 0, 0, 0],
              [0, 0, 0, 0, 0, 0, 0],
              [0, 0, 0, 0, 0, 0, 0],
              [1, 1, 1, 1, 1, 1, 1],
              [0, 0, 0, 0, 0, 0, 0],
              [0, 0, 0, 0, 0, 0, 0],
              [0, 0, 0, 0, 0, 0, 0],
          ], // Minus
          [
              [1, 0, 0, 0, 0, 0, 1],
              [0, 1, 0, 0, 0, 1, 0],
              [0, 0, 1, 0, 1, 0, 0],
              [0, 0, 0, 1, 0, 0, 0],
              [0, 0, 1, 0, 1, 0, 0],
              [0, 1, 0, 0, 0, 1, 0],
              [1, 0, 0, 0, 0, 0, 1],
          ], // Multiply
          [
              [0, 0, 0, 0, 0, 0, 0],
              [0, 0, 0, 1, 0, 0, 0],
              [0, 0, 0, 0, 0, 0, 0],
              [1, 1, 1, 1, 1, 1, 1],
              [0, 0, 0, 0, 0, 0, 0],
              [0, 0, 0, 1, 0, 0, 0],
              [0, 0, 0, 0, 0, 0, 0],
          ], // Divide
      ];
      setOriginal(signs[x]);
      
      let freqMap = {};
      for (let row of signs[x]) {
          for (let cell of row) {
              const key = cell === 1 ? "1" : "0";
              freqMap[key] = (freqMap[key] || 0) + 1;
          }
      }
      if (onSymbolSelected) {
          onSymbolSelected(x);
      }
    }

    return(
        <OpenCvProvider>
        <div id="main-box-temp">
        <div className="left-column">
            <div id="main-layout">

    {/* LEFT SIDE */}
    <div className="left-side">

    <div 
    ref={symbolTextToggleRef}
    style={{
    display: 'flex',
    border: '2px solid #1d2a6d',
    borderRadius: '10px',
    overflow: 'hidden',
    marginBottom: '12px',
    width: '100%'
    }}>
    <button
    onClick={() => { setInputMode('symbol'); setTdata(''); }}
    style={{
      flex: 1,
      padding: '10px',
      background: inputMode === 'symbol' ? '#1d2a6d' : 'white',
      color: inputMode === 'symbol' ? 'white' : '#1d2a6d',
      border: 'none',
      fontWeight: 700,
      fontSize: '13px',
      cursor: 'pointer',
      transition: '0.3s'
    }}>
    🔣 Symbol
    </button>
    <button
    onClick={() => { 
        setInputMode('text'); 
        setOriginal(null); 
        setImage(0); 
        }}
    style={{
      flex: 1,
      padding: '10px',
      background: inputMode === 'text' ? '#1d2a6d' : 'white',
      color: inputMode === 'text' ? 'white' : '#1d2a6d',
      border: 'none',
      fontWeight: 700,
      fontSize: '13px',
      cursor: 'pointer',
      transition: '0.3s'
    }}>
    📝 Text Input
    </button>
    </div>

{/* SYMBOL BOX */}  
    <div id="Choose_box_comp" ref={symbolBoxRef}
    style={{
    opacity: inputMode === 'symbol' ? 1 : 0.3,
    pointerEvents: inputMode === 'symbol' ? 'auto' : 'none',
    transition: '0.3s',
    position: 'relative',
    zIndex: 9999999,
    }}>
    <div className="coolinput_comp">
    <label htmlFor="input" className="text">Choose:</label>
    <Box sx={{
      width: '100%', height: '85%',
      display: 'flex', flexDirection: 'row',
      border: 1, borderRadius: 2, justifyContent: 'space-around'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div id="image-box-comp">
          <div onClick={() => handleImage(0)}>
          <img src={plus} id="image" />
          </div>
          <div onClick={() => handleImage(1)}>
          <img src={minus} id="image" />
          </div>
          <div onClick={() => handleImage(2)}>
          <img src={multiply} id="image" />
          </div>
          <div onClick={() => handleImage(3)}>
          <img src={divide} id="image" />
          </div>
        </div>
      </div>
      </Box>
      </div>
    </div>

{/* TEXT INPUT BOX */}
    <textarea
    ref={textInputBoxRef}
    className="text_box"
    placeholder='Enter data here'
    value={tdata}
    onChange={(e) => { 
        const newVal = e.target.value;
        setTdata(newVal);
        if (newVal.length === 0 ) {
        hasNotifiedTextRef.current = false;
        setTdata(e.target.value);
        //setTdata(newVal);
        setCurrentStep(-1);
        setTree(null);
        setShowInitialNodes(false);
        setIsComplete(false);
        setFrequencyData([]);
        setEncodedTable([]);
        setEncodedText('');
        setShowEdgeExplanation(false);
        setOriginal(null);
        setImage(0);
        }
        if (newVal.length > 0 && !hasNotifiedTextRef.current && onTextEntered) {
            console.log('onTextEntered firing, length:', newVal.length, 'hasNotified:', hasNotifiedTextRef.current);
        hasNotifiedTextRef.current = true;
        onTextEntered();
        }
    }}
    disabled={inputMode === 'symbol'}
    style={{
    opacity: inputMode === 'text' ? 1 : 0.3,
    cursor: inputMode === 'symbol' ? 'not-allowed' : 'auto',
    transition: '0.3s',
    resize: 'none',
    position: 'relative',
    zIndex: 9999999,
   }}/>
    <button  
    ref={analyzeFreqRef}
    className= "analyze-btn" onClick={handleAnalyze}>
         Analyze Frequency
     </button>
        {original && (
        <div id="row3-temp">
        <div className='preview-box'>
            <div 
            style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {original && original.map((row, rowIndex) => row.map((cell, cellIndex) => (
            <div
            key={`${rowIndex}-${cellIndex}`}
            id="huff_matrix"
            style={{ backgroundColor: cell === 0 ? '#0f172a' : '#f8fafc',}}
            ></div>
            ))
            )}
            </div>
        </div>
    </div>
    )}

    </div>

    {/* RIGHT SIDE */}
    <div className="right-side">
       <div className="visual-header">
        <div>
            <h2>
                Huffman Tree Visualization
            </h2> 
            <p>
                Step-by-step encoding simulation
            </p>       
        </div>
        </div>
        {frequencyData.length > 0 && (
        <div 
        ref={freqTableRef}
        className="panel frequency-panel">
        <h2>Frequency Analysis</h2>

        <table className="frequency-table">
            <tbody>
                <tr>
                    <th>Character</th>
                    {frequencyData.map((item, index) => (
                        <td key={index}>
                            {item.char}
                        </td>
                    ))}
                </tr>
                <tr>
                    <th>Frequency</th>
                    {frequencyData.map((item, index) => (
                        <td key={index}>
                            {item.freq}
                        </td>
                    ))}
                </tr>
            </tbody>
        </table>
        <div className="frequency-explanation">
        <h3>Why Frequency Analysis?</h3>
        <p>
            Huffman Coding uses character frequencies to build an efficient binary tree.
            Characters with higher frequency get shorter binary codes.
        </p>
        </div>
    </div>
    )}
    
    <div className="bottom-section">
      <div 
      
      className="tree-section">
        <div 
         className="tree-header">
        TREE VISUALIZATION
        </div>
        <div className="controls-bottom">
            <button 
            ref={generateBtnRef}
            className="control-btn"
                onClick={ () => {
                    handleGenerateTree();
                    if (onGenerate) onGenerate();
                }}
                disabled={frequencyData.length === 0 || (showInitialNodes && !isComplete)}
                style={{ opacity: frequencyData.length === 0 || (showInitialNodes && !isComplete)
                ? 0.4 : 1, cursor: frequencyData.length === 0 || (showInitialNodes && !isComplete)
                ? 'not-allowed' : 'pointer',
                borderRadius: '999px'
                }}>
                Generate
            </button>

            <button 
            ref={nextStepBtnRef}
            className="control-btn"
                onClick={handleNextStep}
                disabled={frequencyData.length === 0 || !showInitialNodes || isComplete}
                style={{opacity: frequencyData.length === 0 || !showInitialNodes || isComplete
                ? 0.4 : 1, cursor: frequencyData.length === 0 || !showInitialNodes || isComplete
                ? 'not-allowed' : 'pointer',
                borderRadius: '999px',}}>
                Next Step
            </button>

            <button 
            ref={prevStepBtnRef}
            className="control-btn"
               onClick={handlePreviousStep}
               disabled={frequencyData.length === 0 || !showInitialNodes}
               style={{
               opacity: frequencyData.length === 0 || !showInitialNodes ? 0.4 : 1,
               cursor: frequencyData.length === 0 || !showInitialNodes ? 'not-allowed' : 'pointer',
               borderRadius: '999px',
               }}>
               Prev Step
            </button>

            <button 
            ref={resetBtnRef}
            className="control-btn"
                onClick={() => {
                    setCurrentStep(-1);
                    setTree(null);
                    setShowInitialNodes(false);
                    setIsComplete(false);
                    setFrequencyData([]);
                    setTdata('');
                    setShowEdgeExplanation(false);
                    experimentStartRef.current = Date.now();
                    experimentEndRef.current = null;
                    if(onReset) onReset();
                }}
                disabled={frequencyData.length === 0}
                style={{opacity: frequencyData.length === 0
                ? 0.4 : 1, cursor: frequencyData.length === 0
                ? 'not-allowed' : 'pointer',
                borderRadius: '9999px'}}>
                Reset
            </button>
        </div>

        <div 
        ref={treeVisualizationRef}
        className="tree-body">
        {showInitialNodes && currentStep === -1 && (
        <div className="initial-nodes">
        {initialNodes.map((node, index) => (
            <div key={index} className="single-node">
                {node.char} ({node.freq})
            </div>
        ))}
        </div>
        )}

        {currentStep >= 0 && tree && tree.name && tree.children && tree.children.length > 0 && (
        <div style={{ width: "100%", height: "500px", overflow: "auto" }}>
        <TreeErrorBoundary resetKey={currentStep}>
        <Tree
             key={JSON.stringify(tree)}
             data={tree}
             orientation="vertical"
             pathFunc="diagonal"
             translate={{x: 250, y:50}}
             draggable={true}
             zoomable={true}
              
            pathClassFunc={({source, target}) => {
                const stepData = steps[currentStep];
                if (!stepData) return "custom-link";
                    
                const leftName = `${stepData?.left?.char} (${stepData?.left?.freq})`;
                const rightName = `${stepData?.right?.char} (${stepData?.right?.freq})`;
                const sourceName = source.data.name;
                const targetName = target.data.name;
                
                if (stepData.type === "select"){
                    if (sourceName === "virtual_root"){
                        const isSelected = targetName === leftName || targetName === rightName;
                        return isSelected ? "custom-link" : "hidden-link";
                    }
                    if(sourceName === leftName || sourceName === rightName) {
                        return "custom-link";
                    }
                    return "hidden-link";
                }
                return "custom-link";
            }}

             renderCustomNodeElement={({nodeDatum}) => {
             if(nodeDatum.name === "root" || nodeDatum.name === "virtual_root"){
                return <g></g>;
             }
             return (
                <g>
                   {nodeDatum.children?.length > 0 && (
                    <>
                    <text x="-35" y="54">0</text>
                    <text x="28" y="55">1</text>
                    </>
                   )}      
                    <circle
                    r="50"
                    fill={
                        nodeDatum.name ===
                        `${steps[currentStep]?.left?.char} (${steps[currentStep]?.left?.freq})`
                        ||
                        nodeDatum.name ===
                        `${steps[currentStep]?.right?.char} (${steps[currentStep]?.right?.freq})`
                             ? "#f59e0b"
                             : "#add8eb"  
                    }
                    stroke="white"
                    strokeWidth="2" />             
                    <text 
                    fill="white"
                    textAnchor='middle'
                    dominantBaseline='middle'
                    letterSpacing='3'
                    fontSize="18px"
                    >
                       {nodeDatum.name}
                    </text>
                </g> 
            );
         }}
        />
        </TreeErrorBoundary>
         </div>
        )}
        </div>

        {current && (
            <div className="merge-visual" ></div>
        )}
        <div >
        <div className="tree-space" ref={treeDescriptionRef} >
        {showInitialNodes && currentStep === -1 && (
        <div className="step-explanation">
        <p>
            <b>: </b> Initial nodes are created from the frequency table.
            Each character becomes a separate node and arranged in ascending order.
        </p>
        </div>   
        )}   
                   
        {currentStep >= 0 && steps[currentStep] && (
        <>
        {steps[currentStep].type === "select" && (
            <div className="step-explanation">
             <p>
                <b>: </b> Selecting the two nodes with the smallest frequencies:{" "}
                <strong>{steps[currentStep].left?.char}</strong> 
                ({steps[currentStep].left?.freq}) 
                {" "} and{" "}
                <strong>{steps[currentStep].right?.char}</strong> 
                ({steps[currentStep].right?.freq})
            </p>
        </div>
        )}
        {steps[currentStep].type === "merge" && !isComplete && (
            <div className="step-explanation">
                <p><b>: </b>The selected nodes are merged to create a new parent node.
                    New node 
                    <strong> {steps[currentStep]?.parent?.char}</strong>{" "}
                    ({steps[currentStep]?.parent?.freq}) 
                    {" "} is created and nodes are sorted again in 
                    ascending order of frequency.
                </p>
            </div>
        )}
        {showEdgeExplanation && (
            <div className='step-explanation'
            style={{
                marginTop:'8px',
                borderLeft: '#1d2a6d',
                padding: '5px',
                borderRadius: '12px',
                backgroundColor: 'rgba(240,244, 255)'
            }}>
            <p>
                <b>Edge Labels: </b>
                In Huffman Tree, <b style={{color:'#2563eb'}}>left branch = 0</b> and {" "}
                <b style={{color: '#dc2626'}}>right branch = 1</b>.{" "}
                The path from root to any leaf gives that character's Huffman code.
            </p>
            </div>
            
        )}
        </>
        )}
        </div>
</div>
        {isComplete && encodedTable.length > 0 && (
        <>  
         <div className="step-explanation final-box" ref={encodedTableRef}>
            <p>
                <b>:  </b>Tree fully generated. Each character has now been assigned an optimal binary code
                based on its frequency. More frequent characters have shorter codes.
                <p>
                <b>You can now see the final encoded output.</b>
                </p>
            </p>
        
        
        <div className='panel encoded-panel' >
            <h2>Encoded Table</h2>
            <table className="frequency-table">
                <tbody>
                    <tr>
                        <th>Character</th>
                        {encodedTable.map((item, index) => (
                            <td key={index}>{item.char}</td>
                        ))}
                    </tr>
                    <tr>
                        <th>Code</th>
                        {encodedTable.map((item, index) => (
                            <td key={index}>{item.code}</td>
                        ))}
                    </tr>
                </tbody>
            </table>
        </div>

        <button
            onClick={handleDownloadReport}
            style={{
                marginTop: '14px',
                padding: '10px 22px',
                background: '#1d2a6d',
                color: 'white',
                border: 'none',
                borderRadius: '999px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer'
            }}
        >
            ⬇ Download Report
        </button>
        </div>
        
        </>
        )}      
    </div>
</div>
</div>
</div>
</div> 
</div> 
</OpenCvProvider> )}
