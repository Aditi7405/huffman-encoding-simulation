import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, Popper } from '@mui/material';
import Box from '@mui/material/Box';
import HuffmanAnimation from './HuffmanAnimation';
import Button from './styledbutton';
import voice from '../assets/images/voice-play.png';
import voice_pause from '../assets/images/voice-pause.png';

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

  const setConceptStepSynced = (val) => {
    conceptStepRef.current = val;
    setConceptStep(val);
  };

  const conceptTourSteps = [
    {
      title: "Guided Tutor",
      text: "Welcome to Huffman Concept! I will guide you through this visualization step by step.",
      ref: guidedTutorRef,
    },
    {
      title: "Instructions Button",
      text: "Click the Instructions button to view step by step procedure for using this visualization.",
      ref: instructionBtnRef,
    },
    {
      title: "Speech Button",
      text: "Click this button to listen to an audio explanation of Huffman Encoding concept.",
      ref: speechBtnRef,
    },
    {
      title: "Symbol / Text Input",
      text: "Select a symbol like Plus, Minus, Multiply or Divide. Or switch to Text Input and type your own text.",
      ref: symbolTextToggleRef,
      waitingForSymbol: true,
    },
    {
      title: "Analyze Frequency",
      text: "Click Analyze Frequency button. It will count how many times each character appears and show a frequency table.",
      ref: analyzeFreqRef,
      waitingForAnalyze: true,
    },
    {
      title: "Frequency Table",
      text: "This table shows each character and how many times it appears in the input.",
      ref: freqTableRef,
      placement: "bottom-end",
    },
    {
      title: "Generate Tree",
      text: "Click Generate button. Initial nodes will appear on screen, each representing a character with its frequency.",
      ref: generateBtnRef,
      placement: "left-start",
    },
    {
      title: "Next Step",
      text: "Click Next Step repeatedly. First two lowest frequency nodes get highlighted in orange — this is the Select phase.",
      ref: nextStepBtnRef,
      placement: "left-start",
    },
    {
      title: "Tree Visualization Box",
      text: "Watch the Huffman Tree build here step by step. Each node shows character and its frequency.",
      ref: treeVisualizationRef,
      placement: "bottom",
    },
    {
      title: "Prev Step",
      text: "Click Prev Step to go back to the previous step of tree building.",
      ref: prevStepBtnRef,
      placement: "left-start",
    },
    {
      title: "Reset",
      text: "Click Reset to clear everything and start over with a new input. You have completed the walkthrough!",
      ref: resetBtnRef,
      placement: "left-start",
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
      setIsPopupVisible(true);
      const el = conceptTourSteps[next]?.ref?.current;
      if (el) setAnchorEl(el);
      speakTourText(conceptTourSteps[next].text);
    });
  };

  const handleAnalyzeDone = () => {
  console.log("handleAnalyzeDone called, waitingForAnalyzeRef:", waitingForAnalyzeRef.current);
  if (!waitingForAnalyzeRef.current) return;
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
      setIsPopupVisible(true);
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

         <span ref={speechBtnRef} style={{ display: isHuffmanSpeaking ? "none" : "inline-flex" }}>
         <Button title="Play"
         onClick={() => {
         if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsHuffmanSpeaking(true);
        } else if (isConceptTourRunning) {
        speakTourText(conceptTourSteps[conceptStep].text, () => {
          setIsHuffmanSpeaking(false);
        });
        setIsHuffmanSpeaking(true);
      }
    }}
    style={{ minWidth: "unset", padding: "0px" }}>
    <img src={voice} alt="voice" style={{ width: "40px", height: "auto" }} />
  </Button>
