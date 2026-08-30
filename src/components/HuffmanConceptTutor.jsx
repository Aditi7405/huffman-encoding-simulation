import { useState, useEffect, useRef, useMemo } from 'react';
import { Dialog, DialogTitle, DialogContent, Popper, Modal } from '@mui/material';
import Box from '@mui/material/Box';
import HuffmanAnimation from './HuffmanAnimation';
import Button from './styledbutton';
import voice from '../assets/images/voice-play.png';
import voice_pause from '../assets/images/voice-pause.png';
import { useMediaQuery, useTheme } from '@mui/material';

const getArrowVisualStyle = (placement = 'bottom-start') => {
  const side = placement.split('-')[0];
  const base = {
    position: 'absolute',
    width: '14px',
    height: '14px',
    background: '#f5fffa',
    transform: 'rotate(45deg)',
    zIndex: 2,
  };
  if (side === 'bottom') return { ...base, borderTop: '4px solid #ffd700', borderLeft: '4px solid #ffd700' };
  if (side === 'top')    return { ...base, borderBottom: '4px solid #ffd700', borderRight: '4px solid #ffd700' };
  if (side === 'left')   return { ...base, borderTop: '4px solid #ffd700', borderRight: '4px solid #ffd700' };
  if (side === 'right')  return { ...base, borderBottom: '4px solid #ffd700', borderLeft: '4px solid #ffd700' };
  return { ...base, borderTop: '4px solid #ffd700', borderLeft: '4px solid #ffd700' };
};

