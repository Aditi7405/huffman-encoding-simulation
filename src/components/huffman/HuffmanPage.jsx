import "../../App.css";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import { Menu as MenuIcon } from "@mui/icons-material";
import {
  Slider,
  MenuItem,
  Drawer,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import Tab from "@mui/material/Tab";

import Button from "../styledbutton";
import Select from "../styledselect";

import { useState, useRef, useEffect } from "react";

import voice from "../../assets/images/voice-play.png";
import voice_pause from "../../assets/images/voice-pause.png";
import sample1 from "../../assets/images/sample1.jpg";
import sample2 from "../../assets/images/sample2.jpg";
import sample3 from "../../assets/images/sample3.jpg";
import sample4 from "../../assets/images/sample4.jpg";
import jpeg from "jpeg-js";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import HuffmanAnimation from "../HuffmanAnimation";

import { OpenCvProvider } from "opencv-react";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import { createPortal } from "react-dom";
import zIndex from "@mui/material/styles/zIndex";

//returns a tab panel
function TabPanel(props) {
  const { children, tabValue, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={tabValue !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {tabValue === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}
function TutorBubble({text, targetRef, visible}) {
  const [pos, setPos] = useState({top:0,  left: 0, width: 0});
  const [wordIndex, setWodIndex] = useState(0);
  const words = text ? text.split(" ") : [];

  useEffect(() => {
    if(!visible || !targetRef?.current) return;

    const el = targetRef.current;
    const rect = el.getBoundingClientRect();
    const scrollY = window.scrollY || window.pageYOffset;
    const scrollX = window.scrollX || window.pageXOffset;

    setPos({
      top: rect.bottom + scrollY +12,
      left: rect.left + scrollX,
      width: Math.max(rect.width, 260),
    });
  }, [visible, targetRef, text]);

  useEffect(() => {
    if (!visible || !text) {
      setWordIndex(0);
      return;
    }
    setWordIndex(0);
  }, [text, visible]);
  useEffect(() => {
    if (!visible) return;
    if (wordIndex >=words.length) return;
    const timer = setTimeout(() => {
      setWordIndex((prev) => prev + 1);
    }, 370);
    return () => clearTimeout(timer);
  }, [wordIndex, visible, words.length]);

  if(!visible || !text) return null;

  return (
    <div
    style={{
      position: "absolute",
      top: pos.top,
      left: pos.left,
      width: pos.width,
      zIndex: 9999,
      background: "white",
      border: "2px solid #1d2a6d",
      borderRadius: "14px",
      padding: "10px 14px",
      boxShadow: "0 6px 24px rgba(29,42,109,0.18)",
      fontSize: "13px",
      lineHeight: "1.8",
      pointerEvents: "none",
    }}>
    <div
        style={{
          position: "absolute",
          top: "-10px",
          left: "22px",
          width: 0,
          height: 0,
          borderLeft: "10px solid transparent",
          borderRight: "10px solid transparent",
          borderBottom: "10px solid #1d2a6d",
        }}
      /> 
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          marginBottom: "7px",
          fontSize: "11px",
          color: "#92400e",
          background: "#fef3c7",
          padding: "2px 9px",
          borderRadius: "20px",
        }}>
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "#f59e0b",
            display: "inline-block",
            animation: "tutorBlink 1s infinite",
          }}
        />
        Guided Tutor
        </div> 
        <div>
          {words.map((word, i) => (
            <span
            key={i}
            style={{
              padding: "1px 3px",
              marginRight: "3px",
              borderRadius: "4px",
              display: "inline-block",
              background: i === wordIndex ? "#fff8e1" : "transparent",
              color: i === wordIndex ? "#92400e" : "#1d2a6d",
              fontWeight: i === wordIndex ? "600" : "400",
              borderBottom: i === wordIndex ? "2px solid #f59e0b" :"2px solid transparent",
              transition: "all 0.15s ease",
            }}>
              {word}
            </span>
          ))}
        </div>
    </div>
  );
}
export default function HuffmanPage() {
  const myProcess2Button = useRef(null);

  const notifyE = (msg) => {
    toast.error(msg, {
      theme: "dark",
      position: "bottom-left", // Set toast position
      autoClose: 5000, // Toast auto-closes after 5 seconds
      hideProgressBar: false, // Show progress bar
      closeOnClick: true, // Close toast when clicked
      pauseOnHover: true, // Pause when hovered
      draggable: true, // Enable dragging
    });
  };

  const notifyS = (msg) => {
    toast.success(msg, {
      theme: "dark",
      position: "bottom-left", // Set toast position
      autoClose: 3000, // Toast auto-closes after 3 seconds
      hideProgressBar: false, // Show progress bar
      closeOnClick: true, // Close toast when clicked
      pauseOnHover: true, // Pause when hovered
      draggable: true, // Enable dragging
    });
  };

  const handlePrint = () => {
    if (isTutorEnabled || isTutorPlaying || tutorPaused){
      isTutorCancelledRef.current = true;
      speechSynthesis.cancel();
      if (stepIndexRef.current > 0) stepIndexRef.current -=1;
      setIsTutorPlaying(false);
      setTutorPaused(true);
      speakText("You have clicked the Print button. The print dialog will now open.")
    }
    window.print(); // Triggers the print dialog
  };

 

  const cv = window.cv;
  const [mrl, setMrl] = useState("");
  //const [mrl,setMrl]=useState(1);
  const [qfactor, setQfactor] = useState("");
  const [quality, setQuality] = useState("");
  const [hresult, setHresult] = useState(null);
  const [jpegResult, setJpegResult] = useState(null);
  // animation
  const [uploadedImageName, setUploadedImageName] = useState(null);
  const [isInputImageAnimationPlaying, setIsInputImageAnimationPlaying] =
    useState(false);
  const [isImageProcessed, setIsImageProcessed] = useState(false);
  const [isAnimationPlaying, setIsAnimationPlaying] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [instructionStep, setInstructionStep] = useState(-1);
  const [tourStep, setTourStep] = useState(-1);
  const [tourWordIndex, setTourWordIndex] = useState(0);
  const [tourMsgPos, setTourMsgPos] = useState({ top: 0, right: 10 });
  const [isTourPlaying, setIsTourPlaying] = useState(false);
  const [isTutorEnabled, setIsTutorEnabled] = useState(false);
  const [isTutorPlaying, setIsTutorPlaying] = useState(false);
  const [tutorPaused, setTutorPaused] = useState(false);
  const [currentTutorStep, setCurrentTutorStep] = useState(-1);
  const [tutorMessageStep, setTutorMessageStep] = useState(-1);
  const [highlightTick, setHighlightTick] = useState(0);
  const [showTutorPrompt, setShowTutorPrompt] = useState(false);
   
  function calculateEntropyMap(srcGray) {
    const kernelSize = 9;
    const half = Math.floor(kernelSize / 2);
    const width = srcGray.cols;
    const height = srcGray.rows;

    let entropyMap = new cv.Mat.zeros(height, width, cv.CV_8UC1);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let freq = new Array(256).fill(0);
        let total = 0;

        for (let ky = -half; ky <= half; ky++) {
          for (let kx = -half; kx <= half; kx++) {
            const ny = y + ky;
            const nx = x + kx;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const val = srcGray.ucharPtr(ny, nx)[0];
              freq[val]++;
              total++;
            }
          }
        }

        let entropy = 0;
        for (let i = 0; i < 256; i++) {
          if (freq[i] > 0) {
            const p = freq[i] / total;
            entropy -= p * Math.log2(p);
          }
        }

        const normalized = Math.min(255, Math.round((entropy / 8) * 255));
        entropyMap.ucharPtr(y, x)[0] = normalized;
      }
    }

    return entropyMap;
  }

  function lossyHuffmanEncode() {
    const imgElement = document.getElementById("inputImage");

    if(isTutorEnabled || isTutorPlaying || tutorPaused){
      isTutorCancelledRef.current = true;
      speechSynthesis.cancel();
      if(stepIndexRef.current > 0) stepIndexRef.current -=1;
      setIsTutorPlaying(false);
      setTutorPaused(true);

      if (selectedImage === null){
        speakFeedback("Please select an image first from the available sample images or upload your owwn image.");
        return;
      }
    
      if (!qfactor || isNaN(qfactor) || qfactor < 1) {
        speakFeedback("Please enter a valid quantization factor before clicking the process button.");
        return;
      }
      speakFeedback("Great! You have selected an image and entered the quantization factor. Please watch the output for the entropy maps and compression ratio.")
    }

    if (selectedImage === null || !imgElement) {
      notifyE("Please select an image first.");
      return;
    }

    if(!qfactor || isNaN(qfactor) || qfactor < 1){
      notifyE("Please enter the value for Qunatization Factor.");
      console.log("Image or qfactor problem");
      return;
    }

    let src = cv.imread(imgElement);
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY);

    setHuffText("Old Entropy | New Entropy | Compressed Image");

    // Step 1: Calculate entropy map of original image
    let originalEntropy = calculateEntropyMap(src);

    // Step 2: Quantize image
    let quantized = new cv.Mat();
    src.convertTo(quantized, -1, 1 / qfactor, 0);
    quantized.convertTo(quantized, -1, qfactor, 0);
    const compressionRatio = Math.max((8 - Math.log2(qfactor)) / 8, 0);
    setHresult({ compressionRatio: compressionRatio.toFixed(4) });
    // Step 3: Calculate entropy map after quantization
    let compressedEntropy = calculateEntropyMap(quantized);

    // Step 4: Combine all three images: originalEntropy | compressedEntropy | quantized
    let merged = new cv.Mat();
    let images = new cv.MatVector();
    images.push_back(originalEntropy);
    images.push_back(compressedEntropy);
    images.push_back(quantized);
    cv.hconcat(images, merged);
    cv.imshow("outputCanvas", merged);

    // Cleanup
    src.delete();
    quantized.delete();
    originalEntropy.delete();
    compressedEntropy.delete();
    images.delete();
    merged.delete();
    setHresult({ compressionRatio: compressionRatio.toFixed(4) });
    console.log(hresult);
    setIsImageProcessed(true);
    setIsAnimationPlaying(true);
    setTimeout(() => {
      setIsAnimationPlaying(false);
    }, 1000);
    notifyS("Process Completed !!");
    // myProcess2Button.current.disabled=true
  }

  const [rleresult, setRleresult] = useState(null);

  const [text, setText] = useState("Output Image");
  const [huffText, setHuffText] = useState("Output Image");
  const [sineText, setSineText] = useState("Output Image");
  const [jpegText, setJpegText] = useState("Output Image");

  const [scResult, setScResult] = useState(null);

  //sets variable which defines which tab is active
  const [tabValue, setTabValue] = useState(1);

  const [openInstructionsModal, setOpenInstructionsModal] = useState(false);
  const [openRunLengthModal, setOpenRunLengthModal] = useState(false);
  const [openHuffmanModal, setOpenHuffmanModal] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false); // State for opening/closing the drawer

  var indexTabValue = tabValue;

  const instr = () => {
    
    isTutorCancelledRef.current = true;
    speechSynthesis.cancel();
    if (stepIndexRef.current > 0) stepIndexRef.current -= 1;
    wasTutorActiveRef.current = isTutorEnabled || isTutorPlaying || tutorPaused;

    setIsTutorPlaying(false);
    setTutorPaused(true);
    setCurrentTutorStep(-1);
    setInstructionStep(0);
    setOpenInstructionsModal(true);
  };

  const exp2 = () => {
    setOpenHuffmanModal(true);
  };

  const initialImages = [sample1, sample2, sample3, sample4];

  // State to hold the images
  const [images, setImages] = useState(initialImages);

  const [selectedImage, setSelectedImage] = useState(0);
  const [imageName, setImageName] = useState("");

  

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedImageName(file.name);
      setIsInputImageAnimationPlaying(true);
      setTimeout(() => {
        setIsInputImageAnimationPlaying(false);
      }, 1200);
      // Create a URL for the image file
      const imageUrl = URL.createObjectURL(file);

      // Add the new image to the state
      setImages((prevImages) => {
        const updatedImages = [...prevImages, imageUrl];
        return updatedImages;
      });

      // Find the index of the new image in the updated images array
      const foundIndex = images.length; // Since it's being added at the end of the array
      setSelectedImage(foundIndex);
    }
  };

  const handleImageClick = (index) => {
    setText("Output Image");
    setHuffText("Output Image");
    setSineText("Output Image");
    setJpegText("Output Image");
    setHresult();
    setRleresult();
    setScResult();
    setJpegResult();
    setSelectedImage(index);
    setMrl("");
    setQfactor("");
    setQuality("");
    setImageName(`Sample ${index + 1}`);
    setIsInputImageAnimationPlaying(true);
    setTimeout(() => {
      setIsInputImageAnimationPlaying(false);
    }, 500);
  };

  const handleCloseModal = () => {
    speechSynthesis.cancel();
    setOpenInstructionsModal(false); // Close the modal
    setInstructionStep(-1);

    if (wasTutorActiveRef.current) {
      setTimeout(() => {
        isTutorCancelledRef.current=false;
        setIsTutorEnabled(true);
        setTutorPaused(false);
        setIsTutorPlaying(true);
        speakStep();
      }, 200);
    }
  };

  const handleClose3Modal = () => {
    setOpenHuffmanModal(false); // Close the modal
  };

  const voicePause = useRef(null);
  const voicePlay = useRef(null);

  const utteranceRef = useRef(null);

  useEffect(() => {
    speechSynthesis.cancel(); // Cancel any speech on reload
  }, []);

  useEffect(() => {
    setShowTutorPrompt(true);
  }, []);
  
  useEffect(() => {
    if (tourStep === -1) {
      setTourWordIndex(0);
      return;
    }
    const text = tourSteps[tourStep]?.text || "";
    const word = text.split(" ");
    if(tourWordIndex >= word.length) return;
    const timer = setTimeout(() => {
      setTourWordIndex(prev => prev + 1);
    }, 550);
    return () => clearTimeout(timer);
  }, [tourWordIndex, tourStep]);

  useEffect (() => {
    setTourWordIndex(0);
  }, [tourStep]);

  useEffect(() => {
    if (!openInstructionsModal) return;
    if (instructionStep === -1) return;

    const steps = instructionsList[indexTabValue] || [];
    const normalSteps = steps.filter(s => !s.trim().startsWith("Note:"));

    if(instructionStep >= normalSteps.length) {
      speechSynthesis.cancel();
      setInstructionStep(-1);
      return;
    }

    const speakText= 
      `${instructionStep === 0
      ? "Instruction for Lossy Huffman Encoding." 
      : ""
    } Step ${instructionStep + 1}. ${
     normalSteps[instructionStep]
    }`;

    const utterance = new SpeechSynthesisUtterance(speakText);
   
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => {
      setInstructionStep(prev => {
        if (prev + 1 >= normalSteps.length) return -1;
        return prev + 1;
      });
    };

    utterance.onerror = () => {
      setInstructionStep(-1);
    };

    speechSynthesis.speak(utterance);
    return () => {
      speechSynthesis.cancel();
    };
  }, [instructionStep, openInstructionsModal]);

  const speakFeedback = (text) => {
    console.log("speakFeedback called with:", text);
    console.log("speechSynthesis available:", !!window.speechSynthesis);

    window.speechSynthesis.cancel();
    setTimeout(() => {
      console.log("inside setTimeout, about to speak");
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onStart = () => console.log("SPEECH STARTED");
      utterance.onend = () => console.log("SPEECH ENDED");
      utterance.onerror = () => console.log("SPEECH ERROR:", e.error);
      window.speechSynthesis.speak(utterance);
      console.log("speak() called, speaking:", window.speechSynthesis.speaking);
    }, 300);
  };

  const stepIndexRef = useRef(0);
  const isTourCancelledRef = useRef(false);
  const isTutorCancelledRef = useRef(false);
  const wasTutorActiveRef = useRef(false);
  const guidedTutorBtnRef = useRef(null);
  const instructionButtonRef = useRef(null);
  const currentTutorStepRef = useRef(-1);
  const toolboxRef = useRef(null);
  const chooseImageRef = useRef(null);
  const uploadButtonRef = useRef(null);
  const quantizationRef = useRef(null);
  const inputImageRef = useRef(null);
  const processButtonRef = useRef(null);
  const outputSectionRef = useRef(null);
  const printButtonRef = useRef(null);
  const conceptButtonRef = useRef(null);


