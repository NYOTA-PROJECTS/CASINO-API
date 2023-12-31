const express = require("express");
const multer = require("multer");
const path = require("path");
const sharp = require("sharp");
const userController = require("../controllers/userController");
const adminTokenMiddleware = require("../middlewares/adminTokenMiddleware");
const userTokenMiddleware = require("../middlewares/userTokenMiddleware");
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/profiles");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Vérifiez le type de fichier si nécessaire
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Le fichier doit être une image."));
    }
  },
});

/**
 * @swagger
 * /api/v1/user/list-all:
 *   get:
 *     summary: Liste des utilisateurs
 *     description: Récupère la liste de tous les utilisateurs enregistrés.
 *     tags:
 *       - Utilisateur
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         type: string
 *         required: true
 *         description: Token d'authentification Bearer de l'administrateur.
 *     responses:
 *       200:
 *         description: Succès - La liste des utilisateurs a été récupérée avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       firstName:
 *                         type: string
 *                         example: John
 *                       lastName:
 *                         type: string
 *                         example: Doe
 *                       birthday:
 *                         type: string
 *                         format: date
 *                         example: 2000-01-01
 *                       phone:
 *                         type: string
 *                         example: "123456789"
 *                       barcode:
 *                         type: string
 *                         example: "abcdef123456"
 *                       sponsoringCode:
 *                         type: string
 *                         example: "abc123"
 *                       imageUrl:
 *                         type: string
 *                         example: "https://example.com/profile.jpg"
 *                       cashback:
 *                         type: number
 *                         example: 50.00
 *                       whatsapp:
 *                         type: boolean
 *                         example: true
 *       500:
 *         description: Erreur interne du serveur - Vérifiez les journaux pour plus de détails.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Une erreur s'est produite lors de la récupération de tous les utilisateurs."
 */
router.get("/list-all", adminTokenMiddleware, userController.list);

/**
 * @swagger
 * /api/v1/user/check:
 *   post:
 *     summary: Vérification de l'utilisateur et envoi de codes de sécurité
 *     description: |
 *       Vérifie si le numéro de portable est associé à une carte de fidélité.
 *       Envoie des codes de sécurité via SMS et retourne les informations de l'utilisateur le cas échéant.
 *     tags:
 *       - Utilisateur
 *     parameters:
 *       - in: body
 *         name: userCheckData
 *         description: Données pour la vérification de l'utilisateur
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             phone:
 *               type: string
 *               description: Numéro de portable de l'utilisateur
 *               example: "123456789"
 *     responses:
 *       200:
 *         description: Succès - Retourne les informations de l'utilisateur et les codes de sécurité
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 user:
 *                   type: object
 *                   properties:
 *                     firstName:
 *                       type: string
 *                       example: John
 *                     lastName:
 *                       type: string
 *                       example: Doe
 *                     amount:
 *                       type: number
 *                       example: 100
 *                 codes:
 *                   type: object
 *                   properties:
 *                     otpSms:
 *                       type: string
 *                       example: "123456"
 *       404:
 *         description: Non trouvé - Aucune carte de fidélité associée au numéro de portable
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Ce numéro de portable n'est affilié à aucune carte de fidélité.
 *       409:
 *         description: Conflit - Le numéro de portable est déjà associé à une carte de fidélité
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Ce numéro de portable est déjà associé à une carte de fidélité. Veuillez vous connecter.
 *       500:
 *         description: Erreur interne du serveur - Vérifiez les journaux pour plus de détails.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Une erreur s'est produite lors de la connexion à la carte de fidélité.
 */
router.post("/check", userController.userCheck);

/**
 * @swagger
 * /api/v1/user/validate-code:
 *   post:
 *     summary: Validation des codes de sécurité
 *     description: |
 *       Valide les codes de sécurité envoyés à l'utilisateur via SMS.
 *     tags:
 *       - Utilisateur
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         type: string
 *         required: true
 *         description: Token d'authentification Bearer.
 *       - in: body
 *         name: validateCodeData
 *         description: Données pour la validation des codes de sécurité
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             phone:
 *               type: string
 *               description: Numéro de portable de l'utilisateur
 *               example: "123456789"
 *             otp:
 *               type: string
 *               description: Code de sécurité à valider
 *               example: "123456"
 *     responses:
 *       200:
 *         description: Succès - Codes validés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Codes validés avec succès.
 *       401:
 *         description: Non autorisé - Codes invalides ou déjà utilisés
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Codes invalides ou déjà utilisés. Veuillez réessayer.
 *       500:
 *         description: Erreur interne du serveur - Vérifiez les journaux pour plus de détails.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Une erreur s'est produite lors de la validation des codes.
 */
