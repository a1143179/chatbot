// Postgres database configuration and logging
import { Pool } from 'pg';
import azureLogger from './utils/azureLogger.js';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'chatbot_db',
  user: process.env.DB_USERNAME || process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT) || 5432,
  max: 10,
  idleTimeoutMillis: 30000,
};

const pool = new Pool(dbConfig);

async function getConnection() {
  // pg Pool handles connection reuse automatically
  return pool;
}

async function logAIInteraction(interactionData) {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO ai_interactions (
          user_id, session_id, request_datetime, response_datetime,
          user_prompt, system_instruction, language_preference, chat_history_count,
          ai_response, response_model, response_tokens, response_time_ms,
          function_called, function_args, function_result,
          error_occurred, error_message, error_type,
          request_ip, user_agent, request_headers
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7, $8,
          $9, $10, $11, $12,
          $13, $14, $15,
          $16, $17, $18,
          $19, $20, $21
        ) RETURNING id;`,
        [
          interactionData.user_id || 'anonymous',
          interactionData.session_id,
          interactionData.request_datetime,
          interactionData.response_datetime,
          interactionData.user_prompt,
          interactionData.system_instruction,
          interactionData.language_preference,
          interactionData.chat_history_count,
          interactionData.ai_response,
          interactionData.response_model,
          interactionData.response_tokens,
          interactionData.response_time_ms,
          interactionData.function_called,
          interactionData.function_args ? JSON.stringify(interactionData.function_args) : null,
          interactionData.function_result,
          interactionData.error_occurred || false,
          interactionData.error_message,
          interactionData.error_type,
          interactionData.request_ip,
          interactionData.user_agent,
          interactionData.request_headers ? JSON.stringify(interactionData.request_headers) : null,
        ]
      );
      azureLogger.info('AI interaction logged successfully', { id: result.rows[0].id });
      return result.rows[0].id;
    } finally {
      client.release();
    }
  } catch (error) {
    azureLogger.error('Failed to log AI interaction', { error: error.message });
    return null;
  }
}

async function getAnalyticsSummary(days = 7) {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT 
          CAST(request_datetime AS DATE) as date,
          COUNT(*) as total_requests,
          COUNT(*) FILTER (WHERE function_called IS NOT NULL) as function_calls,
          COUNT(*) FILTER (WHERE error_occurred) as errors,
          AVG(response_time_ms) as avg_response_time,
          COUNT(*) FILTER (WHERE language_preference = 'chinese') as chinese_requests,
          COUNT(*) FILTER (WHERE language_preference = 'english') as english_requests
        FROM ai_interactions
        WHERE request_datetime >= NOW() - INTERVAL '$1 days'
        GROUP BY CAST(request_datetime AS DATE)
        ORDER BY date DESC`,
        [days]
      );
      return result.rows;
    } finally {
      client.release();
    }
  } catch (error) {
    azureLogger.error('Failed to get analytics', { error: error.message });
    return [];
  }
}

async function getFunctionCallStats() {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT 
          function_called,
          COUNT(*) as call_count,
          AVG(response_time_ms) as avg_response_time,
          COUNT(*) FILTER (WHERE error_occurred) as error_count
        FROM ai_interactions
        WHERE function_called IS NOT NULL
        GROUP BY function_called
        ORDER BY call_count DESC`
      );
      return result.rows;
    } finally {
      client.release();
    }
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