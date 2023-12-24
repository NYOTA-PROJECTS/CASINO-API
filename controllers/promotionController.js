const { User, Shop, Promotion } = require("../models");
const Op = require("sequelize").Op;

const createPromotion = async (req, res) => {
  try {
    const shopId = req.headers.shopid;
    const { startAt, endAt } = req.body;

    if (!shopId) {
      return res.status(400).json({
        status: "error",
        message: "ID de la boutique manquant.",
      });
    }

    if (!startAt || !isValidDateFormat(startAt)) {
      return res.status(400).json({
        status: "error",
        message:
          "Date de début manquante ou format invalide (doit être YYYY-MM-DD).",
      });
    }

    if (!endAt || !isValidDateFormat(endAt)) {
      return res.status(400).json({
        status: "error",
        message:
          "Date de fin manquante ou format invalide (doit être YYYY-MM-DD).",
      });
    }

    const existingShop = await Shop.findByPk(shopId);

    if (!existingShop) {
      return res.status(404).json({
        status: "error",
        message: "Boutique non trouvée.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "Aucune image de la promotion n'a été fournie.",
      });
    }

    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/promotions/${
      req.file.filename
    }`;

    const promotion = await Promotion.create({
      shopId: shopId,
      imageUrl: imageUrl,
      startAt: startAt,
      endAt: endAt,
    });

    const promotionResponse = {
      id: promotion.id,
      shopId: promotion.shopId,
      imageUrl: promotion.imageUrl,
      startAt: promotion.startAt,
      endAt: promotion.endAt,
    };

    res.status(201).json({
      status: "success",
      data: promotionResponse,
    });
  } catch (error) {
    console.error(`ERROR CREATE PROMOTION: ${error}`);
    res.status(500).json({
      status: "error",
      message: "Une erreur s'est produite lors de la création de la promotion.",
    });
  }
};

const listPromotionsByShopId = async (req, res) => {
  try {
    const shopId = req.headers.shopid;

    if (!shopId) {
      return res.status(400).json({
        status: "error",
        message: "ID de la boutique manquant dans les en-têtes.",
      });
    }

    const existingShop = await Shop.findByPk(shopId);

    if (!existingShop) {
      return res.status(404).json({
        status: "error",
        message: "Boutique non trouvée.",
      });
    }

    const promotions = await Promotion.findAll({
      where: { shopId: shopId },
      order: [["createdAt", "DESC"]],
    });

    const promotionsResponse = promotions.map((promotion) => ({
      id: promotion.id,
      imageUrl: promotion.imageUrl,
      startAt: promotion.startAt,
      endAt: promotion.endAt,
    }));

    res.status(200).json({
      status: "success",
      promotions: promotionsResponse,
    });
  } catch (error) {
    console.error(`ERROR LIST PROMOTIONS BY SHOP ID: ${error}`);
    res.status(500).json({
      status: "error",
      message:
        "Une erreur s'est produite lors de la récupération des promotions de la boutique.",
    });
  }
};

const deletePromotion = async (req, res) => {
  try {
    const promotionId = req.body.promotionId;

    // Vérifier si la promotion existe
    const promotion = await Promotion.findByPk(promotionId);

    if (!promotion) {
      return res.status(404).json({
        status: 'error',
        message: 'La promotion spécifiée n\'existe pas.',
      });
    }

    // Supprimer la promotion
    await promotion.destroy();

    res.status(200).json({
      status: 'success',
      message: 'La promotion a été supprimée avec succès.',
    });
  } catch (error) {
    console.error(`ERROR DELETE PROMOTION: ${error}`);
    res.status(500).json({
      status: 'error',
      message: 'Une erreur s\'est produite lors de la suppression de la promotion.',
    });
  }
};

const listActivePromotions = async (req, res) => {
  try {
    // Récupérer la date actuelle
    const currentDate = new Date();

    // Trouver les promotions actives
    const activePromotions = await Promotion.findAll({
      where: {
        endAt: {
          [Op.lte]: currentDate, // Op.lte signifie "inférieur ou égal"
        },
      },
      include: {
        model: Shop,
        attributes: ['name'], // Inclure uniquement le nom de la boutique
      },
      order: [['createdAt', 'DESC']],
    });

    const activePromotionsResponse = activePromotions.map((promotion) => ({
      id: promotion.id,
      shopName: promotion.Shop.name,
      imageUrl: promotion.imageUrl,
      startAt: promotion.startAt,
      endAt: promotion.endAt,
    }));

    res.status(200).json({
      status: 'success',
      promotions: activePromotionsResponse,
    });
  } catch (error) {
    console.error(`ERROR LIST ACTIVE PROMOTIONS: ${error}`);
    res.status(500).json({
      status: 'error',
      message: 'Une erreur s\'est produite lors de la récupération des promotions actives.',
    });
  }
};

function isValidDateFormat(date) {
  const dateFormat = /^\d{4}-\d{2}-\d{2}$/;
  return dateFormat.test(date);
}

module.exports = { createPromotion, listPromotionsByShopId, deletePromotion, listActivePromotions, };