const tutorSteps = [
  { text: "Welcome! Let me guide you through this experiment.", ref: guidedTutorBtnRef },
  { text: "Click Instructions to see the procedure.", ref: instructionButtonRef },
  { text: "This is the Lossy Huffman Tools panel.", ref: toolboxRef },
  { text: "Select an image from the available options.", ref: chooseImageRef },
  { text: "You can also upload your own image.", ref: uploadButtonRef },
  { text: "Enter a quantization factor here.", ref: quantizationRef },
  { text: "This is the Input Image section.", ref: inputImageRef },
  { text: "Click Process to generate output.", ref: processButtonRef },
  { text: "The output and compression ratio appear here.", ref: outputSectionRef },
  { text: "Click Print to save or print your result.", ref: printButtonRef },
  { text: "Click Concept to see how Huffman Encoding works.", ref: conceptButtonRef },
];

const getHightlightStyle = (ref) => {
  if(!isTutorPlaying && !tutorPaused) return {};

  const activeStep = currentTutorStepRef.current;
  if (activeStep < 0 || activeStep >= tutorSteps.length) return {};
  const activeRef = tutorSteps[activeStep]?.ref;
  if (!activeRef || activeRef !== ref) return {};

  return {
    boxShadow: "0 0 0 4px rgba(245, 158, 11, 0.9)",
    borderRadius: "12px",
    transition: "all 0.3s ease",
    animation: "pulseHighlight 1.2s infinite",
    position: "relative",
    zIndex: 5,
  };
};

