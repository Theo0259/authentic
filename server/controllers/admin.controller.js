// Importation du module MySQL
const mysql = require("mysql");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();

// Création d'une connexion à la base de données en utilisant les informations d'environnement

const conn = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

const email_admin = process.env.EMAIL_ADMIN;
const secretKey = process.env.SECRET_KEY;




const register = async (req, res) => {

    const { email, password } = req.body
    let responseMessage = "";
    if (email_admin != process.env.EMAIL_ADMIN) {
        return res.status(401).json({
            error: 'L\email n\est pas autoriser !'
        })
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        if (passwordRegex.test(password)) {
            responseMessage += "Mot de passe valide. ";
        } else {
            responseMessage += "Le mot de passe ne satisfait pas les critères de sécurité : ";
    
            if (password.length < 8) {
                responseMessage += "Le mot de passe doit comporter au moins 8 caractères. ";
            }
    
            if (!/[A-Z]/.test(password)) {
                responseMessage += "Le mot de passe doit contenir au moins une lettre majuscule. ";
            }
    
            if (!/[a-z]/.test(password)) {
                responseMessage += "Le mot de passe doit contenir au moins une lettre minuscule. ";
            }
    
            if (!/\d/.test(password)) {
                responseMessage += "Le mot de passe doit contenir au moins un chiffre. ";
            }
    
            if (!/[@$!%*?&]/.test(password)) {
                responseMessage += "Le mot de passe doit contenir au moins un caractère spécial (@, $, !, %, *, ?, &). ";
            }
            res.status(402).json({
                            message: responseMessage
                        });
                
                        return;
        }


        const query = `SELECT * FROM admin WHERE email = ?`;
    conn.query(query, [email], async (err, results) => {
        if (err) {
            console.error('L\'email entré n\'est pas valide.' + err);
            res.status(500).json({ error: 'L\'email entré n\'est pas valide.' });
        }
        if (results.length > 0) {
            res.status(401).json({ error: 'L\'email entré est déjà utilisé.' });
        } else {
    // Si le mot de passe est valide, hacher avec bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    const query = 'INSERT INTO `admin`(`email`, `password`) VALUES (?, ?)';
    conn.query(query, [email, passwordHash], (err) => {
        if (err) {
            console.error('erreur')
            res.status(500).json({ error: 'erreur' })
        } else {
            res.status(200).json({ message: 'utilisateur enregistré' });
        }
    })
}
    })
}

const login = async (req, res) => {
    const { email, password } = req.body;
    if (email != email_admin) {
        res.status(401).json({ message: 'L\'e-mail c\'est pas bon.' });
        return;
    }
    const query = `SELECT * FROM admin WHERE email = ?`;
    conn.query(query, [email], async (err, results) => {
        if (err) {
            console.error('L\'email entré n\'est pas valide.' + err);
            res.status(500).json({ error: 'L\'email entré n\'est pas valide.' });
        }
        // Gestion des insertions
        const admin = results[0];
        const ishached = await bcrypt.compare(password, admin.password);

        if (!ishached) {
            res.status(401).json({ message: 'Le mot de passe n\'est pas valide' });
            return;
        }
        // Générer le token
        const token = jwt.sign({ adminId: admin.id }, secretKey, { expiresIn: '1h' });

        const message = 'Connection établie.'
        res.status(200).json({ message, token });


    });
}

module.exports = {
    register,
    login,
};