router.post("/validate-otp", userController.validateCode);

/**
 * @swagger
 * /api/v1/user/register-without-account:
 *   post:
 *     summary: Inscription sans compte et avec carte de fidélité
 *     description: |
 *       Inscrit un nouvel utilisateur sans compte mais avec une carte de fidélité. Les informations nécessaires incluent le nom, le prénom, la date d'anniversaire, le code de parrainage, le numéro de portable et le mot de passe.
 *     tags:
 *       - Utilisateur
 *     parameters:
 *       - in: body
 *         name: registerWithoutAccountData
 *         description: Données d'inscription sans compte et avec carte de fidélité
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             firstName:
 *               type: string
 *               description: Prénom de l'utilisateur
 *               example: John
 *             lastName:
 *               type: string
 *               description: Nom de famille de l'utilisateur
 *               example: Doe
 *             birthday:
 *               type: string
 *               format: date
 *               description: Date d'anniversaire de l'utilisateur (format YYYY-MM-DD)
 *               example: 2000-01-01
 *             sponsorCode:
 *               type: string
 *               description: Code de parrainage de l'utilisateur
 *               example: "abc123"
 *             phone:
 *               type: string
 *               description: Numéro de portable de l'utilisateur
 *               example: "123456789"
 *             password:
 *               type: string
 *               description: Mot de passe de l'utilisateur
 *               example: MotDePasseSecret
 *     responses:
 *       201:
 *         description: Succès - Utilisateur inscrit avec succès avec les informations de carte de fidélité.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 user:
 *                   type: object
 *                   properties:
 *                     firstName:
 *                       type: string
 *                       example: John
 *                     lastName:
 *                       type: string
 *                       example: Doe
 *                     birthday:
 *                       type: string
 *                       format: date
 *                       example: 2000-01-01
 *                     phone:
 *                       type: string
 *                       example: "123456789"
 *                     sponsoringCode:
 *                       type: string
 *                       example: "abc123"
 *                     token:
 *                       type: string
 *                       example: "jwtToken"
 *       400:
 *         description: Requête invalide - Veuillez vérifier les paramètres de la requête.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Veuillez fournir le numéro de portable."
 *       409:
 *         description: Conflit - Le numéro de portable est déjà associé à une carte de fidélité.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Ce numéro de portable est déjà associé à une carte de fidélité."
 *       500:
 *         description: Erreur interne du serveur - Vérifiez les journaux pour plus de détails.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Une erreur s'est produite lors de la création de la carte de fidélité."
 */
router.post("/register-without-account", userController.registerWithoutAccount);

/**
 * @swagger
 * /api/v1/user/register-with-account:
 *   post:
 *     summary: Inscription avec compte et carte de fidélité
 *     description: |
 *       Inscrit un nouvel utilisateur avec un compte et une carte de fidélité. Les informations nécessaires incluent le nom, le prénom, la date d'anniversaire, le montant, le numéro de portable et le mot de passe.
 *     tags:
 *       - Utilisateur
 *     parameters:
 *       - in: body
 *         name: registerWithAccountData
 *         description: Données d'inscription avec compte et carte de fidélité
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             firstName:
 *               type: string
 *               description: Prénom de l'utilisateur
 *               example: John
 *             lastName:
 *               type: string
 *               description: Nom de famille de l'utilisateur
 *               example: Doe
 *             birthday:
 *               type: string
 *               format: date
 *               description: Date d'anniversaire de l'utilisateur (format YYYY-MM-DD)
 *               example: 2000-01-01
 *             amount:
 *               type: number
 *               description: Montant de la carte de fidélité
 *               example: 50.00
 *             phone:
 *               type: string
 *               description: Numéro de portable de l'utilisateur
 *               example: "123456789"
 *             password:
 *               type: string
 *               description: Mot de passe de l'utilisateur
 *               example: MotDePasseSecret
 *     responses:
 *       201:
 *         description: Succès - Utilisateur inscrit avec succès avec les informations de carte de fidélité.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 user:
 *                   type: object
 *                   properties:
 *                     firstName:
 *                       type: string
 *                       example: John
 *                     lastName:
 *                       type: string
 *                       example: Doe
 *                     birthday:
 *                       type: string
 *                       format: date
 *                       example: 2000-01-01
 *                     phone:
 *                       type: string
 *                       example: "123456789"
 *                     barcode:
 *                       type: string
 *                       example: "abcdef123456"
 *                     sponsoringCode:
 *                       type: string
 *                       example: "abc123"
 *                     cashback:
 *                       type: number
 *                       example: 50.00
 *                     token:
 *                       type: string
 *                       example: "jwtToken"
 *       400:
 *         description: Requête invalide - Veuillez vérifier les paramètres de la requête.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Veuillez fournir le numéro de portable."
 *       409:
 *         description: Conflit - Le numéro de portable est déjà associé à une carte de fidélité.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Ce numéro de portable est déjà associé à une carte de fidélité."
 *       500:
 *         description: Erreur interne du serveur - Vérifiez les journaux pour plus de détails.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Une erreur s'est produite lors de la création de la carte de fidélité."
 */
