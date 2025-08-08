-- Database schema for AI chatbot requests and responses
-- This table stores all AI interactions for analytics and debugging
-- For Azure SQL Database

CREATE TABLE ai_interactions (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    session_id NVARCHAR(255),
    request_datetime DATETIME2 NOT NULL DEFAULT GETDATE(),
    response_datetime DATETIME2,
    
    -- Request information
    user_prompt NVARCHAR(MAX) NOT NULL,
    system_instruction NVARCHAR(MAX),
    language_preference NVARCHAR(10) NOT NULL,
    chat_history_count INT DEFAULT 0,
    
    -- Response information
    ai_response NVARCHAR(MAX),
    response_model NVARCHAR(50) DEFAULT 'gemini-2.0-flash',
    response_tokens INT,
    response_time_ms INT,
    
    -- Function call information
    function_called NVARCHAR(100),
    function_args NVARCHAR(MAX),
    function_result NVARCHAR(MAX),
    
    -- Error information
    error_occurred BIT DEFAULT 0,
    error_message NVARCHAR(MAX),
    error_type NVARCHAR(100),
    
    -- Request metadata
    request_ip NVARCHAR(45),
    user_agent NVARCHAR(MAX),
    request_headers NVARCHAR(MAX)
);

-- Create indexes for performance
CREATE INDEX idx_session_id ON ai_interactions(session_id);
CREATE INDEX idx_datetime ON ai_interactions(request_datetime);
CREATE INDEX idx_function_called ON ai_interactions(function_called);
CREATE INDEX idx_error_occurred ON ai_interactions(error_occurred);
-- Create a view for common analytics queries
CREATE VIEW ai_interactions_summary AS
SELECT 
    CAST(request_datetime AS DATE) as interaction_date,
    COUNT(*) as total_interactions,
    COUNT(CASE WHEN function_called IS NOT NULL THEN 1 END) as function_calls,
    COUNT(CASE WHEN error_occurred = 1 THEN 1 END) as errors,
    AVG(response_time_ms) as avg_response_time,
    COUNT(CASE WHEN language_preference = 'chinese' THEN 1 END) as chinese_requests,
    COUNT(CASE WHEN language_preference = 'english' THEN 1 END) as english_requests
FROM ai_interactions
GROUP BY CAST(request_datetime AS DATE)
ORDER BY interaction_date DESC;

-- Create a view for function call analytics
CREATE VIEW function_call_analytics AS
SELECT 
    function_called,
    COUNT(*) as call_count,
    AVG(response_time_ms) as avg_response_time,
    COUNT(CASE WHEN error_occurred = 1 THEN 1 END) as error_count
FROM ai_interactions
WHERE function_called IS NOT NULL
GROUP BY function_called
ORDER BY call_count DESC; 