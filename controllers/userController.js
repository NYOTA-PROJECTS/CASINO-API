const sharp = require("sharp");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Sequelize = require("sequelize");
const twilio = require("twilio");
const { v4: uuidv4 } = require("uuid");
const {
  User,
  Otp,
  Cashback,
  SponsoringWallet,
  SettingSponsoring,
  UserCashback,
  Setting,
  TransactionFidelityCard,
  Voucher,
} = require("../models");
const accountSid = "ACa1159c8d1faa08ab522ea1705fa55f6f";
const authToken = "de90c1334e51e3d3d32d88dd9e9b074b";
const twilioClient = new twilio(accountSid, authToken);
const fs = require("fs");
const generatedSponsoringCode = require("../utils/sponsoringUtils");

const userCheck = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir le numéro de portable.",
      });
    }

    const existingUser = await User.findOne({
      where: { phone },
    });

    if (existingUser) {
      return res.status(409).json({
        status: "error",
        message:
          "Ce numéro de portable est déjà associé à une carte de fidélité. Veuillez vous connecter.",
      });
    }

    const sequelizeSecondary = new Sequelize({
      host: process.env.DB2_HOST,
      username: process.env.DB2_USER,
      dialect: "mysql",
      database: process.env.DB2_NAME,
      password: process.env.DB2_PASSWORD,
    });

    const [results] = await sequelizeSecondary.query(
      `SELECT c.first_name, c.last_name, ca.montant
           FROM clients c
           INNER JOIN cartes ca ON c.id = ca.client_id
           WHERE c.phone = :phone LIMIT 1`,
      {
        replacements: { phone },
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    if (results) {
      // Générer les codes
      //const otpSms = generateOtp();

      // Envoyer les codes via Twilio
      //await sendOtpViaTwilio(phone, otpSms);

      // Stocker les codes dans la base de données
      //await storeOtpsInDatabase(phone, otpSms);

      const userResponse = {
        firstName: results.first_name,
        lastName: results.last_name,
        amount: results.montant,
      };

      return res.status(200).json({
        status: "success",
        user: userResponse,
      });
    } else {
      return res.status(404).json({
        status: "error",
        message:
          "Cette carte de fidélité n'est plus valide. Veuillez vous inscrire en indiquant ne pas avoir de carte.",
      });
    }
  } catch (error) {
    console.error(`ERROR LOGIN USER: ${error}`);
    res.status(500).json({
      status: "error",
      message:
        "Une erreur s'est produite lors de la connexion à la carte de fidélité.",
    });
  }
};

// Fonction pour envoyer l'OTP via Twilio
async function sendOtpViaTwilio(phone, otp) {
  try {
    await twilioClient.messages
      .create({
        body: `Votre code de vérification est : ${otp}`,
        from: "+13023062887",
        to: "+242" + phone,
      })
      .then((call) => console.log(`SMS RESPONSE: ${call.sid}`));
    console.log(`OTP sent to 044913233`);
  } catch (error) {
    console.error(`ERROR SENDING OTP VIA TWILIO: ${error}`);
    throw error;
  }
}

// Fonction pour générer un OTP
function generateOtp() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Enregistrez les codes dans la base de données avec l'état "non utilisé"
async function storeOtpsInDatabase(phone, otpSms) {
  try {
    await Otp.create({
      phone,
      otpSms,
      isOtpSmsUsed: false,
    });
  } catch (error) {
    console.error(`ERROR STORING OTPS IN DATABASE: ${error}`);
    throw error;
  }
}

// Fonction pour valider les codes côté serveur
async function validateOtps(phone, otpSms) {
  try {
    const user = await Otp.findOne({
      where: {
        phone,
        otpSms,
        isOtpSmsUsed: false,
      },
    });

    if (user) {
      // Marquez les codes comme utilisés
      await user.update({
        isOtpSmsUsed: true,
      });
      return true; // Les codes sont valides et ont été marqués comme utilisés
    } else {
      return false; // Les codes n'existent pas ou ont déjà été utilisés
    }
  } catch (error) {
    console.error(`ERROR VALIDATING OTPS: ${error}`);
    throw error;
  }
}