router.post("/register-with-account", userController.registerWithAccount);

/**
 * @swagger
 * /api/v1/user/update-profile-image:
 *   post:
 *     summary: Mettre à jour l'image de profil
 *     description: |
 *       Met à jour l'image de profil de l'utilisateur. L'utilisateur doit être authentifié via un token Bearer dans l'en-tête de la requête.
 *     tags:
 *       - Utilisateur
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         type: string
 *         required: true
 *         description: Token d'authentification Bearer.
 *       - in: formData
 *         name: profileImage
 *         type: file
 *         required: true
 *         description: Fichier image à téléverser pour la mise à jour de l'image de profil. La taille de l'image sera redimensionnée à 350x350 pixels.
 *     responses:
 *       200:
 *         description: Succès - Image de profil mise à jour avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Image de profil mise à jour avec succès.
 *                 profileImageUrl:
 *                   type: string
 *                   format: uri
 *                   example: http://example.com/profiles/123456_resized.jpg
 *       401:
 *         description: Non autorisé - Format de token invalide.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Format de token invalide.
 *       404:
 *         description: Non trouvé - L'utilisateur n'a pas été trouvé.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Utilisateur non trouvé.
 *       500:
 *         description: Erreur interne du serveur - Vérifiez les journaux pour plus de détails.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Une erreur est survenue lors de la mise à jour de l'image de profil.
 */
router.put("/update-profile-image", upload.single("profileImage"), userController.updateProfileImage);

/**
 * @swagger
 * /api/v1/user/check-sponsoring-code:
 *   post:
 *     summary: Vérifier la validité d'un code de parrainage.
 *     description: Vérifie si le code de parrainage fourni correspond à un utilisateur existant.
 *     tags:
 *       - Utilisateur
 *     parameters:
 *       - in: body
 *         name: body
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             sponsoringCode:
 *               type: string
 *               description: Le code de parrainage à vérifier.
 *               example: ABC123
 *     responses:
 *       200:
 *         description: Succès - Le code de parrainage est valide.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Le code de parrainage est valide.
 *       404:
 *         description: Aucun utilisateur trouvé avec ce code de parrainage.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Aucun utilisateur trouvé avec ce code de parrainage.
 *       400:
 *         description: Bad Request - Le code de parrainage n'est pas fourni.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Veuillez fournir un code de parrainage.
 *       500:
 *         description: Erreur interne du serveur - Vérifiez les journaux pour plus de détails.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Une erreur s'est produite lors de la vérification du code de parrainage.
 */
router.post("/check-sponsoring-code", userController.checkCode);

/**
 * @swagger
 * /api/v1/user/login:
 *   post:
 *     summary: Connexion de l'utilisateur
 *     description: |
 *       Permet à un utilisateur de se connecter en fournissant son numéro de téléphone et son mot de passe. Si la connexion est réussie, renvoie les détails de l'utilisateur et un jeton JWT.
 *     tags:
 *       - Utilisateur
 *     parameters:
 *       - in: body
 *         name: loginData
 *         description: Données de connexion de l'utilisateur
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             phone:
 *               type: string
 *               description: Numéro de portable de l'utilisateur
 *               example: "123456789"
 *             password:
 *               type: string
 *               description: Mot de passe de l'utilisateur
 *               example: MotDePasseSecret
 *     responses:
 *       200:
 *         description: Succès - Utilisateur connecté avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 user:
 *                   type: object
 *                   properties:
 *                     firstName:
 *                       type: string
 *                       example: John
 *                     lastName:
 *                       type: string
 *                       example: Doe
 *                     birthday:
 *                       type: string
 *                       format: date
 *                       example: 2000-01-01
 *                     phone:
 *                       type: string
 *                       example: "123456789"
 *                     barcode:
 *                       type: string
 *                       example: "abcdef123456"
 *                     sponsoringCode:
 *                       type: string
 *                       example: "abc123"
 *                     imageUrl:
 *                       type: string
 *                       example: "https://example.com/profile.jpg"
 *                     cashback:
 *                       type: number
 *                       example: 50.00
 *                     token:
 *                       type: string
 *                       example: "jwtToken"
 *       401:
 *         description: Échec de l'authentification - Vérifiez les informations de connexion.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Numéro de téléphone ou mot de passe incorrect."
 *       500:
 *         description: Erreur interne du serveur - Vérifiez les journaux pour plus de détails.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Une erreur s'est produite lors de la connexion."
 */
