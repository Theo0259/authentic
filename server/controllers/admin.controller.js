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
  const { email, password } = req.body;
  let responseMessage = "";
  if (email !== process.env.EMAIL_ADMIN) {
    return res.status(401).json({
      error: "L'email nest pas autoriser !",
    });
  }

  const passwordRegex =
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  if (passwordRegex.test(password)) {
    responseMessage += "Mot de passe valide. ";
  } else {
    responseMessage +=
      "Le mot de passe ne satisfait pas les critères de sécurité : ";

    if (password.length < 8) {
      responseMessage +=
        "Le mot de passe doit comporter au moins 8 caractères. ";
    }

    if (!/[A-Z]/.test(password)) {
      responseMessage +=
        "Le mot de passe doit contenir au moins une lettre majuscule. ";
    }

    if (!/[a-z]/.test(password)) {
      responseMessage +=
        "Le mot de passe doit contenir au moins une lettre minuscule. ";
    }

    if (!/\d/.test(password)) {
      responseMessage += "Le mot de passe doit contenir au moins un chiffre. ";
    }

    if (!/[@$!%*?&]/.test(password)) {
      responseMessage +=
        "Le mot de passe doit contenir au moins un caractère spécial (@, $, !, %, *, ?, &). ";
    }
    res.status(402).json({
      message: responseMessage,
    });

    return;
  }

  const query = `SELECT * FROM admin WHERE email = ?`;
  conn.query(query, [email], async (err, results) => {
    if (err) {
      console.error("L'email entré n'est pas valide." + err);
      res.status(500).json({ error: "L'email entré n'est pas valide." });
    }
    if (results.length > 0) {
      res.status(401).json({ error: "L'email entré est déjà utilisé." });
    } else {
      // Si le mot de passe est valide, hacher avec bcrypt
      const passwordHash = await bcrypt.hash(password, 10);

      const query = "INSERT INTO `admin`(`email`, `password`) VALUES (?, ?)";
      conn.query(query, [email, passwordHash], (err) => {
        if (err) {
          console.error("erreur");
          res.status(500).json({ error: "erreur" });
        } else {
          res.status(200).json({ message: "utilisateur enregistré" });
        }
      });
    }
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (email != email_admin) {
    res.status(401).json({ message: "L'email n'est pas valide." });
    return;
  }
  const query = `SELECT * FROM admin WHERE email = ?`;
  conn.query(query, [email], async (err, results) => {
    if (err) {
      console.error("L'email entré n'est pas valide." + err);
      res.status(500).json({ error: "L'email entré n'est pas valide." });
    }
    // Gestion des insertions
    const admin = results[0];
    const ishached = await bcrypt.compare(password, admin.password);

    if (!ishached) {
      res.status(401).json({ message: "Le mot de passe n'est pas valide" });
      return;
    }
    // Générer le token
    const token = jwt.sign({ adminId: admin.id }, secretKey, {
      expiresIn: "1h",
    });

    const message = "Connection établie.";
    res.status(200).json({ message, token });
  });
};

const extractBearer = (authorization) => {
  if (typeof authorization !== "string") {
    return null;
  }
  const matches = authorization.match(/(bearer)\s+(\S+)/i);

  return matches ? matches[2] : null;
};

// Fonction du contrôleur pour vérifier le token
const dashboard = (req, res) => {
  // Récupérer le token à partir du header Authorization
  const token =
    req.headers.authorization && extractBearer(req.headers.authorization);

  if (!token) {
    // Si le token est absent, renvoyer une réponse d'erreur
    return res.status(401).json({ message: "Token absent" });
  }

  // Vérifier le token
  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      console.error("Erreur de vérification du token : " + err);
      // Si le token est invalide, renvoyer une réponse d'erreur
      return res.status(401).json({ message: "Token invalide" });
    }

    // Si le token est valide, vous pouvez accéder aux informations décodées, par exemple, l'ID de l'utilisateur
    const adminId = decoded.adminId;

    // Renvoyer une réponse de succès
    res.status(200).json({ message: "Token valide", adminId });
  });
};

module.exports = {
  register,
  login,
  dashboard,
};
