-- Create database tables for AI chatbot interactions

CREATE TABLE ai_interactions (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    session_id VARCHAR(255),
    request_datetime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    response_datetime TIMESTAMP,
    -- Request information
    user_prompt TEXT NOT NULL,
    system_instruction TEXT,
    language_preference VARCHAR(10) NOT NULL,
    chat_history_count INT DEFAULT 0,
    -- Response information
    ai_response TEXT,
    response_model VARCHAR(50) DEFAULT 'gemini-2.0-flash',
    response_tokens INT,
    response_time_ms INT,
    -- Function call information
    function_called VARCHAR(100),
    function_args TEXT,
    function_result TEXT,
    -- Error information
    error_occurred BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    error_type VARCHAR(100),
    -- Request metadata
    request_ip VARCHAR(45),
    user_agent TEXT,
    request_headers TEXT
);

-- Create indexes for performance
CREATE INDEX idx_user_id ON ai_interactions(user_id);
CREATE INDEX idx_session_id ON ai_interactions(session_id);
CREATE INDEX idx_datetime ON ai_interactions(request_datetime);
CREATE INDEX idx_function_called ON ai_interactions(function_called);
CREATE INDEX idx_error_occurred ON ai_interactions(error_occurred);

-- Create a view for common analytics queries
CREATE OR REPLACE VIEW ai_interactions_summary AS
SELECT 
    DATE(request_datetime) as interaction_date,
    COUNT(*) as total_interactions,
    COUNT(*) FILTER (WHERE function_called IS NOT NULL) as function_calls,
    COUNT(*) FILTER (WHERE error_occurred) as errors,
    AVG(response_time_ms) as avg_response_time,
    COUNT(*) FILTER (WHERE language_preference = 'chinese') as chinese_requests,
    COUNT(*) FILTER (WHERE language_preference = 'english') as english_requests
FROM ai_interactions
GROUP BY DATE(request_datetime)
ORDER BY interaction_date DESC;

-- Create a view for function call analytics
CREATE OR REPLACE VIEW function_call_analytics AS
SELECT 
    function_called,
    COUNT(*) as call_count,
    AVG(response_time_ms) as avg_response_time,
    COUNT(*) FILTER (WHERE error_occurred) as error_count
FROM ai_interactions
WHERE function_called IS NOT NULL
GROUP BY function_called
ORDER BY call_count DESC;

-- Insert a test record to verify the table works
INSERT INTO ai_interactions (
    user_id, 
    user_prompt, 
    language_preference, 
    ai_response, 
    response_model
) VALUES (
    'test-user',
    'Hello, this is a test message',
    'english',
    'Hello! This is a test response from the AI.',
    'gemini-2.0-flash'
);

-- Verify the table was created successfully
SELECT * FROM ai_interactions ORDER BY request_datetime DESC LIMIT 5;