router.post("/login", userController.login);

/**
 * @swagger
 * /api/v1/user/cashback-amount:
 *   get:
 *     summary: Récupérer le cashback de l'utilisateur
 *     description: Récupère le montant du cashback associé à l'utilisateur authentifié.
 *     tags:
 *       - Utilisateur
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         type: string
 *         required: true
 *         description: Token d'authentification Bearer.
 *     responses:
 *       200:
 *         description: Succès - Le montant du cashback de l'utilisateur a été récupéré avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 cashback:
 *                   type: number
 *                   example: 50.00
 *       401:
 *         description: Erreur d'authentification - Veuillez fournir un token valide.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Token non fourni."
 *       404:
 *         description: Utilisateur non trouvé - L'utilisateur associé au token n'a pas été trouvé.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Utilisateur non trouvé."
 *       500:
 *         description: Erreur interne du serveur - Vérifiez les journaux pour plus de détails.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Une erreur s'est produite lors de la récupération du cashback de l'utilisateur."
 */
router.get("/cashback-amount",  userController.getCashback);

/**
 * @swagger
 * /api/v1/user/cashback-limi:
 *   get:
 *     summary: Récupérer la limite du cashback de l'utilisateur
 *     description: Récupère le montant du cashback limite définis par l'utilisateur authentifié.
 *     tags:
 *       - Utilisateur
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         type: string
 *         required: true
 *         description: Token d'authentification Bearer.
 *     responses:
 *       200:
 *         description: Succès - Le montant du cashback de l'utilisateur a été récupéré avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 cashback:
 *                   type: number
 *                   example: 50.00
 *       401:
 *         description: Erreur d'authentification - Veuillez fournir un token valide.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Token non fourni."
 *       404:
 *         description: Utilisateur non trouvé - L'utilisateur associé au token n'a pas été trouvé.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Utilisateur non trouvé."
 *       500:
 *         description: Erreur interne du serveur - Vérifiez les journaux pour plus de détails.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Une erreur s'est produite lors de la récupération du cashback de l'utilisateur."
 */
router.get("/cashback-limit",  userController.getCashbackLimit);

/**
 * @swagger
 * /api/v1/user/sponsoring-amount:
 *   get:
 *     summary: Récupérer les montants de parrainage
 *     description: Récupère les montants associés aux parrainages (filleul et parrain).
 *     tags:
 *       - Utilisateur
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         type: string
 *         required: true
 *         description: Token d'authentification Bearer.
 *     responses:
 *       200:
 *         description: Succès - Les montants de parrainage ont été récupérés avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     godsonAmount:
 *                       type: number
 *                       example: 10.00
 *                       description: Montant associé au filleul.
 *                     godfatherAmount:
 *                       type: number
 *                       example: 5.00
 *                       description: Montant associé au parrain.
 *       500:
 *         description: Erreur interne du serveur - Vérifiez les journaux pour plus de détails.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Une erreur s'est produite lors de la récupération des montants de parrainage."
 */
router.get("/sponsoring-amount", userController.getSponsoringAmount);

/**
 * @swagger
 * /api/v1/user/transactions:
 *   get:
 *     summary: Récupérer les transactions de l'utilisateur
 *     description: Récupère les transactions associées à l'utilisateur.
 *     tags:
 *       - Transactions
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         type: string
 *         required: true
 *         description: Token d'authentification Bearer.
 *     responses:
 *       200:
 *         description: Succès - Les transactions de l'utilisateur ont été récupérées avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 transactions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                         description: ID de la transaction.
 *                       ticketNumber:
 *                         type: string
 *                         example: "ABC123"
 *                         description: Numéro du ticket.
 *                       ticketAmount:
 *                         type: number
 *                         example: 50.00
 *                         description: Montant du ticket.
 *                       ticketCashback:
 *                         type: number
 *                         example: 5.00
 *                         description: Montant de cashback associé au ticket.
 *       401:
 *         description: Non autorisé - Veuillez fournir un token d'authentification valide.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Token non fourni."
 *       500:
 *         description: Erreur interne du serveur - Vérifiez les journaux pour plus de détails.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Une erreur s'est produite lors de la récupération des transactions de l'utilisateur."
 */
router.get("/transactions", userController.getTransactions);