const validateCode = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    // Vérifiez si les codes sont valides
    const isValid = await validateOtps(phone, otp);

    if (isValid) {
      return res.status(200).json({
        status: "success",
        message: "Codes validés avec succès.",
      });
    } else {
      return res.status(401).json({
        status: "error",
        message: "Codes invalides ou déjà utilisés. Veuillez réessayer.",
      });
    }
  } catch (error) {
    console.error(`ERROR VALIDATING OTPS: ${error}`);
    res.status(500).json({
      status: "error",
      message: "Une erreur s'est produite lors de la validation des codes.",
    });
  }
};

const registerWithAccount = async (req, res) => {
  try {
    const { firstName, lastName, birthday, amount, phone, password } = req.body;

    if (!firstName) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir le nom.",
      });
    }

    if (!lastName) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir le prénom.",
      });
    }

    if (!phone) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir le numéro de portable.",
      });
    }

    if (!password) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir le mot de passe.",
      });
    }

    if (password.length < 4) {
      return res.status(400).json({
        status: "error",
        message: "Le mot de passe doit contenir au moins 4 caractères.",
      });
    }

    const existingUser = await User.findOne({
      where: { phone },
    });

    if (existingUser) {
      return res.status(409).json({
        status: "error",
        message:
          "Ce numéro de portable est déjà associé à une carte de fidelité.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const sponsoringCode = generatedSponsoringCode.generateSponsoringCode();

    const newUser = await User.create({
      firstName,
      lastName,
      birthday: birthday || null,
      phone,
      barcode: uuidv4(),
      password: hashedPassword,
      sponsoringCode: sponsoringCode,
    });

    const cashback = await Cashback.create({
      userId: newUser.id,
      amount: amount || 0,
    });

    await SponsoringWallet.create({
      userId: newUser.id,
      sponsoringCode: 0,
    });

    if (!newUser || !cashback) {
      return res.status(500).json({
        status: "error",
        message:
          "Une erreur s'est produite lors de la création de la carte de fidelité.",
      });
    }

    const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET);

    const userResponse = {
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      birthday: newUser.birthday,
      phone: newUser.phone,
      barcode: newUser.barcode,
      sponsoringCode: newUser.sponsoringCode,
      imageUrl: newUser.imageUrl,
      whatsapp: newUser.isWhatsapp,
      token: token,
    };

    await UserCashback.create({
      userId: newUser.id,
      amount: 5000,
    });

    return res.status(201).json({
      status: "success",
      user: userResponse,
    });
  } catch (error) {
    console.error(`ERROR REGISTER WITH ACCOUNT USER: ${error}`);
    res.status(500).json({
      status: "error",
      message:
        "Une erreur s'est produite lors de la création de la carte de fidelité.",
    });
  }
};

const updateProfileImage = async (req, res) => {
  try {
    const token = req.headers.authorization;

    if (!token.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ status: "error", message: "Format de token invalide." });
    }

    // Extrait le token en supprimant le préfixe "Bearer "
    const tokenValide = token.substring(7);
    // Extract the user ID from the token
    const decodedToken = jwt.verify(tokenValide, process.env.JWT_SECRET);
    const userId = decodedToken.id;

    // Vérifier si l'utilisateur existe dans la base de données en utilisant son ID
    const user = await User.findByPk(userId);
    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "Utilisateur non trouvé." });
    }

    // Utilisation de Sharp pour redimensionner l'image à 200x200
    const resizedImageFilename = `${Date.now()}_resized${path.extname(
      req.file.filename
    )}`;
    const resizedImagePath = path.join(
      __dirname,
      "..",
      "public/profiles/",
      resizedImageFilename
    );

    // Crée le répertoire s'il n'existe pas
    const resizedImageDirectory = path.dirname(resizedImagePath);
    if (!fs.existsSync(resizedImageDirectory)) {
      fs.mkdirSync(resizedImageDirectory, { recursive: true });
    }

    await sharp(req.file.path).resize(350, 350).toFile(resizedImagePath);

    // Mettre à jour le lien complet de l'image de profil dans la base de données
    const profileImageUrl = `${req.protocol}://${req.get(
      "host"
    )}/profiles/${resizedImageFilename}`;
    user.imageUrl = profileImageUrl; // Sauvegarde l'URL complète dans le champ 'imageUrl'
    await user.save();

    // Supprimer le fichier d'origine après la mise à jour
    fs.unlinkSync(req.file.path);

    res.json({
      status: "success",
      message: "Image de profil mise à jour avec succès.",
      profileImageUrl,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message:
        "Une erreur est survenue lors de la mise à jour de l'image de profil.",
    });
  }
};

