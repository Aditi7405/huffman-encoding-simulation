import { useState, useEffect, useRef} from 'react';
import { Dialog, DialogTitle, DialogContent, Popper} from '@mui/material';
import { Portal } from '@mui/material';
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
      placement: "bottom"
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
    if (open && onOpen) {
      onOpen();
    }
  }, [open]);

  useEffect(() => {
    const dialogEl = document.getElementById('explanation-dialog');
    if (!dialogEl) return;
    const scrollEl = dialogEl.closest('.MuiDialog-scrollPaper') || dialogEl.parentElement;
    if (!scrollEl) return;
    if (isConceptTourRunning) {
      scrollEl.style.overflow = 'hidden';
    } else {
      scrollEl.style.overflow = '';
    }
    return () => {
      scrollEl.style.overflow = '';
    };
  }, [isConceptTourRunning]);

  // ✅ Tour step useEffect — sirf tour anchor set karta hai
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

  // ✅ Open useEffect — sirf welcome popup set karta hai
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

  const handleSymbolSelected = (index) => {
    if (!waitingForSymbolRef.current) return;
    if (resetAnimationRef.current) resetAnimationRef.current();
    setWaitingForSymbol(false);
    waitingForSymbolRef.current = false;
    window.speechSynthesis.cancel();
    const name = symbolNames[index];
    const u = new SpeechSynthesisUtterance(`You selected ${name}.`);
    u.rate = 0.95;

    u.onend = () => {
      const next = conceptStep + 1;
      setConceptStep(next);
      setWaitingForAnalyze(true);
      setIsConceptTourRunning(true);
      setIsPopupVisible(true);
      const u2 = new SpeechSynthesisUtterance(conceptTourSteps[next].text);
      u2.rate = 0.95;
      window.speechSynthesis.speak(u2);
    };
    window.speechSynthesis.speak(u);
  };

  const handleAnalyzeDone = () => {
    if (!waitingForAnalyze) return;
    setWaitingForAnalyze(false);
    window.speechSynthesis.cancel();
    const next = conceptStep + 1;
    setConceptStep(next);
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
      const u = new SpeechSynthesisUtterance(conceptTourSteps[next].text);
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
    }, 300);
  };

  const handleTextEntered = () => {
    if (!waitingForSymbolRef.current) return;
    if (resetAnimationRef.current) resetAnimationRef.current();
    setWaitingForSymbol(false);
    waitingForSymbolRef.current = false;
    setIsConceptTourRunning(false);
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance("Text entered. Now click Analyze Frequency.");
    u.rate = 0.95;
    u.onend = () => {
      const next = conceptStep + 1;
      setConceptStep(next);
      setWaitingForAnalyze(true);
      setIsConceptTourRunning(true);
      setIsPopupVisible(true);
      const u2 = new SpeechSynthesisUtterance(conceptTourSteps[next].text);
      u2.rate = 0.95;
      window.speechSynthesis.speak(u2);
    };
    window.speechSynthesis.speak(u);
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
<Button title="Play"
  ref={speechBtnRef}
  onClick={() => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsHuffmanSpeaking(true);
    } else {
      const text = "Huffman Encoding is a data compression algorithm. Characters with higher frequency get shorter binary codes.";
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.onend = () => setIsHuffmanSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsHuffmanSpeaking(true);
    }
  }}
  style={{ display: isHuffmanSpeaking ? "none" : "inline-flex", minWidth: "unset", padding: "0px" }}>
  <img src={voice} alt="voice" style={{ width: "40px", height: "auto" }} />
</Button>

<Button title="Pause"
  onClick={() => {
    window.speechSynthesis.pause(); 
    setIsHuffmanSpeaking(false);
  }}
  style={{ display: isHuffmanSpeaking ? "inline-flex" : "none", minWidth: "unset", padding: "0px" }}>
  <img src={voice_pause} alt="voice_pause" style={{ width: "40px", height: "auto" }} />
