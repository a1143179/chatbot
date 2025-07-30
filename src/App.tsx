import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRM } from '@pixiv/three-vrm';
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
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const animationClipsRef = useRef<THREE.AnimationClip[]>([]);
  
  // Speech recognition and synthesis
  const [isListening, setIsListening] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // VRM and VRMA selection
  const [selectedVRM, setSelectedVRM] = useState<string>('cute-girl.vrm');
  const [selectedVRMA, setSelectedVRMA] = useState<string>('VRMA_01.vrma');
  
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

  // Load VRMA animation files
  const loadVRMAAnimations = useCallback(async (vrmaFile: string) => {
    const loader = new GLTFLoader();
    const clips: THREE.AnimationClip[] = [];

    try {
      console.log(`Loading VRMA file: ./models/vrma/${vrmaFile}`);
      const gltf = await new Promise<any>((resolve, reject) => {
        loader.load(`./models/vrma/${vrmaFile}`, resolve, undefined, reject);
      });
      
      console.log('VRMA loaded successfully:', gltf);
      console.log('VRMA animations:', gltf.animations);
      
      if (gltf.animations && gltf.animations.length > 0) {
        clips.push(...gltf.animations);
        console.log(`Loaded animation from ${vrmaFile}:`, gltf.animations.length, 'clips');
        
        // Log animation details
        gltf.animations.forEach((clip: any, index: number) => {
          console.log(`Animation ${index}:`, {
            name: clip.name,
            duration: clip.duration,
            tracks: clip.tracks.length
          });
        });
      } else {
        console.warn(`No animations found in ${vrmaFile}`);
      }
    } catch (error) {
      console.error(`Failed to load animation from ${vrmaFile}:`, error);
    }

    animationClipsRef.current = clips;
    console.log('Total animation clips loaded:', clips.length);
  }, []);

  // Play animation clip
  const playAnimation = useCallback((clipIndex: number) => {
    const vrm = vrmRef.current;
    const clips = animationClipsRef.current;
    
    console.log('playAnimation called with:', { clipIndex, vrm: !!vrm, clips: !!clips, clipsLength: clips?.length });
    
    if (!vrm) {
      console.warn('Cannot play animation: VRM not available');
      return;
    }
    
    if (!clips || clips.length === 0) {
      console.warn('Cannot play animation: No animation clips available');
      return;
    }
    
    if (clipIndex >= clips.length) {
      console.warn(`Cannot play animation: clipIndex ${clipIndex} >= clips.length ${clips.length}`);
      return;
    }

    // Stop current animation
    if (mixerRef.current) {
      console.log('Stopping current animation');
      mixerRef.current.stopAllAction();
    }

    // Create new mixer and play animation
    console.log('Creating new animation mixer');
    const mixer = new THREE.AnimationMixer(vrm.scene);
    mixerRef.current = mixer;
    
    const clip = clips[clipIndex];
    console.log('Animation clip details:', {
      name: clip.name,
      duration: clip.duration,
      tracks: clip.tracks.length
    });
    
    const action = mixer.clipAction(clip);
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.play();

    console.log(`Playing animation clip ${clipIndex}:`, clip.name);
    console.log('Action details:', {
      isRunning: action.isRunning(),
      time: action.time,
      duration: action.getClip().duration
    });
  }, []);



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
      // Play animation if available
      console.log('Speech started, checking for animations...');
      console.log('Available animation clips:', animationClipsRef.current.length);
      if (animationClipsRef.current.length > 0) {
        const randomClipIndex = Math.floor(Math.random() * animationClipsRef.current.length);
        console.log(`Playing random animation clip: ${randomClipIndex}`);
        playAnimation(randomClipIndex);
      } else {
        console.log('No animation clips available');
      }
    };
    
    // Stop lip sync when speech ends
    utterance.onend = () => {
      stopLipSync();
      // Stop any playing animation
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
      }
    };

    synthesisRef.current.speak(utterance);
  }, [startLipSync, stopLipSync, playAnimation]);

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

  // useEffect(() => {
  //   if (!mountRef.current) return;

  //   // Initialize Three.js scene
  //   const scene = new THREE.Scene();
  //   sceneRef.current = scene;
  //   scene.background = new THREE.Color(0xf0f0f0);

  //   // Setup camera
  //   const camera = new THREE.PerspectiveCamera(
  //     75,
  //     window.innerWidth / window.innerHeight,
  //     0.1,
  //     1000
  //   );
  //   cameraRef.current = camera;
  //   camera.position.set(0, 1.5, 3);

  //   // Setup renderer
  //   const renderer = new THREE.WebGLRenderer({ antialias: true });
  //   rendererRef.current = renderer;
  //   renderer.setSize(window.innerWidth, window.innerHeight);
  //   renderer.setPixelRatio(window.devicePixelRatio);
  //   renderer.shadowMap.enabled = true;
  //   renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  //   mountRef.current.appendChild(renderer.domElement);

  //   // Add lights
  //   const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  //   scene.add(ambientLight);

  //   const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  //   directionalLight.position.set(1, 1, 1);
  //   directionalLight.castShadow = true;
  //   scene.add(directionalLight);

  //   // Load VRM model
  //   const loader = new GLTFLoader();
  //   const plugin = new VRMLoaderPlugin();
  //   loader.register((parser: any) => plugin.createPlugin(parser));

  //   loader.load(
  //     '/models/cute-girl.vrm',
  //     (gltf: any) => {
  //       const vrm = plugin.createVRMInstance(gltf);
  //       vrmRef.current = vrm;
  //       scene.add(vrm.scene);

  //       // Position the model
  //       vrm.scene.position.set(0, 0, 0);
  //       vrm.scene.scale.setScalar(1);

  //       // Enable shadows
  //       vrm.scene.traverse((child: any) => {
  //         if (child instanceof THREE.Mesh) {
  //           child.castShadow = true;
  //           child.receiveShadow = true;
  //         }
  //       });

  //       // Animation loop
  //       const animate = () => {
  //         requestAnimationFrame(animate);
          
  //         // Update VRM
  //         const delta = 0.016; // 60fps
  //         vrm.update(delta);
          
  //         renderer.render(scene, camera);
  //       };
  //       animate();
  //     },
  //     (progress: any) => {
  //       console.log('Loading progress:', (progress.loaded / progress.total) * 100, '%');
  //     },
  //     (error: any) => {
  //       console.error('Error loading VRM:', error);
  //     }
  //   );

  //   // Handle window resize
  //   const handleResize = () => {
  //     if (camera && renderer) {
  //       camera.aspect = window.innerWidth / window.innerHeight;
  //       camera.updateProjectionMatrix();
  //       renderer.setSize(window.innerWidth, window.innerHeight);
  //     }
  //   };
  //   window.addEventListener('resize', handleResize);

  //   // Cleanup
  //   return () => {
  //     window.removeEventListener('resize', handleResize);
  //     if (mountRef.current && renderer.domElement) {
  //       mountRef.current.removeChild(renderer.domElement);
  //     }
  //     renderer.dispose();
  //   };
  // }, []);

  // Initialize speech recognition
  useEffect(() => {
    const mountElement = mountRef.current;
    if (!mountElement) return;
    
    // Initialize Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    const camera = new THREE.PerspectiveCamera(
      35,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.6, 4); // Position camera to center the avatar
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountElement.appendChild(renderer.domElement);
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    // Load VRM model (official latest API)
    const loader = new GLTFLoader();
    loader.register((parser: any) => new VRMLoaderPlugin(parser));
    
    // Load VRM model function
    const loadVRMModel = async (vrmFile: string) => {
      console.log(`Loading VRM file: ${vrmFile}`);
      
      // Remove existing VRM from scene
      if (vrmRef.current) {
        scene.remove(vrmRef.current.scene);
      }
      
      // Add cache-busting parameter
      const url = `./models/vrm/${vrmFile}?t=${Date.now()}`;
      
      try {
        const gltf = await new Promise<any>((resolve, reject) => {
          loader.load(url, resolve, undefined, reject);
        });
        
        console.log('VRM loaded successfully:', vrmFile);
        const vrm = gltf.userData.vrm;
        vrmRef.current = vrm;
        scene.add(vrm.scene);
        // Position the model to be centered and moved up 50px from previous position
        vrm.scene.position.set(0, 0.75, 0); // Center the avatar and move up 50px from 0.5 to 0.75
        vrm.scene.rotation.y = Math.PI; // Face the camera
        vrm.scene.scale.setScalar(1.2); // Slightly larger for better visibility
        // Enable shadows
        vrm.scene.traverse((child: any) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        console.log('Avatar loaded successfully');
        
        // Load VRMA animations after VRM is loaded
        await loadVRMAAnimations(selectedVRMA);
      } catch (error) {
        console.error(`Error loading VRM (${vrmFile}):`, error);
      }
    };
    
    // Load initial VRM model
    loadVRMModel(selectedVRM);
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      const delta = 0.016; // 60fps
      if (vrmRef.current) {
        vrmRef.current.update(delta);
      }
      if (mixerRef.current) {
        mixerRef.current.update(delta);
        // Debug mixer state
        const mixer = mixerRef.current as any;
        if (mixer._actions && mixer._actions.length > 0) {
          const action = mixer._actions[0];
          if (action && action.isRunning()) {
            console.log('Animation is running, time:', action.time);
          }
        }
      }
      renderer.render(scene, camera);
    };
    animate();
    // Handle window resize
    const handleResize = () => {
      if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        // Ensure avatar stays centered and at correct height after resize
        if (vrmRef.current) {
          vrmRef.current.scene.position.set(0, 0.75, 0);
        }
      }
    };
    window.addEventListener('resize', handleResize);
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountElement && renderer.domElement) {
        mountElement.removeChild(renderer.domElement);
      }
             renderer.dispose();
     };
       }, [selectedVRM, selectedVRMA, loadVRMAAnimations]);



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

  // Handle VRMA animation change
  const handleVRMAChange = useCallback(async (vrmaFile: string) => {
    setSelectedVRMA(vrmaFile);
    await loadVRMAAnimations(vrmaFile);
  }, [loadVRMAAnimations]);

  // Test animation function
  const testAnimation = useCallback(() => {
    console.log('Testing animation...');
    console.log('Current VRM:', vrmRef.current);
    console.log('Current animation clips:', animationClipsRef.current);
    console.log('Current mixer:', mixerRef.current);
    
    if (animationClipsRef.current.length > 0) {
      console.log('Attempting to play animation 0...');
      playAnimation(0);
    } else {
      console.log('No animations available for testing');
    }
  }, [playAnimation]);

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
      <div ref={mountRef} style={{ width: '100vw', height: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }} />
      
             {/* Model selection controls */}
       <div className="model-controls">
         <div className="control-group">
           <label htmlFor="vrm-select">VRM Model:</label>
           <select 
             id="vrm-select"
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
         
                   <div className="control-group">
            <label htmlFor="vrma-select">VRMA Animation:</label>
            <select 
              id="vrma-select"
              value={selectedVRMA}
              onChange={(e) => handleVRMAChange(e.target.value)}
              className="model-select"
            >
              <option value="VRMA_01.vrma">Animation 01</option>
              <option value="VRMA_02.vrma">Animation 02</option>
              <option value="VRMA_03.vrma">Animation 03</option>
              <option value="VRMA_04.vrma">Animation 04</option>
              <option value="VRMA_05.vrma">Animation 05</option>
              <option value="VRMA_06.vrma">Animation 06</option>
              <option value="VRMA_07.vrma">Animation 07</option>
            </select>
            <button 
              onClick={testAnimation}
              className="test-animation-btn"
              style={{ marginTop: '5px', padding: '5px 10px', fontSize: '12px' }}
            >
              Test Animation
            </button>
          </div>
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