const registerWithoutAccount = async (req, res) => {
  try {
    const {
      phone,
      firstName,
      lastName,
      birthday,
      sponsorCode,
      isWhatsapp,
      password,
    } = req.body;

    if (!firstName) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir le nom.",
      });
    }

    if (!lastName) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir le prénom.",
      });
    }

    if (!phone) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir le numéro de portable.",
      });
    }

    if (!password) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir le mot de passe.",
      });
    }

    // Validation de la longueur du mot de passe
    if (password.length < 4) {
      return res.status(400).json({
        status: "error",
        message: "Le mot de passe doit contenir au moins 4 caractères.",
      });
    }

    // Vérification si l'utilisateur existe déjà
    const existingUser = await User.findOne({ where: { phone } });

    if (existingUser) {
      return res.status(409).json({
        status: "error",
        message:
          "Ce numéro de portable est déjà associé à une carte de fidélité.",
      });
    }

    // Vérification de la longueur du code de parrainage
    if (sponsorCode && sponsorCode.length < 6) {
      return res.status(400).json({
        status: "error",
        message: "Le code de parrainage doit contenir au moins 6 caractères.",
      });
    }

    // Vérification si le numéro de portable est associé à une carte de fidélité
    const sequelizeSecondary = new Sequelize({
      host: process.env.DB2_HOST,
      username: process.env.DB2_USER,
      dialect: "mysql",
      database: process.env.DB2_NAME,
      password: process.env.DB2_PASSWORD,
    });

    const [results] = await sequelizeSecondary.query(
      `SELECT c.first_name, c.last_name, ca.montant
       FROM clients c
       INNER JOIN cartes ca ON c.id = ca.client_id
       WHERE c.phone = :phone LIMIT 1`,
      {
        replacements: { phone },
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    if (results) {
      return res.status(409).json({
        status: "error",
        message:
          "Ce numéro de portable est déjà associé à une carte de fidélité. Veuillez vous connecter en indiquant que vous possédez déjà une carte de fidélité.",
      });
    }

    let sponsorId = null;

    if (sponsorCode) {
      const sponsor = await User.findOne({
        where: { sponsoringCode: sponsorCode },
      });

      if (!sponsor) {
        return res.status(400).json({
          status: "error",
          message: "Le code de parrainage est incorrect.",
        });
      }

      sponsorId = sponsor.id;
    }
    // Création d'un nouveau code de parrainage s'il n'est pas fourni
    const mySponsorCode = generatedSponsoringCode.generateSponsoringCode();
    const hashedpassword = await bcrypt.hash(password, 10);

    // Création de l'utilisateur
    const user = await User.create({
      phone: phone,
      firstName: firstName,
      lastName: lastName,
      password: hashedpassword,
      barcode: uuidv4(),
      isWhatsapp: isWhatsapp === null ? false : isWhatsapp,
      birthday: birthday || null,
      sponsorId: sponsorId,
      sponsoringCode: mySponsorCode,
    });

    await UserCashback.create({
      userId: user.id,
      amount: 5000,
    });

    if (sponsorCode) {
      const setting = await SettingSponsoring.findByPk(1);
      const sponsingAmount = setting ? setting.godsonAmount : 0;
      await SponsoringWallet.create({
        userId: user.id,
        amount: sponsingAmount,
      });
    }

    await Cashback.create({
      userId: user.id,
      amount: 0,
    });

    // Génération du token JWT
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);

    // Réponse avec les détails de l'utilisateur
    const userResponse = {
      firstName: user.firstName,
      lastName: user.lastName,
      birthday: user.birthday,
      phone: user.phone,
      barcode: user.barcode,
      sponsoringCode: user.sponsoringCode,
      imageUrl: user.imageUrl,
      whatsapp: user.isWhatsapp,
      token: token,
    };

    res.status(201).json({
      status: "success",
      user: userResponse,
    });
  } catch (error) {
    console.error(`ERROR REGISTER WITHOUT ACCOUNT USER: ${error}`);
    res.status(500).json({
      status: "error",
      message:
        "Une erreur s'est produite lors de la création de la carte de fidelité.",
    });
  }
};

