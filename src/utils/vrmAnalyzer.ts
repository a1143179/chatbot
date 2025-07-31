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
    
    // Use the comprehensive expression name getter
    const allExpressionNames = getAllExpressionNames(vrm);
    analysis.expressionNames = allExpressionNames;
    
    // Try to get expression names
    if (expressionManager.getExpressionNames) {
      const names = expressionManager.getExpressionNames();
      console.log('Expression names from getExpressionNames:', names);
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
        console.log('Extracted expression names from _expressions:', expressionNames);
      }
    }
    
    // Try to access mouthExpressionNames
    if (expressionManager.mouthExpressionNames) {
      console.log('mouthExpressionNames:', expressionManager.mouthExpressionNames);
    }
    
    // Try to access _expressionMap
    if (expressionManager._expressionMap) {
      console.log('_expressionMap keys:', Object.keys(expressionManager._expressionMap));
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
  
  // Enhanced mouth shape patterns for better lip-sync
  const mouthPatterns = [
    // Basic vowel shapes
    /^[AIUEO]$/i,           // Single vowels
    /^[AIUEO]h$/i,          // Vowels with 'h'
    /^vrc\.v_[aiueo]$/i,    // VRChat style
    
    // Mouth opening patterns
    /^mouth/i,               // Mouth-related
    /^jaw/i,                 // Jaw-related
    /^open/i,                // Open-related
    /^wide/i,                // Wide-related
    /^part/i,                // Part-related
    /^close/i,               // Close-related
    /^shut/i,                // Shut-related
    /^seal/i,                // Seal-related
    
    // Lip movement patterns
    /^lip/i,                 // Lip-related
    /^pucker/i,              // Pucker-related
    /^round/i,               // Round-related
    /^flat/i,                // Flat-related
    /^narrow/i,              // Narrow-related
    /^relax/i,               // Relax-related
    /^tight/i,               // Tight-related
    
    // Expression patterns
    /^smile/i,               // Smile-related
    /^frown/i,               // Frown-related
    /^grin/i,                // Grin-related
    /^sad/i,                 // Sad-related
    /^happy/i,               // Happy-related
    /^angry/i,               // Angry-related
    /^surprised/i,           // Surprised-related
    /^shocked/i,             // Shocked-related
    
    // Specific phoneme patterns
    /^aa$/i,                 // 'ah' sound
    /^ee$/i,                 // 'ee' sound
    /^ih$/i,                 // 'ih' sound
    /^oh$/i,                 // 'oh' sound
    /^ou$/i,                 // 'ou' sound
    /^ah$/i,                 // 'ah' sound
    /^eh$/i,                 // 'eh' sound
    /^uh$/i,                 // 'uh' sound
    
    // VRChat specific patterns
    /^vrc\./i,               // VRChat expressions
    /^v_[aiueo]$/i,         // VRChat vowel shapes
    
    // Generic mouth patterns
    /mouth/i,                // Any mouth reference
    /jaw/i,                  // Any jaw reference
    /lip/i,                  // Any lip reference
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
  
  // Enhanced priority order for mouth shapes with better categorization
  const priorityShapes = [
    // Primary vowel shapes (most common for lip-sync)
    'A', 'Ah', 'vrc.v_a', 'MouthOpen', 'JawOpen', 'aa', 'ah',
    'I', 'Ih', 'vrc.v_i', 'MouthWide', 'JawWide', 'ee', 'ih',
    'O', 'Oh', 'vrc.v_o', 'MouthRound', 'JawRound', 'oh', 'ou',
    'U', 'Uh', 'vrc.v_u', 'MouthPucker', 'JawPucker', 'uh',
    'E', 'Eh', 'vrc.v_e', 'MouthSmile', 'JawSmile', 'eh',
    
    // Secondary mouth shapes
    'open', 'wide', 'part', 'close', 'tight', 'relax',
    'round', 'pucker', 'flat', 'narrow',
    'smile', 'frown', 'grin', 'sad', 'happy', 'angry',
    
    // Generic mouth references
    'mouth', 'jaw', 'lip'
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

export function getAllExpressionNames(vrm: any): string[] {
  const allNames: string[] = [];
  
  if (!(vrm as any).expressionManager) {
    return allNames;
  }
  
  const expressionManager = (vrm as any).expressionManager;
  
  // Method 1: Try getExpressionNames method
  if (expressionManager.getExpressionNames && typeof expressionManager.getExpressionNames === 'function') {
    try {
      const names = expressionManager.getExpressionNames();
      if (names && Array.isArray(names)) {
        allNames.push(...names);
        console.log('Found expressions via getExpressionNames:', names);
      }
    } catch (error) {
      console.log('getExpressionNames method failed:', error);
    }
  }
  
  // Method 2: Extract from _expressions array
  if (expressionManager._expressions && Array.isArray(expressionManager._expressions)) {
    const expressionNames = expressionManager._expressions.map((expr: any) => {
      if (expr && expr.name) {
        return expr.name;
      }
      return null;
    }).filter((name: string | null) => name !== null);
    
    if (expressionNames.length > 0) {
      allNames.push(...expressionNames);
      console.log('Found expressions via _expressions:', expressionNames);
    }
  }
  
  // Method 3: Get mouthExpressionNames
  if (expressionManager.mouthExpressionNames && Array.isArray(expressionManager.mouthExpressionNames)) {
    allNames.push(...expressionManager.mouthExpressionNames);
    console.log('Found expressions via mouthExpressionNames:', expressionManager.mouthExpressionNames);
  }
  
  // Method 4: Get keys from _expressionMap
  if (expressionManager._expressionMap && typeof expressionManager._expressionMap === 'object') {
    const mapKeys = Object.keys(expressionManager._expressionMap);
    if (mapKeys.length > 0) {
      allNames.push(...mapKeys);
      console.log('Found expressions via _expressionMap keys:', mapKeys);
    }
  }
  
  // Method 5: Try to access expressions property
  if (expressionManager.expressions && Array.isArray(expressionManager.expressions)) {
    const expressionNames = expressionManager.expressions.map((expr: any) => {
      if (expr && expr.name) {
        return expr.name;
      }
      return null;
    }).filter((name: string | null) => name !== null);
    
    if (expressionNames.length > 0) {
      allNames.push(...expressionNames);
      console.log('Found expressions via expressions property:', expressionNames);
    }
  }
  
  // Remove duplicates and return
  const uniqueNames = Array.from(new Set(allNames));
  console.log('All unique expression names found:', uniqueNames);
  
  return uniqueNames;
} 