require("reflect-metadata");
const { DataSource } = require("typeorm");

const AppDataSource = new DataSource({
    type: "postgres",
    host: '127.0.0.1',
    port: 5432,
    username: "postgres",
    password: "password",
    database: "chatbot_db",
    synchronize: false, // Never use this in production!
    logging: false,
    entities: [],
    migrations: [],
    subscribers: [],
});

exports.AppDataSource = AppDataSource;