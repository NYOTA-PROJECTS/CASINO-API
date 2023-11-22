const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");

// Initialize express app
const app = express();

// Mogan logger
app.use(morgan("combined"));

// Variable d'environnement à partir de .env
dotenv.config();

// Middleware 
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware gestionnaire d'erreurs
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Erreur serveur.' });
  });


// limiteur de requête d'access au serveur
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Trop de requêtes. Veuillez reessayer dans 15 minutes."
})

// Routes

// Démarrage serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀🚀-----Serveur démarré sur le port: ${PORT}-----🚀🚀`);
});