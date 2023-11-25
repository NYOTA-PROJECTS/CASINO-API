const express = require("express");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const shopRoutes = require("./routes/shopRoutes");
const shelveRoutes = require("./routes/shelveRoutes");
const subshelveRoutes = require("./routes/subshelveRoutes");
const adminRoutes = require("./routes/adminRoutes");
const productRoutes = require("./routes/productRoutes");
const fs = require("fs");

// Initialize express app
const app = express();

// SwaggerOptions
const swaggerOptions = {
  swaggerDefinition: {
    info: {
      title: "CASINO API",
      version: "1.0.0",
      description: "API CASINO SUPERMARKET",
    },
    securityDefinitions: {
      jwt: {
        type: "apiKey",
        name: "Authorization",
        in: "header",
      },
    },
  },
  apis: ["./routes/*.js"],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Mogan logger
app.use(morgan("combined"));

// Variable d'environnement à partir de .env
dotenv.config();

// Middleware to create the destination folder for public
const createUploadsShelvesFolder = (req, res, next) => {
  const folderPath = "public/uploads/shelves";
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
  next();
};

const createUploadsSubShelvesFolder = (req, res, next) => {
  const folderPath = "public/uploads/subshelves";
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
  next();
};

const createUploadsProductsFolder = (req, res, next) => {
  const folderPath = "public/uploads/products";
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
  next();
};

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Public folder
app.use(express.static("public"));

// Middleware gestionnaire d'erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Erreur serveur." });
});

// limiteur de requête d'access au serveur
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Trop de requêtes. Veuillez reessayer dans 15 minutes.",
});

// Routes
app.use("/api/v1/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use("/api/v1/shop", shopRoutes, limiter);
app.use("/api/v1/shelve", createUploadsShelvesFolder, shelveRoutes, limiter);
app.use("/api/v1/subshelve", createUploadsSubShelvesFolder, subshelveRoutes, limiter);
app.use("/api/v1/admin", adminRoutes, limiter);
app.use("/api/v1/product", createUploadsProductsFolder, productRoutes, limiter);


// Démarrage serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀🚀-----Serveur démarré sur le port: ${PORT}-----🚀🚀`);
});