const checkCode = async (req, res) => {
  try {
    const { sponsoringCode } = req.body;

    if (!sponsoringCode) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir un code de parrainage.",
      });
    }

    const isSponsoringCodeValid = await checkSponsoringCode(sponsoringCode);

    if (isSponsoringCodeValid) {
      return res.status(200).json({
        status: "success",
        message: "Le code de parrainage est valide.",
      });
    } else {
      return res.status(404).json({
        status: "error",
        message: "Aucun utilisateur trouvé avec ce code de parrainage.",
      });
    }
  } catch (error) {
    console.error(`Error handling sponsoring code check: ${error}`);
    res.status(500).json({
      status: "error",
      message:
        "Une erreur s'est produite lors de la vérification du code de parrainage.",
    });
  }
};

const checkSponsoringCode = async (sponsoringCode) => {
  try {
    const existingUser = await User.findOne({
      where: { sponsoringCode },
    });

    return existingUser !== null;
  } catch (error) {
    console.error(`Error checking sponsoring code: ${error}`);
    throw error;
  }
};

const login = async (req, res) => {
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

    if (password.length < 4) {
      return res.status(401).json({
        status: "error",
        message: "Le mot de passe doit contenir au moins 6 caractères.",
      });
    }

    // Vérifiez si l'utilisateur existe dans la base de données en utilisant le numéro de téléphone
    const user = await User.findOne({ where: { phone } });
    if (!user) {
      // Si l'utilisateur n'existe pas, demandez de créer un compte
      return res.status(401).json({
        status: "error",
        message:
          "Numéro de téléphone non enregistré. Veuillez créer un compte.",
      });
    }

    // Vérifiez si le mot de passe est valide
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: "error",
        message: "Numéro de téléphone ou mot de passe incorrect.",
      });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);

    const userCashback = await Cashback.findOne({
      where: { userId: user.id },
    });

    const cashbackAmount = userCashback.amount;

    const userResponse = {
      firstName: user.firstName,
      lastName: user.lastName,
      birthday: user.birthday,
      phone: user.phone,
      barcode: user.barcode,
      sponsoringCode: user.sponsoringCode,
      imageUrl: user.imageUrl,
      cashback: cashbackAmount,
      whatsapp: user.isWhatsapp,
      token: token,
    };

    res.status(200).json({
      status: "success",
      user: userResponse,
    });
  } catch (error) {
    console.error(`Error login: ${error}`);
    res.status(500).json({
      status: "error",
      message: "Une erreur s'est produite lors de la connexion.",
    });
  }
};

const list = async (req, res) => {
  try {
    const users = await User.findAll();

    const userResponse = users.map((user) => {
      return {
        firstName: user.firstName,
        lastName: user.lastName,
        birthday: user.birthday,
        phone: user.phone,
        barcode: user.barcode,
        sponsoringCode: user.sponsoringCode,
        imageUrl: user.imageUrl,
        cashback: user.cashback,
        whatsapp: user.isWhatsapp,
      };
    });
    res.status(200).json({
      status: "success",
      users: userResponse,
    });
  } catch (error) {
    console.error(`Error listing users: ${error}`);
    res.status(500).json({
      status: "error",
      message:
        "Une erreur s'est produite lors de la recuperation de tous les utilisateurs.",
    });
  }
};

