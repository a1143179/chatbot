# Azure SQL Database Setup Guide

## 1. 创建Azure免费账户

1. 访问 https://azure.microsoft.com/free/
2. 注册免费账户（需要信用卡验证，但不会收费）
3. 免费账户包含：
   - 12个月免费Azure SQL数据库（基本层）
   - 每月750小时免费Azure Functions
   - 每月5GB免费存储

## 2. 创建SQL数据库

### 步骤1：登录Azure Portal
- 访问 https://portal.azure.com
- 使用您的Azure账户登录

### 步骤2：创建SQL数据库
1. 点击"创建资源"
2. 搜索"SQL数据库"
3. 选择"SQL数据库"
4. 点击"创建"

### 步骤3：配置数据库
```
基本信息：
- 订阅：选择您的订阅
- 资源组：创建新的或使用现有的
- 数据库名称：chatbot_db
- 服务器：创建新服务器
  - 服务器名称：chatbot-server-[随机数]
  - 位置：选择离您最近的区域（如East US）
  - 身份验证方法：使用SQL身份验证
  - 管理员用户名：admin
  - 密码：[设置强密码，至少8个字符，包含大小写字母和数字]
```

### 步骤4：选择定价层
1. 点击"配置数据库"
2. 选择"基本"层（免费）
3. 设置：
   - 计算 + 存储：基本
   - 最大数据大小：2 GB
   - 备份存储冗余：本地冗余存储

### 步骤5：网络设置
1. 在"网络"选项卡中
2. 连接方法：公共端点
3. 允许Azure服务和资源访问此服务器：是
4. 添加当前客户端IP地址：是

### 步骤6：创建数据库
1. 点击"查看 + 创建"
2. 验证所有设置
3. 点击"创建"
4. 等待部署完成（约5-10分钟）

## 3. 获取连接信息

部署完成后，您需要以下信息：

```
服务器名称：chatbot-server-[随机数].database.windows.net
数据库名称：chatbot_db
用户名：admin
密码：[您设置的密码]
端口：1433
```

## 4. 创建数据库表

### 方法1：使用Azure Portal查询编辑器
1. 在Azure Portal中找到您的数据库
2. 点击"查询编辑器"
3. 输入用户名和密码
4. 运行以下SQL脚本：

```sql
-- 创建AI交互记录表
CREATE TABLE ai_interactions (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id NVARCHAR(255) NOT NULL,
    session_id NVARCHAR(255),
    request_datetime DATETIME2 NOT NULL DEFAULT GETDATE(),
    response_datetime DATETIME2,
    
    -- 请求信息
    user_prompt NVARCHAR(MAX) NOT NULL,
    system_instruction NVARCHAR(MAX),
    language_preference NVARCHAR(10) NOT NULL,
    chat_history_count INT DEFAULT 0,
    
    -- 响应信息
    ai_response NVARCHAR(MAX),
    response_model NVARCHAR(50) DEFAULT 'gemini-2.0-flash',
    response_tokens INT,
    response_time_ms INT,
    
    -- 函数调用信息
    function_called NVARCHAR(100),
    function_args NVARCHAR(MAX),
    function_result NVARCHAR(MAX),
    
    -- 错误信息
    error_occurred BIT DEFAULT 0,
    error_message NVARCHAR(MAX),
    error_type NVARCHAR(100),
    
    -- 请求元数据
    request_ip NVARCHAR(45),
    user_agent NVARCHAR(MAX),
    request_headers NVARCHAR(MAX)
);

-- 创建索引
CREATE INDEX idx_user_id ON ai_interactions(user_id);
CREATE INDEX idx_session_id ON ai_interactions(session_id);
CREATE INDEX idx_datetime ON ai_interactions(request_datetime);
CREATE INDEX idx_function_called ON ai_interactions(function_called);
CREATE INDEX idx_error_occurred ON ai_interactions(error_occurred);
```

### 方法2：使用SQL Server Management Studio (SSMS)
1. 下载并安装SSMS
2. 连接到您的Azure SQL数据库
3. 运行上述SQL脚本

## 5. 配置Azure Functions环境变量

在Azure Functions应用中设置以下环境变量：

```
DB_HOST=chatbot-server-[随机数].database.windows.net
DB_USER=admin
DB_PASSWORD=[您的密码]
DB_NAME=chatbot_db
DB_PORT=1433
```

### 设置步骤：
1. 在Azure Portal中找到您的Function App
2. 点击"配置"
3. 点击"应用程序设置"
4. 添加上述环境变量
5. 点击"保存"

## 6. 安装依赖

在Azure Functions中安装mssql依赖：

1. 在Azure Portal中找到您的Function App
2. 点击"开发工具" > "高级工具"
3. 点击"转到"打开Kudu
4. 在Kudu中，点击"调试控制台" > "CMD"
5. 导航到函数目录并运行：
   ```bash
   npm install mssql
   ```

## 7. 测试连接

部署完成后，您可以通过以下方式测试：

1. 发送一个聊天请求
2. 检查Azure Functions日志
3. 在数据库中查询记录：
   ```sql
   SELECT TOP 10 * FROM ai_interactions ORDER BY request_datetime DESC;
   ```

## 8. 监控和分析

### 查看基本统计
```sql
SELECT 
    COUNT(*) as total_interactions,
    COUNT(CASE WHEN function_called IS NOT NULL THEN 1 END) as function_calls,
    COUNT(CASE WHEN error_occurred = 1 THEN 1 END) as errors,
    AVG(response_time_ms) as avg_response_time
FROM ai_interactions;
```

### 查看语言使用统计
```sql
SELECT 
    language_preference,
    COUNT(*) as request_count
FROM ai_interactions
GROUP BY language_preference;
```

### 查看函数调用统计
```sql
SELECT 
    function_called,
    COUNT(*) as call_count
FROM ai_interactions
WHERE function_called IS NOT NULL
GROUP BY function_called;
```

## 注意事项

1. **免费层限制**：
   - 最大2GB存储
   - 每月有限的计算时间
   - 适合开发和测试

2. **安全考虑**：
   - 使用强密码
   - 定期更新密码
   - 限制IP访问（如果需要）

3. **成本控制**：
   - 监控使用量
   - 设置支出警报
   - 在不需要时暂停服务

## 故障排除

### 常见问题：

1. **连接失败**：
   - 检查防火墙设置
   - 验证连接字符串
   - 确认环境变量正确

2. **权限错误**：
   - 确认用户名和密码正确
   - 检查数据库用户权限

3. **超时错误**：
   - 检查网络连接
   - 验证Azure SQL服务状态

## 支持资源

- [Azure SQL Database文档](https://docs.microsoft.com/en-us/azure/azure-sql/)
- [Azure Functions文档](https://docs.microsoft.com/en-us/azure/azure-functions/)
- [Azure免费账户常见问题](https://azure.microsoft.com/en-us/free/free-account-faq/) 