</span> 

          <span style={{ display: isHuffmanSpeaking ? "inline-flex" : "none" }}>
            <Button title="Pause"
              onClick={() => {
                window.speechSynthesis.pause();
                setIsHuffmanSpeaking(false);
              }}
              style={{ minWidth: "unset", padding: "0px" }}>
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
              background: "white", color: "#1d2a6d", fontWeight: 600,
              padding: "8px 18px", borderRadius: "10px", cursor: "pointer",
              whiteSpace: "nowrap", fontSize: "14px", width: "145px", height: "42px",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "1px solid #333",
            }}>
            INSTRUCTIONS
          </button>

          <button
            ref={guidedTutorRef}
            onClick={() => {
              setShowWelcome(true);
              setWelcomeAnchorEl(guidedTutorRef.current);
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
            modifiers={[{ name: 'offset', options: { offset: [0, 8] } }]}
          >
            <div style={{
              width: '340px', background: 'white', borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(29,42,109,0.25)', border: '2px solid #1d2a6d', overflow: 'hidden',
            }}>
              <div style={{
                background: 'white', padding: '10px 14px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span style={{ color: '#1d2a6d', fontWeight: 700, fontSize: '13px' }}>
                  <h3>Guided Tutor is here to help!</h3>
                </span>
                <button onClick={() => setShowWelcome(false)} style={{
                  background: 'transparent', border: 'none', color: '#1d2a6d', fontSize: '16px', cursor: 'pointer'
                }}>✕</button>
              </div>
              <div style={{ padding: '12px 14px' }}>
                <p style={{ fontSize: '15px', color: '#333', lineHeight: '1.6', margin: 0 }}>
                  Welcome. Do you want Guided Tutor to give you a proper guide on how to run the simulator?
                </p>
                <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                  <button onClick={() => setShowWelcome(false)}
                    style={{
                      flex: 1, padding: '7px', background: 'white', color: '#1d2a6d',
                      border: '1px solid #1d2a6d', borderRadius: '8px',
                      cursor: 'pointer', fontWeight: 600, fontSize: '12px'
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
                      flex: 1, padding: '7px', background: '#1d2a6d', color: 'white',
                      border: 'none', borderRadius: '8px',
                      cursor: 'pointer', fontWeight: 600, fontSize: '12px'
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
            { name: 'offset', options: { offset: [0, 10] } },
            { name: 'flip', enabled: true },
            { name: 'preventOverflow', options: { boundary: 'viewport', padding: 12 } },
            { name: 'hide', enabled: false },
          ]}>
        
          <div style={{
            width: '320px',
            background: 'linear-gradient(135deg, rgb(219,234,254), rgb(224,231,255))',
            borderRadius: '18px', padding: '16px',
            boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
            position: 'relative',
          }}>
          
           <div style={{
              textAlign: 'center', fontSize: '15px', fontWeight: '700',
              color: '#1d2a6d', marginBottom: '12px',
              borderBottom: '1px solid #cbd5e1', paddingBottom: '8px'
            }}>
              {conceptTourSteps[conceptStep]?.title}
            </div>

            <div style={{ fontSize: '14px', color: '#333', lineHeight: '1.6', marginBottom: '18px' }}>
              {conceptTourSteps[conceptStep]?.text.split(" ").map((word, i) => (
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
              ))}
            </div>

            {showSymbolAlert && (
              <div style={{
                background: '#fff3cd', border: '1px solid #f59e0b', borderRadius: '8px',
                padding: '8px 12px', marginBottom: '12px', fontSize: '13px', color: '#92400e',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}>
                ⚠️ Please select a symbol or enter your own text before continuing.
              </div>
            )}

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
                    if (conceptStep > 0) {
                      goToStep(conceptStep - 1);
                    }
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
                    setIsConceptTourRunning(false);
                    setAnchorEl(null);
                    return;
                  }
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
                  background: '#1d2a6d', color: 'white', border: 'none',
                  padding: '8px 18px', borderRadius: '10px',
                  cursor: 'pointer', fontWeight: '600', fontSize: '13px'
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
          );
        </Popper>
      )}

      <DialogContent sx={{ padding: "0px", height: "1200px" }}>
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
        />}
      </DialogContent>
    </Dialog>
  );
}