# VRM Expression Debugging Guide

## 基础检查步骤

### 1. 打开浏览器开发者工具
- 在浏览器中打开应用程序 (http://localhost:3000)
- 按 F12 或右键选择"检查"打开开发者工具
- 切换到"Console"标签页

### 2. 查看VRM模型加载时的口型名称
当VRM模型加载时，控制台会显示类似以下信息：
```
=== VRM Expression Debug ===
Available expressions: ['A', 'I', 'U', 'E', 'O', 'Blink', 'Joy', 'Angry', ...]
BlendShapeProxy available: {...}
=== End VRM Expression Debug ===
```

### 3. 使用测试按钮
- 点击页面底部的绿色"Test VRM Expressions"按钮
- 这会在控制台中打印当前VRM模型的所有可用表达式
- 同时会触发一个测试语音来观察口型同步效果

### 4. 识别正确的口型名称
在控制台输出中查找以下常见的口型名称：
- **标准VRoid Studio名称**: `A`, `I`, `U`, `E`, `O`
- **替代名称**: `Ah`, `Ih`, `Uh`, `Eh`, `Oh`
- **VRChat风格**: `vrc.v_a`, `vrc.v_i`, `vrc.v_u`, `vrc.v_e`, `vrc.v_o`
- **通用名称**: `MouthOpen`, `MouthWide`, `MouthSmile`

### 5. 更新代码中的口型名称
找到正确的口型名称后，在 `src/App.tsx` 的 `speakText` 函数中：
- 将 `setVrmMouthShape('A', 1.0)` 中的 `'A'` 替换为你的模型中实际的口型名称
- 例如：`setVrmMouthShape('vrc.v_a', 1.0)` 或 `setVrmMouthShape('MouthOpen', 1.0)`

## 当前实现的功能

### 简化的基于事件的同步
- 使用 `utterance.onboundary` 事件来检测单词边界
- 在单词边界时张开嘴巴 (`setVrmMouthShape('A', 1.0)`)
- 150毫秒后自动闭上嘴巴
- 语音结束时确保嘴巴闭合

### 调试功能
- 模型加载时自动打印所有可用表达式
- 测试按钮可以手动触发调试输出
- 控制台会显示详细的VRM表达式信息

## 常见问题

### Q: 控制台没有显示表达式信息？
A: 确保VRM模型正确加载，检查网络请求是否成功。

### Q: 口型没有反应？
A: 检查控制台中的表达式名称，确保使用的是正确的名称。

### Q: 口型同步不自然？
A: 可以调整 `onboundary` 事件中的延迟时间（当前150毫秒）。

## 下一步
1. 运行应用程序并查看控制台输出
2. 记录下你的VRM模型中实际的口型名称
3. 根据实际名称更新代码
4. 测试口型同步效果 