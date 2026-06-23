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

    function handleNextStep(){
        if(currentStep >= steps.length - 1){
            setIsComplete(true);
            if(onTreeComplete) onTreeComplete();
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