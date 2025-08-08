// Database connection test script
// Run this to verify your Postgres Database connection

import { getConnection, logAIInteraction } from './database.js';

async function testDatabaseConnection() {
    console.log('Testing database connection...');
    console.log('Environment variables:');
    console.log('- DB_HOST:', process.env.DB_HOST || 'NOT SET');
    console.log('- DB_NAME:', process.env.DB_NAME || 'NOT SET');
    console.log('- DB_USERNAME:', process.env.DB_USERNAME || 'NOT SET');
    console.log('- DB_PASSWORD:', process.env.DB_PASSWORD ? 'SET' : 'NOT SET');
    console.log('- DB_PORT:', process.env.DB_PORT || '5432 (default)');
    try {
        // Test connection
        const pool = await getConnection();
        if (pool) {
            console.log('✅ Database connection successful!');
            // Test inserting a record
            const testData = {
                user_id: 'test-user',
                session_id: 'test-session-' + Date.now(),
                request_datetime: new Date(),
                user_prompt: 'Database connection test',
                language_preference: 'english',
                chat_history_count: 0,
                ai_response: 'Database connection test successful',
                response_model: 'test',
                response_tokens: 10,
                response_time_ms: 100,
                request_ip: '127.0.0.1',
                user_agent: 'test-script'
            };
            const result = await logAIInteraction(testData);
            if (result) {
                console.log('✅ Test record inserted successfully!');
                console.log('Record ID:', result);
            } else {
                console.log('⚠️ Test record insertion failed');
            }
        } else {
            console.log('❌ Database connection failed - pg module not available');
        }
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.error('Full error:', error);
    }
}

// Run the test
testDatabaseConnection().then(() => {
    console.log('Database test completed');
    process.exit(0);
}).catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
});