const startGuidedTutor = () => {
  setShowTutorPrompt(false);
  isTutorCancelledRef.current = false;
  setIsTutorEnabled(true);
  setTutorPaused(false);
  stepIndexRef.current = 0;
  currentTutorStepRef.current = 0;
  speakStep();
};

const handleTutorToggle = () => {
  if (isTutorPlaying) {
    isTutorCancelledRef.current = true;
    speechSynthesis.cancel();
    setIsTutorPlaying(false);
    setTutorPaused(true);
  } else {
    isTutorCancelledRef.current = false;
    setIsTutorEnabled(true);
    setIsTutorPlaying(true);
    setTutorPaused(false);
    speakStep();
  }
};

const speakStep = () => {
  if (isTutorCancelledRef.current) return;

  const step = tutorSteps[stepIndexRef.current];

  if (!step) {
    setIsTutorPlaying(false);
    setCurrentTutorStep(-1);
    currentTutorStepRef.current = -1;
    return;
  }

  // PEHLE highlight update karo
  currentTutorStepRef.current = stepIndexRef.current;
  setCurrentTutorStep(stepIndexRef.current);
  setHighlightTick(prev => prev + 1);

  if (step.ref?.current) {
    step.ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // 100ms baad speech shuru karo
  setTimeout(() => {
    if (isTutorCancelledRef.current) return;

    const utterance = new SpeechSynthesisUtterance(step.text);
    const voices = speechSynthesis.getVoices();
    if (voices.length) utterance.voice = voices[0];
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => {
      if (isTutorCancelledRef.current) return;
      stepIndexRef.current += 1;
      speakStep();
    };

    utterance.onerror = () => {
      setIsTutorPlaying(false);
      setCurrentTutorStep(-1);
      currentTutorStepRef.current = -1;
    };

    speechSynthesis.speak(utterance);
  }, 100);
};

  const instructionsList = {
    0: [
      "Select an image from the available options or upload one using the Upload File button.",
      "Enter the value for minimum run length.",
      "Click the Process button to continue.",
      "Click the Print button to print the result.",
      "Note: Click the Concept button to get a detailed explanation.",
    ],
    1: [
      "Select an image from the available options or upload one using the Upload File button.",
      "Enter the value for Quantization Factor.",
      "Click the Process button to continue.",
      "Click the Print button to print the result.",
      "Note: Click the Concept button to get a detailed explanation.",
    ],
    2: [
      "Select an image from the available options or upload one using the Upload File button.",
      "Set the function you want to use: sine/cosine.",
      "Set the Quantization Factor.",
      "Click the Process button to continue.",
      "Click the Print button to print the result.",
    ],
    3: [
      "Select an image from the available options or upload one using the Upload File button.",
      "Set the Quality Factor between 0-100.",
      "Click the Process button to continue.",
      "Click the Print button to print the result.",
    ],
  };

  const tourSteps = [
  {
    text: "Welcome to the Lossy Huffman Encoding experiment! I will guide you through the experiment interface and workflow.",
    refKey: "guidedTutor",
  },
  {
    text: "This is the Instructions button. Click here at any time to view the detailed procedure for performing experiment.",
    refKey: "instruction",
  },
  {
    text: "This is the Lossy Huffman Tools panel. It contains all the utilities you need to perform the experiment.",
    refKey: "toolbox",
  },
  {
    text: "In this section, you can select a sample image for processing. Click on any image to choose it as the input.",
    refKey: "chooseImage",
  },
  {
    text: "You can also upload your own image by clicking the Upload File button.",
    refKey: "upload",
  },
  {
    text: "Enter a valid Quantization Factor value here. It controls the level of compression.",
    refKey: "quantization",
  },
  {
    text: "This is the Input Image section, where the selected or uploaded image will be displayed before processing.",
    refKey: "inputImage",
  },
  {
    text: "Once you have selected an image and entered the quantization factor, click the Process button to generate the output.",
    refKey: "process",
  },
  {
    text: "The processed output image, entropy maps and compression ratio will appear in this section.",
    refKey: "output",
  },
  {
    text: "Click the Print button to print or save the generated result.",
    refKey: "print",
  },
  {
    text: "Click the Concept button to understand how Huffman Encoding works through a step by step animation.",
    refKey: "concept",
  },
  {
    text: "This completes the guided walkthrough. You are all set to start the experiment. Good luck!",
    refKey: "concept",
  },
];

const getRefByKey = (key) => {
  const map = {
    guidedTutor: guidedTutorBtnRef,
    instruction: instructionButtonRef,
    toolbox: toolboxRef,
    chooseImage: chooseImageRef,
    upload: uploadButtonRef,
    quantization: quantizationRef,
    inputImage: inputImageRef,
    process: processButtonRef,
    output: outputSectionRef,
    print: printButtonRef,
    concept: conceptButtonRef,
  };
  return map[key];
};

const updateTourPos = (refKey) => {
  const ref = getRefByKey(refKey);
  if (ref?.current) {
    const rect = ref.current.getBoundingClientRect();
    setTourMsgPos({
      top: rect.bottom + 12,
      right: window.innerWidth - rect.right,
    });
    ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }
};

const speakTourText = (text, onDone) => {
  window.speechSynthesis.cancel();
  setTimeout(() => {
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) utterance.voice = voices[0];
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onend = () => { if (onDone) onDone(); };
    utterance.onerror = () => { if (onDone) onDone(); };
    window.speechSynthesis.speak(utterance);
  }, 300);
};

const goToStep = (index) => {
  if (index >= tourSteps.length) {
    setTourStep(-1);
    setIsTourPlaying(false);
    setTourWordIndex(0);
    return;
  }
  const step = tourSteps[index];
  setTourStep(index);
  setTourWordIndex(0);
  updateTourPos(step.refKey);
  speakTourText(step.text);
};

const startTour = () => {
  isTourCancelledRef.current = false;
  setIsTourPlaying(true);
  goToStep(0);
};