export default function HuffmanConceptTutor({ open, onClose, onOpen }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const getResponsivePlacement = (placement, mobileOverride) => {
  if (!isMobile || !placement) return placement;
  if (mobileOverride) return mobileOverride;
  if (placement.startsWith('top')) return 'top';
  return 'bottom';
  };

  const getResponsiveOffset = (offset) => {
    if (!isMobile) return offset;
    return [0, 10];
  };

  const [showInstructions, setShowInstructions] = useState(false);
  const [isHuffmanSpeaking, setIsHuffmanSpeaking] = useState(false);
  const [isConceptTourRunning, setIsConceptTourRunning] = useState(false);
  const [conceptStep, setConceptStep] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);
  const [waitingForSymbol, setWaitingForSymbol] = useState(false);
  const [waitingForAnalyze, setWaitingForAnalyze] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [welcomeAnchorEl, setWelcomeAnchorEl] = useState(null);
  const symbolNames = ['Plus (+)', 'Minus (-)', 'Multiply (×)', 'Divide (÷)'];
  const [isPopupVisible, setIsPopupVisible] = useState(true);
  const [tourWordIndex, setTourWordIndex] = useState(-1);
  const [actualPlacement, setActualPlacement] = useState('bottom-start');
  const [isTreeGenerated, setIsTreeGenerated] = useState(false);
  const [showActionRequired, setShowActionRequired] = useState(false);
  const [isAnalyzeDone, setIsAnalyzeDone] = useState(false);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  const [totalMerges, setTotalMerges] = useState(0);
  const [currentMerge, setCurrentMerge] = useState(0);
  const [treeCompleted, setTreeCompleted] = useState(false);
  const [activeInstructionStep, setActiveInstructionStep] = useState(-1);
  const [treeCompleteMessage, setTreeCompleteMessage] = useState('');
  const [dynamicAnchorPlacement, setDynamicAnchorPlacement] = useState(null);
  const [dynamicTourText, setDynamicTourText] = useState(null);
  const [dynamicOffset, setDynamicOffset] = useState(null);
  const [arrowEl, setArrowEl] = useState(null);

  const guidedTutorRef = useRef(null);
  const instructionBtnRef = useRef(null);
  const speechBtnRef = useRef(null);
  const symbolTextToggleRef = useRef(null);
  const analyzeFreqRef = useRef(null);
  const generateBtnRef = useRef(null);
  const nextStepBtnRef = useRef(null);
  const prevStepBtnRef = useRef(null);
  const resetBtnRef = useRef(null);
  const progressReportRef = useRef(null);
  const treeVisualizationRef = useRef(null);
  const waitingForSymbolRef = useRef(false);
  const freqTableRef = useRef(null);
  const resetAnimationRef = useRef(null);
  const wordTimersRef = useRef([]);
  const conceptStepRef = useRef(0);
  const waitingForAnalyzeRef = useRef(false);
  const symbolBoxRef = useRef(null);
  const textInputBoxRef = useRef(null);
  const isTreeGeneratedRef = useRef(false);
  const isAnalyzeDoneRef = useRef(false);
  const isSpeechEnabledRef = useRef(true);
  const hasDeclinedRef = useRef(false);
  const isHandlingSymbolRef = useRef(false);
  const treeDescriptionRef = useRef(null);
  const encodedTableRef = useRef(null);
  const treeCompletedRef = useRef(false);
  const totalMergesRef = useRef(0);
  const isConceptTourRunningRef = useRef(false);
  const inputModeRef = useRef('symbol');
  const hasNotifiedTextRef = useRef(false);

  const setConceptStepSynced = (val) => {
    conceptStepRef.current = val;
    setConceptStep(val);
  };

  const setTourRunning = (val) => {
    isConceptTourRunningRef.current = val;
    setIsConceptTourRunning(val);
  };

  const cancelTour = () => {
    setTourRunning(false);
    setIsPopupVisible(false);
    setAnchorEl(null);
    window.speechSynthesis.cancel();
    wordTimersRef.current.forEach(t => clearTimeout(t));
    wordTimersRef.current = [];
    setTourWordIndex(-1);
    setIsHuffmanSpeaking(false);
    setConceptStepSynced(0);
    conceptTourSteps.forEach(step => {
      const el = step.ref?.current;
      if (el) {
        el.style.outline = '';
        el.style.boxShadow = '';
        el.style.borderRadius = '';
      }
    });
  };

  const handleAnalyzeValidationFailed = (phase, mode) => {
    if (!isConceptTourRunningRef.current) return;

    if (phase === 'pause') {
      window.speechSynthesis.cancel();
      setIsPopupVisible(false);
      return;
    }

    setShowActionRequired(false);
    setTourRunning(true);
    setConceptStepSynced(3);
    setWaitingForSymbol(true);
    waitingForSymbolRef.current = true;
    hasNotifiedTextRef.current = false;
    setDynamicAnchorPlacement(null);
    setDynamicOffset(null);
    setDynamicTourText(null);

    setTimeout(() => {
      if (mode === 'text') {
        const tEl = textInputBoxRef.current;
        if (tEl) {
          tEl.style.outline = '3px solid #f59e0b';
          tEl.style.boxShadow = '0 0 0 6px rgba(245, 158, 11, 0.3)';
          tEl.style.borderRadius = '8px';
          setAnchorEl(tEl);
        }
        setDynamicAnchorPlacement(getResponsivePlacement('right'));
        setDynamicOffset(getResponsiveOffset([100, 10]));
        const msg = "Please type your text before clicking Analyze Frequency.";
        setDynamicTourText(msg);
        setIsPopupVisible(true);
        speakTourText(msg);
      } else {
        const sEl = symbolBoxRef.current;
        if (sEl) {
          sEl.style.outline = '3px solid #f59e0b';
          sEl.style.boxShadow = '0 0 0 6px rgba(245, 158, 11, 0.3)';
          sEl.style.borderRadius = '8px';
          setAnchorEl(sEl);
        }
        setDynamicAnchorPlacement(getResponsivePlacement('right'));
        setDynamicOffset(getResponsiveOffset([100, 10]));
        const msg = "Please select a symbol before clicking Analyze Frequency.";
        setDynamicTourText(msg);
        setIsPopupVisible(true);
        speakTourText(msg);
      }
    }, 250);
  };

  const conceptTourSteps = [
    {
      title: "Guided Tutor",
      text: "Welcome to the Huffman Encoding Visualization experiment. This simulation demonstrates how Huffman Coding analyzes symbol frequencies, constructs a binary tree, and assigns efficient binary codes for lossless data compression.",
      ref: guidedTutorRef,
      placement: "bottom-end",
    },
    {
      title: "Instructions Button",
      text: "Click here to view detailed step-by-step instructions about how the Huffman Encoding simulation works and how to perform each operation correctly.",
      ref: instructionBtnRef,
      placement: "bottom-start",
    },
    {
      title: "Mute and Unmute Audio",
      text: "Use this button to mute or unmute the guided audio explanation at any time during the experiment.",
      ref: speechBtnRef,
      placement: "bottom-start",
    },
    {
      title: "Binary Image / Text Input",
      text: "Start by selecting a sample binary image from the available options, or switch to Text Input mode and enter your own text. The selected input will be used to analyze symbol frequencies and construct the Huffman Tree.",
      ref: symbolTextToggleRef,
      waitingForSymbol: true,
      placement: "left-start",
    },
    {
      title: "Analyze Frequency",
      text: "Click the Analyze Frequency button to count how many times each unique symbol occurs in the input. These frequency values determine how the Huffman Tree is constructed and how binary codes are assigned.",
      ref: analyzeFreqRef,
      waitingForAnalyze: true,
      requiresAnalyze: true,
      placement: "right",
      offset: [140, 10],
    },
    {
      title: "Frequency Table",
      text: "The Frequency Table displays each unique symbol along with its frequency. Observe that symbols occurring more frequently have higher frequency values. These frequencies are used to determine which nodes are selected and merged during Huffman Tree construction.",
      ref: freqTableRef,
      placement: "bottom-end",
    },
    {
      title: "Generate Tree",
      text: "Click the Generate button to create the initial Huffman Tree structure. Each unique symbol is represented as a leaf node, with its frequency shown in the node. The nodes are arranged according to their frequencies before the merging process begins.",
      ref: generateBtnRef,
      placement: "left-start",
      requiresGenerate: true,
      offset: [10, 10],
    },
    {
      title: "Next Step",
      text: "Click Next Step to perform the next stage of Huffman Tree construction. The two nodes with the lowest frequencies are selected and merged to form a new parent node whose frequency is their combined frequency. Repeat this process until a single root node remains.",
      ref: nextStepBtnRef,
      placement: "top-start",
      requiresTreeComplete: true,
    },
    {
      title: "Prev Step",
      text: "You can Click Prev Step to move back to the previous stage of the Huffman Tree construction. Use it to review how the nodes were selected and merged at an earlier step.",
      ref: prevStepBtnRef,
      placement: "top-start",
    },
    {
      title: "Tree Visualization Box",
      text: "This panel displays the Huffman Tree as it is constructed step by step. Observe how the lowest-frequency nodes are repeatedly merged to form parent nodes. The 0 and 1 labels on the branches represent the binary paths used to generate the Huffman codes.",
      ref: treeVisualizationRef,
      placement: "left",
      mobilePlacement: "top",
    },
    {
      title: "Tree Description",
      text: "The Tree Description explains each stage of the construction process. It identifies the nodes selected for merging, shows their combined frequency, and explains how the binary tree develops until the final Huffman Tree is formed.",
      ref: treeDescriptionRef,
      placement: "bottom-start",
    },
    {
      title: "Encoded Table",
      text: "After the Huffman Tree is completed, the Encoded Table displays each symbol, its frequency, and its corresponding binary Huffman code. Symbols with higher frequencies generally receive shorter codes, while less frequent symbols receive longer codes, reducing the average number of bits required for lossless compression.",
      ref: encodedTableRef,
      placement: "top",
      requiresGenerate: true,
    },
    {
      title: "Reset",
      text: "Click the Reset button to clear the current simulation and return to the initial state. You can then select a new Image or enter new text and explore the Huffman Encoding process again.",
      ref: resetBtnRef,
      placement: "right-start",
    },
    {
      title: "Experiment Completed",
      text: "You have successfully completed the guided walkthrough of the Huffman Encoding Simulation. Click the Progress Report button to download and review your simulation report, including the experimental results and observations.",
      ref: progressReportRef,
      placement: "right-start",
    },
  ];

  useEffect(() => {
    if (open && onOpen) onOpen();
  }, [open]);

  // Scroll lock: desktop-only. On mobile the dialog content can be taller
  // than the viewport (fixed 1700px on desktop, auto on mobile), so locking
  // scroll here would trap the user unable to reach content below the fold.
  useEffect(() => {
    if (isMobile) return;
    const dialogEl = document.getElementById('explanation-dialog');
    if (!dialogEl) return;
    const scrollEl = dialogEl.closest('.MuiDialog-scrollPaper') || dialogEl.parentElement;
    if (!scrollEl) return;
    scrollEl.style.overflow = isConceptTourRunning ? 'hidden' : '';
    return () => { scrollEl.style.overflow = ''; };
  }, [isConceptTourRunning, isMobile]);

  useEffect(() => {
    if (!isConceptTourRunning) return;
    const el = conceptTourSteps[conceptStep]?.ref?.current;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [conceptStep, isConceptTourRunning]);

  useEffect(() => {
    let timer;
    if (open) {
      timer = setTimeout(() => {
        const el = guidedTutorRef.current;
        if (!el) return;
        setShowWelcome(true);
        setWelcomeAnchorEl(el);
      }, 800);
    } else {
      setShowWelcome(false);
      setWelcomeAnchorEl(null);
      setTourRunning(false);
      setAnchorEl(null);
      hasDeclinedRef.current = false;
    }
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      wordTimersRef.current.forEach(t => clearTimeout(t));
      wordTimersRef.current = [];
    };
  }, []);

  useEffect(() => {
    const symbolEl = symbolBoxRef.current;
    const textEl = textInputBoxRef.current;
    if (symbolEl) { symbolEl.style.outline = ''; symbolEl.style.boxShadow = ''; symbolEl.style.borderRadius = ''; }
    if (textEl) { textEl.style.outline = ''; textEl.style.boxShadow = ''; textEl.style.borderRadius = ''; }

    if (!isConceptTourRunning) {
      conceptTourSteps.forEach(step => {
        const el = step.ref?.current;
        if (el) {
          el.style.outline = '';
          el.style.boxShadow = '';
          el.style.borderRadius = '';
        }
      });
      return;
    }

    conceptTourSteps.forEach(step => {
      const el = step.ref?.current;
      if (el) {
        el.style.outline = '';
        el.style.boxShadow = '';
        el.style.borderRadius = '';
      }
    });

    const el = conceptTourSteps[conceptStep]?.ref?.current;
    if (el) {
      el.style.outline = '3px solid #f59e0b';
      el.style.boxShadow = '0 0 0 6px rgba(245, 158, 11, 0.3)';
      el.style.borderRadius = '8px';
      el.style.transition = 'all 0.3s ease';
    }
  }, [conceptStep, isConceptTourRunning]);

  const resolvedTourPlacement = getResponsivePlacement(
  dynamicAnchorPlacement || conceptTourSteps[conceptStep]?.placement || "bottom-start",
  !dynamicAnchorPlacement ? conceptTourSteps[conceptStep]?.mobilePlacement : undefined
  );

  // Memoized so Popper doesn't get a brand-new modifiers array on every
  // render (which was part of what fed the infinite-update loop). This
  // array now only changes when something that should actually affect
  // positioning changes.
  const tourOffset = getResponsiveOffset(
    dynamicOffset || conceptTourSteps[conceptStep]?.offset || [0, 10]
  );
  const boundaryPadding = isMobile ? { top: 70, bottom: 12, left: 12, right: 12 } : 12;

  const popperModifiers = useMemo(() => {
    return [
      { name: 'offset', options: { offset: tourOffset } },
      { name: 'flip', enabled: true, options: { boundary: 'viewport', padding: boundaryPadding } },
      { name: 'preventOverflow', options: { boundary: 'viewport', padding: boundaryPadding } },
      { name: 'hide', enabled: false },
      // Popper computes the correct arrow x/y for the CURRENT (post-flip/shift) box.
      { name: 'arrow', options: { element: arrowEl, padding: 10 } },
      {
        name: 'applyArrowPosition',
        enabled: true,
        phase: 'write',
        requires: ['arrow'],
        fn: ({ state }) => {
  if (!arrowEl) return;
  const { x, y } = state.modifiersData.arrow || {};
  const side = state.placement.split('-')[0];
  const staticSide = { top: 'bottom', right: 'left', bottom: 'top', left: 'right' }[side];

  arrowEl.style.top = '';
  arrowEl.style.left = '';
  arrowEl.style.right = '';
  arrowEl.style.bottom = '';

  arrowEl.style.borderTop = '';
  arrowEl.style.borderRight = '';
  arrowEl.style.borderBottom = '';
  arrowEl.style.borderLeft = '';

  Object.assign(arrowEl.style, getArrowVisualStyle(state.placement));

  if (x != null) arrowEl.style.left = `${x}px`;
  if (y != null) arrowEl.style.top = `${y}px`;
  arrowEl.style[staticSide] = '-7px';
},
},
      {
        name: 'reportPlacement', enabled: true, phase: 'afterWrite',
        fn: ({ state }) => {
          setActualPlacement(prev => (prev === state.placement ? prev : state.placement));
        },
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(tourOffset), JSON.stringify(boundaryPadding), arrowEl]);

  const speakTourText = (text, onDone) => {
    if (!isSpeechEnabledRef.current || !isConceptTourRunningRef.current) {
      if (onDone) onDone();
      return;
    }
    window.speechSynthesis.cancel();
    wordTimersRef.current.forEach(t => clearTimeout(t));
    wordTimersRef.current = [];
    setTourWordIndex(-1);

    const doSpeak = (voices) => {
      const utterance = new SpeechSynthesisUtterance(text);
      if (voices.length > 0) utterance.voice = voices[0];

      const words = text.split(' ');

      utterance.onboundary = (event) => {
        if (event.name === 'word') {
          let charCount = 0;
          for (let i = 0; i < words.length; i++) {
            if (charCount >= event.charIndex) {
              setTourWordIndex(i);
              break;
            }
            charCount += words[i].length + 1;
          }
        }
      };

      utterance.onend = () => {
        setTourWordIndex(-1);
        setIsHuffmanSpeaking(false);
        if (onDone) onDone();
      };

      utterance.onerror = (e) => {
        if (e.error === 'interrupted') return;
        //console.warn('Speech error:', e);
        setTourWordIndex(-1);
        setIsHuffmanSpeaking(false);
        if (onDone) onDone();
      };

      window.speechSynthesis.speak(utterance);
    };

    setTimeout(() => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        doSpeak(voices);
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.onvoiceschanged = null;
          doSpeak(window.speechSynthesis.getVoices());
        };
      }
    }, 150);
  };

  const registerSymbolSelection = (index) => {
    isHandlingSymbolRef.current = true;
    setWaitingForSymbol(false);
    waitingForSymbolRef.current = false;

    const symbolEl = symbolBoxRef.current;
    if (symbolEl) {
      symbolEl.style.outline = '3px solid #f59e0b';
      symbolEl.style.boxShadow = '0 0 0 6px rgba(245, 158, 11, 0.3)';
      symbolEl.style.borderRadius = '8px';
      setAnchorEl(symbolEl);
      setDynamicAnchorPlacement(getResponsivePlacement('right'));
      setDynamicOffset(getResponsiveOffset([100, 10]));
    }

    const name = symbolNames[index];
    const dynamicText = `You selected ${name}.`;
    setDynamicTourText(dynamicText);

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(dynamicText);
    utterance.rate = 0.95;
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) utterance.voice = voices[0];

    utterance.onend = () => {
      const next = conceptStepRef.current + 1;
      setWaitingForAnalyze(true);
      waitingForAnalyzeRef.current = true;
      setTourRunning(true);
      goToStep(next);
      setTimeout(() => {
        isHandlingSymbolRef.current = false;
      }, 300);
    };
    window.speechSynthesis.speak(utterance);
  };

  const handleSymbolSelected = (index) => {
    if (isHandlingSymbolRef.current) return;

    if (!waitingForSymbolRef.current) {
      if (!isConceptTourRunningRef.current) return;

      setIsAnalyzeDone(false);
      isAnalyzeDoneRef.current = false;
      setIsTreeGenerated(false);
      isTreeGeneratedRef.current = false;
      setTreeCompleted(false);
      treeCompletedRef.current = false;
      setWaitingForAnalyze(false);
      waitingForAnalyzeRef.current = false;
      hasNotifiedTextRef.current = false;
      window.speechSynthesis.cancel();
      setTourRunning(true);
      setConceptStepSynced(3);

      registerSymbolSelection(index);
      return;
    }

    registerSymbolSelection(index);
  };

  const handleAnalyzeDone = () => {
    if (!waitingForAnalyzeRef.current) return;
    setIsAnalyzeDone(true);
    isAnalyzeDoneRef.current = true;
    waitingForAnalyzeRef.current = false;
    setWaitingForAnalyze(false);
    setTourRunning(true);

    const next = conceptStepRef.current + 1;
    setConceptStepSynced(next);

    setTimeout(() => {
      goToStep(next);
    }, 300);
  };

  const handleStepsGenerated = (count) => {
    setTotalMerges(count);
    totalMergesRef.current = count;
    setCurrentMerge(0);
    setTreeCompleted(false);
    treeCompletedRef.current = false;
  };

  const handleNextStepDone = (currentIdx) => {
    const mergesDone = Math.floor((currentIdx + 1) / 2);
    setCurrentMerge(mergesDone);
  };

  const handleTreeComplete = () => {
    setTreeCompleted(true);
    treeCompletedRef.current = true;

    if (!isConceptTourRunningRef.current) return;
    const msg = "Excellent! The Huffman Tree is now complete. All characters have been merged into a single root node. Click Next to continue.";
    setTreeCompleteMessage(msg);
    speakTourText(msg);
  };

  const registerTextEntry = () => {
    isHandlingSymbolRef.current = true;
    hasNotifiedTextRef.current = true;

    setWaitingForSymbol(false);
    waitingForSymbolRef.current = false;
    setWaitingForAnalyze(true);
    waitingForAnalyzeRef.current = true;

    const textEl = textInputBoxRef.current;
    if (textEl) {
      textEl.style.outline = '3px solid #f59e0b';
      textEl.style.boxShadow = '0 0 0 6px rgba(245, 158, 11, 0.3)';
      textEl.style.borderRadius = '8px';
      setAnchorEl(textEl);
    }
    setDynamicAnchorPlacement(getResponsivePlacement('right'));
    setDynamicOffset(getResponsiveOffset([100, 10]));

    const dynamicText = "Here you can type the text which you want to encode. Once done, click Analyze Frequency.";
    setDynamicTourText(dynamicText);

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance("Text Entered. Now click on next button.");
    utterance.rate = 0.95;
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) utterance.voice = voices[0];

    utterance.onend = () => {
      isHandlingSymbolRef.current = false;
    };

    utterance.onerror = (e) => {
      if (e.error === 'interrupted') return;
      isHandlingSymbolRef.current = false;
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleTextEntered = () => {
    if (isHandlingSymbolRef.current) return;
    if (hasNotifiedTextRef.current) return;

    if (!waitingForSymbolRef.current) {
      if (!isConceptTourRunningRef.current) return;

      setIsAnalyzeDone(false);
      isAnalyzeDoneRef.current = false;
      setIsTreeGenerated(false);
      isTreeGeneratedRef.current = false;
      setTreeCompleted(false);
      treeCompletedRef.current = false;
      setWaitingForAnalyze(false);
      waitingForAnalyzeRef.current = false;
      window.speechSynthesis.cancel();
      setTourRunning(true);
      setConceptStepSynced(3);

      registerTextEntry();
      return;
    }

    registerTextEntry();
  };

  const goToStep = (stepIndex) => {
    setShowActionRequired(false);
    setConceptStepSynced(stepIndex);
    setTourWordIndex(-1);
    setDynamicAnchorPlacement(null);
    setDynamicOffset(null);
    setDynamicTourText(null);
    window.speechSynthesis.cancel();

    if (conceptTourSteps[stepIndex]?.waitingForSymbol) {
      setWaitingForSymbol(true);
      waitingForSymbolRef.current = true;
      isHandlingSymbolRef.current = false;
      hasNotifiedTextRef.current = false;
    } else {
      setWaitingForSymbol(false);
      waitingForSymbolRef.current = false;
    }
    if (conceptTourSteps[stepIndex]?.waitingForAnalyze) {
      setWaitingForAnalyze(true);
      waitingForAnalyzeRef.current = true;
    } else {
      setWaitingForAnalyze(false);
      waitingForAnalyzeRef.current = false;
    }

    const trySetAnchor = (attempts = 0) => {
      const el = conceptTourSteps[stepIndex]?.ref?.current;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setAnchorEl(el);
        setIsPopupVisible(true);
        speakTourText(conceptTourSteps[stepIndex].text);
      } else if (attempts < 10) {
        setTimeout(() => trySetAnchor(attempts + 1), 100);
      }
    };

    trySetAnchor();
  };

  const handleTutorToggle = () => {
    if (isSpeechEnabledRef.current) {
      window.speechSynthesis.cancel();
      wordTimersRef.current.forEach(t => clearTimeout(t));
      wordTimersRef.current = [];
      setTourWordIndex(-1);
      setIsHuffmanSpeaking(false);
      isSpeechEnabledRef.current = false;
      setIsSpeechEnabled(false);
    } else {
      isSpeechEnabledRef.current = true;
      setIsSpeechEnabled(true);
      if (isConceptTourRunning && conceptTourSteps[conceptStep]) {
        speakTourText(conceptTourSteps[conceptStep].text);
      }
    }
  };

  const isNextDisabled =
    ((conceptTourSteps[conceptStep]?.requiresAnalyze ||
      conceptTourSteps[conceptStep]?.waitingForAnalyze) && !isAnalyzeDone) ||
    (conceptTourSteps[conceptStep]?.requiresGenerate && !isTreeGenerated) ||
    (conceptTourSteps[conceptStep]?.requiresTreeComplete && !treeCompleted);

  return (
    <>
      <style>{`
        .tour-exit-btn {
          background: transparent;
          border: 1px solid #1d2a6d;
          border-radius: 10px;
          padding: 8px 14px;
          color: #64748b;
          font-weight: 600;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s ease;
        }
        .tour-exit-btn:hover {
          background: #fee2e2;
          border-color: #dc2626;
          color: #dc2626;
          transform: translateY(-2px);
          box-shadow: 0 4px 10px rgba(220,38,38,0.25);
        }

        .tour-prev-btn {
          background: #d1d5db;
          color: #1d2a6d;
          border: 1px solid #1d2a6d;
          padding: 8px 14px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .tour-prev-btn:hover:not(:disabled) {
          background: #b8c0cc;
          transform: translateY(-2px);
          box-shadow: 0 4px 10px rgba(29,42,109,0.2);
        }
        .tour-prev-btn:disabled { cursor: not-allowed; opacity: 0.7; }

        .tour-next-btn {
          color: white;
          border: none;
          padding: 8px 18px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 13px;
          transition: all 0.2s ease;
        }
        .tour-next-btn.enabled {
          background: #1d2a6d;
          cursor: pointer;
        }
        .tour-next-btn.enabled:hover {
          background: #2f3f8f;
          transform: translateY(-2px);
          box-shadow: 0 6px 14px rgba(29,42,109,0.35);
        }
        .tour-next-btn.disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }
        @media (max-width: 480px) {
          .tour-exit-btn, .tour-prev-btn, .tour-next-btn {
            padding: 4px 8px !important;
            font-size: 10px !important;
            border-radius: 7px !important;
          }
        }
      `}</style>
      <Dialog
        open={open}
        onClose={onClose}
        fullScreen={isMobile}
        aria-labelledby="explanation-dialog-title"
        PaperProps={{
          id: "explanation-dialog",
          sx: isMobile
            ? {
                // fullScreen forces the Paper to 100vh + flex column by default.
                // Locking width here stops any stretchy child from pushing
                // the Paper (and therefore the whole page) wider than the
                // viewport.
                display: 'flex',
                flexDirection: 'column',
                height: '100dvh',
                maxHeight: '100dvh',
                width: '100vw',
                maxWidth: '100vw',
                overflow: 'hidden',
                overflowX: 'hidden',
              }
            : undefined,
        }}>

        <DialogTitle id="instructions-dialog-title"
          sx={{
            backgroundColor: '#f5fffa', color: 'white',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'nowrap',
            padding: isMobile ? '4px 6px' : '12px 24px',
            gap: isMobile ? '4px' : 0,
            position: 'sticky', top: 0, zIndex: 10,
            overflow: 'hidden',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}>

          <span style={{
            fontSize: isMobile ? '9px' : '20px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            flexShrink: 1,
            minWidth: 0,
          }}>
            Huffman Concept
          </span>

          <div style={{
            position: 'relative', display: "flex",
            flexWrap: 'nowrap',
            justifyContent: 'flex-end',
            alignItems: "center",
            gap: isMobile ? '3px' : '10px',
            flexShrink: 0,
            minWidth: 0,
          }}>

            <span ref={speechBtnRef} style={{ display: "inline-flex", alignItems: "center", flexShrink: 0 }}>
              <Button title="Play"
                onClick={handleTutorToggle}
                style={{ display: isConceptTourRunning ? "none" : "inline-flex", minWidth: "unset", padding: "0px" }}>
                <img src={voice} alt="voice" style={{ width: isMobile ? "16px" : "40px", height: "auto" }} />
              </Button>
              <Button title="Pause"
                onClick={handleTutorToggle}
                style={{ display: isConceptTourRunning ? "inline-flex" : "none", minWidth: "unset", padding: "0px" }}>
                <img src={voice_pause} alt="voice_pause" style={{ width: isMobile ? "16px" : "40px", height: "auto" }} />
              </Button>
            </span>

            <button
              ref={instructionBtnRef}
              onClick={() => {
                window.speechSynthesis.cancel();
                setShowInstructions(true);

                const activeEl = conceptTourSteps[conceptStep]?.ref?.current;
                if (activeEl) {
                  activeEl.style.outline = '';
                  activeEl.style.boxShadow = '';
                  activeEl.style.borderRadius = '';
                }

                const steps = [
                  " Select a binary image from the image box or type your custom text.",
                  " Click the Analyze Frequency button.",
                  " Click the Generate button to create the Huffman Tree. ",
                  " Click Next Step repeatedly to merge the lowest-frequency nodes.",
                  " Click Prev Step to move back to the previous stage of the Huffman Tree construction and review the earlier merging process.",
                  " View the final Huffman Tree and binary codes in the Encoded Table.",
                  " Click the Reset button to start from the initial step."
                ];
                let index = 0;

                const speakNext = () => {
                  if (index >= steps.length) { setActiveInstructionStep(-1); return; }
                  setActiveInstructionStep(index);
                  const u = new SpeechSynthesisUtterance(`Step ${index + 1}. ${steps[index]}`);
                  u.rate = 0.95;
                  const voices = window.speechSynthesis.getVoices();
                  if (voices.length > 0) u.voice = voices[0];
                  u.onend = () => { index += 1; speakNext(); };
                  window.speechSynthesis.speak(u);
                };

                setTimeout(() => {
                  const intro = new SpeechSynthesisUtterance("Instructions of Huffman Encoding.");
                  intro.rate = 0.95;
                  const voices = window.speechSynthesis.getVoices();
                  if (voices.length > 0) intro.voice = voices[0];
                  intro.onend = speakNext;
                  window.speechSynthesis.speak(intro);
                }, 300);
              }}
              style={{
                background: "white", color: "#1d2a6d", fontWeight: 600,
                padding: isMobile ? "2px 4px" : "8px 18px",
                borderRadius: "6px", cursor: "pointer",
                whiteSpace: "nowrap",
                fontSize: isMobile ? "7px" : "14px",
                width: "auto", minWidth: "auto",
                height: isMobile ? "18px" : "42px",
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "1px solid #333",
                flexShrink: 0,
              }}>
              INSTRUCTIONS
            </button>

            <button
              ref={guidedTutorRef}
              onClick={() => {
                if (showInstructions) return;
                setShowWelcome(false);
                window.speechSynthesis.cancel();
                setTourRunning(true);
                setConceptStepSynced(0);
                goToStep(0);
              }}
              style={{
                background: "#ffd700", color: "#1d2a6d", border: "1px solid #1d2a6d",
                borderRadius: "5px",
                padding: isMobile ? "2px 5px" : "5px 14px",
                cursor: "pointer",
                fontSize: isMobile ? "7px" : "13px",
                fontWeight: "bold", display: "flex", alignItems: "center",
                gap: "2px", whiteSpace: "nowrap",
                height: isMobile ? "18px" : "42px",
                flexShrink: 0,
              }}>
              <b>Guided Tutor</b>
            </button>

            <button onClick={() => {
              window.speechSynthesis.cancel();
              setIsHuffmanSpeaking(false);
              setTourRunning(false);
              onClose();
            }}
              style={{
                background: 'white', color: '#1d2a6d', border: '1px solid #1d2a6d',
                borderRadius: '5px',
                padding: isMobile ? '2px 5px' : '6px 16px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: isMobile ? '7px' : '14px',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}>
              Close
            </button>
          </div>

          {isMobile && showWelcome && welcomeAnchorEl && !showInstructions && (
            <div
              onClick={() => { hasDeclinedRef.current = true; setShowWelcome(false); }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', zIndex: 999998 }}
            />
          )}

          {showWelcome && welcomeAnchorEl && !showInstructions && (
            <Popper
              open={Boolean(welcomeAnchorEl)}
              anchorEl={welcomeAnchorEl}
              placement="bottom-end"
              style={{ zIndex: 999999 }}
              modifiers={[{ name: 'offset', options: { offset: [0, 10] } }]}>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{
                  width: '16px', height: '16px',
                  background: '#f5fffa',
                  transform: 'rotate(45deg)', borderTop: '4px solid #ffd700',
                  borderLeft: '4px solid #ffd700', marginLeft: 'auto', marginRight: '20px',
                  marginBottom: '-9px', zIndex: 2, flexShrink: 0, position: 'relative',
                }} />

                <div style={{
                  width: isMobile ? 'min(85vw, 300px)' : '320px',
                  background: '#f5fffa',
                  borderRadius: isMobile ? '10px' : '12px',
                  padding: isMobile ? '10px' : '16px',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.15)', border: '4px solid #ffd700',
                  position: 'relative', zIndex: 0,
                }}>
                  <div style={{
                    textAlign: 'center',
                    fontSize: isMobile ? '13px' : '16px',
                    fontWeight: 'bold',
                    color: '#1d2a6d',
                    marginBottom: isMobile ? '8px' : '12px',
                    borderBottom: '1px solid #cbd5e1',
                    paddingBottom: isMobile ? '6px' : '8px',
                  }}>
                    Guided Tutor is here to help!
                  </div>

                  <p style={{
                    fontSize: isMobile ? '11px' : '14px',
                    color: '#444',
                    marginBottom: isMobile ? '12px' : '18px',
                    lineHeight: isMobile ? '1.35' : '1.5',
                  }}>
                    Welcome. Do you want Guided Tutor to give you a proper guide on how to run the simulator?
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: isMobile ? '6px' : '10px' }}>
                    <button onClick={() => {
                      hasDeclinedRef.current = true;
                      setShowWelcome(false);
                    }}
                      style={{
                        background: '#f3f4f6', color: '#1d2a6d', border: '1px solid #1d2a6d',
                        padding: isMobile ? '5px 10px' : '8px 20px',
                        borderRadius: isMobile ? '6px' : '8px', cursor: 'pointer',
                        fontWeight: '600', fontSize: isMobile ? '10px' : '14px',
                      }}>
                      No, Thanks
                    </button>

                    <button onClick={() => {
                      setShowWelcome(false);
                      setTourRunning(true);
                      setConceptStepSynced(0);
                      setTimeout(() => {
                        const el = conceptTourSteps[0].ref.current;
                        if (!el) return;
                        setAnchorEl(el);
                        setIsPopupVisible(true);
                        speakTourText(conceptTourSteps[0].text);
                      }, 500);
                    }}
                      style={{
                        background: '#1d2a6d', color: 'white', border: 'none',
                        padding: isMobile ? '5px 10px' : '8px 20px',
                        borderRadius: isMobile ? '6px' : '8px', cursor: 'pointer',
                        fontWeight: '600', fontSize: isMobile ? '10px' : '14px',
                      }}>
                      Yes, Please
                    </button>
                  </div>
                </div>
              </div>
            </Popper>
          )}
        </DialogTitle>

        {isMobile && isConceptTourRunning && anchorEl && isPopupVisible && !showInstructions && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', zIndex: 999998, pointerEvents: 'none' }} />
        )}

        {isConceptTourRunning && anchorEl && isPopupVisible && !showInstructions && (
          <Popper
            open={true}
            anchorEl={anchorEl}
            placement={resolvedTourPlacement}
            style={{ zIndex: 1000000 }}
            modifiers={popperModifiers}>

            <div style={{
              width: isMobile ? 'min(85vw, 300px)' : '320px',
              position: 'relative',
            }}>
              <div ref={setArrowEl} style={getArrowVisualStyle()} />

              <div style={{
                background: '#f5fffa',
                borderRadius: '18px',
                padding: isMobile ? '12px' : '16px',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                border: '4px solid #ffd700',
                position: 'relative',
                maxHeight: isMobile ? '75vh' : 'none',
                overflowY: isMobile ? 'auto' : 'visible',
              }}>

              <div style={{
                textAlign: 'center',
                fontSize: isMobile ? '13px' : '15px',
                fontWeight: 'bold ',
                color: 'hsl(223, 87%, 25%)', marginBottom: '8px',
                borderBottom: '1px solid #cbd5e1', paddingBottom: '8px'
              }}>
                {showActionRequired ? "⚠️ Action Required"
                  : dynamicTourText ? (inputModeRef.current === 'text' ? "Text Input" : "Symbol Selected")
                    : conceptTourSteps[conceptStep]?.title}
              </div>

              <div style={{ fontSize: isMobile ? '0.85rem' : '0.95rem', color: '#444', lineHeight: '1.4', marginBottom: '18px', textAlign: 'justify' }}>
                {showActionRequired ? (
                  ((conceptTourSteps[conceptStep]?.requiresAnalyze ||
                    conceptTourSteps[conceptStep]?.waitingForAnalyze) && !isAnalyzeDone
                    ? "Please click the Analyze Frequency button before proceeding."
                    : "Please click the Generate button before proceeding."
                  ).split(" ").map((word, i) => (
                    <span key={i} style={{
                      padding: "1px 3px", marginRight: "3px", borderRadius: "4px", display: "inline-block",
                      background: i === tourWordIndex ? "#fff8e1" : "transparent",
                      color: i === tourWordIndex ? "#92400e" : "#444",
                      fontWeight: i === tourWordIndex ? "600" : "400",
                      borderBottom: i === tourWordIndex ? "2px solid #f59e0b" : "2px solid transparent",
                      transition: "all 0.15s ease",
                    }}>{word}</span>
                  ))
                ) : (
                  (dynamicTourText
                    ? dynamicTourText
                    : conceptTourSteps[conceptStep]?.requiresTreeComplete && treeCompleted && treeCompleteMessage
                      ? treeCompleteMessage
                      : conceptTourSteps[conceptStep]?.text
                  ).split(" ").map((word, i) => (
                    <span key={i} style={{
                      padding: "1px 3px", marginRight: "3px", borderRadius: "4px", display: "inline-block",
                      background: i === tourWordIndex ? "#fff8e1" : "transparent",
                      color: i === tourWordIndex ? "#92400e" : "#444",
                      fontWeight: i === tourWordIndex ? "600" : "400",
                      borderBottom: i === tourWordIndex ? "2px solid #f59e0b" : "2px solid transparent",
                      transition: "all 0.15s ease",
                    }}>{word}</span>
                  ))
                )}

                {isConceptTourRunning && conceptTourSteps[conceptStep]?.requiresTreeComplete && !treeCompleted && (
                  <div style={{
                    marginBottom: '12px', background: 'rgba(255,255,255,0.6)',
                    borderRadius: '10px', padding: '10px 14px', border: '1px solid #c7d2fe'
                  }}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', fontSize: '12px',
                      color: '#1d2a6d', fontWeight: '600', marginBottom: '6px'
                    }}>
                      <span> Tree Building Progress</span>
                      <span>{currentMerge} / {Math.floor(totalMerges / 2)} merges</span>
                    </div>
                    <div style={{ background: '#e2e8f0', borderRadius: '4px', height: '8px' }}>
                      <div style={{
                        width: totalMerges > 0 ? `${(currentMerge / Math.floor(totalMerges / 2)) * 100}%` : '0%',
                        background: 'linear-gradient(90deg, #1d2a6d, #3b82f6)',
                        height: '8px', borderRadius: '4px', transition: 'width 0.4s ease'
                      }} />
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '5px', textAlign: 'center' }}>
                      Keep clicking "Next Step" to build the tree!
                    </div>
                  </div>
                )}

                {isConceptTourRunning && conceptTourSteps[conceptStep]?.requiresTreeComplete && treeCompleted && (
                  <div style={{
                    marginBottom: '12px',
                    background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
                    borderRadius: '10px', padding: '10px 14px',
                    border: '1px solid #6ee7b7', textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#065f46', marginBottom: '2px' }}>
                      Tree Complete!
                    </div>
                    <div style={{ fontSize: '11px', color: '#047857' }}>
                      All {Math.floor(totalMerges / 2)} merges done. Click Next to continue →
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={cancelTour} className="tour-exit-btn">
                    EXIT
                  </button>

                  <button
                    onClick={() => {
                      setShowActionRequired(false);
                      if (conceptStep > 0) goToStep(conceptStep - 1);
                    }}
                    disabled={conceptStep === 0}
                    className="tour-prev-btn"
                  >
                    Prev
                  </button>
                </div>

                <button
                  onClick={() => {
                    const currentStepData = conceptTourSteps[conceptStep];

                    if (currentStepData?.waitingForSymbol) {
                      if (!waitingForSymbolRef.current) {
                        setDynamicAnchorPlacement(null);
                        setDynamicOffset(null);
                        setDynamicTourText(null);
                        goToStep(conceptStep + 1);
                        return;
                      }

                      setWaitingForSymbol(true);
                      waitingForSymbolRef.current = true;
                      hasNotifiedTextRef.current = false;

                      const mode = inputModeRef.current;
                      if (mode === 'text') {
                        const tEl = textInputBoxRef.current;
                        if (tEl) {
                          tEl.style.outline = '3px solid #f59e0b';
                          tEl.style.boxShadow = '0 0 0 6px rgba(245, 158, 11, 0.3)';
                          tEl.style.borderRadius = '8px';
                          setAnchorEl(tEl);
                          setDynamicAnchorPlacement(getResponsivePlacement('right'));
                          setDynamicOffset(getResponsiveOffset([100, 10]));
                        }
                        const msg = "Here you can type the text which you want to encode. Type something to continue.";
                        setDynamicTourText(msg);
                        speakTourText(msg);
                      } else {
                        const sEl = symbolBoxRef.current;
                        if (sEl) {
                          sEl.style.outline = '3px solid #f59e0b';
                          sEl.style.boxShadow = '0 0 0 6px rgba(245, 158, 11, 0.3)';
                          sEl.style.borderRadius = '8px';
                          setAnchorEl(sEl);
                          setDynamicAnchorPlacement(getResponsivePlacement('right'));
                          setDynamicOffset(getResponsiveOffset([100, 10]));
                        }
                        const msg = "Here are the symbols — Plus, Minus, Multiply, and Divide. Choose any one to continue.";
                        setDynamicTourText(msg);
                        speakTourText(msg);
                      }
                      return;
                    }

                    if ((currentStepData?.requiresAnalyze || currentStepData?.waitingForAnalyze)
                      && !isAnalyzeDoneRef.current) {
                      setShowActionRequired(true);
                      speakTourText("Please click the Analyze Frequency button before proceeding.");
                      return;
                    }

                    if (currentStepData?.requiresGenerate && !isTreeGeneratedRef.current) {
                      setShowActionRequired(true);
                      speakTourText("Please click the Generate button before proceeding.");
                      return;
                    }

                    if (currentStepData?.requiresTreeComplete && !treeCompletedRef.current) {
                      speakTourText("Please complete the tree by clicking Next Step button until tree is fully built.");
                      return;
                    }

                    setShowActionRequired(false);

                    if (conceptStep < conceptTourSteps.length - 1) {
                      goToStep(conceptStep + 1);
                    } else {
                      cancelTour();
                    }
                  }}
                  className={`tour-next-btn ${isNextDisabled ? 'disabled' : 'enabled'}`}
                >
                  {conceptStep === conceptTourSteps.length - 1 ? 'Finish' : 'Next'}
                </button>
              </div>

              <div style={{ marginTop: '12px' }}>
                <div style={{ background: '#eee', borderRadius: '4px', height: '6px' }}>
                  <div style={{
                    width: `${((conceptStep + 1) / conceptTourSteps.length) * 100}%`,
                    background: '#1d2a6d', height: '6px', borderRadius: '4px', transition: '0.3s'
                  }} />
                </div>
                <span style={{ fontSize: '11px', color: '#888', marginTop: '4px', display: 'block', textAlign: 'right' }}>
                  {conceptStep + 1} / {conceptTourSteps.length}
                </span>
              </div>
              </div>
            </div>
          </Popper>
        )}

        <DialogContent
          sx={{
            padding: "0px",
            minHeight: isMobile ? 'auto' : "1700px",
            height: isMobile ? 'auto' : "1700px",
            // These stop this content area from behaving like a stretchy
            // flex child of the fullScreen mobile Paper (which is
            // display:flex by default). Without them, the Paper's forced
            // 100dvh height/width could get pushed by children below.
            display: 'block',
            flex: isMobile ? '1 1 auto' : undefined,
            overflowY: isMobile ? 'auto' : 'visible',
            overflowX: 'hidden',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}>

          <Modal
            open={showInstructions}
            onClose={() => setShowInstructions(false)}
            sx={{ zIndex: 2000000 }}
          >
            <Box sx={{
              position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              outline: 'none',
            }}>
              <Box sx={{ background: 'white', borderRadius: '8px', maxWidth: '580px', width: '90%', overflow: 'hidden' }}>
                <Box sx={{ background: '#1a3a5c', padding: '12px 20px' }}>
                  <span style={{ color: 'white', fontSize: '20px', fontWeight: 600 }}>Instructions of Huffman Encoding:</span>
                </Box>
                <Box sx={{ padding: '20px 24px 8px' }}>
                  {[
                    { stepNum: 1, html: 'Select a <b>binary image</b> or <b>Grayscale image</b> from the image box or type your custom text.' },
                    { stepNum: 2, html: 'Click <b>"Analyze Frequency"</b> button.' },
                    { stepNum: 3, html: 'Click <b>"Generate"</b> button to create the Huffman Tree.' },
                    { stepNum: 4, html: 'Click <b>"Next Step"</b> repeatedly to merge the lowest-frequency nodes.' },
                    { stepNum: 5, html: 'Click <b>"Prev Step"</b> to move back to the previous stage of the Huffman Tree construction and review the earlier merging process.' },
                    { stepNum: 6, html: 'View the final <b>Huffman Tree</b> and <b>binary codes</b> in the Encoded Table.' },
                    { stepNum: 7, html: 'Click the <b>"Reset"</b> button to start from the initial step.' }
                  ].map((step, idx) => (
                    <p key={idx} style={{
                      fontSize: '14px', margin: '0 0 10px', padding: '4px 6px', borderRadius: '4px',
                      backgroundColor: activeInstructionStep === idx ? '#fff8e1' : 'transparent',
                      color: activeInstructionStep === idx ? '#92400e' : '#333',
                      fontWeight: activeInstructionStep === idx ? '600' : '400',
                      borderLeft: activeInstructionStep === idx ? '3px solid #f59e0b' : '3px solid transparent',
                      transition: 'all 0.3s ease',
                    }}>
                      <strong>Step {step.stepNum} - </strong>
                      <span dangerouslySetInnerHTML={{ __html: step.html }} />
                    </p>
                  ))}
                  <div style={{
                    marginTop: '16px', padding: '10px 14px', background: '#f0f4ff',
                    borderRadius: '8px', borderLeft: '3px solid #1d2a6d', fontSize: '13px', color: '#555'
                  }}>
                    <strong>Tip:</strong> Characters with higher frequency get shorter binary codes!
                  </div>
                  <button onClick={() => {
                    window.speechSynthesis.cancel();
                    setShowInstructions(false);
                    setActiveInstructionStep(-1);
                    if (isConceptTourRunning) {
                      speakTourText(conceptTourSteps[conceptStep].text);
                      const el = conceptTourSteps[conceptStep]?.ref?.current;
                      if (el) {
                        el.style.outline = '3px solid #f59e0b';
                        el.style.boxShadow = '0 0 0 6px rgba(245, 158, 11, 0.3)';
                        el.style.borderRadius = '8px';
                      }
                    }
                  }}
                    style={{
                      display: 'flex', justifyContent: 'center', alignItems: 'center',
                      margin: '15px auto 0', background: 'white', color: '#1d2a6d',
                      border: '2px solid #1d2a6d', borderRadius: '6px', padding: '4px 10px',
                      cursor: 'pointer', fontSize: '16px'
                    }}>
                    <b>CLOSE</b>
                  </button>
                </Box>
              </Box>
            </Box>
          </Modal>

          {open && <HuffmanAnimation
            symbolTextToggleRef={symbolTextToggleRef}
            symbolBoxRef={symbolBoxRef}
            textInputBoxRef={textInputBoxRef}
            analyzeFreqRef={analyzeFreqRef}
            freqTableRef={freqTableRef}
            generateBtnRef={generateBtnRef}
            nextStepBtnRef={nextStepBtnRef}
            prevStepBtnRef={prevStepBtnRef}
            resetBtnRef={resetBtnRef}
            treeVisualizationRef={treeVisualizationRef}
            onSymbolSelected={handleSymbolSelected}
            onAnalyzeDone={handleAnalyzeDone}
            onValidationFailed={handleAnalyzeValidationFailed}
            onInputModeChange={(mode) => {
              inputModeRef.current = mode;
              if (isConceptTourRunningRef.current && waitingForSymbolRef.current) {
                hasNotifiedTextRef.current = false;
                if (mode === 'text') {
                  const tEl = textInputBoxRef.current;
                  const sEl = symbolBoxRef.current;
                  if (sEl) { sEl.style.outline = ''; sEl.style.boxShadow = ''; sEl.style.borderRadius = ''; }
                  if (tEl) {
                    tEl.style.outline = '3px solid #f59e0b';
                    tEl.style.boxShadow = '0 0 0 6px rgba(245, 158, 11, 0.3)';
                    tEl.style.borderRadius = '8px';
                    setAnchorEl(tEl);
                  }
                  setDynamicAnchorPlacement(getResponsivePlacement('right'));
                  setDynamicOffset(getResponsiveOffset([100, 10]));
                  const msg = "Type your text here to encode it, then click Analyze Frequency.";
                  setDynamicTourText(msg);
                  setIsPopupVisible(true);
                  speakTourText(msg);
                } else {
                  const sEl = symbolBoxRef.current;
                  const tEl = textInputBoxRef.current;
                  if (tEl) { tEl.style.outline = ''; tEl.style.boxShadow = ''; tEl.style.borderRadius = ''; }
                  if (sEl) {
                    sEl.style.outline = '3px solid #f59e0b';
                    sEl.style.boxShadow = '0 0 0 6px rgba(245, 158, 11, 0.3)';
                    sEl.style.borderRadius = '8px';
                    setAnchorEl(sEl);
                  }
                  setDynamicAnchorPlacement(getResponsivePlacement('right'));
                  setDynamicOffset(getResponsiveOffset([100, 10]));
                  const msg = "Here are the symbols — Plus, Minus, Multiply, and Divide. Choose any one to continue.";
                  setDynamicTourText(msg);
                  setIsPopupVisible(true);
                  speakTourText(msg);
                }
              }
            }}
            onTextEntered={handleTextEntered}
            onRegisterReset={(fn) => { resetAnimationRef.current = fn; }}
            onGenerate={() => {
              setIsTreeGenerated(true);
              isTreeGeneratedRef.current = true;
              if (isConceptTourRunningRef.current && conceptTourSteps[conceptStepRef.current]?.requiresGenerate) {
                setShowActionRequired(false);
                const next = conceptStepRef.current + 1;
                setConceptStepSynced(next);
                goToStep(next);
              }
            }}
            onReset={() => {
              hasNotifiedTextRef.current = false;
              setIsTreeGenerated(false);
              isTreeGeneratedRef.current = false;
              setIsAnalyzeDone(false);
              isAnalyzeDoneRef.current = false;
              setTourRunning(false);
              setAnchorEl(null);
              setIsPopupVisible(false);
              setWaitingForAnalyze(false);
              waitingForAnalyzeRef.current = false;
              setWaitingForSymbol(false);
              waitingForSymbolRef.current = false;
              window.speechSynthesis.cancel();
              setTreeCompleted(false);
              treeCompletedRef.current = false;
              setCurrentMerge(0);
              setTotalMerges(0);
            }}
            treeDescriptionRef={treeDescriptionRef}
            encodedTableRef={encodedTableRef}
            onStepsGenerated={handleStepsGenerated}
            onNextStepDone={handleNextStepDone}
            onTreeComplete={handleTreeComplete}
          />}
        </DialogContent>
      </Dialog>
    </>
  );
}