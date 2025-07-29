import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRM } from '@pixiv/three-vrm';
import './App.css';
import config from './config';

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
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  
  // Speech recognition and synthesis
  const [isListening, setIsListening] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
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

  const speakText = useCallback((text: string) => {
    if (!synthesisRef.current) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    // 启动嘴型同步
    utterance.onstart = () => {
      const mouthShapes = ['A', 'I', 'U', 'E', 'O'];
      lipSyncIntervalRef.current = setInterval(() => {
        const shape = mouthShapes[Math.floor(Math.random() * mouthShapes.length)];
        mouthShapes.forEach(s => setVrmMouthShape(s, s === shape ? 1 : 0));
      }, 100);
    };
    // 停止嘴型同步
    utterance.onend = () => {
      if (lipSyncIntervalRef.current) clearInterval(lipSyncIntervalRef.current);
      ['A', 'I', 'U', 'E', 'O'].forEach(s => setVrmMouthShape(s, 0));
    };

    synthesisRef.current.speak(utterance);
  }, []);

  const processWithAI = useCallback(async (userInput: string) => {
    setIsProcessing(true);
    
    try {
      // Use configuration for API URL
      const response = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: userInput
        }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
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
        content: 'Sorry, an error occurred while processing your request.' 
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
    loader.load(
      '/chatbot/models/cute-girl.vrm',
      (gltf: any) => {
        const vrm = gltf.userData.vrm;
        vrmRef.current = vrm;
        scene.add(vrm.scene);
        // Position the model to be centered and higher up
        vrm.scene.position.set(0, 1.5, 0); // Center the avatar and move up
        vrm.scene.rotation.y = Math.PI; // Face the camera
        vrm.scene.scale.setScalar(1.2); // Slightly larger for better visibility
        // Enable shadows
        vrm.scene.traverse((child: any) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        // Load and play vrma_07.vrma animation
        const animLoader = new GLTFLoader();
        animLoader.load('/models/vrma_07.vrma', (animGltf: any) => {
          if (animGltf.animations && animGltf.animations.length > 0) {
            console.log('vrma_07.vrma tracks:', animGltf.animations[0].tracks.map((t: any) => t.name));
            const mixer = new THREE.AnimationMixer(vrm.scene);
            mixer.clipAction(animGltf.animations[0]).play();
            mixerRef.current = mixer;
          } else {
            console.log('No animations found in vrma_07.vrma');
          }
        });
      },
      (progress: any) => {
        console.log('Loading progress:', (progress.loaded / progress.total) * 100, '%');
      },
      (error: any) => {
        console.error('Error loading VRM:', error);
      }
    );
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      const delta = 0.016; // 60fps
      if (vrmRef.current) {
        vrmRef.current.update(delta);
      }
      if (mixerRef.current) {
        mixerRef.current.update(delta);
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
        // Ensure avatar stays centered and higher up after resize
        if (vrmRef.current) {
          vrmRef.current.scene.position.set(0, 1.5, 0);
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
  }, []);

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
  }, [processWithAI]);

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

  return (
    <div className="App">
      <div ref={mountRef} style={{ width: '100vw', height: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }} />
      
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
