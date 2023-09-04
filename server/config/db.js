require('dotenv').config();
const mysql = require('mysql');

const connectDB = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });
        console.log('Connexion à la base de données réussie!');
        return connection;
    } catch (e) {
        console.log('La connexion à la base de données à échoué : ' + e);
        throw e;
    }
};

module.exports = connectDB;