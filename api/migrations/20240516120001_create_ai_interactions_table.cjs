exports.up = function(knex) {
  return knex.schema.createTable('ai_interactions', table => {
    table.increments('id').primary(); 
    table.string('session_id');
    table.timestamp('request_datetime').defaultTo(knex.fn.now());
    table.timestamp('response_datetime');
    table.string('user_prompt');
    table.string('system_instruction');
    table.string('language_preference');
    table.integer('chat_history_count');
    table.text('ai_response');
    table.string('response_model');
    table.integer('response_tokens');
    table.integer('response_time_ms');
    table.string('function_called');
    table.jsonb('function_args');
    table.string('function_result');
    table.boolean('error_occurred').defaultTo(false);
    table.string('error_message');
    table.string('error_type');
    table.string('ip');
    table.string('user_agent');
    table.jsonb('request_headers');
    table.timestamps(true, true); // adds created_at and updated_at
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('ai_interactions');
};