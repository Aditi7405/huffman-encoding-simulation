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

  const setConceptStepSynced = (val) => {
    conceptStepRef.current = val;
    setConceptStep(val);
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
    },
    {
      title: "Analyze Frequency",
      text: "Click Analyze Frequency to compute the character frequency distribution of your input. This step is fundamental — Huffman Encoding relies entirely on character frequencies to assign optimal binary codes.",
      ref: analyzeFreqRef,
      waitingForAnalyze: true,
      requiresAnalyze: true,
      placement: "right",
      offset: [100,10],
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
      placement: "left-start",   
    },
    {
      title: "Tree Visualization Box",
      text: "This panel renders the Huffman Tree in real time. Observe how nodes combine step by step, with edge labels 0 and 1 representing the binary path from root to each character.You can see the full description below the tree visualization area.",
      ref: treeVisualizationRef,
      placement: "left",
    },
    {
      title: "Prev Step",
      text: "Use Prev Step to navigate backwards through the tree construction process — useful for reviewing any merging step in detail.",
      ref: prevStepBtnRef,
      placement: "left-start",
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
    const currentRef = conceptTourSteps[conceptStep]?.ref;
    const el = currentRef?.current;
    setIsPopupVisible(false);
    setAnchorEl(null);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const timer = setTimeout(() => {
        setAnchorEl(el);
        setIsPopupVisible(true);
      }, 600);
      return () => clearTimeout(timer);
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
      setIsConceptTourRunning(false);
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
    if (symbolEl) { symbolEl.style.outline= ''; symbolEl.style.boxShadow = ''; symbolEl.style.borderRadius = '';}
    if (textEl) {textEl.style.outline = ''; textEl.style.boxShadow = '';symbolEl.style.borderRadius = ''; }
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
  if(!isConceptTourRunning) return;
  const pl = conceptTourSteps[conceptStep]?.placement || 'bottom-start';
  currentPlacementRef.current = pl;
}, [conceptStep, isConceptTourRunning]);

  const speakTourText = (text, onDone) => {
    if(!isSpeechEnabledRef.current){
      if(onDone) onDone();
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
      const preferred = voices.find(v => v.lang.startsWith('en')) || voices[0];
      if (preferred) utterance.voice = preferred;
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.volume = 1;

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
    console.log("handleSymbolSelected called, waiting:", waitingForSymbolRef.current, "tourRunning:", isConceptTourRunning);
    if (!waitingForSymbolRef.current) return;
    if (resetAnimationRef.current) resetAnimationRef.current();
    setWaitingForSymbol(false);
    waitingForSymbolRef.current = false;
  const symbolEl = symbolBoxRef.current;
  if (symbolEl) {
  symbolEl.style.outline = '3px solid #f59e0b';
  symbolEl.style.boxShadow = '0 0 0 6px rgba(245, 158, 11, 0.3)';
  symbolEl.style.borderRadius = '8px';
  }

    const name = symbolNames[index];
    speakTourText(`You selected ${name}.`, () => {
      const next = conceptStepRef.current + 1;
      setConceptStepSynced(next);
      setWaitingForAnalyze(true);
      waitingForAnalyzeRef.current = true;
      setIsConceptTourRunning(true);
      setAnchorEl(null);
      setIsPopupVisible(false);
      const el = conceptTourSteps[next]?.ref?.current;
      if (el) setAnchorEl(el);
      speakTourText(conceptTourSteps[next].text);
    });
  };

  const handleAnalyzeDone = () => {
  console.log("handleAnalyzeDone called, waitingForAnalyzeRef:", waitingForAnalyzeRef.current);
  if (!waitingForAnalyzeRef.current) return;
  setIsAnalyzeDone(true);
  isAnalyzeDoneRef.current = true;
  waitingForAnalyzeRef.current = false;
  setWaitingForAnalyze(false);
  const next = conceptStepRef.current + 1;
  setConceptStepSynced(next);
  setIsPopupVisible(false);
  setTimeout(() => {
    const el = freqTableRef.current;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        setAnchorEl(el);
        setIsPopupVisible(true);
      }, 400);
    } else {
      setIsPopupVisible(true);
    }
    speakTourText(conceptTourSteps[next].text);
  }, 300);
};

  const handleTextEntered = () => {
    if (!waitingForSymbolRef.current) return;
    if (resetAnimationRef.current) resetAnimationRef.current();
    setWaitingForSymbol(false);
    waitingForSymbolRef.current = false;

  const textEl = textInputBoxRef.current;
  if (textEl) {
  textEl.style.outline = '3px solid #f59e0b';
  textEl.style.boxShadow = '0 0 0 6px rgba(245, 158, 11, 0.3)';
  textEl.style.borderRadius = '8px';
  }
    setIsConceptTourRunning(false);
    speakTourText("Text entered. Now click Analyze Frequency.", () => {
      const next = conceptStepRef.current + 1;
      setConceptStepSynced(next);
      setWaitingForAnalyze(true);
      waitingForAnalyzeRef.current = true;
      setIsConceptTourRunning(true);
      setAnchorEl(null);
      setIsPopupVisible(false);
      const el = conceptTourSteps[next]?.ref?.current;
      if (el) setAnchorEl(el);
      speakTourText(conceptTourSteps[next].text);
    });
  };

  const goToStep = (stepIndex) => {
    setConceptStepSynced(stepIndex);
    const el = conceptTourSteps[stepIndex]?.ref?.current;
    if (el) setAnchorEl(el);
    speakTourText(conceptTourSteps[stepIndex].text);
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
    style={{ display: isConceptTourRunning ? "none" : "inline-flex",
    minWidth: "unset", padding: "0px" }}>
    <img src={voice} alt="voice" style={{ width: "40px", height: "auto" }} />
  </Button>

  <Button title="Pause"
    onClick={handleTutorToggle}
    style={{ display: isConceptTourRunning ? "inline-flex" : "none",
    minWidth: "unset", padding: "0px" }}>
    <img src={voice_pause} alt="voice_pause" style={{ width: "40px", height: "auto" }} />
  </Button>
</span>

          <button
            ref={instructionBtnRef}
            onClick={() => {
              window.speechSynthesis.cancel();
              setShowInstructions(true);
              setTimeout(() => {
              const u = new SpeechSynthesisUtterance(
                "Instructions of Huffman Encoding"+
                "Step 1: Select a symbol image or type your own text. " +
                "Step 2: Click Analyze Frequency button. " +
                "Step 3: Click Generate button. " +
                "Step 4: Click Next Step repeatedly. " +
                "Step 5: Final binary codes will be displayed. " +
                "Step 6: Click Reset to start over."
              );
              u.rate = 0.95;
              window.speechSynthesis.speak(u);
              }, 300);
            }}
            style={{
              background: "white", 
              color: "#1d2a6d", 
              fontWeight: 600,
              padding: "8px 18px", 
              borderRadius: "13px", 
              cursor: "pointer",
              whiteSpace: "nowrap", 
              fontSize: "14px",
              width: "145px", 
              height: "42px",
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              border: "1px solid #333",
            }}>
            INSTRUCTIONS
          </button>

          <button
            ref={guidedTutorRef}
            onClick={() => {
            if (hasDeclinedRef.current || isConceptTourRunning) {
            hasDeclinedRef.current = false;
            setShowWelcome(false);
            setIsConceptTourRunning(true);
            setConceptStepSynced(0);
            setTimeout(() => {
                const el = conceptTourSteps[0].ref.current;
                if (!el) return;
                setAnchorEl(el);
                setIsPopupVisible(true);
                speakTourText(conceptTourSteps[0].text);
            }, 500);
            } else {
              setShowWelcome(true);
              setWelcomeAnchorEl(guidedTutorRef.current);
            }
            }}
            style={{
              background: "white", 
              color: "#1d2a6d", 
              border: "1.5px solid #1d2a6d",
              borderRadius: "6px", 
              padding: "5px 14px", 
              cursor: "pointer",
              fontSize: "13px", 
              fontWeight: 600, 
              display: "flex", 
              alignItems: "center",
              gap: "8px", 
              whiteSpace: "nowrap", 
              height: "42px"
            }}>
            <b>Guided Tutor</b>
          </button>

          <button onClick={() => {
            window.speechSynthesis.cancel();
            setIsHuffmanSpeaking(false);
            setIsConceptTourRunning(false);
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
      {/* Arrow */}
      <div style={{
        width: '16px',
        height: '16px',
        background: 'linear-gradient(135deg, rgb(219,234,254), rgb(224,231,255))',
        transform: 'rotate(45deg)',
        borderTop: '2px solid #1d2a6d',
        borderLeft: '2px solid #1d2a6d',
        marginLeft: 'auto',
        marginRight: '20px',
        marginBottom: '-8px',
        zIndex: 0,
        flexShrink: 0,
      }}/>

      <div style={{
        width: '320px',
        background: 'linear-gradient(135deg, rgb(219,234,254), rgb(224,231,255))',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
        border: '2px solid #1d2a6d',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          textAlign: 'center',
          fontSize: '16px',
          fontWeight: '700',
          color: '#1d2a6d',
          marginBottom: '12px',
          borderBottom: '1px solid #cbd5e1',
          paddingBottom: '8px',
        }}>
          Guided Tutor is here to help!
        </div>

        <p style={{ fontSize: '14px', color: '#444', marginBottom: '18px', lineHeight: '1.5' }}>
          Welcome. Do you want Guided Tutor to give you a proper guide on how to run the simulator?
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
          <button onClick={() => {
            hasDeclinedRef.current = true;
            setShowWelcome(false)}}
            style={{
              background: '#f3f4f6', color: '#1d2a6d',
              border: '1px solid #1d2a6d', padding: '8px 20px',
              borderRadius: '8px', cursor: 'pointer',
              fontWeight: '600', fontSize: '14px',
            }}>
            No, Thanks
          </button>

          <button onClick={() => {
            setShowWelcome(false);
            setIsConceptTourRunning(true);
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
              background: '#1d2a6d', color: 'white',
              border: 'none', padding: '8px 20px',
              borderRadius: '8px', cursor: 'pointer',
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
              name: 'reportPlacement',
              enabled: true,
              phase: 'afterWrite',
              fn: ({ state }) => {
                setActualPlacement(state.placement);
              },
            },
          ]}>
        
          <div style={{
            width: '320px',
            background: 'linear-gradient(135deg, rgb(219,234,254), rgb(224,231,255))',
            borderRadius: '18px', 
            padding: '16px',
            boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
            border: '2px solid #1d2a5d',
            position: 'relative',
          }}>
          <div style={getArrowStyle(actualPlacement)}/>

          <div style={{
          textAlign: 'center', 
          fontSize: '15px', 
          fontWeight: '700',
          color: '#1d2a6d', 
          marginBottom: '12px',
          borderBottom: '1px solid #cbd5e1', 
          paddingBottom: '8px'
          }}>
          {showActionRequired ? "⚠️ Action Required" : conceptTourSteps[conceptStep]?.title}
          </div>

<div style={{ fontSize: '14px', color: '#333', lineHeight: '1.6', marginBottom: '18px' }}>
  {showActionRequired ? (
    "Please click the Generate button before proceeding."
      .split(" ").map((word, i) => (
        <span key={i} style={{
          padding: "1px 3px", marginRight: "3px", borderRadius: "4px", display: "inline-block",
          background: i === tourWordIndex ? "#fff8e1" : "transparent",
          color: i === tourWordIndex ? "#92400e" : "#1d2a6d",
          fontWeight: i === tourWordIndex ? "600" : "400",
          borderBottom: i === tourWordIndex ? "2px solid #f59e0b" : "2px solid transparent",
          transition: "all 0.15s ease",
        }}>
          {word}
        </span>
      ))
  ) : (
    conceptTourSteps[conceptStep]?.text.split(" ").map((word, i) => (
      <span key={i} style={{
        padding: "1px 3px", marginRight: "3px", borderRadius: "4px", display: "inline-block",
        background: i === tourWordIndex ? "#fff8e1" : "transparent",
        color: i === tourWordIndex ? "#92400e" : "#1d2a6d",
        fontWeight: i === tourWordIndex ? "600" : "400",
        borderBottom: i === tourWordIndex ? "2px solid #f59e0b" : "2px solid transparent",
        transition: "all 0.15s ease",
      }}>
        {word}
      </span>
    ))
  )}
</div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => {
                  setIsConceptTourRunning(false);
                  setConceptStepSynced(0);
                  setAnchorEl(null);
                  window.speechSynthesis.cancel();
                  if (wordTimersRef.current) {
                    wordTimersRef.current.forEach(t => clearTimeout(t));
                    wordTimersRef.current = [];
                  }
                  setTourWordIndex(-1);
                  setIsHuffmanSpeaking(false);
                  conceptTourSteps.forEach(step => {
                  const el = step.ref?.current;
                  if (el) {
                  el.style.outline = '';
                  el.style.boxShadow = '';
                  el.style.borderRadius = '';
                  }
                  });
                }} style={{
                  background: 'transparent', border: '1px solid #1d2a6d', borderRadius: '10px',
                  padding: '8px 14px', color: '#64748b', fontWeight: '600', cursor: 'pointer', fontSize: '13px'
                }}>EXIT</button>

                <button
                  onClick={() => {
                    setShowActionRequired(false);
                    if (conceptStep > 0) {
                      goToStep(conceptStep - 1);
                    }
                  }}
                  disabled={conceptStep === 0}
                  style={{
                    background: '#d1d5db', 
                    color: '#1d2a6d', 
                    border: '1px solid #1d2a6d',
                    padding: '8px 14px', 
                    borderRadius: '10px',
                    cursor: conceptStep === 0 ? 'not-allowed' : 'pointer',
                    fontWeight: '600', 
                    fontSize: '13px'
                  }}>Back</button>
              </div>
              <button
                onClick={() => {
                  const currentStepData = conceptTourSteps[conceptStep];
                  if (currentStepData?.waitingForSymbol) {
                    setWaitingForSymbol(true);
                    waitingForSymbolRef.current = true;
                    setAnchorEl(null);
                    setIsPopupVisible(false);
                    return;
                  }
                  if (currentStepData?.waitingForAnalyze) {
                  waitingForAnalyzeRef.current = true;
                  setIsConceptTourRunning(false);
                  setAnchorEl(null);
                  return;
                  }
                  if (currentStepData?.requiresGenerate && !isTreeGeneratedRef.current) {
                    setShowActionRequired(true);
                    speakTourText("Please click the Generate button before proceeding.");
                    return;
                  }
                  if (currentStepData?.requiresAnalyze && !isAnalyzeDoneRef.current) {
                  setShowActionRequired(true);
                  speakTourText("Please click the Analyze Frequency button before proceeding.");
                  return;
                  }
                  if (currentStepData?.waitingForAnalyze) {
                  waitingForAnalyzeRef.current = true;
                  setWaitingForAnalyze(true);
                  setAnchorEl(null);
                  setIsPopupVisible(false);
                  return;
                  }
                  setShowActionRequired(false);
                  if (conceptStep < conceptTourSteps.length - 1) {
                    const next = conceptStep + 1;
                    if (conceptTourSteps[next]?.waitingForAnalyze) {
                      setWaitingForAnalyze(true);
                      waitingForAnalyzeRef.current = true;
                    }
                    goToStep(next);
                  } else {
                    setIsConceptTourRunning(false);
                    setConceptStepSynced(0);
                    setAnchorEl(null);
                    window.speechSynthesis.cancel();
                  }
                }}
                style={{
                  background: '#1d2a6d', 
                  color: 'white', 
                  border: 'none',
                  padding: '8px 18px', 
                  borderRadius: '10px',
                  cursor: 'pointer', 
                  fontWeight: '600', 
                  fontSize: '13px'
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
            position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Box sx={{ background: 'white', borderRadius: '8px', maxWidth: '580px', width: '90%', overflow: 'hidden' }}>
              <Box sx={{ background: '#1a3a5c', padding: '12px 20px' }}>
                <span style={{ color: 'white', fontSize: '20px', fontWeight: 600 }}>Instructions of Huffman Encoding:</span>
              </Box>
              <Box sx={{ padding: '20px 24px 8px' }}>
                <p style={{ fontSize: '14px', color: '#333', margin: '0 0 10px' }}><strong>Step 1 - </strong> Select a symbol image from Choose box or type your own text.</p>
                <p style={{ fontSize: '14px', color: '#333', margin: '0 0 10px' }}><strong>Step 2 - </strong> Click <b>"Analyze Frequency"</b> button.</p>
                <p style={{ fontSize: '14px', color: '#333', margin: '0 0 10px' }}><strong>Step 3 - </strong> Click <b>"Generate"</b> button.</p>
                <p style={{ fontSize: '14px', color: '#333', margin: '0 0 10px' }}><strong>Step 4 - </strong> Click <b>"Next Step"</b> repeatedly.</p>
                <p style={{ fontSize: '14px', color: '#333', margin: '0 0 10px' }}><strong>Step 5 - </strong> Final binary codes will be displayed.</p>
                <p style={{ fontSize: '14px', color: '#333', margin: '0 0 10px' }}><strong>Step 6 - </strong> Click <b>"Reset"</b> to start over.</p>
                <div style={{ marginTop: '16px', padding: '10px 14px', background: '#f0f4ff', borderRadius: '8px', borderLeft: '3px solid #1d2a6d', fontSize: '13px', color: '#555' }}>
                  <strong>Tip:</strong> Characters with higher frequency get shorter binary codes!
                </div>
                <button onClick={() => {
                   window.speechSynthesis.cancel(); 
                   setShowInstructions(false); 
                   if(isConceptTourRunning){
                    speakTourText(conceptTourSteps[conceptStep].text);
                   }
                   }}
                  style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '15px auto 0', background: 'white', color: '#1d2a6d', border: '2px solid #1d2a6d', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '16px' }}>
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
          onGenerate={() => {setIsTreeGenerated(true);
            isTreeGeneratedRef.current = true;
            if (isConceptTourRunning && conceptTourSteps[conceptStepRef.current]?.requiresGenerate) {
            setShowActionRequired(false);
            const next = conceptStepRef.current + 1;
            setConceptStepSynced(next);
            const el = conceptTourSteps[next]?.ref?.current;
            if (el) setAnchorEl(el);
            speakTourText(conceptTourSteps[next].text);
            } 
          }}
          onReset={() => {setIsTreeGenerated(false);
            isTreeGeneratedRef.current = false;
            setIsAnalyzeDone(false);
            isAnalyzeDoneRef.current = false;
            setIsConceptTourRunning(false);
            setAnchorEl(null);
            setIsPopupVisible(false);
            setWaitingForAnalyze(false);
            waitingForAnalyzeRef.current = false;
            setWaitingForSymbol(false);
            waitingForSymbolRef.current = false;
            window.speechSynthesis.cancel();
          }}
        />}
      </DialogContent>
    </Dialog>
  );
}