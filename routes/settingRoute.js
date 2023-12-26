const express = require('express');
const settingController = require('../controllers/settingController');
const adminTokenMiddleware = require('../middlewares/adminTokenMiddleware');
const router = express.Router();

/**
 * @swagger
 * /api/v1/setting/update-cashback:
 *   put:
 *     summary: Mettre à jour le montant du cashback
 *     description: |
 *       Met à jour le montant actuel du cashback dans les paramètres du système.
 *     tags:
 *       - Cashback
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         type: string
 *         required: true
 *         description: Token d'authentification Bearer de l'administrateur.
 *       - in: body
 *         name: updateCashbackAmountData
 *         description: Données de mise à jour du montant du cashback
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             amount:
 *               type: number
 *               description: Montant du cashback à mettre à jour
 *               example: 5.00
 *     responses:
 *       200:
 *         description: Succès - Le montant du cashback a été mis à jour avec succès.
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
 *                   example: "Le montant du cashback a été mis à jour avec succès."
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
 *                   example: "Veuillez fournir le montant du cashback."
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
 *                   example: "Une erreur s'est produite lors de la mise à jour du montant du cashback."
 */
router.put("/update-cashback", adminTokenMiddleware, settingController.updateCashbackAmount);

/**
 * @swagger
 * /api/v1/setting/cashback-amount:
 *   get:
 *     summary: Obtenir le montant du cashback
 *     description: |
 *       Récupère le montant actuel du cashback dans les paramètres du système.
 *     tags:
 *       - Cashback
 *     responses:
 *       200:
 *         description: Succès - Le montant du cashback a été récupéré avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 amount:
 *                   type: number
 *                   example: 5.00
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
 *                   example: "Une erreur s'est produite lors de la récupération du montant du cashback."
 */
router.get("/cashback-amount", settingController.getCashbackAmount);

module.exports = router;