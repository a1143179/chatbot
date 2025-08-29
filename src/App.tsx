import React, { useEffect, useRef, useState, useCallback } from 'react';
import Loader from './components/Loader';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRM } from '@pixiv/three-vrm';
import './App.css';
import config from './config';
import CorsTest from './components/CorsTest';
import { analyzeVRM, findMouthShapes, suggestMouthShape } from './utils/vrmAnalyzer';

// Utility functions for localStorage
const getLocalStorage = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn('Failed to get from localStorage:', error);
    return null;
  }
};

const setLocalStorage = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn('Failed to set localStorage:', error);
  }
};

// Save camera state to localStorage
const saveCameraState = (camera: THREE.PerspectiveCamera): void => {
  const cameraState = {
    position: {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z
    },
    rotation: {
      x: camera.rotation.x,
      y: camera.rotation.y,
      z: camera.rotation.z
    },
    fov: camera.fov,
    aspect: camera.aspect
  };
  setLocalStorage('cameraState', JSON.stringify(cameraState));
};

// Load camera state from localStorage
const loadCameraState = (camera: THREE.PerspectiveCamera): boolean => {
  const savedState = getLocalStorage('cameraState');
  if (savedState) {
    try {
      const cameraState = JSON.parse(savedState);
      camera.position.set(cameraState.position.x, cameraState.position.y, cameraState.position.z);
      camera.rotation.set(cameraState.rotation.x, cameraState.rotation.y, cameraState.rotation.z);
      camera.fov = cameraState.fov;
      camera.aspect = cameraState.aspect;
      camera.updateProjectionMatrix();
      return true;
    } catch (error) {
      console.warn('Failed to parse camera state:', error);
      return false;
    }
  }
  
  // Set default camera state for first-time visitors
  const defaultCameraState = {
    position: { x: 0.39000000000000024, y: 2.4099999999999997, z: 1.2552423843600007 },
    rotation: { x: 0, y: 0, z: 0 },
    fov: 35,
    aspect: 2.107487922705314
  };
  
  camera.position.set(defaultCameraState.position.x, defaultCameraState.position.y, defaultCameraState.position.z);
  camera.rotation.set(defaultCameraState.rotation.x, defaultCameraState.rotation.y, defaultCameraState.rotation.z);
  camera.fov = defaultCameraState.fov;
  camera.aspect = defaultCameraState.aspect;
  camera.updateProjectionMatrix();
  
  // Save the default state to localStorage
  setLocalStorage('cameraState', JSON.stringify(defaultCameraState));
  console.log('Set default camera state for first-time visitor');
  
  return true;
};

// Save VRM rotation state to localStorage
const saveVRMRotationState = (vrm: VRM): void => {
  const vrmState = {
    rotation: {
      x: vrm.scene.rotation.x,
      y: vrm.scene.rotation.y,
      z: vrm.scene.rotation.z
    }
  };
  setLocalStorage('vrmRotationState', JSON.stringify(vrmState));
};

