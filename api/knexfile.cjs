module.exports = {
  development: {
    client: 'mssql',
    connection: {
      server: process.env.DB_SERVER,
      port: parseInt(process.env.DB_PORT || '1433'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      options: {
        encrypt: false, // Use true for production
        trustServerCertificate: true,
      },
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './migrations'
    }
  },
};
