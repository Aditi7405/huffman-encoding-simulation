import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, Popper } from '@mui/material';
import Box from '@mui/material/Box';
import HuffmanAnimation from './HuffmanAnimation';
import Button from './styledbutton';
import voice from '../assets/images/voice-play.png';
import voice_pause from '../assets/images/voice-pause.png';

const getArrowStyle = (placement = 'bottom-start') => {
  const base = {
    position: 'absolute',
    width: '14px',
    height: '14px',
    background: 'rgb(219,234,254)',
    transform: 'rotate(45deg)',
    zIndex: 2,
  };

  if (placement.startsWith('bottom')) return {
    ...base,
    top: '-7px',
    borderTop: '2px solid #1d2a6d',
    borderLeft: '2px solid #1d2a6d',
    ...(placement.endsWith('end')  ? { right: '18px' } : {}),
    ...(placement.endsWith('start') ? { left: '18px' } : {}),
    ...(placement === 'bottom' ? { left: '50%', transform: 'translateX(-50%) rotate(45deg)' } : {}),
  };

  if (placement.startsWith('top')) return {
    ...base,
    bottom: '-7px',
    borderBottom: '2px solid #1d2a6d',
    borderRight: '2px solid #1d2a6d',
    ...(placement.endsWith('end')  ? { right: '18px' } : {}),
    ...(placement.endsWith('start') ? { left: '18px' } : {}),
    ...(placement === 'top' ? { left: '50%', transform: 'translateX(-50%) rotate(45deg)' } : {}),
  };

  if (placement.startsWith('left')) return {
    ...base,
    right: '-7px',
    top: '18px',
    borderTop: '2px solid #1d2a6d',
    borderRight: '2px solid #1d2a6d',
  };

  if (placement.startsWith('right')) return {
    ...base,
    left: '-7px',
    top: '18px',
    borderBottom: '2px solid #1d2a6d',
    borderLeft: '2px solid #1d2a6d',
  };

  return { ...base, top: '-7px', left: '18px',
    borderTop: '2px solid #1d2a6d', borderLeft: '2px solid #1d2a6d' };
};

