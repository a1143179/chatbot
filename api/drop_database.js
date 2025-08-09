exports.up = async function(knex) {
  return knex.raw('DROP DATABASE IF EXISTS chatbot_db');
};

exports.down = async function(knex) {
  return knex.raw('CREATE DATABASE chatbot_db');
};