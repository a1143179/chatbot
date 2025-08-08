exports.up = function(knex) {
  return knex.schema.alterTable('ai_interactions', table => {
    table.dropColumn('user_id');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('ai_interactions', table => {
    table.string('user_id');
  });
};