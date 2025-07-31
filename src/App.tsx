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

function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const vrmRef = useRef<VRM | null>(null);
  
  // Speech recognition and synthesis
  const [isListening, setIsListening] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // VRM selection only
  const [selectedVRM, setSelectedVRM] = useState<string>('cute-girl.vrm');
  
  // Language context
  const [languageContext, setLanguageContext] = useState<'chinese' | 'english'>('chinese');
  
  // Mouse control states
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [mouseButton, setMouseButton] = useState<number>(0);
  const [lastMouseX, setLastMouseX] = useState<number>(0);
  const [lastMouseY, setLastMouseY] = useState<number>(0);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

  function setVrmMouthShape(shape: string, value: number) {
    const vrm = vrmRef.current;
    if (!vrm) {
      console.log('setVrmMouthShape: No VRM loaded');
      return;
    }
    
    console.log(`setVrmMouthShape: Setting ${shape} to ${value}`);
    
    // VRM 1.x
    if ((vrm as any).expressionManager && typeof (vrm as any).expressionManager.setValue === 'function') {
      (vrm as any).expressionManager.setValue(shape, value);
      console.log(`Applied to expressionManager: ${shape} = ${value}`);
      
      // Debug: List available expressions
      if (value > 0) {
        console.log('Available expressions:', (vrm as any).expressionManager.getExpressionNames?.() || 'No getExpressionNames method');
      }
    } else if ((vrm as any).blendShapeProxy && typeof (vrm as any).blendShapeProxy.setValue === 'function') {
      (vrm as any).blendShapeProxy.setValue(shape, value);
      console.log(`Applied to blendShapeProxy: ${shape} = ${value}`);
    } else {
      console.log('setVrmMouthShape: No compatible expression system found');
    }
  }

  // Simple lip sync with TTS events
  const speakText = useCallback((text: string) => {
    if (!synthesisRef.current) return;
    
    // Cancel any ongoing speech to avoid event conflicts
    synthesisRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = languageContext === 'chinese' ? 'zh-CN' : 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    let mouthTimer: NodeJS.Timeout | null = null;

    // Open mouth when speech starts
    utterance.onstart = () => {
      console.log('Speech started - opening mouth');
      // Try the most common mouth shape first
      setVrmMouthShape('A', 1.0);
    };

    // Handle word boundaries for natural lip sync
    utterance.onboundary = (event) => {
      console.log('Word boundary detected - adjusting mouth');
      // Clear any existing timer
      if (mouthTimer) {
        clearTimeout(mouthTimer);
      }
      
      // Open mouth for current word
      setVrmMouthShape('A', 1.0);
      
      // Close mouth after a short delay if no next word
      mouthTimer = setTimeout(() => {
        console.log('Closing mouth after delay');
        setVrmMouthShape('A', 0.0);
      }, 150);
    };

    // Close mouth when speech ends
    utterance.onend = () => {
      console.log('Speech ended - closing mouth');
      if (mouthTimer) {
        clearTimeout(mouthTimer);
      }
      setVrmMouthShape('A', 0.0);
    };

    synthesisRef.current.speak(utterance);
  }, [languageContext]);

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

    // --- Scene, camera, renderer, lighting initialization (keep unchanged) ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 4);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Ensure renderer.domElement is accessible during unmount
    mountElement.appendChild(renderer.domElement);
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    const loader = new GLTFLoader();
    loader.register((parser: any) => new VRMLoaderPlugin(parser));
    
    // --- Model loading logic ---
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
        
        // DEBUG: Print all available expression names
        console.log('=== VRM Expression Debug ===');
        if ((vrm as any).expressionManager) {
          const expressionNames = (vrm as any).expressionManager.getExpressionNames?.();
          console.log('Available expressions:', expressionNames);
          
          // Also check blendShapeProxy for older VRM versions
          if ((vrm as any).blendShapeProxy) {
            console.log('BlendShapeProxy available:', (vrm as any).blendShapeProxy);
          }
        } else {
          console.log('No expressionManager found');
        }
        console.log('=== End VRM Expression Debug ===');
        
        console.log('Avatar loaded. Pose will be enforced in the animation loop.');

      } catch (error) {
        console.error(`Error loading VRM (${vrmFile}):`, error);
      }
    };
    
    loadVRMModel(selectedVRM);
    
    // --- Animation loop and window resize (core modification here) ---
    const clock = new THREE.Clock();
    let poseInitialized = false; // Flag to ensure reset only executes once

    const animate = () => {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      
      if (vrmRef.current) {
        // Update VRM's animation and physics first
        vrmRef.current.update(delta);

        // **Core fix: Immediately force our pose after update**
        // This step will override any pose reset caused by .update()
        const humanoid = vrmRef.current.humanoid;
        if (humanoid) {
          const setBoneRotation = (boneName: VRMHumanBoneName, x: number, y: number, z: number) => {
            const boneNode = humanoid.getNormalizedBoneNode(boneName);
            if (boneNode) {
              boneNode.rotation.set(
                THREE.MathUtils.degToRad(x),
                THREE.MathUtils.degToRad(y),
                THREE.MathUtils.degToRad(z)
              );
            }
          };

          // Force arms to hang naturally
          setBoneRotation(VRMHumanBoneName.LeftUpperArm, 0, 0, 60);   // A-pose: arms down at 60 degrees (moved up)
          setBoneRotation(VRMHumanBoneName.RightUpperArm, 0, 0, -60); // A-pose: arms down at -60 degrees (moved up)
          setBoneRotation(VRMHumanBoneName.LeftLowerArm, 0, 0, 15);   // Slight elbow bend
          setBoneRotation(VRMHumanBoneName.RightLowerArm, 0, 0, -15); // Slight elbow bend
          
          // Only apply pose once, reset spring bones to their new resting state
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
  }, [selectedVRM]); // <-- Dependencies array

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = languageContext === 'chinese' ? 'zh-CN' : 'en-US';

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
  }, [processWithAI, languageContext]); // eslint-disable-line react-hooks/exhaustive-deps

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
    } else if (mouseButton === 1) { // Middle button - panning
      vrmRef.current.scene.position.x += deltaX * 0.01;
      vrmRef.current.scene.position.y -= deltaY * 0.01; // Inverted Y for natural panning
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
        
        {/* Language selector */}
        <select 
          value={languageContext}
          onChange={(e) => setLanguageContext(e.target.value as 'chinese' | 'english')}
          className="language-select"
        >
          <option value="chinese">中文</option>
          <option value="english">English</option>
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
        
        {/* Test button for debugging VRM expressions */}
        <button 
          className="test-button"
          onClick={() => {
            console.log('=== Testing VRM Expressions ===');
            if (vrmRef.current) {
              console.log('VRM loaded:', vrmRef.current);
              if ((vrmRef.current as any).expressionManager) {
                const expressionNames = (vrmRef.current as any).expressionManager.getExpressionNames?.();
                console.log('Available expressions:', expressionNames);
              }
              if ((vrmRef.current as any).blendShapeProxy) {
                console.log('BlendShapeProxy:', (vrmRef.current as any).blendShapeProxy);
              }
            } else {
              console.log('No VRM loaded');
            }
            // Test speech synthesis
            speakText('Hello, this is a test for VRM mouth shapes.');
          }}
        >
          Test VRM Expressions
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