/**
 * @swagger
 * /api/v1/user/update-cashback-limit:
 *   put:
 *     summary: Mettre à jour le montant du cashback de l'utilisateur
 *     description: Met à jour le montant du cashback associé à l'utilisateur authentifié.
 *     tags:
 *       - Utilisateur
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         type: string
 *         required: true
 *         description: Token d'authentification Bearer.
 *       - in: body
 *         name: updateCashbackData
 *         description: Données de mise à jour du montant du cashback
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             amount:
 *               type: number
 *               description: Nouveau montant du cashback
 *               example: 75.00
 *     responses:
 *       200:
 *         description: Succès - Le montant du cashback de l'utilisateur a été mis à jour avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: "Cashback mis à jour avec succès."
 *       401:
 *         description: Erreur d'authentification - Veuillez fournir un token valide.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Token non fourni."
 *       404:
 *         description: Utilisateur non trouvé - L'utilisateur associé au token n'a pas été trouvé.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Utilisateur non trouvé."
 *       500:
 *         description: Erreur interne du serveur - Vérifiez les journaux pour plus de détails.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Une erreur s'est produite lors de la mise à jour du cashback."
 */
router.put("/update-cashback-limit", userController.updateCashbackLimit);

/**
 * @swagger
 * /api/v1/user/voucher:
 *   get:
 *     summary: Récupérer le bon d'achat actif de l'utilisateur
 *     description: Récupère le bon d'achat actif associé à l'utilisateur.
 *     tags:
 *       - Bon d'achat
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         type: string
 *         required: true
 *         description: Token d'authentification Bearer.
 *     responses:
 *       200:
 *         description: Succès - Le bon d'achat actif de l'utilisateur a été récupéré avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 voucher:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                       description: ID du bon d'achat.
 *                     amount:
 *                       type: number
 *                       example: 10.00
 *                       description: Montant du bon d'achat.
 *                     expirateDate:
 *                       type: string
 *                       example: "2023-12-31"
 *                       description: Date d'expiration du bon d'achat (YYYY-MM-DD).
 *                     ticketDate:
 *                       type: string
 *                       example: "2023-01-01"
 *                       description: Date du ticket associé au bon d'achat (YYYY-MM-DD).
 *                     ticketNumber:
 *                       type: string
 *                       example: "ABC123"
 *                       description: Numéro du ticket associé au bon d'achat.
 *                     ticketAmount:
 *                       type: number
 *                       example: 50.00
 *                       description: Montant du ticket associé au bon d'achat.
 *                     ticketCashback:
 *                       type: number
 *                       example: 5.00
 *                       description: Montant de cashback associé au ticket du bon d'achat.
 *                     state:
 *                       type: integer
 *                       example: 1
 *                       description: État du bon d'achat (1 pour actif, 0 pour inactif).
 *       401:
 *         description: Non autorisé - Veuillez fournir un token d'authentification valide.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Token non fourni."
 *       404:
 *         description: Non trouvé - Aucun bon d'achat actif trouvé pour cet utilisateur.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Aucun bon d'achat actif trouvé pour cet utilisateur."
 *       500:
 *         description: Erreur interne du serveur - Vérifiez les journaux pour plus de détails.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Une erreur s'est produite lors de la récupération du bon d'achat de l'utilisateur."
 */
router.get("/voucher", userController.getUserVoucher);

/**
 * @swagger
 * /api/v1/user/voucher-generate:
 *   post:
 *     summary: Générer ou mettre à jour un bon d'achat pour l'utilisateur
 *     description: Génère ou met à jour un bon d'achat pour l'utilisateur en fonction du montant du cashback accumulé.
 *     tags:
 *       - Bon d'achat
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         type: string
 *         required: true
 *         description: Token d'authentification Bearer.
 *     responses:
 *       200:
 *         description: Succès - Bon d'achat généré ou mis à jour avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: "Bon d'achat généré ou mis à jour avec succès."
 *       400:
 *         description: Requête incorrecte - Le montant du cashback est insuffisant.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Le montant du cashback est insuffisant. Minimum requis : 50.00."
 *       401:
 *         description: Non autorisé - Veuillez fournir un token d'authentification valide.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Token non fourni."
 *       404:
 *         description: Non trouvé - Utilisateur non trouvé, configuration non trouvée, ou bon d'achat non trouvé.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Utilisateur non trouvé."
 *       500:
 *         description: Erreur interne du serveur - Vérifiez les journaux pour plus de détails.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Une erreur s'est produite lors de la génération ou de la mise à jour du bon d'achat."
 *                 error:
 *                   type: string
 *                   example: "Message d'erreur détaillé."
 */
router.post("/voucher-generate", userController.generateVoucher);

module.exports = router;
