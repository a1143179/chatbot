import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRM, VRMHumanBoneName } from '@pixiv/three-vrm';
import './App.css';
import config from './config';
import CorsTest from './components/CorsTest';

// Type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Phoneme to mouth shape mapping for Chinese
const phonemeToMouthShape: { [key: string]: string[] } = {
  // Vowels
  'a': ['A'],
  'e': ['E'],
  'i': ['I'],
  'o': ['O'],
  'u': ['U'],
  // Consonants that affect mouth shape
  'b': ['A'],
  'p': ['A'],
  'm': ['A'],
  'f': ['A'],
  'v': ['A'],
  'w': ['O'],
  'y': ['I'],
  // Chinese specific sounds
  'zh': ['A'],
  'ch': ['A'],
  'sh': ['A'],
  'r': ['A'],
  'z': ['A'],
  'c': ['A'],
  's': ['A'],
  'h': ['A'],
  'l': ['A'],
  'n': ['A'],
  'ng': ['A'],
  'j': ['I'],
  'q': ['I'],
  'x': ['I'],
  'g': ['A'],
  'k': ['A'],
  'd': ['A'],
  't': ['A']
};

function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const vrmRef = useRef<VRM | null>(null);
  
  // Speech recognition and synthesis
  const [isListening, setIsListening] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // VRM selection only
  const [selectedVRM, setSelectedVRM] = useState<string>('cute-girl.vrm');
  
  // Mouse control states
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [mouseButton, setMouseButton] = useState<number>(0);
  const [lastMouseX, setLastMouseX] = useState<number>(0);
  const [lastMouseY, setLastMouseY] = useState<number>(0);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const lipSyncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  function setVrmMouthShape(shape: string, value: number) {
    const vrm = vrmRef.current;
    if (!vrm) return;
    
    // VRM 1.x
    if ((vrm as any).expressionManager && typeof (vrm as any).expressionManager.setValue === 'function') {
      (vrm as any).expressionManager.setValue(shape, value);
    } else if ((vrm as any).blendShapeProxy && typeof (vrm as any).blendShapeProxy.setValue === 'function') {
      (vrm as any).blendShapeProxy.setValue(shape, value);
    }
  }



  // Improved lip sync based on text analysis
  const analyzeTextForLipSync = useCallback((text: string): string[] => {
    const phonemes: string[] = [];
    const words = text.toLowerCase().split(/\s+/);
    
    words.forEach(word => {
      // Simple Chinese character to pinyin approximation
      // This is a basic implementation - for better results, you'd want a proper Chinese-to-pinyin library
      const chars = word.split('');
      chars.forEach(char => {
        // Map Chinese characters to approximate phonemes
        if (/[aeiou]/.test(char)) {
          phonemes.push(char);
        } else if (/[bpmfw]/.test(char)) {
          phonemes.push('b');
        } else if (/[dtnl]/.test(char)) {
          phonemes.push('d');
        } else if (/[gkh]/.test(char)) {
          phonemes.push('g');
        } else if (/[jqx]/.test(char)) {
          phonemes.push('j');
        } else if (/[zhchsh]/.test(char)) {
          phonemes.push('zh');
        } else if (/[zcs]/.test(char)) {
          phonemes.push('z');
        } else {
          // Default to 'a' for unknown characters
          phonemes.push('a');
        }
      });
    });
    
    return phonemes;
  }, []);

  const startLipSync = useCallback((text: string) => {
    const phonemes = analyzeTextForLipSync(text);
    let currentIndex = 0;
    
    // Clear any existing lip sync
    if (lipSyncIntervalRef.current) {
      clearInterval(lipSyncIntervalRef.current);
    }
    
    // Reset all mouth shapes
    ['A', 'I', 'U', 'E', 'O'].forEach(shape => setVrmMouthShape(shape, 0));
    
    lipSyncIntervalRef.current = setInterval(() => {
      if (currentIndex >= phonemes.length) {
        // End of text, close mouth
        ['A', 'I', 'U', 'E', 'O'].forEach(shape => setVrmMouthShape(shape, 0));
        if (lipSyncIntervalRef.current) {
          clearInterval(lipSyncIntervalRef.current);
        }
        return;
      }
      
      const phoneme = phonemes[currentIndex];
      const shapes = phonemeToMouthShape[phoneme] || ['A'];
      
      // Set mouth shapes
      ['A', 'I', 'U', 'E', 'O'].forEach(shape => {
        const value = shapes.includes(shape) ? 1.0 : 0.0;
        setVrmMouthShape(shape, value);
      });
      
      currentIndex++;
    }, 150); // Adjust timing based on speech rate
  }, [analyzeTextForLipSync]);

  const stopLipSync = useCallback(() => {
    if (lipSyncIntervalRef.current) {
      clearInterval(lipSyncIntervalRef.current);
      lipSyncIntervalRef.current = null;
    }
    // Reset mouth shapes
    ['A', 'I', 'U', 'E', 'O'].forEach(shape => setVrmMouthShape(shape, 0));
  }, []);

  const speakText = useCallback((text: string) => {
    if (!synthesisRef.current) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    // Start lip sync when speech starts
    utterance.onstart = () => {
      startLipSync(text);
    };
    
    // Stop lip sync when speech ends
    utterance.onend = () => {
      stopLipSync();
    };

    synthesisRef.current.speak(utterance);
  }, [startLipSync, stopLipSync]);

  const processWithAI = useCallback(async (userInput: string) => {
    setIsProcessing(true);
    
    try {
      console.log('Making API request to:', config.apiUrl);
      console.log('Request payload:', { prompt: userInput });
      
      // Use configuration for API URL
      const response = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          prompt: userInput
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API request failed:', response.status, errorText);
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('API response data:', data);
      const aiResponse = data.response;
      
      // Add AI response to chat
      const assistantMessage: ChatMessage = { role: 'assistant', content: aiResponse };
      setChatHistory(prev => [...prev, assistantMessage]);
      
      // Speak the response
      speakText(aiResponse);
      
    } catch (error) {
      console.error('Error processing with AI:', error);
      const errorMessage: ChatMessage = { 
        role: 'assistant', 
        content: `Sorry, an error occurred while processing your request: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  }, [speakText]);

  // Initialize Three.js scene and VRM
  useEffect(() => {
    const mountElement = mountRef.current;
    if (!mountElement) return;

    // --- 场景、相机、渲染器、光照的初始化 (保持不变) ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 4);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // 在 unmount 时确保能访问到 renderer.domElement
    mountElement.appendChild(renderer.domElement);
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    const loader = new GLTFLoader();
    loader.register((parser: any) => new VRMLoaderPlugin(parser));
    
    // --- 模型加载逻辑 ---
    const loadVRMModel = async (vrmFile: string) => {
      console.log(`Loading VRM file: ${vrmFile}`);
      
      if (vrmRef.current) {
        scene.remove(vrmRef.current.scene);
      }
      
      const url = `./models/vrm/${vrmFile}?t=${Date.now()}`;
      
      try {
        const gltf = await loader.loadAsync(url);
        const vrm = gltf.userData.vrm as VRM;
        vrmRef.current = vrm;
        scene.add(vrm.scene);
        
        vrm.scene.position.set(0, 0.75, 0);
        vrm.scene.rotation.y = Math.PI;
        vrm.scene.scale.setScalar(1.2);
        
        vrm.scene.traverse((child: any) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        console.log('Avatar loaded. Pose will be enforced in the animation loop.');

      } catch (error) {
        console.error(`Error loading VRM (${vrmFile}):`, error);
      }
    };
    
    loadVRMModel(selectedVRM);
    
    // --- 动画循环与窗口大小调整 (核心修改在这里) ---
    const clock = new THREE.Clock();
    let poseInitialized = false; // 用于确保 reset 只执行一次的标志

    const animate = () => {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      
      if (vrmRef.current) {
        // 先更新VRM的动画和物理
        vrmRef.current.update(delta);

        // **核心修复：在更新后，立即强制应用我们的姿势**
        // 这一步将覆盖掉任何由 .update() 引起的姿势重置
        const humanoid = vrmRef.current.humanoid;
        if (humanoid) {
          const setBoneRotation = (boneName: VRMHumanBoneName, x: number, y: number, z: number) => {
            const boneNode = humanoid.getBoneNode(boneName);
            if (boneNode) {
              boneNode.rotation.set(
                THREE.MathUtils.degToRad(x),
                THREE.MathUtils.degToRad(y),
                THREE.MathUtils.degToRad(z)
              );
            }
          };

          // 强制手臂自然下垂
          setBoneRotation(VRMHumanBoneName.LeftUpperArm, 0, 0, 0);   // 自然下垂
          setBoneRotation(VRMHumanBoneName.RightUpperArm, 0, 0, 0);  // 自然下垂
          setBoneRotation(VRMHumanBoneName.LeftLowerArm, 0, 0, 0);   // 自然下垂
          setBoneRotation(VRMHumanBoneName.RightLowerArm, 0, 0, 0);  // 自然下垂
          
          // 仅在第一次应用姿势时，重置弹簧骨，将其设定为新的静止状态
          if (!poseInitialized && vrmRef.current.springBoneManager) {
            vrmRef.current.springBoneManager.reset();
            poseInitialized = true;
            console.log("Pose enforced and spring bones have been reset to this pose.");
          }
        }
      }
      
      renderer.render(scene, camera);
    };

    animate();
    
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountElement && renderer.domElement.parentElement) {
         mountElement.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [selectedVRM]); // <-- 依赖项数组

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'zh-CN';

      recognitionRef.current.onresult = async (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        console.log('Recognized:', transcript);
        
        // Add user message to chat
        const userMessage: ChatMessage = { role: 'user', content: transcript };
        setChatHistory(prev => [...prev, userMessage]);
        
        // Process with AI
        await processWithAI(transcript);
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    // Initialize speech synthesis
    synthesisRef.current = window.speechSynthesis;
  }, [processWithAI]); // eslint-disable-line react-hooks/exhaustive-deps

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening && !isProcessing) {
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening, isProcessing]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  // Handle VRM model change
  const handleVRMChange = useCallback(async (vrmFile: string) => {
    setSelectedVRM(vrmFile);
    // The VRM will be reloaded in the useEffect when selectedVRM changes
  }, []);

  // Mouse control functions
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    setIsMouseDown(true);
    setMouseButton(event.button);
    setLastMouseX(event.clientX);
    setLastMouseY(event.clientY);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsMouseDown(false);
    setMouseButton(0);
  }, []);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!isMouseDown || !vrmRef.current) return;

    const deltaX = event.clientX - lastMouseX;
    const deltaY = event.clientY - lastMouseY;

    if (mouseButton === 0) { // Left button - horizontal rotation
      vrmRef.current.scene.rotation.y += deltaX * 0.01;
    } else if (mouseButton === 2) { // Right button - vertical rotation
      vrmRef.current.scene.rotation.x += deltaY * 0.01;
    }

    setLastMouseX(event.clientX);
    setLastMouseY(event.clientY);
  }, [isMouseDown, mouseButton, lastMouseX, lastMouseY]);

  const handleWheel = useCallback((event: React.WheelEvent) => {
    if (!vrmRef.current) return;
    
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    vrmRef.current.scene.scale.multiplyScalar(zoomFactor);
  }, []);

  // Simple routing
  const [currentRoute, setCurrentRoute] = useState<string>('main');

  // Check URL for route
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/test-cors') {
      setCurrentRoute('cors-test');
    } else {
      setCurrentRoute('main');
    }
  }, []);

  // Render CORS test page
  if (currentRoute === 'cors-test') {
    return <CorsTest />;
  }

  return (
    <div className="App">
      <div 
        ref={mountRef} 
        style={{ width: '100vw', height: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()} // Prevent right-click context menu
      />
      
      {/* Simple model selector */}
      <div className="model-selector">
        <select 
          value={selectedVRM}
          onChange={(e) => handleVRMChange(e.target.value)}
          className="model-select"
        >
          <option value="cute-girl.vrm">Cute Girl</option>
          <option value="twitch-girl.vrm">Twitch Girl</option>
          <option value="Nahida.vrm">Nahida</option>
          <option value="star-rail.vrm">Star Rail</option>
          <option value="pee.vrm">Pee</option>
        </select>
      </div>

      {/* Voice control overlay */}
      <div className="voice-controls">
        <button 
          className={`voice-button ${isListening ? 'listening' : ''}`}
          onClick={isListening ? stopListening : startListening}
          disabled={isProcessing}
        >
          {isListening ? 'Stop Recording' : 'Start Recording'}
        </button>
        
        {isProcessing && (
          <div className="processing-indicator">
            Processing...
          </div>
        )}
      </div>

      {/* Chat history overlay */}
      <div className="chat-history">
        {chatHistory.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            <strong>{message.role === 'user' ? 'You' : 'Assistant'}:</strong> {message.content}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