const getCashback = async (req, res) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res
        .status(401)
        .json({ status: "error", message: "Token non fourni." });
    }

    // Vérifiez si l'en-tête commence par "Bearer "
    if (!token.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ status: "error", message: "Format de token invalide." });
    }
    // Extrait le token en supprimant le préfixe "Bearer "
    const userToken = token.substring(7);
    let decodedToken;
    try {
      decodedToken = jwt.verify(userToken, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ status: "error", message: "TokenExpiredError" });
      }
      return res
        .status(401)
        .json({ status: "error", message: "Token invalide." });
    }
    const userId = decodedToken.id;
    const user = await User.findByPk(userId);
    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "Utilisateur non trouvé." });
    }

    const userCashback = await Cashback.findOne({
      where: { userId: user.id },
    });

    const cashbackAmount = userCashback.amount;

    res.status(200).json({
      status: "success",
      cashback: cashbackAmount,
    });
  } catch (error) {
    console.error(`Error getting user cashback: ${error}`);
    res.status(500).json({
      status: "error",
      message:
        "Une erreur s'est produite lors de la recuperation du cashback de l'utilisateur.",
    });
  }
};

const updateCashbackLimit = async (req, res) => {
  try {
    const token = req.headers.authorization;
    const { amount } = req.body;

    if (!token) {
      return res
        .status(401)
        .json({ status: "error", message: "Token non fourni." });
    }

    if (!amount) {
      return res
        .status(401)
        .json({ status: "error", message: "Montant non fourni." });
    }
    if (!token.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ status: "error", message: "Format de token invalide." });
    }
    const userToken = token.substring(7);
    let decodedToken;
    try {
      decodedToken = jwt.verify(userToken, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ status: "error", message: "TokenExpiredError" });
      }
      return res
        .status(401)
        .json({ status: "error", message: "Token invalide." });
    }
    const userId = decodedToken.id;
    const user = await User.findByPk(userId);
    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "Utilisateur non trouvé." });
    }
    const userCashback = await UserCashback.findOne({
      where: { userId: user.id },
    });

    if (!userCashback) {
      await UserCashback.create({
        userId: user.id,
        amount: amount,
      });
      return res.status(200).json({
        status: "success",
        message: "Cashback creé avec succes.",
      });
    }

    userCashback.amount = amount;

    await userCashback.save();

    res.status(200).json({
      status: "success",
      message: "Cashback mis à jour avec succes.",
    });
  } catch (error) {
    console.error(`Error updating cashback user: ${error}`);
    res.status(500).json({
      status: "error",
      message: "Une erreur s'est produite lors de la mise à jour du cashback.",
    });
  }
};

const getCashbackLimit = async (req, res) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res
        .status(401)
        .json({ status: "error", message: "Token non fourni." });
    }

    // Vérifiez si l'en-tête commence par "Bearer "
    if (!token.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ status: "error", message: "Format de token invalide." });
    }
    // Extrait le token en supprimant le préfixe "Bearer "
    const userToken = token.substring(7);
    let decodedToken;
    try {
      decodedToken = jwt.verify(userToken, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ status: "error", message: "TokenExpiredError" });
      }
      return res
        .status(401)
        .json({ status: "error", message: "Token invalide." });
    }
    const userId = decodedToken.id;
    const user = await User.findByPk(userId);
    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "Utilisateur non trouvé." });
    }

    const userCashback = await UserCashback.findOne({
      where: { userId: user.id },
    });

    const cashbackAmount = userCashback.amount;

    res.status(200).json({
      status: "success",
      cashback: cashbackAmount,
    });
  } catch (error) {
    console.error(`Error getting user cashback limit: ${error}`);
    res.status(500).json({
      status: "error",
      message:
        "Une erreur s'est produite lors de la recuperation du cashback de l'utilisateur.",
    });
  }
};