const stopTour = () => {
  isTourCancelledRef.current = true;
  window.speechSynthesis.cancel();
  setTourStep(-1);
  setIsTourPlaying(false);
  setTourWordIndex(0);
};


  const getInstructions = () => {
    const steps = instructionsList[indexTabValue];
    if (!steps) return <p>No instructions available.</p>;

    const normalSteps = [];
    const notes = [];

    steps.forEach((step) => {
      if (step.trim().startsWith("Note:")) {
        const noteHtml = step
          .replace(/(Concept)/g, "<b>$1</b>")
          .replace(/^Note:/, '<b style="color:blue">Note:</b>');
        notes.push(noteHtml);
      } else {
        const stepHtml = step.replace(
          /(Upload File|Process|Print)/g,
          "<b>$1</b>",
        );
        normalSteps.push(stepHtml);
      }
    });

    return (
      <div>
        <ol>
          {normalSteps.map((html, idx) => (
            <li key={idx} dangerouslySetInnerHTML={{ __html: html }} />
          ))}
        </ol>
        {notes.map((note, idx) => (
          <p key={`note-${idx}`} dangerouslySetInnerHTML={{ __html: note }} />
        ))}
      </div>
    );
  };
  
const handleConceptClick = () => {
  if (isTutorEnabled || isTutorPlaying || tutorPaused) {
    isTutorCancelledRef.current = true;
    speechSynthesis.cancel();
    if (stepIndexRef.current > 0) stepIndexRef.current -= 1;
    setIsTutorPlaying(false);
    setTutorPaused(true);
    speakFeedback("You clicked the Concept button. This will show you a step by step animation explaining how Huffman Encoding works.");
    return;
  }
  exp2();
};

const handleProcessClick = () => {
  console.log("handleProcessClick called");
  console.log("isTutorEnabled:", isTutorEnabled);
  console.log("isTutorPlaying:", isTutorPlaying);
  console.log("tutorPaused:", tutorPaused);
  if (isTutorEnabled || isTutorPlaying || tutorPaused) {
    isTutorCancelledRef.current = true;
    speechSynthesis.cancel();
    if(stepIndexRef.current > 0) stepIndexRef.current -= 1;
    setIsTutorPlaying(false);
    setTutorPaused(true);
    speakFeedback("You clicked the Process button. Make sure you have selected an image and enetred a valid quantization factor, the click Process to generate the output.");
    return;
  }
  lossyHuffmanEncode();
}

  return (
    <OpenCvProvider>
      <div id="main-box">
        <div id="bottom-footer"> &copy; 2025 Virtual Labs, IIT Roorkee</div>

        <div id="top-header">
          {/* Hamburger Icon for Mobile */}

          {/* Drawer for Mobile View */}

          {/* Tabs for Desktop */}

          <h2 className="header-heading">Huffman Encoding</h2>
          <div id="header_button" style={{display: "flex", 
              alignItems:"center",
              gap: "12px",
              marginLeft:"auto", 
              position:"relative"}}>
            <Button title="Play" ref={voicePlay} onClick={handleTutorToggle}
            style={{ display: isTutorPlaying? "none" : "inline-flex"}}>
              <img
                src={voice}
                alt="voice"
                style={{ width: "40px", height: "auto" }}
              />
            </Button>

            <Button ref={voicePause} title="Pause" onClick={handleTutorToggle}
            style={{ display: isTutorPlaying ? "inline-flex" : "none"}}>
              <img
                src={voice_pause}
                alt="voice"
                style={{ width: "40px", height: "auto" }}
              />
            </Button>
       
            <Button 
            ref={instructionButtonRef}
            style={{ color: "#D1D3D8",
            ...(tutorMessageStep === 1 ? {
              boxShadow: "0 0 15px rgba(255, 165, 0, 0.6)",
            } : {}) 
            }} onClick={instr}>
              <strong>instructions</strong>
            </Button>

            <button 
            ref={guidedTutorBtnRef}
            onClick={() => { 
              if (tourStep >= 0) {
                stopTour();
              } else {
                setShowTutorPrompt(true);
              }
            }}
               style={{
                background: tourStep >=0 ?"#ff4444" : "yellow",
                color: "#1d2a6d",
                fontWeight: 600,
                padding: "8px 18px",
                borderRadius: "10px",
                textTransform: "none",
                cursor: "pointer",
                boxShadow: "0 6px 15px rgba(29, 42, 109, 0.3)",
                transition: "0.3s ease",
                whiteSpace: "nowrap",
               }}>
              {tourStep >= 0 ? "Stop Tour" : "Guided Tutor"}
            </button>
           </div>

           {showTutorPrompt && (
            <div 
            style={{
              position: "absolute",
              top: "calc(100% + 12px)",
              right: "0",
              width: "350px",
              background: "#fff",
              borderRadius: "12px",
              padding: "12px",
              boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
              zIndex: 9999,
            }}>
            <div style={{
              position: "absolute",
              top: "-10px",
              right: "24px",
              width: 0,
              height: 0,
              borderLeft: "10px solid ",
              borderRight: "10px solid ",
              borderBottom: "10px solid white",
            }}/>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "12px"
            }}>
            <div 
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              background: "#1D2A6D",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              color: "white",
              fontSize: "22px",
              fontWeight: "bold",
            }}>
            <SmartToyIcon style={{fontSize: "28px", color: "white"}}/>
            </div>
            <div>
            <h3 style={{ margin: 0, color: "#1d2a6d" ,marginBottom: "10px", fontSize: "14px", fontWeight: "700"}}>
            Guided Tutor is here to help!
            </h3>
            <p style={{
              fontSize: "14px",
              color: "#444",
              marginBottom: "18px",
              lineHeight: "1.5",
            }}>
              Welcome, Do you want Guided Tutor will give you proper guide how to run the simulaton?
            </p>
            <div
              style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "10px",
            }}>

            <button onClick={() => {
              setIsTutorEnabled(false);
              setShowTutorPrompt(false);
              
            }}
            style={{
            background: "#f3f4f6",
            color: "#1d2a6d",
            border: "1px solid #1d2a6d",
            padding: "8px 20px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "14px",
            }}>
              No, Thanks
            </button>

            <button onClick={() => {
              setIsTutorEnabled(true);
              setShowTutorPrompt(false);
              

              startTour();
              
            }}
            style={{
                    background: "#1d2a6d",
                    color: "white",
                    border: "none",
                    padding: "8px 20px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "14px",
                  }}>
                    Yes, Please
                  </button>
            </div>
            </div>
            </div>
            </div>
           )}

          {tourStep >= 0 && createPortal(
            <div style={{
              position: "fixed",
              top: `${tourMsgPos.top}px`,
              right: `${tourMsgPos.right}px`,
              width: "300px",
              background: "linear-gradient(135deg, rgb(219,234,254), rgb(224,231,255))",
              borderRadius: "18px",
              padding: "16px",
              boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
              zIndex: 9999,
            }}>
            <div style={{
              position: "absolute",
              top: "-10px",
              right: "20px",
              width: 0,
              height: 0,
              borderLeft: "10px solid transparent",
              borderRight: "10px solid transparent",
              borderBottom: "10px solid #bfdbfe",
            }}/>
            <div style={{
              fonstSize: "14px",
              color: "#333",
              lineHeight: "1.6",
              fontWeight: "500",
              marginBottom: "18px",
            }}>
            {tourSteps[tourStep]?.text.split(" ").map((word, i) => (
              <span key={i} style={{
                padding: "1px 3px",
                marginRight: "3px",
                borderRadius: "4px",
                display: "inline-block",
                background: i === tourWordIndex ? "#fff8e1" : "transparent",
                color: i === tourWordIndex ? "#92400e" : "#1d2a6d",
                fontWeight: i === tourWordIndex ? "600" : "400",
                borderBottom: i === tourWordIndex ? "2px  solid #f59e0b" : "2px solid transparent",
                transition: "all 0.15s ease",
              }}>
                {word}
              </span>
            ))}
            </div>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
            <button onClick={stopTour}
            style={{
              background: "transparent",
              border: "1px solid #1d2a6d",
              borderRadius: "10px",
              padding: "8px 18px",
              color: "#64748b",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "14px",
            }}>
              Close
            </button>
            <button onClick={() => goToStep(tourStep + 1)}
            style={{
              background: "#1d2a6d",
              color: "white",
              border: "none",
              padding: "8px 18px",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "600",
            }}>
              {tourStep === tourSteps.length -1 ? "Finish" : "Next"}
            </button>
            </div>
            </div>,
            document.body
          )}
          <Dialog
           open={openInstructionsModal}
           onClose={handleCloseModal}
           maxWidth="sm"
           fullWidth
           PaperProps={{
           sx: { borderRadius: '8px', overflow: 'hidden', m: 2 }
          }}>
  {/* ── Navy Header ── */}
  <Box 
  style={getHightlightStyle(instructionButtonRef)}
   sx={{
    background: '#1d2a6d',
    padding: '12px 20px'
  }}>
    <span style={{ color: 'white', fontSize: '17px', fontWeight: 600 }}>
      Instructions for Lossy Huffman Encoding
    </span>
  </Box>

  {/* ── Content ── */}
  <DialogContent sx={{ padding: '20px 24px 8px' }}>

    {/* Blue bold title - tab ke hisaab se */}
    {/*<p style={{ fontWeight: 700, fontSize: '15px', color: '#1D2A6D', margin: '0 0 14px' }}>
      {tabValue === 0 ? 'Run Length Encoding'
        : tabValue === 1 ? 'Lossy Huffman'
        : tabValue === 2 ? 'Sine and Cosine'
        : 'JPEG Compression'}:
    </p>

    {/* Numbered Steps + Note */}
    {(() => {
      const steps = instructionsList[indexTabValue] || [];
      const normalSteps = steps.filter(s => !s.trim().startsWith('Note:'));
      const notes = steps.filter(s => s.trim().startsWith('Note:'));

      return (
        <>
          <ol style={{
            margin: '0 0 12px',
            //paddingLeft: '22px',
            //fontSize: '14px',
            //lineHeight: '1.9',
            //color: '#333'
          }}>
            {/*{normalSteps.map((step, idx) => {
              const html = step.replace(
                /(Upload File|Process|Print|Analyze Frequency|Generate|Next Step|Reset)/g,
                '<strong>$1</strong>'
              );
              return (
                <li key={idx} dangerouslySetInnerHTML={{ __html: html }} />
              );
            })}*/}

            {normalSteps.map((step, idx) => {
              const html = step.replace(
                /(Upload File|Process|Print|Analyze Frequency|Generate|Next Step|Reset)/g,
                '<strong>$1</strong>'
              );
              return (
                <div key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  marginBottom: '8px',
                  backgroundColor: instructionStep === idx ? '#fff8e1' : 'transparent',
                  borderLeft: instructionStep === idx ? '3px solid #1d2a6d' : '3px solid transparent',
                  paddingLeft: '8px',
                  borderRadius: '4px',
                  transition: 'all 0.4s ease',
                  fontWeight: instructionStep ===idx ? '600' : '400',
                  color: instructionStep === idx ? '#1d2a6d' : '#333',
                  }}>

                  <span style={{
                    minWidth: '54px',
                    fontWeight: '700',
                    fontSize: '13px',
                    color: instructionStep === idx ? '#1d2a6d' : '#1d2a6d',
                    paddingTop: '2px',
                    flexShrink: 0, 
                  }}>
                    Step {idx + 1}
                  </span>

                  <span 
                  dangerouslySetInnerHTML={{ __html: html}}
                  style={{
                    fontSize: '14px',
                    lineHeight: '1.9',
                    fontWeight: instructionStep === idx ? '600' : '400',
                    color: instructionStep === idx ? '#1d2a6d' : '#333',
                  }}/>
                  </div>
              );
            })}
          </ol>

          {notes.map((note, idx) => {
            const noteHtml = note
              .replace(/^Note:/, '')
              .replace(/(Concept)/g, '<strong>$1</strong>')
              .trim();
            return (
              <p key={`note-${idx}`} style={{ fontSize: '14px', margin: '0 0 8px', color: '#333' }}>
                <span style={{ color: '#c0392b', fontWeight: 700 }}>Note: </span>
                <span dangerouslySetInnerHTML={{ __html: noteHtml }} />
              </p>
            );
          })}
        </>
      );
    })()}

  </DialogContent>

  {/* ── Footer ── */}
  <DialogActions sx={{ padding: '8px 24px 16px', justifyContent: 'center'}}>
    <button
      onClick={handleCloseModal}
      style={{
        background: 'transparent',
        border: 'none',
        color: '#1D2A6D',
        fontSize: '14px',
        fontWeight: 700,
        letterSpacing: '0.05em',
        cursor: 'pointer',
        padding: '4px 0',
        alignItems: 'center'
      }}
    >
      CLOSE
    </button>
  </DialogActions>

