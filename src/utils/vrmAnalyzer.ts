// VRM Analyzer Utility
// This utility helps analyze VRM models and their expression systems

export interface VRMAnalysis {
  hasExpressionManager: boolean;
  hasBlendShapeProxy: boolean;
  expressionNames: string[];
  blendShapeNames: string[];
  vrmVersion: string;
  metaInfo: any;
  availableSystems: string[];
}

export function analyzeVRM(vrm: any): VRMAnalysis {
  const analysis: VRMAnalysis = {
    hasExpressionManager: false,
    hasBlendShapeProxy: false,
    expressionNames: [],
    blendShapeNames: [],
    vrmVersion: 'unknown',
    metaInfo: null,
    availableSystems: []
  };

  console.log('=== VRM Analysis ===');
  console.log('VRM object:', vrm);
  console.log('VRM type:', typeof vrm);
  console.log('VRM keys:', Object.keys(vrm));

  // Check for expression manager
  if ((vrm as any).expressionManager) {
    analysis.hasExpressionManager = true;
    analysis.availableSystems.push('expressionManager');
    
    const expressionManager = (vrm as any).expressionManager;
    console.log('ExpressionManager found:', expressionManager);
    console.log('ExpressionManager keys:', Object.keys(expressionManager));
    
    // Try to get expression names
    if (expressionManager.getExpressionNames) {
      const names = expressionManager.getExpressionNames();
      analysis.expressionNames = names || [];
      console.log('Expression names:', names);
    }
    
    // Try direct access to expressions
    if (expressionManager.expressions) {
      console.log('Direct expressions:', expressionManager.expressions);
    }
    
    // Try to access _expressions array
    if (expressionManager._expressions) {
      console.log('_expressions array:', expressionManager._expressions);
      console.log('_expressions length:', expressionManager._expressions.length);
      
      // Extract expression names from _expressions
      const expressionNames = expressionManager._expressions.map((expr: any) => {
        if (expr && expr.name) {
          return expr.name;
        }
        return null;
      }).filter((name: string | null) => name !== null);
      
      if (expressionNames.length > 0) {
        analysis.expressionNames = expressionNames;
        console.log('Extracted expression names from _expressions:', expressionNames);
      }
    }
    
    // Try to access mouthExpressionNames
    if (expressionManager.mouthExpressionNames) {
      console.log('mouthExpressionNames:', expressionManager.mouthExpressionNames);
      analysis.expressionNames = [...analysis.expressionNames, ...expressionManager.mouthExpressionNames];
    }
    
    // Try to access _expressionMap
    if (expressionManager._expressionMap) {
      console.log('_expressionMap keys:', Object.keys(expressionManager._expressionMap));
      const mapKeys = Object.keys(expressionManager._expressionMap);
      if (mapKeys.length > 0) {
        analysis.expressionNames = [...analysis.expressionNames, ...mapKeys];
        console.log('Added _expressionMap keys to expression names');
      }
    }
  }

  // Check for blend shape proxy
  if ((vrm as any).blendShapeProxy) {
    analysis.hasBlendShapeProxy = true;
    analysis.availableSystems.push('blendShapeProxy');
    
    const blendShapeProxy = (vrm as any).blendShapeProxy;
    console.log('BlendShapeProxy found:', blendShapeProxy);
    console.log('BlendShapeProxy keys:', Object.keys(blendShapeProxy));
    
    // Try to get blend shape names
    if (blendShapeProxy.getBlendShapeNames) {
      const names = blendShapeProxy.getBlendShapeNames();
      analysis.blendShapeNames = names || [];
      console.log('BlendShape names:', names);
    }
  }

  // Check VRM version and meta
  if ((vrm as any).meta) {
    analysis.metaInfo = (vrm as any).meta;
    console.log('VRM Meta:', (vrm as any).meta);
    
    if ((vrm as any).meta.version) {
      analysis.vrmVersion = (vrm as any).meta.version;
    }
  }

  // Check for any expression-related properties
  const vrmKeys = Object.keys(vrm);
  const expressionKeys = vrmKeys.filter(key => 
    key.toLowerCase().includes('expression') || 
    key.toLowerCase().includes('blend') || 
    key.toLowerCase().includes('shape')
  );
  console.log('Expression-related keys:', expressionKeys);

  console.log('=== Analysis Complete ===');
  console.log('Analysis result:', analysis);
  
  return analysis;
}

export function findMouthShapes(analysis: VRMAnalysis): string[] {
  const mouthShapes: string[] = [];
  
  // Common mouth shape patterns
  const mouthPatterns = [
    /^[AIUEO]$/i,           // Single vowels
    /^[AIUEO]h$/i,          // Vowels with 'h'
    /^vrc\.v_[aiueo]$/i,    // VRChat style
    /^mouth/i,               // Mouth-related
    /^jaw/i,                 // Jaw-related
    /^lip/i,                 // Lip-related
    /^open/i,                // Open-related
    /^wide/i,                // Wide-related
    /^smile/i,               // Smile-related
    /^frown/i,               // Frown-related
    /^pucker/i,              // Pucker-related
    /^round/i,               // Round-related
    /^flat/i,                // Flat-related
    /^narrow/i,              // Narrow-related
    /^relax/i,               // Relax-related
    /^tight/i,               // Tight-related
    /^part/i,                // Part-related
    /^close/i,               // Close-related
    /^shut/i,                // Shut-related
    /^seal/i,                // Seal-related
  ];

  // Check expression names
  analysis.expressionNames.forEach(name => {
    if (mouthPatterns.some(pattern => pattern.test(name))) {
      mouthShapes.push(`Expression: ${name}`);
    }
  });

  // Check blend shape names
  analysis.blendShapeNames.forEach(name => {
    if (mouthPatterns.some(pattern => pattern.test(name))) {
      mouthShapes.push(`BlendShape: ${name}`);
    }
  });

  return mouthShapes;
}

export function suggestMouthShape(analysis: VRMAnalysis): string | null {
  const mouthShapes = findMouthShapes(analysis);
  
  if (mouthShapes.length === 0) {
    console.log('No mouth shapes found in VRM model');
    return null;
  }

  console.log('Found mouth shapes:', mouthShapes);
  
  // Priority order for mouth shapes
  const priorityShapes = [
    'A', 'Ah', 'vrc.v_a', 'MouthOpen', 'JawOpen',
    'I', 'Ih', 'vrc.v_i', 'MouthWide', 'JawWide',
    'O', 'Oh', 'vrc.v_o', 'MouthRound', 'JawRound',
    'U', 'Uh', 'vrc.v_u', 'MouthPucker', 'JawPucker',
    'E', 'Eh', 'vrc.v_e', 'MouthSmile', 'JawSmile'
  ];

  // Find the first priority shape that exists
  for (const priorityShape of priorityShapes) {
    const found = mouthShapes.find(shape => 
      shape.toLowerCase().includes(priorityShape.toLowerCase())
    );
    if (found) {
      console.log(`Suggested mouth shape: ${found}`);
      return found;
    }
  }

  // If no priority shape found, return the first one
  console.log(`Using first available mouth shape: ${mouthShapes[0]}`);
  return mouthShapes[0];
} 