const getSponsoringAmount = async (req, res) => {
  try {
    const setting = await SettingSponsoring.findByPk(1);
    const godsonAmount = setting ? setting.godsonAmount : 0;
    const godfatherAmount = setting ? setting.godfatherAmount : 0;

    const response = {
      godsonAmount: godsonAmount,
      godfatherAmount: godfatherAmount,
    };

    res.status(200).json({
      status: "success",
      data: response,
    });
  } catch (error) {
    console.error(`Error getting refferral amount: ${error}`);
    res.status(500).json({
      status: "error",
      message:
        "Une erreur s'est produite lors de la recuperation des montant de parrainage des utilisateurs.",
    });
  }
};

const getTransactions = async (req, res) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res
        .status(401)
        .json({ status: "error", message: "Token non fourni." });
    }

    // Vérifiez si l'en-tête commence par "Bearer "
    if (!token.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ status: "error", message: "Format de token invalide." });
    }
    // Extrait le token en supprimant le préfixe "Bearer "
    const userToken = token.substring(7);
    let decodedToken;
    try {
      decodedToken = jwt.verify(userToken, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ status: "error", message: "TokenExpiredError" });
      }
      return res
        .status(401)
        .json({ status: "error", message: "Token invalide." });
    }
    const userId = decodedToken.id;
    const user = await User.findByPk(userId);
    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "Utilisateur non trouvé." });
    }

    const transaction = await TransactionFidelityCard.findAll({
      where: { userId: user.id },
    });

    const transactionsResponse = transaction.map((transaction) => ({
      id: transaction.id,
      ticketNumber: transaction.ticketNumber,
      ticketNumber: transaction.ticketNumber,
      ticketAmount: transaction.ticketAmount,
      ticketCashback: transaction.ticketCashback,
    }));

    res.status(200).json({
      status: "success",
      transactions: transactionsResponse,
    });
  } catch (error) {
    console.error(`Error getting user transaction: ${error}`);
    res.status(500).json({
      status: "error",
      message:
        "Une erreur s'est produite lors de la recuperation des transactions de l'utilisateur.",
    });
  }
};

const getUserVoucher = async (req, res) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res
        .status(401)
        .json({ status: "error", message: "Token non fourni." });
    }

    // Vérifiez si l'en-tête commence par "Bearer "
    if (!token.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ status: "error", message: "Format de token invalide." });
    }
    // Extrait le token en supprimant le préfixe "Bearer "
    const userToken = token.substring(7);
    let decodedToken;
    try {
      decodedToken = jwt.verify(userToken, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ status: "error", message: "TokenExpiredError" });
      }
      return res
        .status(401)
        .json({ status: "error", message: "Token invalide." });
    }
    const userId = decodedToken.id;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "L'utilisateur n'existe pas.",
      });
    }

    // Recherche du bon d'achat de l'utilisateur avec state=1
    const userVoucher = await Voucher.findOne({
      where: {
        userId: userId,
        state: 1,
      },
    });

    if (!userVoucher) {
      return res.status(404).json({
        status: "error",
        message: "Aucun bon d'achat actif trouvé pour cet utilisateur.",
      });
    }

    const voucherResponse = {
      id: userVoucher.id,
      amount: userVoucher.amount,
      expirateDate: userVoucher.expirateDate,
      ticketDate: userVoucher.ticketDate,
      ticketNumber: userVoucher.ticketNumber,
      ticketAmount: userVoucher.ticketAmount,
      ticketCashback: userVoucher.ticketCashback,
      state: userVoucher.state,
    };

    res.status(200).json({
      status: "success",
      voucher: voucherResponse,
    });
  } catch (error) {
    console.error(`ERROR GET USER VOUCHER: ${error}`);
    res.status(500).json({
      status: "error",
      message:
        "Une erreur s'est produite lors de la récupération du bon d'achat de l'utilisateur.",
    });
  }
};