export default function HuffmanConceptTutor({ open, onClose, onOpen }) {

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
  const [showSymbolAlert, setShowSymbolAlert] = useState(false);
  const [tourWordIndex, setTourWordIndex] = useState(-1);
  const [actualPlacement, setActualPlacement] = useState('bottom-start');
  const [isTreeGenerated, setIsTreeGenerated] = useState(false);
  const [showActionRequired, setShowActionRequired] = useState(false);
  const [isAnalyzeDone, setIsAnalyzeDone] = useState(false);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  const [totalMerges, setTotalMerges] = useState(0);
  const [currentMerge, setCurrentMerge] = useState(0);
  const [treeCompleted, setTreeCompleted] = useState(false);
  const [showTreeComplete, setShowTreeComplete] = useState(false);
  const [instructionsWodIndex, setInstructionsWordIndex] = useState(-1);
  const [activeInstructionStep, setActiveInstructionStep] = useState(-1);
  const [treeCompleteMessage, setTreeCompleteMessage] = useState('');

  const guidedTutorRef = useRef(null);
  const instructionBtnRef = useRef(null);
  const speechBtnRef = useRef(null);
  const symbolTextToggleRef = useRef(null);
  const analyzeFreqRef = useRef(null);
  const generateBtnRef = useRef(null);
  const nextStepBtnRef = useRef(null);
  const prevStepBtnRef = useRef(null);
  const resetBtnRef = useRef(null);
  const treeVisualizationRef = useRef(null);
  const waitingForSymbolRef = useRef(false);
  const freqTableRef = useRef(null);
  const resetAnimationRef = useRef(null);
  const wordTimersRef = useRef([]);
  const conceptStepRef = useRef(0);
  const waitingForAnalyzeRef = useRef(false);
  const symbolBoxRef = useRef(null);
  const textInputBoxRef = useRef(null);
  const currentPlacementRef = useRef('bottom-start');
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
    if (wordTimersRef.current) {
      wordTimersRef.current.forEach(t => clearTimeout(t));
      wordTimersRef.current = [];
    }
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

  const restartFromInput = () => {
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
  setTimeout(() => {
    goToStep(3); 
  }, 300);
};

  const conceptTourSteps = [
    {
      title: "Guided Tutor",
      text: "Welcome to Huffman Encoding Visualization! This guided tour will walk you through each component of the simulator, helping you understand how Huffman Encoding works in practice.",
      ref: guidedTutorRef,
      placement: "bottom-end",
    },
    {
      title: "Instructions Button",
      text: "The Instructions panel provides a complete step-by-step walkthrough of the simulation process. Refer to it anytime you need a quick refresher on how to operate the visualizer.",
      ref: instructionBtnRef,
      placement: "bottom-start",
    },
    {
      title: "Speech Button",
      text: "Toggle audio narration using this button. When enabled, the system will vocally explain each concept as you progress through the visualization.",
      ref: speechBtnRef,
      placement: "bottom-start",
    },
    {
      title: "Symbol / Text Input",
      text: "Choose your input mode — select a mathematical symbol such as Plus, Minus, Multiply, or Divide, or switch to Text Input mode and enter any custom string to begin encoding.",
      ref: symbolTextToggleRef,
      waitingForSymbol: true,
      placement: "left-start",
    },
    {
      title: "Analyze Frequency",
      text: "Click Analyze Frequency to compute the character frequency distribution of your input. This step is fundamental — Huffman Encoding relies entirely on character frequencies to assign optimal binary codes.",
      ref: analyzeFreqRef,
      waitingForAnalyze: true,
      requiresAnalyze: true,
      placement: "right",
      offset: [140,10],
    },
    {
      title: "Frequency Table",
      text: "The Frequency Table displays each unique character alongside its occurrence count. Characters with higher frequency will receive shorter binary codes, forming the basis of Huffman's compression strategy.",
      ref: freqTableRef,
      placement: "bottom-end",
    },
    {
      title: "Generate Tree",
      text: "Click Generate to initialize the Huffman Tree. Each character is represented as a leaf node, sorted in ascending order of frequency — ready for the tree-building process to begin.",
      ref: generateBtnRef,
      placement: "left-start",
      requiresGenerate: true,
      offset: [10,10],
    },
    {
      title: "Next Step",
      text: "Press Next Step to advance the tree construction. The two nodes with the lowest frequencies are highlighted and merged iteratively until a single root node remains — this is the core of Huffman's greedy algorithm.",
      ref: nextStepBtnRef,
      placement: "top-start",
      requiresTreeComplete: true,
    },
    {
      title: "Prev Step",
      text: "Use Prev Step to navigate backwards through the tree construction process — useful for reviewing any merging step in detail.",
      ref: prevStepBtnRef,
      placement: "top-start",
    },
    {
      title: "Tree Visualization Box",
      text: "This panel renders the Huffman Tree in real time. Observe how nodes combine step by step, with edge labels 0 and 1 representing the binary path from root to each character. You can see the full description below the tree visualization area.",
      ref: treeVisualizationRef,
      placement: "left",
    },
    {
      title: "Tree Description",
      text: "Below the tree visualization, you can read a step-by-step description of what is happening - which nodes are being selected, merged, and how the edge labels 0 and 1 form the binary path from root to each leaf character.",
      ref: treeDescriptionRef,
      placement: "left-start",
    },
    {
      title: "Encoded Table",
      text: "Once the tree is fully built, the Encoded Table appears here showing each character alongside its optimal Huffman binary code. Characters with higher frequency receive shorter codes — this is the core compression benefit of Huffman Encoding.",
      ref: encodedTableRef,
      placement: "top",
      requiresGenerate: true,
    },
    {
      title: "Reset",
      text: "Click Reset to clear the current simulation entirely and start fresh with a new input. You have successfully completed the full walkthrough of the Huffman Encoding Visualizer!",
      ref: resetBtnRef,
      placement: "right-start",
    },
  ];

  useEffect(() => {
    if (open && onOpen) onOpen();
  }, [open]);

  useEffect(() => {
    const dialogEl = document.getElementById('explanation-dialog');
    if (!dialogEl) return;
    const scrollEl = dialogEl.closest('.MuiDialog-scrollPaper') || dialogEl.parentElement;
    if (!scrollEl) return;
    scrollEl.style.overflow = isConceptTourRunning ? 'hidden' : '';
    return () => { scrollEl.style.overflow = ''; };
  }, [isConceptTourRunning]);

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
      if (wordTimersRef.current) {
        wordTimersRef.current.forEach(t => clearTimeout(t));
        wordTimersRef.current = [];
      }
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

  useEffect(() => {
    if (!isConceptTourRunning) return;
    const pl = conceptTourSteps[conceptStep]?.placement || 'bottom-start';
    currentPlacementRef.current = pl;
  }, [conceptStep, isConceptTourRunning]);

  const speakTourText = (text, onDone) => {
    if (!isSpeechEnabledRef.current) {
      if (onDone) onDone();
      return;
    }
    window.speechSynthesis.cancel();
    if (wordTimersRef.current) {
      wordTimersRef.current.forEach(t => clearTimeout(t));
      wordTimersRef.current = [];
    }
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
        console.warn('Speech error:', e);
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

  const handleSymbolSelected = (index) => {
    if (!waitingForSymbolRef.current) {
      
      if (isConceptTourRunningRef.current) {
        restartFromInput();
      }
      return;
    }

    if (isHandlingSymbolRef.current) return;
    isHandlingSymbolRef.current = true;

    setWaitingForSymbol(false);
    waitingForSymbolRef.current = false;

    const symbolEl = symbolBoxRef.current;
    if (symbolEl) {
      symbolEl.style.outline = '3px solid #f59e0b';
      symbolEl.style.boxShadow = '0 0 0 6px rgba(245, 158, 11, 0.3)';
      symbolEl.style.borderRadius = '8px';
    }

    const name = symbolNames[index];
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(`You selected ${name}.`);
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
        const toggleEl = symbolTextToggleRef.current;
        if (toggleEl) {
          toggleEl.style.outline = '';
          toggleEl.style.boxShadow = '';
          toggleEl.style.borderRadius = '';
        }
        const sEl = symbolBoxRef.current;
        if (sEl) {
          sEl.style.outline = '3px solid #f59e0b';
          sEl.style.boxShadow = '0 0 0 6px rgba(245, 158, 11, 0.3)';
          sEl.style.borderRadius = '8px';
        }
        isHandlingSymbolRef.current = false;
      }, 300);
    };
    window.speechSynthesis.speak(utterance);
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
    }, 600);
  };

  const handleStepsGenerated = (count) => {
    setTotalMerges(count);
    totalMergesRef.current = count;
    setCurrentMerge(0);
    setTreeCompleted(false);
    treeCompletedRef.current = false;
  };

  const handleNextStepDone = (currentIdx, total) => {
    const mergesDone = Math.floor((currentIdx + 1) / 2);
    setCurrentMerge(mergesDone);
  };

  const handleTreeComplete = () => {
    setTreeCompleted(true);
    treeCompletedRef.current = true;
    const msg = "Excellent! The Huffman Tree is now complete. All characters have been merged into a single root node. Click Next to continue.";
    setTreeCompleteMessage(msg);
    speakTourText(msg);
  };

  const handleTextEntered = () => {
    if (!waitingForSymbolRef.current) {
      if (isConceptTourRunningRef.current) {
        restartFromInput();
      }
      return;
    }

    if (resetAnimationRef.current) resetAnimationRef.current();
    setWaitingForSymbol(false);
    waitingForSymbolRef.current = false;

    const textEl = textInputBoxRef.current;
    if (textEl) {
      textEl.style.outline = '3px solid #f59e0b';
      textEl.style.boxShadow = '0 0 0 6px rgba(245, 158, 11, 0.3)';
      textEl.style.borderRadius = '8px';
    }

    speakTourText("Text entered. Now click Analyze Frequency.", () => {
      const next = conceptStepRef.current + 1;
      setWaitingForAnalyze(true);
      waitingForAnalyzeRef.current = true;
      setTourRunning(true); 
      goToStep(next);
    });
  };

  const goToStep = (stepIndex) => {
    setShowActionRequired(false);
    setConceptStepSynced(stepIndex);
    setTourWordIndex(-1);
    window.speechSynthesis.cancel();

    if (conceptTourSteps[stepIndex]?.waitingForSymbol) {
      setWaitingForSymbol(true);
      waitingForSymbolRef.current = true;
      isHandlingSymbolRef.current = false;
    } else {
      setWaitingForSymbol(false);
      waitingForSymbolRef.current = false;
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="explanation-dialog-title"
      PaperProps={{ id: "explanation-dialog" }}>

      <DialogTitle id="instructions-dialog-title"
        sx={{
          backgroundColor: '#1d2a6d', color: 'white',
          display: 'flex', flexDirection: 'row',
          justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 24px', position: 'relative'
        }}>

        <span style={{ fontSize: '20px', fontWeight: '600' }}>
          Huffman Concept
        </span>

        <div style={{ position: 'relative', display: "flex", alignItems: "center", gap: '10px' }}>

          {/* Speech Button */}
          <span ref={speechBtnRef} style={{ display: "inline-flex", alignItems: "center" }}>
            <Button title="Play"
              onClick={handleTutorToggle}
              style={{ display: isConceptTourRunning ? "none" : "inline-flex", minWidth: "unset", padding: "0px" }}>
              <img src={voice} alt="voice" style={{ width: "40px", height: "auto" }} />
            </Button>
            <Button title="Pause"
              onClick={handleTutorToggle}
              style={{ display: isConceptTourRunning ? "inline-flex" : "none", minWidth: "unset", padding: "0px" }}>
              <img src={voice_pause} alt="voice_pause" style={{ width: "40px", height: "auto" }} />
            </Button>
          </span>

          <button
            ref={instructionBtnRef}
            onClick={() => {
              window.speechSynthesis.cancel();
              setShowInstructions(true);
              const steps = [
                " Select a symbol image from Choose box or type your own text. ",
                " Click Analyze Frequency button. ",
                " Click Generate button. ",
                " Click Next Step repeatedly. ",
                " Final binary codes will be displayed. ",
                " Click Reset to start over."
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
              padding: "8px 18px", borderRadius: "13px", cursor: "pointer",
              whiteSpace: "nowrap", fontSize: "14px", width: "145px", height: "42px",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "1px solid #333",
            }}>
            INSTRUCTIONS
          </button>

          <button
            ref={guidedTutorRef}
            onClick={() => {
              setShowWelcome(false);
              window.speechSynthesis.cancel();
              setTourRunning(true); 
              setConceptStepSynced(0);
              goToStep(0);
            }}
            style={{
              background: "white", color: "#1d2a6d", border: "1.5px solid #1d2a6d",
              borderRadius: "6px", padding: "5px 14px", cursor: "pointer",
              fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center",
              gap: "8px", whiteSpace: "nowrap", height: "42px"
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
              background: 'white', color: '#1d2a6d', border: '2px solid #1d2a6d',
              borderRadius: '8px', padding: '6px 16px', fontWeight: '600',
              cursor: 'pointer', fontSize: '14px'
            }}>
            Close
          </button>
        </div>

        {/* Welcome Popup */}
        {showWelcome && welcomeAnchorEl && (
          <Popper
            open={Boolean(welcomeAnchorEl)}
            anchorEl={welcomeAnchorEl}
            placement="bottom-end"
            style={{ zIndex: 99999 }}
            modifiers={[{ name: 'offset', options: { offset: [0, 10] } }]}>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{
                width: '16px', height: '16px',
                background: 'linear-gradient(135deg, rgb(219,234,254), rgb(224,231,255))',
                transform: 'rotate(45deg)', borderTop: '2px solid #1d2a6d',
                borderLeft: '2px solid #1d2a6d', marginLeft: 'auto', marginRight: '20px',
                marginBottom: '-9px', zIndex: 2, flexShrink: 0, position: 'relative',
              }} />

              <div style={{
                width: '320px',
                background: 'linear-gradient(135deg, rgb(219,234,254), rgb(224,231,255))',
                borderRadius: '12px', padding: '16px',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)', border: '2px solid #1d2a6d',
                position: 'relative', zIndex: 0,
              }}>
                <div style={{
                  textAlign: 'center', fontSize: '16px', fontWeight: '700',
                  color: '#1d2a6d', marginBottom: '12px',
                  borderBottom: '1px solid #cbd5e1', paddingBottom: '8px',
                }}>
                  Guided Tutor is here to help!
                </div>

                <p style={{ fontSize: '14px', color: '#444', marginBottom: '18px', lineHeight: '1.5' }}>
                  Welcome. Do you want Guided Tutor to give you a proper guide on how to run the simulator?
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                  <button onClick={() => {
                    hasDeclinedRef.current = true;
                    setShowWelcome(false);
                  }}
                    style={{
                      background: '#f3f4f6', color: '#1d2a6d', border: '1px solid #1d2a6d',
                      padding: '8px 20px', borderRadius: '8px', cursor: 'pointer',
                      fontWeight: '600', fontSize: '14px',
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
                      padding: '8px 20px', borderRadius: '8px', cursor: 'pointer',
                      fontWeight: '600', fontSize: '14px',
                    }}>
                    Yes, Please
                  </button>
                </div>
              </div>
            </div>
          </Popper>
        )}
      </DialogTitle>

      {/* Tour Popup */}
      {isConceptTourRunning && anchorEl && isPopupVisible && !showInstructions && (
        <Popper
          open={true}
          anchorEl={anchorEl}
          placement={conceptTourSteps[conceptStep]?.placement || "bottom-start"}
          style={{ zIndex: 999999 }}
          modifiers={[
            { name: 'offset', options: { offset: conceptTourSteps[conceptStep]?.offset || [0, 10] } },
            { name: 'flip', enabled: true },
            { name: 'preventOverflow', options: { boundary: 'viewport', padding: 12 } },
            { name: 'hide', enabled: false },
            {
              name: 'reportPlacement', enabled: true, phase: 'afterWrite',
              fn: ({ state }) => { setActualPlacement(state.placement); },
            },
          ]}>

          <div style={{
            width: '320px',
            background: 'linear-gradient(135deg, rgb(219,234,254), rgb(224,231,255))',
            borderRadius: '18px', padding: '16px',
            boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
            border: '2px solid #1d2a5d', position: 'relative',
          }}>
            <div style={getArrowStyle(actualPlacement)} />

            <div style={{
              textAlign: 'center', fontSize: '15px', fontWeight: '700',
              color: '#1d2a6d', marginBottom: '12px',
              borderBottom: '1px solid #cbd5e1', paddingBottom: '8px'
            }}>
              {showActionRequired ? "⚠️ Action Required" : conceptTourSteps[conceptStep]?.title}
            </div>

            <div style={{ fontSize: '14px', color: '#333', lineHeight: '1.6', marginBottom: '18px' }}>
              {showActionRequired ? (
                ((conceptTourSteps[conceptStep]?.requiresAnalyze ||
                  conceptTourSteps[conceptStep]?.waitingForAnalyze) && !isAnalyzeDone
                  ? "Please click the Analyze Frequency button before proceeding."
                  : "Please click the Generate button before proceeding."
                ).split(" ").map((word, i) => (
                  <span key={i} style={{
                    padding: "1px 3px", marginRight: "3px", borderRadius: "4px", display: "inline-block",
                    background: i === tourWordIndex ? "#fff8e1" : "transparent",
                    color: i === tourWordIndex ? "#92400e" : "#1d2a6d",
                    fontWeight: i === tourWordIndex ? "600" : "400",
                    borderBottom: i === tourWordIndex ? "2px solid #f59e0b" : "2px solid transparent",
                    transition: "all 0.15s ease",
                  }}>{word}</span>
                ))
              ) : (
                (conceptTourSteps[conceptStep]?.requiresTreeComplete && treeCompleted && treeCompleteMessage
                  ? treeCompleteMessage
                  : conceptTourSteps[conceptStep]?.text
                ).split(" ").map((word, i) => (
                  <span key={i} style={{
                    padding: "1px 3px", marginRight: "3px", borderRadius: "4px", display: "inline-block",
                    background: i === tourWordIndex ? "#fff8e1" : "transparent",
                    color: i === tourWordIndex ? "#92400e" : "#1d2a6d",
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
                    <span>🌳 Tree Building Progress</span>
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
                  <div style={{ fontSize: '22px', marginBottom: '4px' }}>🎉</div>
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
                {/* ✅ EXIT button — cancelTour use karo */}
                <button onClick={cancelTour}
                  style={{
                    background: 'transparent', border: '1px solid #1d2a6d', borderRadius: '10px',
                    padding: '8px 14px', color: '#64748b', fontWeight: '600', cursor: 'pointer', fontSize: '13px'
                  }}>EXIT</button>

                <button
                  onClick={() => {
                    setShowActionRequired(false);
                    if (conceptStep > 0) goToStep(conceptStep - 1);
                  }}
                  disabled={conceptStep === 0}
                  style={{
                    background: '#d1d5db', color: '#1d2a6d', border: '1px solid #1d2a6d',
                    padding: '8px 14px', borderRadius: '10px',
                    cursor: conceptStep === 0 ? 'not-allowed' : 'pointer',
                    fontWeight: '600', fontSize: '13px'
                  }}>Back</button>
              </div>

              <button
                onClick={() => {
                  const currentStepData = conceptTourSteps[conceptStep];

                  if (currentStepData?.waitingForSymbol) {
                    setWaitingForSymbol(true);
                    waitingForSymbolRef.current = true;
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
                style={{
                  background: (
                    ((conceptTourSteps[conceptStep]?.requiresAnalyze ||
                      conceptTourSteps[conceptStep]?.waitingForAnalyze) && !isAnalyzeDone) ||
                    (conceptTourSteps[conceptStep]?.requiresGenerate && !isTreeGenerated) ||
                    (conceptTourSteps[conceptStep]?.requiresTreeComplete && !treeCompleted)
                  ) ? "#9ca3af" : "#1d2a6d",
                  color: "white", border: "none", padding: "8px 18px",
                  borderRadius: "10px",
                  cursor: (
                    ((conceptTourSteps[conceptStep]?.requiresAnalyze ||
                      conceptTourSteps[conceptStep]?.waitingForAnalyze) && !isAnalyzeDone) ||
                    (conceptTourSteps[conceptStep]?.requiresGenerate && !isTreeGenerated) ||
                    (conceptTourSteps[conceptStep]?.requiresTreeComplete && !treeCompleted)
                  ) ? "not-allowed" : "pointer",
                  fontWeight: "600", fontSize: "13px"
                }}>
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
        </Popper>
      )}

      <DialogContent sx={{ padding: "0px", height: "1700px" }}>
        {showInstructions && (
          <Box style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Box sx={{ background: 'white', borderRadius: '8px', maxWidth: '580px', width: '90%', overflow: 'hidden' }}>
              <Box sx={{ background: '#1a3a5c', padding: '12px 20px' }}>
                <span style={{ color: 'white', fontSize: '20px', fontWeight: 600 }}>Instructions of Huffman Encoding:</span>
              </Box>
              <Box sx={{ padding: '20px 24px 8px' }}>
                {[
                  { stepNum: 1, html: 'Select a symbol image from Choose box or type your own text.' },
                  { stepNum: 2, html: 'Click <b>"Analyze Frequency"</b> button.' },
                  { stepNum: 3, html: 'Click <b>"Generate"</b> button.' },
                  { stepNum: 4, html: 'Click <b>"Next Step"</b> repeatedly.' },
                  { stepNum: 5, html: 'Final binary codes will be displayed.' },
                  { stepNum: 6, html: 'Click <b>"Reset"</b> to start over.' },
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
        )}

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
  );
}