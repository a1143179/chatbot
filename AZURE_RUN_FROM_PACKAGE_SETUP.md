# Azure Functions "Run from Package" 部署设置指南

## 概述

"Run from Package" 模式是 Azure Functions 的现代部署方式，它能从根本上杜绝文件不一致或损坏的问题。应用直接从部署的 zip 包运行，而不是解压到 wwwroot。

## 已完成的代码修改

✅ **已移除 function.json 中的 scriptFile 配置**
- `api/health/function.json` - 移除了 `"scriptFile": "./index.js"`
- `api/process/function.json` - 移除了 `"scriptFile": "./index.js"`

## Azure Portal 配置步骤

### 步骤 1: 访问函数应用设置

1. 登录 [Azure Portal](https://portal.azure.com)
2. 导航到您的函数应用 `chatbotprocessor`
3. 在左侧菜单中，选择 **设置 (Settings)** → **配置 (Configuration)**

### 步骤 2: 添加应用程序设置

1. 在 **应用程序设置 (Application settings)** 标签页下
2. 点击 **"+ 新建应用程序设置" (+ New application setting)**
3. 填写以下信息：
   - **名称 (Name)**: `WEBSITE_RUN_FROM_PACKAGE`
   - **值 (Value)**: `1`
4. 点击 **"确定" (OK)**
5. 点击页面顶部的 **"保存" (Save)**

### 步骤 3: 重启函数应用

1. 在函数应用页面，点击 **"重启" (Restart)**
2. 等待重启完成

## 部署工作流

### 触发 GitHub Actions 部署

提交代码更改后，GitHub Actions 将自动触发部署：

```bash
# 提交更改
git add .
git commit -m "Configure Run from Package mode - remove scriptFile entries"
git push
```

### 验证部署

部署完成后，验证以下 URL：

- **Health Check**: `https://chatbotprocessor.azurewebsites.net/api/health`
- **Process Endpoint**: `https://chatbotprocessor.azurewebsites.net/api/process`

## 优势

### 相比传统部署方式的优势

1. **文件一致性**: 直接从 zip 包运行，避免解压过程中的文件损坏
2. **部署速度**: 更快的部署和启动时间
3. **可靠性**: 减少因文件系统问题导致的部署失败
4. **冷启动性能**: 改善冷启动性能
5. **版本控制**: 更好的版本控制和回滚能力

### 技术细节

- **WEBSITE_RUN_FROM_PACKAGE=1**: 启用从包运行模式
- **移除 scriptFile**: 依赖默认约定，保持配置最简化
- **自动重启**: 应用设置更改后需要重启函数应用

## 故障排除

### 常见问题

1. **函数无法启动**
   - 检查 `WEBSITE_RUN_FROM_PACKAGE` 设置是否正确
   - 确认函数应用已重启

2. **部署失败**
   - 检查 GitHub Actions 日志
   - 确认 function.json 格式正确

3. **冷启动缓慢**
   - 这是正常现象，首次访问会较慢
   - 后续访问会更快

### 监控和日志

1. **Azure Portal 监控**
   - 在函数应用页面查看 **"监控" (Monitor)**
   - 检查函数执行日志

2. **Application Insights**
   - 如果配置了 Application Insights，查看详细性能数据

## 回滚计划

如果需要回滚到传统部署模式：

1. 在 Azure Portal 中删除 `WEBSITE_RUN_FROM_PACKAGE` 设置
2. 恢复 function.json 中的 `scriptFile` 配置
3. 重启函数应用

## 最佳实践

1. **测试环境**: 先在测试环境验证配置
2. **监控**: 部署后密切监控应用性能
3. **备份**: 保留传统部署配置作为备份
4. **文档**: 记录配置更改和验证步骤

## 验证清单

- [ ] Azure Portal 中设置了 `WEBSITE_RUN_FROM_PACKAGE=1`
- [ ] 函数应用已重启
- [ ] GitHub Actions 部署成功
- [ ] Health endpoint 返回 200
- [ ] Process endpoint 正常工作
- [ ] 应用性能符合预期

完成以上步骤后，您的 Azure Functions 将使用更可靠的 "Run from Package" 部署模式！ 