const generateVoucher = async (req, res) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ status: "error", message: "Token non fourni." });
    }

    // Vérifiez si l'en-tête commence par "Bearer "
    if (!token.startsWith("Bearer ")) {
      return res.status(401).json({ status: "error", message: "Format de token invalide." });
    }

    // Extrait le token en supprimant le préfixe "Bearer "
    const userToken = token.substring(7);
    let decodedToken;
    try {
      decodedToken = jwt.verify(userToken, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ status: "error", message: "TokenExpiredError" });
      }
      return res.status(401).json({ status: "error", message: "Token invalide." });
    }

    const userId = decodedToken.id;

    const user = await User.findByPk(userId, {
      include: [
        {
          model: UserCashback,
          as: "usercashback",
        },
      ],
    });

    if (!user) {
      return res.status(404).json({ status: "error", message: "Utilisateur non trouvé." });
    }

    const userCashback = user.usercashback;

    if (!userCashback) {
      return res.status(404).json({ status: "error", message: "Montant du cashback non trouvé pour cet utilisateur." });
    }

    const setting = await Setting.findOne();

    if (!setting) {
      return res.status(404).json({ status: "error", message: "Configuration non trouvée." });
    }

    const cashback = await Cashback.findOne({
      where: {
        userId: userId,
      },
    });

    if (!cashback) {
      // Si le cashback n'existe pas encore, le créer
      await Cashback.create({
        userId: userId,
        amount: 0, // Vous pouvez ajuster cela en fonction de vos besoins
      });
    }

    const cashbackAmountThreshold = userCashback.amount;

    if (cashback.amount < cashbackAmountThreshold) {
      return res.status(400).json({
        status: "error",
        message: `Le montant du cashback est insuffisant. Minimum requis : ${cashbackAmountThreshold}.`,
      });
    }

    // Récupérer le nombre de jours à ajouter à la date actuelle
    const voucherDurate = setting.voucherDurate || 0;

    // Calculer la date d'expiration en ajoutant le nombre de jours à la date actuelle
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + voucherDurate);

    // Formater la date d'expiration au format YYYY-MM-DD
    const formattedExpirationDate = expirationDate.toISOString().split("T")[0];

    // Vérifier si un bon d'achat existe déjà pour cet utilisateur
    const existingVoucher = await Voucher.findOne({
      where: {
        userId: userId,
       // state: 1,  Ajouter d'autres conditions si nécessaire
      },
    });

    if (existingVoucher) {
      // Si un bon d'achat existe déjà, mettez à jour les informations et le champ state
      const amountVoucher = existingVoucher.amount + cashbackAmountThreshold;
      await existingVoucher.update({
        amount: amountVoucher,
        expirateDate: formattedExpirationDate,
        state: 1
      });
    } else {
      // Si aucun bon d'achat n'existe, créez-en un
      await Voucher.create({
        userId: userId,
        amount: cashback.amount,
        expirateDate: formattedExpirationDate,
        state: 1,
      });
    }

    // Réduire le montant du cashback de l'utilisateur après la génération ou la mise à jour du bon d'achat
    await cashback.update({
      amount: cashback.amount - cashbackAmountThreshold,
    });

    // Envoyer une réponse réussie avec un statut 200
    return res.status(200).json({
      status: "success",
      message: "Bon d'achat généré ou mis à jour avec succès.",
    });
  } catch (error) {
    console.error(`Erreur lors de la génération ou de la mise à jour du bon d'achat : ${error.message}`);

    // Envoyer une réponse d'erreur avec le statut approprié (par exemple, 500 pour une erreur interne du serveur)
    return res.status(500).json({
      status: "error",
      message: "Une erreur s'est produite lors de la génération ou de la mise à jour du bon d'achat.",
      error: error.message,
    });
  }
};


module.exports = {
  userCheck,
  validateCode,
  registerWithoutAccount,
  registerWithAccount,
  updateProfileImage,
  checkCode,
  login,
  list,
  getCashback,
  updateCashbackLimit,
  getCashbackLimit,
  getSponsoringAmount,
  getTransactions,
  getUserVoucher,
  generateVoucher,
};