</Dialog>
          {/* Instructions Modal 
          <Dialog
            open={openInstructionsModal}
            onClose={handleCloseModal}
            aria-labelledby="instructions-dialog-title"
            aria-describedby="instructions-dialog-description"
            style={{ height: "80%" }}
          >
            <DialogTitle id="instructions-dialog-titlle"> 
              Instructions
            </DialogTitle>
            <DialogContent style={{ paddingTop: "10px" }}>
              <p style={{ color: "#1D2A6D", fontWeight: "bold" }}>
                {tabValue === 0
                  ? "Run Length Encoding"
                  : tabValue === 1
                    ? "Lossy Huffman"
                    : tabValue === 2
                      ? "Sine and Cosine"
                      : "JPEG Compression"}
                :
              </p>
              {getInstructions()}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseModal} color="primary">
                Close
              </Button>
            </DialogActions> 

            </div>

            </div>
          </Dialog> */}
        </div>

        <div id="mainbox">
          <TabPanel tabValue={tabValue} index={1}>
            <div class="flex-container">
              <div class="flex-item-left">
                <div id="left_bar">
                  <Box 
                    ref={toolboxRef}
                    style={getHightlightStyle(toolboxRef)}
                    sx={{
                      width: "100%",
                      height: "85%",
                      display: "flex",
                      flexDirection: "column",
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 2,
                      backgroundColor: "#ffffffff",
                      boxShadow: `
                          0 4px 8px rgba(0,0,0,0.15),
                          0 8px 16px rgba(0,0,0,0.10),
                          0 16px 24px rgba(0,0,0,0.05)`,

                      transition: "all 0.3s ease-in-out",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: `0 6px 12px rgba(0,0,0,0.2),
                                    0 12px 24px rgba(0,0,0,0.15),
                                    0 20px 40px rgba(0,0,0,0.1) `,
                      },
                     }} >
                    <Box
                      sx={{
                        p: 0,
                        alignItems: "center",
                        borderBottom: 1,
                        borderTopLeftRadius: 8,
                        borderTopRightRadius: 8,
                        borderColor: "divider",
                        backgroundColor: "#CDD5E7",
                        color: "#1D2A6D",
                        height: "50px",
                        display: "flex",
                        alignContent: "center",
                        justifyContent: "center",
                      }}
                    >
                      <h4 style={{ margin: "5px 0px" }}>Lossy Huffman Tools</h4>
                    </Box>
                    <Box
                      sx={{
                        p: 2,
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        alignContent: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        overflowY: "scroll",
                        "&::-webkit-scrollbar": { width: "5px" },
                        "&::-webkit-scrollbar-thumb": {
                          backgroundColor: "#555",
                          borderRadius: 2,
                        },
                      }}
                    >
                      <div  ref={chooseImageRef}
                      class="contentog"             
                      style={getHightlightStyle(chooseImageRef)}>
                        <h4
                          style={{
                            margin: "5px 0px",
                            textAlign: "left",
                            color: "#444444",
                          }}
                        >
                          Choose an Image:
                        </h4>
                        <div
                          className="image-grid"
                          sx={{
                            width: "100%",
                            position: "relative",
                            alignContent: "center",
                            justifyContent: "center",
                            textAlign: "center",
                          }}
                        >
                          <div
                            id="row"
                            style={{
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              gap: "5px",
                              marginBottom: "5px",
                            }}
                          >
                            <div
                              className="gridImage gridImageOne"
                              onClick={() => handleImageClick(0)}
                            >
                              <img
                                src={sample1}
                                alt="Sample 3"
                                style={{ width: "100%", height: "auto" }}
                              />
                            </div>
                            <div
                              className="gridImage gridImageTwo"
                              onClick={() => handleImageClick(1)}
                            >
                              <img
                                src={sample2}
                                alt="Sample 4"
                                style={{ width: "100%", height: "auto" }}
                              />
                            </div>
                          </div>
                          <div
                            id="row"
                            style={{
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              gap: "5px",
                            }}
                          >
                            <div
                              className="gridImage gridImageThree"
                              onClick={() => handleImageClick(2)}
                            >
                              <img
                                src={sample3}
                                alt="Sample 3"
                                style={{ width: "100%", height: "auto" }}
                              />
                            </div>
                            <div
                              className="gridImage gridImageFour"
                              onClick={() => handleImageClick(3)}
                            >
                              <img
                                src={sample4}
                                alt="Sample 4"
                                style={{ width: "100%", height: "auto" }}
                              />
                            </div>
                          </div>
                        </div>

                        <div 
                        style={{ marginTop: "15px",
                         textAlign: "center",}}>
                          <label htmlFor="file-upload" className="upload-btn"
                          ref={uploadButtonRef}
                          style={getHightlightStyle(uploadButtonRef)}>
                            <svg
                              className="upload-icon"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M12 16V4" />
                              <path d="M8 8l4-4 4 4" />
                              <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                            </svg>
                            Upload file
                          </label>
                          <input
                            id="file-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            hidden
                          />
                        </div>
                        {uploadedImageName && (
                          <p className="upload-success">
                            {uploadedImageName} image uploaded
                          </p>
                        )}
                      </div>
                      <div>
                        <h4
                          style={{
                            margin: "5px 0px",
                            textAlign: "left",
                            color: "#444444",
                          }}
                        >
                          Quantization Factor:
                        </h4>
                        <input ref={quantizationRef}
                          className="derivative-btn"
                          type="text"
                          value={qfactor}
                          onChange={(e) => setQfactor(Number(e.target.value))}
                          placeholder="Enter std threshold"
                          style={{
                            background: "#e8ecf3",
                            color: "#1D2A6D",
                            marginBottom: "10px",
                            padding: "5px",
                            border: "1px solid #1D2A6D",
                            borderRadius: "10px",
                            ...getHightlightStyle(quantizationRef)
                          }}
                        />
                      </div>
                    </Box>
                  </Box>
                </div>
              </div>

              <div class="flex-item-right">
                <div class="content">
                  <h2 style={{ margin: "5px 0px" }}>Lossy Huffman Encoding</h2>
                  <h4 style={{ margin: "15px 0px", color: "#444444" }}>
                    In this experiment we are going to check how Lossy Huffman
                    Encoding works and how Quantization Factor affects it.
                  </h4>
                </div>
                <div class="input_output" style={{ height: "70%" }}>
                  <div id="sampling_area">
                    <Box ref={inputImageRef}
                    style={getHightlightStyle(inputImageRef)}
                      sx={{
                        width: "50%",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        border: 1,
                        borderColor: isInputImageAnimationPlaying
                          ? "#1C2A6D"
                          : "#9e9e9ec6",
                        borderRadius: 2,
                        backgroundColor: "#ffffff",
                        boxShadow:
                          isInputImageAnimationPlaying === true
                            ? `0 0 0 3px rgba(28, 42, 109, 0.25),
           0 8px 24px rgba(28, 42, 109, 0.35)`
                            : `
           0 4px 8px rgba(0,0,0,0.15),
           0 8px 16px rgba(0,0,0,0.10),
           0 16px 24px rgba(0,0,0,0.05)
         `,
                        transform: isInputImageAnimationPlaying
                          ? "scale(1.02)"
                          : "scale(1)",
                        transition: "all 0.4s ease-in-out",
                        animation: isInputImageAnimationPlaying
                          ? "highlightPulse 1.2s ease-in-out 2"
                          : "none",
                        "&:hover": {
                          transform: "translateY(-4px)",
                        },
                      }}
                    >
                      <Box 
                        sx={{
                          p: 2,
                          borderBottom: 1,
                          borderColor: "divider",
                          backgroundColor: " #EAF2F9",
                          color: "#1D2A6D",
                          display: "flex",
                          height: "10px",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          borderTopLeftRadius: 8,
                          borderTopRightRadius: 8,
                        }}
                      >
                        <h4 style={{ margin: "5px 0px" }}>Input Image</h4>
                      </Box>
                      <Box
                        sx={{
                          p: 2,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <img
                          id="inputImage"
                          src={images[selectedImage]}
                          alt="Input Image"
                        />
                      </Box>
                    </Box>
                    <Box ref={outputSectionRef}
                    style={getHightlightStyle(outputSectionRef)}
                      sx={{
                        width: "auto",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        border: 1,
                        borderColor: isAnimationPlaying
                          ? "#1C2A6D"
                          : "#9e9e9ec6",
                        borderRadius: 2,
                        backgroundColor: "#ffffff",
                        boxShadow:
                          isAnimationPlaying === true
                            ? `0 0 0 3px rgba(28, 42, 109, 0.25),
           0 8px 24px rgba(28, 42, 109, 0.35)`
                            : `
           0 4px 8px rgba(0,0,0,0.15),
           0 8px 16px rgba(0,0,0,0.10),
           0 16px 24px rgba(0,0,0,0.05)
         `,
                        transform: isAnimationPlaying
                          ? "scale(1.02)"
                          : "scale(1)",
                        transition: "all 0.4s ease-in-out",
                        animation: isAnimationPlaying
                          ? "highlightPulse 1.2s ease-in-out 2"
                          : "none",
                        "&:hover": {
                          transform: "translateY(-4px)",
                        },
                      }}
                    >
                      <Box 
                        sx={{
                          p: 2,
                          borderBottom: 1,
                          borderColor: "divider",
                          backgroundColor: " #EAF2F9",
                          color: "#1D2A6D",
                          display: "flex",
                          height: "10px",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          borderTopLeftRadius: 8,
                          borderTopRightRadius: 8,
                        }}
                      >
                        <h4 style={{ margin: "5px 0px" }}>{huffText}</h4>
                      </Box>
                      <Box
                        sx={{
                          p: 2,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <canvas id="outputCanvas"></canvas>
                        {hresult && (
                          <>
                            <h3
                              style={{
                                margin: "5px 0px",
                                textAlign: "left",
                                color: "#444444",
                              }}
                            >
                              Compression ratio: {hresult["compressionRatio"]}
                            </h3>
                          </>
                        )}
                {/* <p>Output Image</p>  */}
                        {isImageProcessed === false && (
                          <div className="process-message-container">
                            <div className="placeholder-content">
                              <div className="file-icon">
                                {" "}
                                <svg
                                  viewBox="0 0 24 24"
                                  width="20"
                                  height="20"
                                  stroke="currentColor"
                                  stroke-width="2"
                                  fill="none"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  class="css-i6dzq1"
                                >
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                  <polyline points="14 2 14 8 20 8"></polyline>
                                  <line x1="16" y1="13" x2="8" y2="13"></line>
                                  <line x1="16" y1="17" x2="8" y2="17"></line>
                                  <polyline points="10 9 9 9 8 9"></polyline>
                                </svg>
                              </div>
                              <p>Process an image to view results.</p>
                            </div>
                          </div>
                        )}
                      </Box>
                    </Box>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-evenly",
                    flexWrap: "wrap",
                    alignContent: "center",
                  }}
                >
                  <Button
                    ref={processButtonRef}
                    // ref={myProcess2Button}
                    class="tool_btn"
                    style={getHightlightStyle(processButtonRef)}
                    onClick={handleProcessClick}
                    variant="outlined"
                    sx={{ borderColor: "#1D2A6D", color: "#1D2A6D" }}
                  >
                    Process
                    <svg class="icon" viewBox="0 0 30 30" fill="currentColor">
                      <path d="M 19.664062 0 C 19.423063 0 19.217828 0.17120313 19.173828 0.40820312 L 18.953125 1.5839844 C 18.896125 1.8889844 18.654609 2.1166875 18.349609 2.1796875 C 18.065609 2.2386875 17.785672 2.3123906 17.513672 2.4003906 C 17.218672 2.4963906 16.897313 2.4205469 16.695312 2.1855469 L 15.919922 1.2792969 C 15.762922 1.0962969 15.498062 1.0528281 15.289062 1.1738281 L 14.710938 1.5078125 C 14.502937 1.6278125 14.408281 1.8804219 14.488281 2.1074219 L 14.884766 3.234375 C 14.987766 3.526375 14.893109 3.8437813 14.662109 4.0507812 C 14.447109 4.2437812 14.243781 4.4471094 14.050781 4.6621094 C 13.843781 4.8931094 13.526375 4.9897187 13.234375 4.8867188 L 12.105469 4.4882812 C 11.878469 4.4082812 11.627813 4.5019375 11.507812 4.7109375 L 11.171875 5.2910156 C 11.051875 5.4990156 11.097297 5.764875 11.279297 5.921875 L 11.376953 6.0058594 C 12.559953 6.0258594 13.572016 6.8720625 13.791016 8.0390625 L 13.851562 8.3574219 L 14.060547 8.1113281 C 14.519547 7.5773281 15.162172 7.2869531 15.826172 7.2519531 C 16.722172 5.8969531 18.255 5 20 5 C 22.761 5 25 7.239 25 10 C 25 11.745 24.103047 13.277875 22.748047 14.171875 C 22.713047 14.835875 22.422672 15.4795 21.888672 15.9375 L 21.642578 16.146484 L 21.960938 16.207031 C 23.127938 16.426031 23.974141 17.438094 23.994141 18.621094 L 24.078125 18.71875 C 24.235125 18.90175 24.499984 18.947172 24.708984 18.826172 L 25.289062 18.490234 C 25.497062 18.370234 25.591719 18.119578 25.511719 17.892578 L 25.113281 16.763672 C 25.010281 16.471672 25.106891 16.154266 25.337891 15.947266 C 25.552891 15.754266 25.756219 15.550938 25.949219 15.335938 C 26.156219 15.104938 26.473625 15.010281 26.765625 15.113281 L 27.892578 15.509766 C 28.119578 15.589766 28.372187 15.496109 28.492188 15.287109 L 28.826172 14.707031 C 28.946172 14.499031 28.902703 14.235125 28.720703 14.078125 L 27.814453 13.300781 C 27.579453 13.098781 27.503609 12.777422 27.599609 12.482422 C 27.687609 12.210422 27.761312 11.932438 27.820312 11.648438 C 27.883312 11.344437 28.111016 11.102922 28.416016 11.044922 L 29.591797 10.822266 C 29.828797 10.781266 30 10.576938 30 10.335938 L 30 9.6640625 C 30 9.4230625 29.828797 9.2178281 29.591797 9.1738281 L 28.416016 8.953125 C 28.111016 8.896125 27.883312 8.6546094 27.820312 8.3496094 C 27.761312 8.0656094 27.687609 7.7856719 27.599609 7.5136719 C 27.503609 7.2186719 27.579453 6.8973125 27.814453 6.6953125 L 28.720703 5.9199219 C 28.903703 5.7629219 28.947172 5.4980625 28.826172 5.2890625 L 28.492188 4.7109375 C 28.372187 4.5029375 28.119578 4.4082812 27.892578 4.4882812 L 26.765625 4.8847656 C 26.473625 4.9877656 26.156219 4.8931094 25.949219 4.6621094 C 25.756219 4.4471094 25.552891 4.2437813 25.337891 4.0507812 C 25.106891 3.8437813 25.010281 3.526375 25.113281 3.234375 L 25.511719 2.1054688 C 25.591719 1.8784687 25.498063 1.6278125 25.289062 1.5078125 L 24.708984 1.171875 C 24.500984 1.051875 24.235125 1.0972969 24.078125 1.2792969 L 23.302734 2.1855469 C 23.100734 2.4205469 22.779375 2.4963906 22.484375 2.4003906 C 22.212375 2.3123906 21.932438 2.2386875 21.648438 2.1796875 C 21.344438 2.1166875 21.102922 1.8870312 21.044922 1.5820312 L 20.824219 0.40625 C 20.782219 0.17025 20.576937 0 20.335938 0 L 19.664062 0 z M 10.664062 8 C 10.423063 8 10.217828 8.17025 10.173828 8.40625 L 9.9882812 9.3945312 C 9.9112813 9.8055313 9.5838281 10.108406 9.1738281 10.191406 C 8.8328281 10.260406 8.497875 10.348078 8.171875 10.455078 C 7.775875 10.585078 7.3413125 10.487875 7.0703125 10.171875 L 6.4199219 9.4121094 C 6.2629219 9.2301094 5.9970625 9.1866406 5.7890625 9.3066406 L 5.2109375 9.640625 C 5.0019375 9.760625 4.9082812 10.013234 4.9882812 10.240234 L 5.3242188 11.191406 C 5.4622188 11.585406 5.3305312 12.009109 5.0195312 12.287109 C 4.7625312 12.517109 4.5180625 12.760578 4.2890625 13.017578 C 4.0110625 13.328578 3.5873594 13.460266 3.1933594 13.322266 L 2.2402344 12.988281 C 2.0132344 12.908281 1.7625781 13.002937 1.6425781 13.210938 L 1.3066406 13.789062 C 1.1856406 13.998062 1.2310625 14.262922 1.4140625 14.419922 L 2.1738281 15.070312 C 2.4898281 15.341313 2.5870312 15.775875 2.4570312 16.171875 C 2.3500312 16.497875 2.2623594 16.832828 2.1933594 17.173828 C 2.1103594 17.583828 1.8074844 17.911281 1.3964844 17.988281 L 0.40820312 18.173828 C 0.17120313 18.217828 0 18.423063 0 18.664062 L 0 19.335938 C 0 19.576937 0.17025 19.782172 0.40625 19.826172 L 1.3945312 20.011719 C 1.8055312 20.088719 2.1084062 20.416172 2.1914062 20.826172 C 2.2604063 21.168172 2.3480781 21.502125 2.4550781 21.828125 C 2.5850781 22.224125 2.487875 22.658687 2.171875 22.929688 L 1.4121094 23.580078 C 1.2301094 23.737078 1.1866406 24.002938 1.3066406 24.210938 L 1.640625 24.789062 C 1.760625 24.998062 2.0132344 25.091719 2.2402344 25.011719 L 3.1914062 24.675781 C 3.5854063 24.537781 4.0091094 24.669469 4.2871094 24.980469 C 4.5171094 25.237469 4.7605781 25.481938 5.0175781 25.710938 C 5.3285781 25.988937 5.4602656 26.412641 5.3222656 26.806641 L 4.9882812 27.759766 C 4.9082812 27.986766 5.0029375 28.237422 5.2109375 28.357422 L 5.7890625 28.693359 C 5.9980625 28.814359 6.2629219 28.768937 6.4199219 28.585938 L 7.0703125 27.826172 C 7.3413125 27.510172 7.775875 27.412969 8.171875 27.542969 C 8.497875 27.649969 8.8328281 27.737641 9.1738281 27.806641 C 9.5838281 27.889641 9.9112813 28.192516 9.9882812 28.603516 L 10.173828 29.591797 C 10.217828 29.828797 10.423063 30 10.664062 30 L 11.335938 30 C 11.576938 30 11.782219 29.82875 11.824219 29.59375 L 12.009766 28.605469 C 12.086766 28.194469 12.414219 27.891594 12.824219 27.808594 C 13.166219 27.739594 13.500172 27.651922 13.826172 27.544922 C 14.222172 27.414922 14.656734 27.512125 14.927734 27.828125 L 15.578125 28.587891 C 15.735125 28.769891 15.999031 28.815313 16.207031 28.695312 L 16.787109 28.359375 C 16.996109 28.239375 17.089766 27.988719 17.009766 27.761719 L 16.675781 26.808594 C 16.537781 26.414594 16.669469 25.990891 16.980469 25.712891 C 17.237469 25.482891 17.481938 25.239422 17.710938 24.982422 C 17.988937 24.671422 18.413641 24.539734 18.806641 24.677734 L 19.759766 25.011719 C 19.986766 25.091719 20.237422 24.997062 20.357422 24.789062 L 20.693359 24.210938 C 20.814359 24.001937 20.768937 23.737078 20.585938 23.580078 L 19.826172 22.929688 C 19.510172 22.658688 19.412969 22.224125 19.542969 21.828125 C 19.649969 21.502125 19.737641 21.167172 19.806641 20.826172 C 19.889641 20.416172 20.192516 20.088719 20.603516 20.011719 L 21.591797 19.826172 C 21.828797 19.782172 22 19.576937 22 19.335938 L 22 18.664062 C 22 18.423063 21.82875 18.218781 21.59375 18.175781 L 20.605469 17.990234 C 20.194469 17.913234 19.891594 17.583828 19.808594 17.173828 C 19.739594 16.832828 19.651922 16.497875 19.544922 16.171875 C 19.414922 15.775875 19.512125 15.343266 19.828125 15.072266 L 20.587891 14.421875 C 20.769891 14.264875 20.815313 13.999016 20.695312 13.791016 L 20.359375 13.210938 C 20.239375 13.001937 19.988719 12.908281 19.761719 12.988281 L 18.808594 13.324219 C 18.414594 13.462219 17.990891 13.330531 17.712891 13.019531 C 17.482891 12.762531 17.239422 12.518062 16.982422 12.289062 C 16.671422 12.011063 16.539734 11.587359 16.677734 11.193359 L 17.011719 10.240234 C 17.091719 10.013234 16.997062 9.7625781 16.789062 9.6425781 L 16.210938 9.3066406 C 16.001938 9.1856406 15.737078 9.2310625 15.580078 9.4140625 L 14.929688 10.173828 C 14.658687 10.489828 14.224125 10.587031 13.828125 10.457031 C 13.502125 10.350031 13.167172 10.262359 12.826172 10.193359 C 12.416172 10.110359 12.088719 9.8074844 12.011719 9.3964844 L 11.826172 8.4082031 C 11.782172 8.1712031 11.576937 8 11.335938 8 L 10.664062 8 z M 20 9 A 1 1 0 0 0 19 10 A 1 1 0 0 0 20 11 A 1 1 0 0 0 21 10 A 1 1 0 0 0 20 9 z M 11 13 C 14.314 13 17 15.686 17 19 C 17 22.314 14.314 25 11 25 C 7.686 25 5 22.314 5 19 C 5 15.686 7.686 13 11 13 z M 11 17 C 9.895 17 9 17.895 9 19 C 9 20.105 9.895 21 11 21 C 12.105 21 13 20.105 13 19 C 13 17.895 12.105 17 11 17 z"></path>
                    </svg>
                  </Button>


                  <Button
                    ref={printButtonRef}
                    class="tool_btn print_btn"
                    style={getHightlightStyle(printButtonRef)}
                    onClick={handlePrint}
                    variant="outlined"
                    sx={{ borderColor: "#1D2A6D", color: "#1D2A6D" }}
                  >
                    Print
                    <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 8V5c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v3h2c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V10c0-1.1.9-2 2-2h2zm2-3h8V5H8v3zM4 10v8h16V10H4zm8 10h-2v2h2v-2z" />
                    </svg>
                  </Button>
                   <Button
                    ref={conceptButtonRef}
                    class="tool_btn"
                    style={getHightlightStyle(conceptButtonRef)}
                    onClick={exp2}
                    variant="outlined"
                    sx={{ borderColor: "#1D2A6D", color: "#1D2A6D" }}
                  >
                    Concept
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="white"
                      width="24px"
                      height="24px"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20 3H4c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2h16c1.103 0 2-.897 2-2V5c0-1.103-.897-2-2-2zM4 19V5h16l.002 14H4z" />
                      <path d="M6 7h12v2H6zm0 4h12v2H6zm0 4h6v2H6z" />
                    </svg>
                  </Button>

                </div>
                {/* ToastContainer must be placed somewhere in the component tree */}
                <ToastContainer />
                {/* Explanation Modal */}
                <Dialog
                  open={openHuffmanModal}
                  onClose={handleClose3Modal}
                  aria-labelledby="explanation-dialog-title"
                  aria-describedby="explanation-dialog-description"
                  PaperProps={{
                    id: "explanation-dialog",
                  }}
                >
                  <DialogTitle id="instructions-dialog-title"
                  sx={{ 
                        backgroundColor: '#1d2a6d',
                        color: 'white',
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 24px'
                        }}>

                  <span style ={{fontSize: '20px', fontWeight: '600'}}>Huffman Concept</span> 
                  <div style={{ display: 'flex', gap: '10px'}}>
                  <button onClick={() => setShowInstructions(true)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    letterSpacing: '0.5px'
                  }}>
                    INSTRUCTIONS
                  </button>   
                  <button onClick={handleClose3Modal}
                  style={{
                    background: 'white',
                    color: '#1d2a6d',
                    border: '2px solid #1d2a6d',
                    borderRadius: '8px',
                    padding: '6px 16px',
                    fontWeight: '600',
                    cursor: 'pointer', 
                    fontSize: '14px'
                  }}
                  onMouseEnter={e => {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.color = '#1d2a6d';
                  }}
                  onMouseLeave={e => {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.color = '#1d2a6d';
                  }}
                   >
                    Close
                  </button>
                  </div>
                  </DialogTitle>

                  <DialogContent
                    sx={{ padding: "0px", height: "1200px" }}>
                    {showInstructions && (
                      <Box style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Box sx={{
                          background: 'white',
                          borderRadius: '8px',
                          //padding: '28px',
                          maxWidth: '580px',
                          width: '90%',
                          position: 'relative',
                          overflow: 'hidden'
                        }}>

                        <Box sx={{background: '#1a3a5c' , padding: '12px 20px'}}>
                          <span style={{color: 'white', fontSize: '20px', fontWeight: 600}}>
                            Instructions of Huffman Encoding:
                          </span>
                        </Box>
                        
                          <Box sx={{padding: '20px 24px 8px'}}>
                          
                            <p style={{fontSize: '14px', color:'#333', margin: '0 0 10px'}}>
                            <strong>Step 1 - </strong> Select a symbol imaage (+ - &times; &divide;) from Choose box or type your own text in the text box. </p>
                            <p style={{ fontSize: '14px', color: '#333', margin: '0 0 10px'}}>
                            <strong>Step 2 - </strong>  Click the <b>"Analyze Frequency"</b> button.The frequency table will be generated. </p>
                            <p style={{ fontSize: '14px', color:'#333', margin: '0 0 10px'}}>
                            <strong>Step 3 - </strong> Click teh <b>"Generate"</b> button. Initial nodes will appear.</p>
                            <p style={{fontSize: '14px', color: '#333', margin: '0 0 10px'}}>
                            <strong>Step 4 - </strong>  Click repeatedly on <b>"Next Step" </b>to watch the tree build step by step:
                            <ul style={{ fontSize: '14px' , marginTop: '4px', paddingLeft: '40px', color: '#555'}}>
                              <li><strong>Select - </strong> The 2 lowest frequency nodes will be highlighted in orange.</li>
                              <li><strong>Merge - </strong>Both nodes merge to create a new parent node.</li>
                            </ul>
                            </p>
                            <p style={{fontSize: '14px', color: '#333', margin: '0 0 10px'}}>
                            <strong>Step 5 - </strong>Once all the steps are complete, the final binary codes will be displayed.</p>
                            <p style={{fontSize: '14px', color: '#333', margin: '0 0 10px'}}>
                            <strong>Step 6 - </strong>Click the <b>"Reset"</b> button to clear everything and start over.</p>
                          
                          <div style={{
                            marginTop: '16px',
                            padding: '10px 14px',
                            background: '#f0f4ff',
                            borderRadius: '8px',
                            borderLeft: '3px solid #1d2a6d',
                            fontSize: '13px',
                            color: '#555'
                          }}>
                          <strong>Tip:</strong> Characters with higher frequency get shorter binary codes!
                          </div>
                        <button onClick={() => setShowInstructions(false)}
                          style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            margin: '15px auto 0',
                            top:'12px',
                            right: '16px',
                            background: 'white',
                            color: '#1d2a6d',
                            border: '2px solid #1d2a6d',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            cursor: 'pointer',
                            fontSize: '16px', 
                        }}>
                         <b>CLOSE</b>  
                        </button>
                        </Box>
                      </Box>
                      </Box>
                    )}
                    {openHuffmanModal && <HuffmanAnimation />}
                    {/* {HuffmanAnimation()} */}
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </TabPanel>
        </div>
      </div>
    </OpenCvProvider>
  );
}