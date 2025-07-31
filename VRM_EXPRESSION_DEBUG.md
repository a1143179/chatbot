# VRM Expression Debugging Guide

## 基础检查步骤

### 1. 打开浏览器开发者工具
- 在浏览器中打开应用程序 (http://localhost:3000)
- 按 F12 或右键选择"检查"打开开发者工具
- 切换到"Console"标签页

### 2. 查看VRM模型加载时的口型名称
当VRM模型加载时，控制台会显示详细的VRM分析信息：
```
=== VRM Analysis ===
VRM object: {...}
VRM keys: ['scene', 'humanoid', 'expressionManager', ...]
ExpressionManager found: {...}
Expression names: ['A', 'I', 'U', 'E', 'O', 'Blink', ...]
=== Analysis Complete ===
Analysis result: {...}
Mouth shapes found: ['Expression: A', 'Expression: I', ...]
Suggested mouth shape: Expression: A
```

### 3. 使用UI界面查看分析结果
- 页面左上角会显示"VRM Analysis Results"面板
- 显示VRM版本、可用系统、表达式名称等信息
- 自动推荐最佳的口型名称

### 4. 使用测试按钮
- 点击页面底部的绿色"Test VRM Expressions"按钮
- 这会在控制台中打印当前VRM模型的详细分析
- 自动测试推荐的口型形状
- 同时会触发一个测试语音来观察口型同步效果

### 5. 识别正确的口型名称
在控制台输出或UI面板中查找以下常见的口型名称：
- **标准VRoid Studio名称**: `A`, `I`, `U`, `E`, `O`
- **替代名称**: `Ah`, `Ih`, `Uh`, `Eh`, `Oh`
- **VRChat风格**: `vrc.v_a`, `vrc.v_i`, `vrc.v_u`, `vrc.v_e`, `vrc.v_o`
- **通用名称**: `MouthOpen`, `MouthWide`, `MouthSmile`

### 6. 更新代码中的口型名称
找到正确的口型名称后，在 `src/App.tsx` 的 `speakText` 函数中：
- 将 `setVrmMouthShape('A', 1.0)` 中的 `'A'` 替换为你的模型中实际的口型名称
- 例如：`setVrmMouthShape('vrc.v_a', 1.0)` 或 `setVrmMouthShape('MouthOpen', 1.0)`

## 当前实现的功能

### 自动VRM分析
- 模型加载时自动分析VRM结构
- 检测可用的表达式系统和BlendShape系统
- 自动识别和推荐最佳的口型名称
- 在UI界面显示详细的分析结果

### 简化的基于事件的同步
- 使用 `utterance.onboundary` 事件来检测单词边界
- 在单词边界时张开嘴巴 (`setVrmMouthShape('A', 1.0)`)
- 150毫秒后自动闭上嘴巴
- 语音结束时确保嘴巴闭合

### 智能口型检测
- 自动扫描所有可用的表达式和BlendShape名称
- 使用模式匹配识别口型相关的形状
- 按优先级推荐最佳的口型名称
- 支持多种VRM格式和命名约定

### 调试功能
- 模型加载时自动打印所有可用表达式
- 测试按钮可以手动触发调试输出
- UI界面实时显示分析结果
- 控制台会显示详细的VRM表达式信息

## 常见问题

### Q: 控制台没有显示表达式信息？
A: 确保VRM模型正确加载，检查网络请求是否成功。新的分析工具会提供更详细的诊断信息。

### Q: 口型没有反应？
A: 检查UI面板中的"Suggested Mouth Shape"或控制台输出，确保使用的是正确的名称。

### Q: 口型同步不自然？
A: 可以调整 `onboundary` 事件中的延迟时间（当前150毫秒）。

### Q: 分析结果显示"None"？
A: 这表示VRM模型可能没有配置表达式系统，或者使用了不同的命名约定。检查控制台的详细输出来了解模型结构。

## 下一步
1. 运行应用程序并查看UI面板中的分析结果
2. 记录下你的VRM模型中实际的口型名称
3. 根据实际名称更新代码
4. 测试口型同步效果
5. 如果自动检测失败，手动检查控制台输出中的详细信息 