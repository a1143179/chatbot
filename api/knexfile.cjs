"use strict";

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: '127.0.0..1',
      database: 'chatbot_db',
      user: 'postgres',
      password: '',
      port: 5432
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: './migrations'
    }
  },

  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  }

};