// Load VRM rotation state from localStorage
const loadVRMRotationState = (vrm: VRM): boolean => {
  const savedState = getLocalStorage('vrmRotationState');
  if (savedState) {
    try {
      const vrmState = JSON.parse(savedState);
      vrm.scene.rotation.set(vrmState.rotation.x, vrmState.rotation.y, vrmState.rotation.z);
      return true;
    } catch (error) {
      console.warn('Failed to parse VRM rotation state:', error);
      return false;
    }
  }
  
  // Set default VRM rotation state for first-time visitors
  const defaultVrmRotationState = {
    rotation: { x: -0.04000000000000018, y: 3.3215926535897933, z: 0 }
  };
  
  vrm.scene.rotation.set(defaultVrmRotationState.rotation.x, defaultVrmRotationState.rotation.y, defaultVrmRotationState.rotation.z);
  
  // Save the default state to localStorage
  setLocalStorage('vrmRotationState', JSON.stringify(defaultVrmRotationState));
  console.log('Set default VRM rotation state for first-time visitor');
  
  return true;
};

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
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  
  // Speech recognition and synthesis
  const [isListening, setIsListening] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // VRM selection only
  const [selectedVRM, setSelectedVRM] = useState<string>('twitch-girl.vrm');
  
  // VRM analysis state
  const [vrmAnalysis, setVrmAnalysis] = useState<any>(null);
  const [suggestedMouthShape, setSuggestedMouthShape] = useState<string | null>(null);
  
  
  
  // Language context
  const [languageContext, setLanguageContext] = useState<'chinese' | 'english'>(() => {
    // Load language preference from localStorage
    const savedLanguage = getLocalStorage('languageContext');
    if (savedLanguage) {
      return savedLanguage as 'chinese' | 'english';
    }
    
    // Set default language to English for first-time visitors
    const defaultLanguage = 'english';
    setLocalStorage('languageContext', defaultLanguage);
    console.log('Set default language to English for first-time visitor');
    return defaultLanguage;
  });
  
  // Voice selection state
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  
  // Mouse control states
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [mouseButton, setMouseButton] = useState<number>(0);
  const [lastMouseX, setLastMouseX] = useState<number>(0);
  const [lastMouseY, setLastMouseY] = useState<number>(0);
  
  // Text input and continuous talking states
  const [textInput, setTextInput] = useState<string>('');
  const [isContinuousTalking, setIsContinuousTalking] = useState(false);
  
  // Add state for tab management
  const [activeTab, setActiveTab] = useState<'vrm' | 'voice'>('vrm');
  
  // Mouse control popup state
  const [showMouseControlPopup, setShowMouseControlPopup] = useState(() => {
    // Check if user has seen the popup before
    const hasSeenPopup = getLocalStorage('mouseControlPopupSeen');
    return hasSeenPopup !== 'true';
  });
  
  // Ref for text input field
  const textInputRef = useRef<HTMLInputElement>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

  function setVrmMouthShape(shape: string, value: number): void {
    const vrm = vrmRef.current;
    if (!vrm) {
      return;
    }

    // VRM 1.x
    if ((vrm as any).expressionManager && typeof (vrm as any).expressionManager.setValue === 'function') {
      (vrm as any).expressionManager.setValue(shape, value);
    } else if ((vrm as any).blendShapeProxy && typeof (vrm as any).blendShapeProxy.setValue === 'function') {
      (vrm as any).blendShapeProxy.setValue(shape, value);
    }
  }

  // Refs for lip sync animation
  const animationFrameId = useRef<number | null>(null);
  const currentMouthValue = useRef(0);
  const targetMouthValue = useRef(0);
  const clock = useRef(new THREE.Clock());

  // Smoother lip sync with interpolation
  const speakText = useCallback((text: string) => {
    if (!synthesisRef.current) return;

    synthesisRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = languageContext === 'chinese' ? 'zh-CN' : 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    const animateLipSync = () => {
      const mouthOpenShape = suggestedMouthShape || 'aa';
      const isSpeaking = synthesisRef.current?.speaking;

      // Smoothly interpolate the current mouth value towards the target
      const lerpFactor = 0.3;
      currentMouthValue.current += (targetMouthValue.current - currentMouthValue.current) * lerpFactor;

      // Apply the interpolated value
      setVrmMouthShape(mouthOpenShape, currentMouthValue.current);

      if (isSpeaking) {
        // Fluctuate the target mouth value for more dynamic movement
        const time = clock.current.getElapsedTime();
        targetMouthValue.current = (Math.sin(time * 20) + 1) / 2 * 0.8 + 0.2;
        animationFrameId.current = requestAnimationFrame(animateLipSync);
      } else {
        // If speech has ended, animate the mouth closing
        targetMouthValue.current = 0;
        if (currentMouthValue.current > 0.01) {
          animationFrameId.current = requestAnimationFrame(animateLipSync);
        } else {
          setVrmMouthShape(mouthOpenShape, 0);
          currentMouthValue.current = 0;
          if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
          }
        }
      }
    };

    utterance.onstart = () => {
      clock.current.start();
      if (vrmAnalysis && vrmAnalysis.expressionNames) {
        vrmAnalysis.expressionNames.forEach((expr: string) => {
          if (expr.toLowerCase().includes('smile')) {
            setVrmMouthShape(expr, 0.0);
          }
        });
      }
      console.log('Speech started - initiating lip sync animation');
      animateLipSync();
    };

    utterance.onend = () => {
      clock.current.stop();
      console.log('Speech ended - closing mouth');
    };

    synthesisRef.current.speak(utterance);
  }, [languageContext, vrmAnalysis, selectedVoice, suggestedMouthShape]);

  const processWithAI = useCallback(async (userInput: string) => {
    setIsProcessing(true);
    
    try {
      console.log('Making API request to:', config.apiUrl);
      
      // Create simple prompt without language instruction (system instruction handles this)
      const simplePrompt = userInput;
      
      console.log('Request payload:', { prompt: simplePrompt, chatHistory: chatHistory.length, language: languageContext });
      
      // Use configuration for API URL
      const response = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          prompt: simplePrompt,
          chatHistory: chatHistory,
          language: languageContext
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
      
      // Speak the AI response (this is the only text that should be spoken)
      console.log('AI response will be spoken by avatar:', aiResponse);
      speakText(aiResponse);
      
      // Refocus text input after AI response
      setTimeout(() => {
        if (textInputRef.current) {
          textInputRef.current.focus();
          console.log('Refocused text input after AI response');
        }
      }, 100); // Small delay to ensure speech synthesis starts
      
    } catch (error) {
      console.error('Error processing with AI:', error);
      const errorMessage: ChatMessage = { 
        role: 'assistant', 
        content: `Sorry, an error occurred while processing your request: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
      setChatHistory(prev => [...prev, errorMessage]);
      
      // Also refocus on error
      setTimeout(() => {
        if (textInputRef.current) {
          textInputRef.current.focus();
          console.log('Refocused text input after error');
        }
      }, 100);
    } finally {
      setIsProcessing(false);
    }
  }, [speakText, languageContext, chatHistory]);

  // Initialize Three.js scene and VRM
  useEffect(() => {
    const mountElement = mountRef.current;
    if (!mountElement) return;

    // --- Scene, camera, renderer, lighting initialization (keep unchanged) ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // Store camera reference for later use
    cameraRef.current = camera;
    
    // Load camera state (will set defaults for first-time visitors)
    loadCameraState(camera);
    
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
      setIsLoading(true);
      
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
        
        // Load VRM rotation state (will set defaults for first-time visitors)
        loadVRMRotationState(vrm);
        
        vrm.scene.traverse((child: any) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        // Use VRM analyzer
        const analysis = analyzeVRM(vrm);
        setVrmAnalysis(analysis);
        
        // Find and suggest mouth shapes
        const suggested = suggestMouthShape(analysis);
        setSuggestedMouthShape(suggested);
        
        
        
        setIsLoading(false);

      } catch (error) {
        console.error(`Error loading VRM (${vrmFile}):`, error);
        setIsLoading(false);
      }
    };
    
    loadVRMModel(selectedVRM);
    
    // --- Animation loop and window resize (core modification here) ---

    const clock = new THREE.Clock();

    const animate = () => {
      requestAnimationFrame(animate);

      const delta = clock.getDelta();

      if (vrmRef.current) {
        vrmRef.current.update(delta);
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
        console.log('Recognized user input:', transcript);
        console.log('User input will NOT be spoken by the avatar');
        
        // Add user message to chat
        const userMessage: ChatMessage = { role: 'user', content: transcript };
        setChatHistory(prev => [...prev, userMessage]);
        
        // Process with AI (only AI response will be spoken)
        await processWithAI(transcript);
        
        // If in continuous talking mode, restart listening
        if (isContinuousTalking && recognitionRef.current) {
          setTimeout(() => {
            if (isContinuousTalking && !isProcessing) {
              recognitionRef.current?.start();
              setIsListening(true);
            }
          }, 1000); // Wait 1 second before restarting
        }
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
  }, [processWithAI, languageContext, isContinuousTalking, isProcessing]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load and set voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
      setSelectedVoice(null); // Set selected voice to null to make "Default Voice" the default
      console.log('Voices loaded. Default voice is set to "Default Voice".');
    };
    
    // Load voices immediately if available
    loadVoices();
    
    // Load voices when they become available
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [languageContext]);

  // Update voice selection when language changes
  useEffect(() => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      // Find the best voice for the current language
      const languagePrefix = languageContext === 'chinese' ? 'zh' : 'en';
      
      // Filter voices by language
      const languageVoices = voices.filter(voice => voice.lang.startsWith(languagePrefix));

      // Try to find a female voice
      let bestVoice = languageVoices.find(voice => 
        getVoiceGender(voice) === '[Female]' && voice.default
      );

      if (!bestVoice) {
        bestVoice = languageVoices.find(voice => 
          getVoiceGender(voice) === '[Female]'
        );
      }

      // If no female voice, fall back to default voice for the language
      if (!bestVoice) {
        bestVoice = languageVoices.find(voice => voice.default);
      }

      // If still no voice found, use any voice for the language
      if (!bestVoice) {
        bestVoice = languageVoices[0];
      }
      
      if (bestVoice) {
        setSelectedVoice(bestVoice);
        console.log(`Auto-selected voice for ${languageContext}:`, bestVoice.name, bestVoice.lang);
      }
    }
  }, [languageContext, availableVoices]);

  // Force re-render of voice selector when language changes
  useEffect(() => {
    console.log('Language changed to:', languageContext);
    console.log('Available voices for language:', availableVoices.filter(voice => {
      const languagePrefix = languageContext === 'chinese' ? 'zh' : 'en';
      return voice.lang.startsWith(languagePrefix);
    }).map(v => `${v.name} (${v.lang})`));
  }, [languageContext, availableVoices]);

  

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

  // Handle text input submission
  const handleTextSubmit = useCallback(async () => {
    if (textInput.trim() && !isProcessing) {
      console.log('Text input submitted:', textInput.trim());
      console.log('Text input will NOT be spoken by the avatar');
      
      // Add user message to chat
      const userMessage: ChatMessage = { role: 'user', content: textInput.trim() };
      setChatHistory(prev => [...prev, userMessage]);
      
      // Process with AI (only AI response will be spoken)
      await processWithAI(textInput.trim());
      
      // Clear text input
      setTextInput('');
    }
  }, [textInput, isProcessing, processWithAI]);

  // Handle continuous talking mode
  const toggleContinuousTalking = useCallback(() => {
    if (isContinuousTalking) {
      // Stop continuous mode
      setIsContinuousTalking(false);
      if (isListening) {
        stopListening();
      }
    } else {
      // Start continuous mode
      setIsContinuousTalking(true);
      if (!isListening && !isProcessing) {
        startListening();
      }
    }
  }, [isContinuousTalking, isListening, isProcessing, startListening, stopListening]);

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
    if (!isMouseDown) return;

    const deltaX = event.clientX - lastMouseX;
    const deltaY = event.clientY - lastMouseY;

    if (mouseButton === 0) { // Left button - pan camera
      if (cameraRef.current) {
        const camera = cameraRef.current;
        camera.position.x -= deltaX * 0.01;
        camera.position.y += deltaY * 0.01;
        
        // Save camera state to cookie after every movement
        saveCameraState(camera);
      }
    } else if (mouseButton === 1) { // Middle button - rotate avatar
      if (vrmRef.current) {
        const vrm = vrmRef.current;
        vrm.scene.rotation.y += deltaX * 0.01;
        vrm.scene.rotation.x += deltaY * 0.01;
        saveVRMRotationState(vrm); // Save rotation state
      }
    }

    setLastMouseX(event.clientX);
    setLastMouseY(event.clientY);
  }, [isMouseDown, mouseButton, lastMouseX, lastMouseY]);

  const handleWheel = useCallback((event: React.WheelEvent) => {
    if (!cameraRef.current) return;
    
    const camera = cameraRef.current;
    const zoomFactor = event.deltaY > 0 ? 1.1 : 0.9; // Reversed zoom direction
    camera.position.z *= zoomFactor;
    
    // Save camera state to cookie after every wheel scroll
    saveCameraState(camera);
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

  // Close mouse control popup and save preference
  const closeMouseControlPopup = useCallback(() => {
    setShowMouseControlPopup(false);
    setLocalStorage('mouseControlPopupSeen', 'true');
  }, []);

  const handleReset = () => {
    localStorage.removeItem('cameraState');
    localStorage.removeItem('vrmRotationState');
    window.location.reload();
  };

  // Render CORS test page
  if (currentRoute === 'cors-test') {
    return <CorsTest />;
  }

  const getVoiceGender = (voice: SpeechSynthesisVoice): string => {
    const name = voice.name.toLowerCase();
    const genderMap: { [key: string]: string } = {
      'google us english': '[Female]',
      'microsoft catherine - english (australia)': '[Female]',
      'microsoft hazel - english (united kingdom)': '[Female]',
      'microsoft susan - english (united kingdom)': '[Female]',
      'microsoft george - english (united kingdom)': '[Male]',
      'microsoft james - english (australia)': '[Male]',
      '國語（臺灣）': '[Female]',
      '普通话（中国大陆）': '[Female]',
      '粤語（香港）': '[Female]',
      'microsoft huihui - chinese (simplified, prc)': '[Female]',
      'microsoft kangkang - chinese (simplified, prc)': '[Female]',
      'microsoft yaoyao - chinese (simplified, prc)': '[Female]',
    };
    console.log('name:', name);
    for (const key in genderMap) {
      if (name.includes(key)) {
        return genderMap[key];
      }
    }

    if (name.includes('female') || name.includes('girl') || name.includes('woman')) {
      return '[female]';
    }
    if (name.includes('male') || name.includes('boy') || name.includes('man')) {
      return '[male]';
    }
    return '';
  };

  return (
    <div className="App">
      {isLoading && <Loader />}
      {/* Left Column - Controls and Statistics */}
      <div className="left-column">
        {/* Model selector */}
        <div className="model-selector">
          <label htmlFor="model-select">Model:</label>
          <select 
            id="model-select"
            value={selectedVRM}
            onChange={(e) => handleVRMChange(e.target.value)}
            className="model-select"
          >
            
            <option value="twitch-girl.vrm">Twitch Girl</option>
            <option value="Nahida.vrm">Nahida</option>
            <option value="star-rail.vrm">Star Rail</option>
            <option value="pee.vrm">Pee</option>
          </select>
          
          <label htmlFor="language-select">Language:</label>
          <select 
            id="language-select"
            value={languageContext}
            onChange={(e) => {
              const newLanguage = e.target.value as 'chinese' | 'english';
              setLanguageContext(newLanguage);
              setLocalStorage('languageContext', newLanguage);
              console.log(`Language changed to: ${newLanguage}, saved to localStorage`);
              
              // Update speech recognition language
              if (recognitionRef.current) {
                recognitionRef.current.lang = newLanguage === 'chinese' ? 'zh-CN' : 'en-US';
              }
            }}
            className="language-select"
          >
            <option value="chinese">中文</option>
            <option value="english">English</option>
          </select>
          
          <label htmlFor="voice-select">Voice:</label>
          <select 
            id="voice-select"
            value={selectedVoice?.name || ''}
            onChange={(e) => {
              const voiceName = e.target.value;
              const voice = availableVoices.find(v => v.name === voiceName);
              setSelectedVoice(voice || null);
              console.log('Voice selected:', voice?.name, voice?.lang);
            }}
            className="voice-select"
          >
            <option value="">[female] Default Voice</option>
            {availableVoices
              .filter(voice => {
                const languagePrefix = languageContext === 'chinese' ? 'zh' : 'en';
                return voice.lang.startsWith(languagePrefix);
              })
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {getVoiceGender(voice)} {voice.name} ({voice.lang})
                </option>
              ))
            }
          </select>
          
          <button onClick={handleReset} className="reset-button">Reset Avatar</button>
          
        </div>

        {/* Multi-tab box for VRM Analysis and Voice Information */}
        <div className="multi-tab-box">
          {/* Tab headers */}
          <div className="tab-headers">
            <button 
              className={`tab-header ${activeTab === 'vrm' ? 'active' : ''}`}
              onClick={() => setActiveTab('vrm')}
            >
              VRM Analysis
            </button>
            <button 
              className={`tab-header ${activeTab === 'voice' ? 'active' : ''}`}
              onClick={() => setActiveTab('voice')}
            >
              Voice Info
            </button>
          </div>

          {/* Tab content */}
          <div className="tab-content">
            {activeTab === 'vrm' && vrmAnalysis && (
              <div className="vrm-analysis">
                <h3>VRM Analysis Results</h3>
                <div className="analysis-content">
                  <p><strong>VRM Version:</strong> {vrmAnalysis.vrmVersion}</p>
                  <p><strong>Available Systems:</strong> {vrmAnalysis.availableSystems.join(', ')}</p>
                  <p><strong>Expression Names:</strong> {vrmAnalysis.expressionNames.join(', ') || 'None'}</p>
                  <p><strong>BlendShape Names:</strong> {vrmAnalysis.blendShapeNames.join(', ') || 'None'}</p>
                  {suggestedMouthShape && (
                    <p><strong>Suggested Mouth Shape:</strong> {suggestedMouthShape}</p>
                  )}
                  <p><strong>Mouth Shapes Found:</strong> {findMouthShapes(vrmAnalysis).join(', ') || 'None'}</p>
                  <p><strong>Current Mouth Shape:</strong> {suggestedMouthShape || 'aa'}</p>
                </div>
              </div>
            )}

            {activeTab === 'voice' && selectedVoice && (
              <div className="voice-info">
                <h3>Voice Information</h3>
                <div className="voice-content">
                  <p><strong>Selected Voice:</strong> {selectedVoice.name}</p>
                  <p><strong>Language:</strong> {selectedVoice.lang}</p>
                  <p><strong>Default:</strong> {selectedVoice.default ? 'Yes' : 'No'}</p>
                  <p><strong>Local Service:</strong> {selectedVoice.localService ? 'Yes' : 'No'}</p>
                  <p><strong>Total Available Voices:</strong> {availableVoices.length}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Center Column - 3D Scene */}
      <div className="center-column">
        <div 
          ref={mountRef} 
          style={{ width: '100%', height: '100%' }}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onWheel={handleWheel}
          onContextMenu={(e) => e.preventDefault()} // Prevent right-click context menu
        />

        {/* Voice control overlay - horizontal buttons */}
        <div className="voice-controls">
          {isProcessing && (
            <div className="processing-indicator">
              Processing...
            </div>
          )}
          
          {/* Text input for typing messages */}
          <input
            ref={textInputRef}
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleTextSubmit();
              }
            }}
            placeholder="Type your message here..."
            className="text-input"
            disabled={isProcessing}
          />
          
          {/* Button container for horizontal layout */}
          <div className="button-container">
            {/* Submit button for text input */}
            <button 
              className="submit-button"
              onClick={handleTextSubmit}
              disabled={!textInput.trim() || isProcessing}
            >
              Send
          </button>
          
            {/* Voice recording button */}
          <button 
              className={`voice-button ${isListening ? 'listening' : ''}`}
              onClick={isListening ? stopListening : startListening}
              disabled={isProcessing || isContinuousTalking}
            >
              {isListening ? 'Stop Talking' : 'Start Talking'}
          </button>
          
            {/* Continuous talking button */}
          <button 
              className={`continuous-button ${isContinuousTalking ? 'active' : ''}`}
              onClick={toggleContinuousTalking}
              disabled={isProcessing}
            >
              {isContinuousTalking ? 'Stop Continuous' : 'Continuous Talking'}
          </button>
          

          </div>
        </div>
      </div>

      {/* Right Column - Chat History */}
      <div className="right-column">
        <div className="chat-history">
          {chatHistory.map((message, index) => (
            <div key={index} className={`message ${message.role}`}>
              <strong>{message.role === 'user' ? 'You' : 'Assistant'}:</strong> {message.content}
            </div>
          ))}
        </div>
      </div>

      {/* Mouse Control Popup Overlay */}
      {showMouseControlPopup && (
        <div className="mouse-control-popup-overlay" onClick={closeMouseControlPopup}>
          <div className="mouse-control-popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h3>Mouse Controls</h3>
              <button className="popup-close" onClick={closeMouseControlPopup}>
                ✕
              </button>
            </div>
            <div className="popup-content">
              <div className="control-item">
                <div className="control-icon">🖱️</div>
                <div className="control-text">
                  <strong>Left Mouse Button:</strong> Pan camera
                </div>
              </div>
              <div className="control-item">
                <div className="control-icon">🖱️</div>
                <div className="control-text">
                  <strong>Middle Mouse Button:</strong> Rotate avatar
                </div>
              </div>
              <div className="control-item">
                <div className="control-icon">🖱️</div>
                <div className="control-text">
                  <strong>Mouse Wheel:</strong> Zoom in/out
                </div>
              </div>
            </div>
            <div className="popup-footer">
              <button className="popup-got-it" onClick={closeMouseControlPopup}>
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
