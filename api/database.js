// Database configuration for Azure SQL Database
import mssql from 'mssql';
import azureLogger from './utils/azureLogger.js';
let sql = null;

try {
    sql = mssql;
    azureLogger.info('mssql module loaded successfully');
} catch {
    azureLogger.warn('mssql module not available, database logging will be disabled');
}

// Database configuration for Azure SQL Database
const dbConfig = {
    server: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'chatbot_db',
    user: process.env.DB_USERNAME || process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || '',
    port: parseInt(process.env.DB_PORT) || 1433,
    options: {
        encrypt: true, // For Azure SQL Database
        trustServerCertificate: false,
        enableArithAbort: true,
        requestTimeout: 30000,
        connectionTimeout: 30000
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

// Create connection pool
let pool = null;

async function getConnection() {
    if (!sql) {
        azureLogger.warn('Database logging disabled - mssql module not available');
        return null;
    }
    
    if (!pool) {
        try {
            pool = await sql.connect(dbConfig);
            azureLogger.info('Database connection established successfully');
        } catch (error) {
            azureLogger.error('Database connection failed', { error: error.message });
            throw error;
        }
    }
    return pool;
}

// Function to log AI interaction
async function logAIInteraction(interactionData) {
    if (!sql) {
        azureLogger.warn('Database logging disabled - mssql module not available');
        return null;
    }
    
    try {
        const pool = await getConnection();
        if (!pool) {
            azureLogger.warn('Database connection not available');
            return null;
        }
        
        const request = pool.request();
        
        request.input('user_id', sql.NVarChar, interactionData.user_id || 'anonymous');
        request.input('session_id', sql.NVarChar, interactionData.session_id);
        request.input('request_datetime', sql.DateTime2, interactionData.request_datetime);
        request.input('response_datetime', sql.DateTime2, interactionData.response_datetime);
        request.input('user_prompt', sql.NVarChar(sql.MAX), interactionData.user_prompt);
        request.input('system_instruction', sql.NVarChar(sql.MAX), interactionData.system_instruction);
        request.input('language_preference', sql.NVarChar(10), interactionData.language_preference);
        request.input('chat_history_count', sql.Int, interactionData.chat_history_count);
        request.input('ai_response', sql.NVarChar(sql.MAX), interactionData.ai_response);
        request.input('response_model', sql.NVarChar(50), interactionData.response_model);
        request.input('response_tokens', sql.Int, interactionData.response_tokens);
        request.input('response_time_ms', sql.Int, interactionData.response_time_ms);
        request.input('function_called', sql.NVarChar(100), interactionData.function_called);
        request.input('function_args', sql.NVarChar(sql.MAX), interactionData.function_args ? JSON.stringify(interactionData.function_args) : null);
        request.input('function_result', sql.NVarChar(sql.MAX), interactionData.function_result);
        request.input('error_occurred', sql.Bit, interactionData.error_occurred || false);
        request.input('error_message', sql.NVarChar(sql.MAX), interactionData.error_message);
        request.input('error_type', sql.NVarChar(100), interactionData.error_type);
        request.input('request_ip', sql.NVarChar(45), interactionData.request_ip);
        request.input('user_agent', sql.NVarChar(sql.MAX), interactionData.user_agent);
        request.input('request_headers', sql.NVarChar(sql.MAX), interactionData.request_headers ? JSON.stringify(interactionData.request_headers) : null);
        
        const result = await request.query(`
            INSERT INTO ai_interactions (
                user_id, session_id, request_datetime, response_datetime,
                user_prompt, system_instruction, language_preference, chat_history_count,
                ai_response, response_model, response_tokens, response_time_ms,
                function_called, function_args, function_result,
                error_occurred, error_message, error_type,
                request_ip, user_agent, request_headers
            ) VALUES (@user_id, @session_id, @request_datetime, @response_datetime,
                     @user_prompt, @system_instruction, @language_preference, @chat_history_count,
                     @ai_response, @response_model, @response_tokens, @response_time_ms,
                     @function_called, @function_args, @function_result,
                     @error_occurred, @error_message, @error_type,
                     @request_ip, @user_agent, @request_headers);
            SELECT SCOPE_IDENTITY() as id;
        `);
        
        azureLogger.info('AI interaction logged successfully', { id: result.recordset[0].id });
        return result.recordset[0].id;
        
    } catch (error) {
        azureLogger.error('Failed to log AI interaction', { error: error.message });
        // Don't throw error to avoid breaking the main flow
        return null;
    }
}

// Function to get analytics data
async function getAnalyticsSummary(days = 7) {
    if (!sql) {
        azureLogger.warn('Database analytics disabled - mssql module not available');
        return [];
    }
    
    try {
        const pool = await getConnection();
        if (!pool) {
            return [];
        }
        
        const request = pool.request();
        request.input('days', sql.Int, days);
        
        const result = await request.query(`
            SELECT 
                CAST(request_datetime AS DATE) as date,
                COUNT(*) as total_requests,
                COUNT(CASE WHEN function_called IS NOT NULL THEN 1 END) as function_calls,
                COUNT(CASE WHEN error_occurred = 1 THEN 1 END) as errors,
                AVG(response_time_ms) as avg_response_time,
                COUNT(CASE WHEN language_preference = 'chinese' THEN 1 END) as chinese_requests,
                COUNT(CASE WHEN language_preference = 'english' THEN 1 END) as english_requests
            FROM ai_interactions
            WHERE request_datetime >= DATEADD(day, -@days, GETDATE())
            GROUP BY CAST(request_datetime AS DATE)
            ORDER BY date DESC
        `);
        
        return result.recordset;
        
    } catch (error) {
        azureLogger.error('Failed to get analytics', { error: error.message });
        return [];
    }
}

// Function to get function call statistics
async function getFunctionCallStats() {
    if (!sql) {
        azureLogger.warn('Database analytics disabled - mssql module not available');
        return [];
    }
    
    try {
        const pool = await getConnection();
        if (!pool) {
            return [];
        }
        
        const request = pool.request();
        
        const result = await request.query(`
            SELECT 
                function_called,
                COUNT(*) as call_count,
                AVG(response_time_ms) as avg_response_time,
                COUNT(CASE WHEN error_occurred = 1 THEN 1 END) as error_count
            FROM ai_interactions
            WHERE function_called IS NOT NULL
            GROUP BY function_called
            ORDER BY call_count DESC
        `);
        
        return result.recordset;
        
    } catch (error) {
        azureLogger.error('Failed to get function call stats', { error: error.message });
        return [];
    }
}

export {
    getConnection,
    logAIInteraction,
    getAnalyticsSummary,
    getFunctionCallStats
}; 