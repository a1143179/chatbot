import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRM, VRMHumanBoneName } from '@pixiv/three-vrm';
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
  
  // VRM selection only
  const [selectedVRM, setSelectedVRM] = useState<string>('cute-girl.vrm');
  
  // VRM analysis state
  const [vrmAnalysis, setVrmAnalysis] = useState<any>(null);
  const [suggestedMouthShape, setSuggestedMouthShape] = useState<string | null>(null);
  
  // Expression selection state
  const [selectedExpression, setSelectedExpression] = useState<string>('neutral');
  
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
  
  // First visit auto-message state
  const [hasSentFirstMessage, setHasSentFirstMessage] = useState(() => {
    // Check if first message has been sent
    const hasSent = getLocalStorage('firstMessageSent');
    return hasSent === 'true';
  });
  
  // Ref to track if first message is being sent
  const isSendingFirstMessage = useRef(false);
  
  // Ref for text input field
  const textInputRef = useRef<HTMLInputElement>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

  function setVrmMouthShape(shape: string, value: number): void {
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

  // Enhanced lip sync with advanced phoneme detection
  const speakText = useCallback((text: string) => {
    if (!synthesisRef.current) return;
    
    // Cancel any ongoing speech to avoid event conflicts
    synthesisRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = languageContext === 'chinese' ? 'zh-CN' : 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    
    // Set the selected voice if available
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    let mouthTimer: NodeJS.Timeout | null = null;
    let currentMouthShape: string | null = null;
    
    // Get available mouth shapes from VRM analysis
    const getAvailableMouthShapes = () => {
      if (vrmAnalysis && vrmAnalysis.expressionNames) {
        // Filter for mouth-related expressions
        const mouthShapes = vrmAnalysis.expressionNames.filter((expr: string) => 
          ['aa', 'ee', 'ih', 'oh', 'ou', 'a', 'e', 'i', 'o', 'u', 'ah', 'eh', 'ih', 'oh', 'uh',
           'open', 'wide', 'round', 'pucker', 'smile', 'frown', 'relax', 'tight', 'part', 'close',
           'jaw', 'lip', 'mouth'].includes(expr.toLowerCase())
        );
        return mouthShapes.length > 0 ? mouthShapes : ['aa']; // Fallback to 'aa'
      }
      return ['aa']; // Default fallback
    };
    
    const availableMouthShapes = getAvailableMouthShapes();
    
    // Enhanced phoneme to mouth shape mapping
    const phonemeToMouthShape = (phoneme: string, word: string): string => {
      const phonemeLower = phoneme.toLowerCase();
      const wordLower = word.toLowerCase();
      
      // Find the best matching mouth shape from available shapes
      const findBestMatch = (targetPatterns: string[]): string => {
        for (const pattern of targetPatterns) {
          const match = availableMouthShapes.find((shape: string) => 
            shape.toLowerCase().includes(pattern.toLowerCase())
          );
          if (match) {
            console.log(`Mouth shape selected: ${match} for phoneme: ${phonemeLower}, word: ${wordLower}`);
            return match;
          }
        }
        console.log(`No match found, using fallback: ${availableMouthShapes[0]} for phoneme: ${phonemeLower}`);
        return availableMouthShapes[0]; // Fallback
      };
      
      // Vowel mappings with more specific patterns
      if (['a', 'ɑ', 'æ', 'ʌ', 'ɑː', 'aː'].includes(phonemeLower)) {
        return findBestMatch(['aa', 'ah', 'a', 'open', 'wide', 'jaw']);
      }
      if (['e', 'ɛ', 'eɪ', 'iː', 'eː'].includes(phonemeLower)) {
        return findBestMatch(['ee', 'eh', 'e', 'wide', 'part']);
      }
      if (['i', 'ɪ', 'iː', 'iː'].includes(phonemeLower)) {
        return findBestMatch(['ih', 'i', 'ee', 'wide', 'part']);
      }
      if (['o', 'ɔ', 'oʊ', 'əʊ', 'oː'].includes(phonemeLower)) {
        return findBestMatch(['oh', 'o', 'round', 'pucker', 'close']);
      }
      if (['u', 'ʊ', 'uː', 'juː', 'uː'].includes(phonemeLower)) {
        return findBestMatch(['ou', 'uh', 'u', 'round', 'pucker', 'close']);
      }
      
      // Consonant mappings with more specific mouth shapes
      if (['p', 'b', 'm'].includes(phonemeLower)) {
        return findBestMatch(['close', 'tight', 'part', 'relax']); // Closed lips
      }
      if (['f', 'v'].includes(phonemeLower)) {
        return findBestMatch(['ih', 'part', 'relax', 'tight']); // Upper teeth on lower lip
      }
      if (['s', 'z', 'ʃ', 'ʒ'].includes(phonemeLower)) {
        return findBestMatch(['ee', 'wide', 'part', 'tight']); // Teeth together
      }
      if (['t', 'd', 'n', 'l'].includes(phonemeLower)) {
        return findBestMatch(['part', 'relax', 'wide', 'ih']); // Tongue to teeth
      }
      if (['k', 'g', 'ŋ'].includes(phonemeLower)) {
        return findBestMatch(['ah', 'open', 'wide', 'aa']); // Back of throat
      }
      if (['r'].includes(phonemeLower)) {
        return findBestMatch(['round', 'oh', 'pucker', 'close']); // Rounded lips
      }
      if (['w', 'j'].includes(phonemeLower)) {
        return findBestMatch(['round', 'wide', 'oh', 'ee']); // Semi-vowels
      }
      
      // Special cases for common word patterns
      if (wordLower.includes('smile') || wordLower.includes('happy') || wordLower.includes('laugh')) {
        return findBestMatch(['smile', 'wide', 'ee', 'part']);
      }
      if (wordLower.includes('frown') || wordLower.includes('sad') || wordLower.includes('cry')) {
        return findBestMatch(['frown', 'pucker', 'oh', 'close']);
      }
      if (wordLower.includes('kiss') || wordLower.includes('pucker')) {
        return findBestMatch(['pucker', 'round', 'oh', 'close']);
      }
      
      // Default to first available shape
      return availableMouthShapes[0];
    };
    
    // Enhanced phoneme detection with word context
    const detectPhoneme = (text: string, charIndex: number): { phoneme: string, word: string } => {
      const words = text.toLowerCase().split(/\s+/);
      let currentCharIndex = 0;
      let currentWord = '';
      
      // Find the word being spoken at the current character index
      for (const word of words) {
        if (currentCharIndex + word.length > charIndex) {
          currentWord = word;
          break;
        }
        currentCharIndex += word.length + 1; // +1 for space
      }
      
      if (!currentWord) {
        currentWord = words[words.length - 1] || 'a';
      }
      
      // Enhanced phoneme detection based on word structure
      const detectPhonemeFromWord = (word: string): string => {
        // Check for common vowel patterns
        if (word.includes('a') || word.includes('o')) {
          if (word.includes('ai') || word.includes('ay')) return 'e';
          if (word.includes('au') || word.includes('aw')) return 'o';
          return 'a';
        }
        if (word.includes('e') || word.includes('i')) {
          if (word.includes('ie') || word.includes('ei')) return 'e';
          if (word.includes('igh')) return 'i';
          return 'e';
        }
        if (word.includes('u')) {
          if (word.includes('ue') || word.includes('ui')) return 'u';
          return 'u';
        }
        if (word.includes('y')) {
          if (word.startsWith('y')) return 'i';
          return 'e';
        }
        
        // Check for consonant patterns that affect mouth shape
        if (word.includes('p') || word.includes('b') || word.includes('m')) return 'p';
        if (word.includes('f') || word.includes('v')) return 'f';
        if (word.includes('s') || word.includes('z')) return 's';
        if (word.includes('r')) return 'r';
        if (word.includes('w')) return 'w';
        
        // Default to 'a' for most consonants
        return 'a';
      };
      
      const phoneme = detectPhonemeFromWord(currentWord);
      return { phoneme, word: currentWord };
    };

    // Open mouth when speech starts
    utterance.onstart = () => {
      // Reset all expressions first to clear any lingering smile
      if (vrmAnalysis && vrmAnalysis.expressionNames) {
        vrmAnalysis.expressionNames.forEach((expr: string) => {
          if (expr.toLowerCase().includes('smile')) {
            setVrmMouthShape(expr, 0.0);
            console.log(`Reset smile expression: ${expr}`);
          }
        });
      }
      
      const { phoneme, word } = detectPhoneme(text, 0);
      const mouthShape = phonemeToMouthShape(phoneme, word);
      currentMouthShape = mouthShape;
      console.log('Speech started - opening mouth with shape:', mouthShape, 'for phoneme:', phoneme, 'word:', word);
      setVrmMouthShape(mouthShape, 1.0);
    };

    // Handle word boundaries for natural lip sync
    utterance.onboundary = (event) => {
      // Get the word being spoken
      const charIndex = event.charIndex;
      const { phoneme, word } = detectPhoneme(text, charIndex);
      const mouthShape = phonemeToMouthShape(phoneme, word);
      
      console.log('Word boundary detected - adjusting mouth with shape:', mouthShape, 'for word:', word, 'phoneme:', phoneme);
      
      // Clear any existing timer
      if (mouthTimer) {
        clearTimeout(mouthTimer);
      }
      
      // Only change mouth shape if it's different from current
      if (currentMouthShape !== mouthShape) {
        // Reset previous mouth shape
        if (currentMouthShape) {
          setVrmMouthShape(currentMouthShape, 0.0);
        }
        
        // Set new mouth shape
        currentMouthShape = mouthShape;
        setVrmMouthShape(mouthShape, 1.0);
      }
      
      // Close mouth after a short delay if no next word
      mouthTimer = setTimeout(() => {
        console.log('Closing mouth after delay');
        if (currentMouthShape) {
          setVrmMouthShape(currentMouthShape, 0.0);
          currentMouthShape = null;
        }
      }, 200);
    };

    // Close mouth when speech ends
    utterance.onend = () => {
      console.log('Speech ended - closing mouth');
      if (mouthTimer) {
        clearTimeout(mouthTimer);
      }
      // Reset to neutral
      if (currentMouthShape) {
        setVrmMouthShape(currentMouthShape, 0.0);
        currentMouthShape = null;
      }
    };

    synthesisRef.current.speak(utterance);
  }, [languageContext, vrmAnalysis, selectedVoice]);

  const processWithAI = useCallback(async (userInput: string) => {
    setIsProcessing(true);
    
    try {
      console.log('Making API request to:', config.apiUrl);
      
      // Create language-specific prompt
      const languagePrompt = languageContext === 'chinese' 
        ? `你是一个友好的AI助手。请始终用中文回复用户的问题。用户输入：${userInput}`
        : `You are a friendly AI assistant. Please always respond in English to user questions. User input: ${userInput}`;
      
      console.log('Request payload:', { prompt: languagePrompt });
      
      // Use configuration for API URL
      const response = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          prompt: languagePrompt
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
  }, [speakText, languageContext]);

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
        
        // DEBUG: Print all available expression names
        console.log('=== VRM Expression Debug ===');
        console.log('VRM object:', vrm);
        console.log('VRM type:', typeof vrm);
        console.log('VRM keys:', Object.keys(vrm));
        
        // Use VRM analyzer
        const analysis = analyzeVRM(vrm);
        setVrmAnalysis(analysis);
        
        // Find and suggest mouth shapes
        const mouthShapes = findMouthShapes(analysis);
        const suggested = suggestMouthShape(analysis);
        setSuggestedMouthShape(suggested);
        
        console.log('=== VRM Analysis Results ===');
        console.log('Analysis:', analysis);
        console.log('Mouth shapes found:', mouthShapes);
        console.log('Suggested mouth shape:', suggested);
        console.log('=== End VRM Analysis ===');
        
        if ((vrm as any).expressionManager) {
          console.log('ExpressionManager found:', (vrm as any).expressionManager);
          console.log('ExpressionManager type:', typeof (vrm as any).expressionManager);
          console.log('ExpressionManager keys:', Object.keys((vrm as any).expressionManager));
          
          const expressionNames = (vrm as any).expressionManager.getExpressionNames?.();
          console.log('Available expressions:', expressionNames);
          
          // Try to get expressions directly
          if ((vrm as any).expressionManager.expressions) {
            console.log('Direct expressions:', (vrm as any).expressionManager.expressions);
          }
          
          // Also check blendShapeProxy for older VRM versions
          if ((vrm as any).blendShapeProxy) {
            console.log('BlendShapeProxy available:', (vrm as any).blendShapeProxy);
            console.log('BlendShapeProxy type:', typeof (vrm as any).blendShapeProxy);
            console.log('BlendShapeProxy keys:', Object.keys((vrm as any).blendShapeProxy));
          }
        } else {
          console.log('No expressionManager found');
          
          // Check for alternative expression systems
          if ((vrm as any).blendShapeProxy) {
            console.log('BlendShapeProxy available:', (vrm as any).blendShapeProxy);
            console.log('BlendShapeProxy type:', typeof (vrm as any).blendShapeProxy);
            console.log('BlendShapeProxy keys:', Object.keys((vrm as any).blendShapeProxy));
          }
          
          // Check for any expression-related properties
          const vrmKeys = Object.keys(vrm);
          const expressionKeys = vrmKeys.filter(key => 
            key.toLowerCase().includes('expression') || 
            key.toLowerCase().includes('blend') || 
            key.toLowerCase().includes('shape')
          );
          console.log('Expression-related keys:', expressionKeys);
        }
        
        // Check VRM version and structure
        if ((vrm as any).meta) {
          console.log('VRM Meta:', (vrm as any).meta);
        }
        
        if ((vrm as any).humanoid) {
          console.log('VRM Humanoid available');
        }
        
        console.log('=== End VRM Expression Debug ===');
        
        // Immediately apply A-pose after VRM is loaded
        if (vrm.humanoid) {
          const setBoneRotation = (boneName: VRMHumanBoneName, x: number, y: number, z: number) => {
            const boneNode = vrm.humanoid.getNormalizedBoneNode(boneName);
            if (boneNode) {
              boneNode.rotation.set(
                THREE.MathUtils.degToRad(x),
                THREE.MathUtils.degToRad(y),
                THREE.MathUtils.degToRad(z)
              );
            }
          };

          // Apply complete A-pose immediately
          setBoneRotation(VRMHumanBoneName.LeftUpperArm, 0, 0, 60);   // A-pose: arms down at 60 degrees
          setBoneRotation(VRMHumanBoneName.RightUpperArm, 0, 0, -60); // A-pose: arms down at -60 degrees
          setBoneRotation(VRMHumanBoneName.LeftLowerArm, 0, 0, 15);   // Slight elbow bend
          setBoneRotation(VRMHumanBoneName.RightLowerArm, 0, 0, -15); // Slight elbow bend
          setBoneRotation(VRMHumanBoneName.LeftHand, 0, 0, 0);        // Natural hand position
          setBoneRotation(VRMHumanBoneName.RightHand, 0, 0, 0);       // Natural hand position
          setBoneRotation(VRMHumanBoneName.LeftShoulder, 0, 0, 0);    // Relaxed shoulders
          setBoneRotation(VRMHumanBoneName.RightShoulder, 0, 0, 0);   // Relaxed shoulders
          
          // Reset spring bones to the new pose
          if (vrm.springBoneManager) {
            vrm.springBoneManager.reset();
            console.log('Spring bones reset to A-pose after VRM load');
          }
          
          console.log('Complete A-pose applied immediately after VRM load');
        }
        
        console.log('Avatar loaded. Pose will be continuously enforced in the animation loop.');

      } catch (error) {
        console.error(`Error loading VRM (${vrmFile}):`, error);
      }
    };
    
    loadVRMModel(selectedVRM);
    
    // --- Animation loop and window resize (core modification here) ---
    const clock = new THREE.Clock();
    let frameCount = 0; // Track frames to ensure pose is applied consistently

    const animate = () => {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      frameCount++;
      
      if (vrmRef.current) {
        // Update VRM's animation and physics first
        vrmRef.current.update(delta);

        // **Core fix: Always force A-pose after update to prevent T-pose**
        // This ensures the pose is maintained even after page refresh or VRM updates
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

          // Force A-pose - ALWAYS apply this pose in every frame
          setBoneRotation(VRMHumanBoneName.LeftUpperArm, 0, 0, 60);   // A-pose: arms down at 60 degrees
          setBoneRotation(VRMHumanBoneName.RightUpperArm, 0, 0, -60); // A-pose: arms down at -60 degrees
          setBoneRotation(VRMHumanBoneName.LeftLowerArm, 0, 0, 15);   // Slight elbow bend
          setBoneRotation(VRMHumanBoneName.RightLowerArm, 0, 0, -15); // Slight elbow bend
          
          // Also set other body parts to ensure complete A-pose
          setBoneRotation(VRMHumanBoneName.LeftHand, 0, 0, 0);        // Natural hand position
          setBoneRotation(VRMHumanBoneName.RightHand, 0, 0, 0);       // Natural hand position
          setBoneRotation(VRMHumanBoneName.LeftShoulder, 0, 0, 0);    // Relaxed shoulders
          setBoneRotation(VRMHumanBoneName.RightShoulder, 0, 0, 0);   // Relaxed shoulders
          
          // Reset spring bones periodically to maintain pose
          if (frameCount % 60 === 0 && vrmRef.current.springBoneManager) { // Every 60 frames (about 1 second)
            vrmRef.current.springBoneManager.reset();
            console.log("Periodic spring bone reset to maintain A-pose");
          }
          
          // Log pose enforcement periodically
          if (frameCount % 300 === 0) { // Every 300 frames (about 5 seconds)
            console.log("A-pose enforced at frame:", frameCount);
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
    
    // Load available voices
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
      
      // Set default voice based on language context
      const defaultVoice = voices.find(voice => 
        voice.lang.startsWith(languageContext === 'chinese' ? 'zh' : 'en') && voice.default
      ) || voices.find(voice => 
        voice.lang.startsWith(languageContext === 'chinese' ? 'zh' : 'en')
      ) || voices[0];
      
      setSelectedVoice(defaultVoice);
    };
    
    // Load voices immediately if available
    loadVoices();
    
    // Load voices when they become available
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [processWithAI, languageContext, isContinuousTalking, isProcessing]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update voice selection when language changes
  useEffect(() => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      // Find the best voice for the current language
      const languagePrefix = languageContext === 'chinese' ? 'zh' : 'en';
      
      // First try to find a default voice for the language
      let bestVoice = voices.find(voice => 
        voice.lang.startsWith(languagePrefix) && voice.default
      );
      
      // If no default voice, find any voice for the language
      if (!bestVoice) {
        bestVoice = voices.find(voice => 
          voice.lang.startsWith(languagePrefix)
        );
      }
      
      // If still no voice found, use the first available voice
      if (!bestVoice && voices.length > 0) {
        bestVoice = voices[0];
      }
      
      if (bestVoice) {
        setSelectedVoice(bestVoice);
        console.log(`Auto-selected voice for ${languageContext}:`, bestVoice.name, bestVoice.lang);
      }
    }
  }, [languageContext, availableVoices]);

  // Auto-send first message for first-time visitors
  useEffect(() => {
    if (!hasSentFirstMessage && !isProcessing && !isSendingFirstMessage.current) {
      // Add a small delay to ensure component is fully initialized
      const timer = setTimeout(() => {
        if (!hasSentFirstMessage && !isProcessing && !isSendingFirstMessage.current) {
          isSendingFirstMessage.current = true; // Mark as sending
          
          const firstMessage = "Please respond in English from now on.";
          
          // Mark as sent immediately to prevent duplicate sends
          setHasSentFirstMessage(true);
          setLocalStorage('firstMessageSent', 'true');
          
          // Add user message to chat
          const userMessage: ChatMessage = { role: 'user', content: firstMessage };
          setChatHistory(prev => [...prev, userMessage]);
          
          // Process with AI
          processWithAI(firstMessage);
          
          console.log('Auto-sent first message for first-time visitor');
        }
      }, 1000); // 1 second delay
      
      return () => clearTimeout(timer);
    }
  }, [hasSentFirstMessage, isProcessing, processWithAI]);

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

  // Handle expression change
  const handleExpressionChange = useCallback((expression: string) => {
    setSelectedExpression(expression);
    
    // Apply the selected expression to the VRM
    if (vrmRef.current) {
      // Reset all expressions first
      if (vrmAnalysis && vrmAnalysis.expressionNames) {
        vrmAnalysis.expressionNames.forEach((expr: string) => {
          setVrmMouthShape(expr, 0.0);
        });
      }
      
      // Apply the selected expression
      if (expression !== 'neutral') {
        setVrmMouthShape(expression, 1.0);
        console.log(`Applied expression: ${expression}`);
      }
    }
  }, [vrmAnalysis]);

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

  // Render CORS test page
  if (currentRoute === 'cors-test') {
    return <CorsTest />;
  }

  return (
    <div className="App">
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
            <option value="cute-girl.vrm">Cute Girl</option>
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
              const voice = availableVoices.find(v => v.name === e.target.value);
              setSelectedVoice(voice || null);
            }}
            className="voice-select"
          >
            <option value="">Default Voice</option>
            {availableVoices
              .filter(voice => {
                const languagePrefix = languageContext === 'chinese' ? 'zh' : 'en';
                return voice.lang.startsWith(languagePrefix);
              })
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))
            }
          </select>
          
          <label htmlFor="expression-select">Expression:</label>
          <select 
            id="expression-select"
            value={selectedExpression}
            onChange={(e) => handleExpressionChange(e.target.value)}
            className="expression-select"
          >
            <option value="neutral">Neutral</option>
            {vrmAnalysis && vrmAnalysis.expressionNames && 
              vrmAnalysis.expressionNames
                .filter((expr: string) => expr !== 'neutral')
                .map((expr: string) => (
                  <option key={expr} value={expr}>{expr}</option>
                ))
            }
          </select>
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
                  <p><strong>Current Mouth Shape:</strong> {suggestedMouthShape ? suggestedMouthShape.replace(/^(Expression|BlendShape):\s*/, '') : 'aa'}</p>
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
