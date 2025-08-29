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

  // Check for expression manager
  if ((vrm as any).expressionManager) {
    analysis.hasExpressionManager = true;
    analysis.availableSystems.push('expressionManager');
    analysis.expressionNames = getAllExpressionNames(vrm);
  }

  // Check for blend shape proxy
  if ((vrm as any).blendShapeProxy) {
    analysis.hasBlendShapeProxy = true;
    analysis.availableSystems.push('blendShapeProxy');
    
    const blendShapeProxy = (vrm as any).blendShapeProxy;
    if (blendShapeProxy.getBlendShapeNames) {
      const names = blendShapeProxy.getBlendShapeNames();
      analysis.blendShapeNames = names || [];
    }
  }

  // Check VRM version and meta
  if ((vrm as any).meta) {
    analysis.metaInfo = (vrm as any).meta;
    if ((vrm as any).meta.version) {
      analysis.vrmVersion = (vrm as any).meta.version;
    }
  }
  
  return analysis;
}

export function findMouthShapes(analysis: VRMAnalysis): string[] {
  const mouthShapes: string[] = [];
  
  const mouthPatterns = [
    /^[AIUEO]$/i,
    /^[AIUEO]h$/i,
    /^vrc\.v_[aiueo]$/i,
    /^mouth/i,
    /^jaw/i,
    /^open/i,
    /^wide/i,
    /^part/i,
    /^close/i,
    /^shut/i,
    /^seal/i,
    /^lip/i,
    /^pucker/i,
    /^round/i,
    /^flat/i,
    /^narrow/i,
    /^relax/i,
    /^tight/i,
    /^smile/i,
    /^frown/i,
    /^grin/i,
    /^sad/i,
    /^happy/i,
    /^angry/i,
    /^surprised/i,
    /^shocked/i,
    /^aa$/i,
    /^ee$/i,
    /^ih$/i,
    /^oh$/i,
    /^ou$/i,
    /^ah$/i,
    /^eh$/i,
    /^uh$/i,
    /^vrc\./i,
    /^v_[aiueo]$/i,
    /mouth/i,
    /jaw/i,
    /lip/i,
  ];

  // Check expression names
  analysis.expressionNames.forEach(name => {
    if (mouthPatterns.some(pattern => pattern.test(name))) {
      mouthShapes.push(name);
    }
  });

  // Check blend shape names
  analysis.blendShapeNames.forEach(name => {
    if (mouthPatterns.some(pattern => pattern.test(name))) {
      mouthShapes.push(name);
    }
  });

  return Array.from(new Set(mouthShapes));
}

export function suggestMouthShape(analysis: VRMAnalysis): string | null {
  const mouthShapes = findMouthShapes(analysis);
  
  if (mouthShapes.length === 0) {
    console.log('No mouth shapes found in VRM model');
    return 'aa'; // fallback to aa
  }

  const priorityShapes = [
    'A', 'Ah', 'vrc.v_a', 'MouthOpen', 'JawOpen', 'aa', 'ah',
    'I', 'Ih', 'vrc.v_i', 'MouthWide', 'JawWide', 'ee', 'ih',
    'O', 'Oh', 'vrc.v_o', 'MouthRound', 'JawRound', 'oh', 'ou',
    'U', 'Uh', 'vrc.v_u', 'MouthPucker', 'JawPucker', 'uh',
    'E', 'Eh', 'vrc.v_e', 'MouthSmile', 'JawSmile', 'eh',
    'open', 'wide', 'part', 'close', 'tight', 'relax',
    'round', 'pucker', 'flat', 'narrow',
    'smile', 'frown', 'grin', 'sad', 'happy', 'angry',
    'mouth', 'jaw', 'lip'
  ];

  for (const priorityShape of priorityShapes) {
    const found = mouthShapes.find(shape => 
      shape.toLowerCase() === priorityShape.toLowerCase()
    );
    if (found) {
      console.log(`Suggested mouth shape: ${found}`);
      return found;
    }
  }

  console.log(`Using first available mouth shape: ${mouthShapes[0]}`);
  return mouthShapes[0];
} 

export function getAllExpressionNames(vrm: any): string[] {
  if (!(vrm as any).expressionManager) {
    return [];
  }
  
  const expressionManager = (vrm as any).expressionManager;
  
  if (expressionManager.expressionMap && typeof expressionManager.expressionMap === 'object') {
    const names = Object.keys(expressionManager.expressionMap);
    console.log('Found expressions via expressionMap:', names);
    return names;
  }
  
  console.log('Could not find expression names in expressionManager.');
  return [];
}