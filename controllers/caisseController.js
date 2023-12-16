const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Caisse, Shop } = require("../models");

// Creation de la caisse
const createCaisse = async (req, res) => {
  try {
    const shopId = req.headers.shopid;
    const { firstName, lastName, phone, email, password } = req.body;

    if (!shopId) {
      return res.status(401).json({
        status: "error",
        message: "Identifiant de magasin non fourni.",
      });
    }

    if (!firstName) {
      return res.status(401).json({
        status: "error",
        message: "Nom de la caissiere non fourni.",
      });
    }

    if (!lastName) {
      return res.status(401).json({
        status: "error",
        message: "Prenom de la caissiere non fourni.",
      });
    }

    if (!phone) {
      return res.status(401).json({
        status: "error",
        message: "Numéro de portable de la caissiere non fourni.",
      });
    }

    if (!password) {
      return res.status(401).json({
        status: "error",
        message: "Mot de passe de la caissiere non fourni.",
      });
    }

    if (password.length < 4) {
      return res.status(401).json({
        status: "error",
        message: "Le mot de passe doit contenir au moins 4 caractères.",
      });
    }

    // Vérifier si la boutique existe
    const existingShop = await Shop.findByPk(shopId);
    if (!existingShop) {
      return res.status(404).json({
        status: "error",
        message: "Le magasin n'existe pas.",
      });
    }

    // Vérifie si la caisse existe déja par son téléphone de portable
    const existingCaisse = await Caisse.findOne({
      where: { phone },
    });

    if (existingCaisse) {
      return res.status(409).json({
        status: "error",
        message: "Une caisse existe déjà avec ce numéro de portable.",
      });
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Creer la caisse
    const newCaisse = await Caisse.create({
      firstName,
      lastName,
      phone,
      email,
      password: hashedPassword,
      shopId,
    });

    const caisseResponse = {
      id: newCaisse.id,
      firstName: newCaisse.firstName,
      lastName: newCaisse.lastName,
      phone: newCaisse.phone,
      email: newCaisse.email,
      shopName: existingShop.name,
    };

    res.status(201).json({
      status: "success",
      caisse: caisseResponse,
    });
  } catch (error) {
    console.error(`ERROR CREATE CAISSE: ${error}`);
    res.status(500).json({
      status: "error",
      message: "Une erreur s'est produite lors de la création de la caisse.",
    });
  }
};

const loginCaisse = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone) {
      return res.status(401).json({
        status: "error",
        message: "Numéro de portable non fourni.",
      });
    }

    if (!password) {
      return res.status(401).json({
        status: "error",
        message: "Mot de passe non fourni.",
      });
    }

    const existingCaisse = await Caisse.findOne({
      where: { phone },
      include: [{ model: Shop, attributes: ["name"] }],
    });

    if (!existingCaisse) {
      return res.status(404).json({
        status: "error",
        message: "La caisse n'existe pas. Veuillez vous inscrire au prealable.",
      });
    }

    // Vérifier si le mot de passe est correct
    const isPasswordValid = await bcrypt.compare(
      password,
      existingCaisse.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        status: "error",
        message: "Mot de passe incorrect. Veuillez réessayer.",
      });
    }

    // Vérifier si le mot de passe a une longueur minimale de 4 caractères
    if (password.length < 4) {
      return res.status(400).json({
        status: "error",
        message:
          "Le mot de passe doit avoir une longueur minimale de 4 caractères.",
      });
    }

    // Générer un token JWT sans durée de vie spécifiée
    const token = jwt.sign({ id: existingCaisse.id }, process.env.JWT_SECRET);

    const caisseResponse = {
      shopName: existingCaisse.Shop.name,
      firstName: existingCaisse.firstName,
      lastName: existingCaisse.lastName,
      token,
    };

    res.status(200).json({
      status: "success",
      caisse: caisseResponse,
    });
  } catch (error) {
    console.error(`ERROR LOGIN CAISSE: ${error}`);
    res.status(500).json({
      status: "error",
      message: "Une erreur s'est produite lors de la connexion de la caisse.",
    });
  }
};

module.exports = {
  createCaisse,
  loginCaisse,
};