</Button>

          <button
  ref={instructionBtnRef}
  onClick={() => {
    window.speechSynthesis.cancel();
    setShowInstructions(true);
    const u = new SpeechSynthesisUtterance(
      "Step 1: Select a symbol image or type your own text. " +
      "Step 2: Click Analyze Frequency button. " +
      "Step 3: Click Generate button. " +
      "Step 4: Click Next Step repeatedly. " +
      "Step 5: Final binary codes will be displayed. " +
      "Step 6: Click Reset to start over."
    );
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
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
              width: '340px',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(29,42,109,0.25)',
              border: '2px solid #1d2a6d',
              overflow: 'hidden',
            }}>
              <div style={{
                background: 'white', padding: '10px 14px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span style={{ color: '#1d2a6d', fontWeight: 700, fontSize: '13px' }}>
                  <h3>Guided Tutor is here to help!</h3>
                </span>
                <button onClick={() => setShowWelcome(false)} style={{
                  background: 'transparent', border: 'none', color: '#1d2a6d',
                  fontSize: '16px', cursor: 'pointer'
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
                    setConceptStep(0);
                    setTimeout(() => {
                      const el = conceptTourSteps[0].ref.current;
                      if (!el) return;
                      setAnchorEl(el);
                      setIsPopupVisible(true);
                      window.speechSynthesis.cancel();
                      const u = new SpeechSynthesisUtterance(conceptTourSteps[0].text);
                      u.rate = 0.95;
                      u.onend = () => setIsHuffmanSpeaking(false);
                      window.speechSynthesis.speak(u);
                      setIsHuffmanSpeaking(true);
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
      {isConceptTourRunning && anchorEl && isPopupVisible && (
        <Popper
          open={true}
          anchorEl={anchorEl}
          placement={conceptTourSteps[conceptStep]?.placement || "bottom-start"}
          style={{ zIndex: 999999 }}
          modifiers={[
            { name: 'offset', options: { offset: [0, 10] } },
            { name: 'flip', enabled: false },
            { name: 'preventOverflow', options: { boundary: 'viewport' } },
            { name: 'hide', enabled: false },
          ]}>
          <div style={{
            width: '320px',
            background: 'linear-gradient(135deg, rgb(219,234,254), rgb(224,231,255))',
            borderRadius: '18px',
            padding: '16px',
            boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
          }}>
            <div style={{
              textAlign: 'center', fontSize: '15px', fontWeight: '700',
              color: '#1d2a6d', marginBottom: '12px',
              borderBottom: '1px solid #cbd5e1', paddingBottom: '8px'
            }}>
              {conceptTourSteps[conceptStep]?.title}
            </div>

            <div style={{ fontSize: '14px', color: '#333', lineHeight: '1.6', marginBottom: '18px' }}>
              {conceptTourSteps[conceptStep]?.text}
            </div>

            {showSymbolAlert && (
              <div style={{
                background: '#fff3cd', border: '1px solid #f59e0b',
                borderRadius: '8px', padding: '8px 12px', marginBottom: '12px',
                fontSize: '13px', color: '#92400e', display: 'flex', alignItems: 'center', gap: '6px'
              }}>
                ⚠️ Please select a symbol or enter your own text before continuing.
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => {
                  setIsConceptTourRunning(false);
                  setConceptStep(0);
                  setAnchorEl(null);
                  window.speechSynthesis.cancel();
                  setIsHuffmanSpeaking(false);
                }} style={{
                  background: 'transparent', border: '1px solid #1d2a6d',
                  borderRadius: '10px', padding: '8px 14px',
                  color: '#64748b', fontWeight: '600', cursor: 'pointer', fontSize: '13px'
                }}>EXIT</button>

                <button
                  onClick={() => {
                    if (conceptStep > 0) {
                      const prev = conceptStep - 1;
                      setConceptStep(prev);
                      setAnchorEl(conceptTourSteps[prev].ref.current);
                      window.speechSynthesis.cancel();
                      const u = new SpeechSynthesisUtterance(conceptTourSteps[prev].text);
                      u.rate = 0.95;
                      u.onend = () => setIsHuffmanSpeaking(false);
                      window.speechSynthesis.speak(u);
                      setIsHuffmanSpeaking(true);
                    }
                  }}
                  disabled={conceptStep === 0}
                  style={{
                    background: '#d1d5db', color: '#1d2a6d',
                    border: '1px solid #1d2a6d', padding: '8px 14px',
                    borderRadius: '10px',
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
                    setConceptStep(next);
                    setAnchorEl(conceptTourSteps[next].ref.current);
                    if (conceptTourSteps[next]?.waitingForAnalyze) {
                      setWaitingForAnalyze(true);
                    }
                    window.speechSynthesis.cancel();
                    const u = new SpeechSynthesisUtterance(conceptTourSteps[next].text);
                    u.rate = 0.95;
                    u.onend = () => setIsHuffmanSpeaking(false);
                    window.speechSynthesis.speak(u);
                    setIsHuffmanSpeaking(true);
                  } else {
                    setIsConceptTourRunning(false);
                    setConceptStep(0);
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
                <button onClick={() =>{
                  window.speechSynthesis.cancel();
                   setShowInstructions(false)}}
                  style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '15px auto 0', background: 'white', color: '#1d2a6d', border: '2px solid #1d2a6d', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '16px' }}>
                  <b>CLOSE</b>
                </button>
              </Box>
            </Box>
          </Box>
        )}
        {open && <HuffmanAnimation
          symbolTextToggleRef={symbolTextToggleRef}
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