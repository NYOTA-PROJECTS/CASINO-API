const express = require("express");
const caisseController = require("../controllers/caisseController");
const caisseTokenMiddleware = require("../middlewares/caisseTokenMiddleware");
const adminTokenMiddleware = require("../middlewares/adminTokenMiddleware");
const router = express.Router();

/**
 * @swagger
 * /api/v1/caisse/create:
 *   post:
 *     summary: Crée une caissière
 *     description: Crée une nouvelle caissière avec le prénom, le nom, le numéro de téléphone, l'email et le mot de passe fournis.
 *     tags:
 *       - Caisse
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         type: string
 *         required: true
 *         description: Token d'authentification Bearer de l'administrateur.
 *       - in: header
 *         name: ShopId
 *         required: true
 *         type: integer
 *         description: Identifiant du magasin.
 *       - in: body
 *         name: caisseDetails
 *         description: Informations de la caissière à créer
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             firstName:
 *               type: string
 *               description: Le prénom de la caissière
 *               example: John
 *             lastName:
 *               type: string
 *               description: Le nom de la caissière
 *               example: Doe
 *             phone:
 *               type: string
 *               description: Le numéro de portable de la caissière
 *               example: 066000000
 *             email:
 *               type: string
 *               description: L'email de la caissière
 *               example: john.doe@example.com
 *             password:
 *               type: string
 *               description: Le mot de passe de la caissière
 *               example: MotDePasseSecret
 *     responses:
 *       201:
 *         description: Succès - Renvoie les informations de la caissière créée.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 caisse:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     firstName:
 *                       type: string
 *                       example: John
 *                     lastName:
 *                       type: string
 *                       example: Doe
 *                     phone:
 *                       type: string
 *                       example: 123456789
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: caissiere@example.com
 *                     shopName:
 *                       type: string
 *                       example: NomMagasin
 *       400:
 *         description: Requête invalide - Vérifiez les paramètres de la requête.
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
 *                   example: Veuillez fournir le prénom de la caissière.
 *       401:
 *         description: Non autorisé - Vérifiez les droits d'accès.
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
 *                   example: Identifiant de magasin non fourni.
 *       404:
 *         description: Non trouvé - La boutique associée n'existe pas.
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
 *                   example: Le magasin n'existe pas.
 *       409:
 *         description: Conflit - Une caissière avec le même numéro de portable existe déjà.
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
 *                   example: Une caissière existe déjà avec ce numéro de portable.
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
 *                   example: Une erreur s'est produite lors de la création de la caissière.
 */
router.post("/create", adminTokenMiddleware, caisseController.createCaisse);

/**
 * @swagger
 * /api/v1/caisse/login:
 *   post:
 *     summary: Connexion de la caissière
 *     description: Connecte une caissière avec son numéro de portable et son mot de passe.
 *     tags:
 *       - Caisse
 *     parameters:
 *       - in: body
 *         name: credentials
 *         description: Informations d'identification pour la connexion
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             phone:
 *               type: string
 *               description: Le numéro de portable de la caissière
 *               example: 066000000
 *             password:
 *               type: string
 *               description: Le mot de passe de la caissière
 *               example: MotDePasseSecret
 *     responses:
 *       200:
 *         description: Succès - Renvoie les informations de la caissière connectée.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 caisse:
 *                   type: object
 *                   properties:
 *                     shopName:
 *                       type: string
 *                       example: NomMagasin
 *                     firstName:
 *                       type: string
 *                       example: John
 *                     lastName:
 *                       type: string
 *                       example: Doe
 *                     token:
 *                       type: string
 *                       example: JWTToken
 *       400:
 *         description: Requête invalide - Vérifiez les paramètres de la requête.
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
 *                   example: Numéro de portable non fourni.
 *       401:
 *         description: Non autorisé - Vérifiez les droits d'accès ou les informations d'identification.
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
 *                   example: La caisse n'existe pas. Veuillez vous inscrire au prealable.
 *       404:
 *         description: Non trouvé - La caissière n'existe pas.
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
 *                   example: La caisse n'existe pas.
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
 *                   example: Une erreur s'est produite lors de la connexion de la caisse.
 */
router.post("/login", caisseController.loginCaisse);

/**
 * @swagger
 * /api/v1/caisse/update-password:
 *   put:
 *     summary: Met à jour le mot de passe d'une caissière par l'administrateur
 *     description: Met à jour le mot de passe d'une caissière en utilisant son ID.
 *     tags:
 *       - Caisse
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         type: string
 *         required: true
 *         description: Token d'authentification Bearer de l'administrateur.
 *       - in: body
 *         name: updatePasswordDetails
 *         description: Informations pour mettre à jour le mot de passe
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             caisseId:
 *               type: integer
 *               description: L'ID de la caissière à mettre à jour.
 *               example: 1
 *             password:
 *               type: string
 *               description: Le nouveau mot de passe de la caissière
 *               example: NouveauMotDePasse
 *     responses:
 *       200:
 *         description: Succès - Le mot de passe de la caissière a été mis à jour avec succès.
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
 *                   example: Mot de passe mis à jour avec succès.
 *       400:
 *         description: Requête invalide - Vérifiez les paramètres de la requête.
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
 *                   example: Veuillez fournir l'ID de la caissière et le nouveau mot de passe.
 *       404:
 *         description: Non trouvé - La caissière n'existe pas.
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
 *                   example: La caissière n'existe pas.
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
 *                   example: Une erreur s'est produite lors de la mise à jour du mot de passe de la caissière.
 */
router.put("/update-password", adminTokenMiddleware, caisseController.updatePassword);

/**
 * @swagger
 * /api/v1/caisse/delete:
 *   delete:
 *     summary: Supprime une caissière
 *     description: Supprime une caissière en utilisant son ID.
 *     tags:
 *       - Caisse
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         type: string
 *         required: true
 *         description: Token d'authentification Bearer de l'administrateur.
 *       - in: header
 *         name: caisseId
 *         required: true
 *         type: integer
 *         description: Identifiant de la caissière à supprimer.
 *     responses:
 *       200:
 *         description: Succès - La caissière a été supprimée avec succès.
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
 *                   example: Caissière supprimée avec succès.
 *       400:
 *         description: Requête invalide - Vérifiez les paramètres de la requête.
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
 *                   example: Veuillez fournir l'ID de la caissière à supprimer.
 *       404:
 *         description: Non trouvé - La caissière n'existe pas.
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
 *                   example: La caissière n'existe pas.
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
 *                   example: Une erreur s'est produite lors de la suppression de la caissière.
 */
router.delete("/delete", adminTokenMiddleware, caisseController.deleteCaisse);

module.exports = router;