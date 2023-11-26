const bcrypt = require("bcrypt");
const { Deliveryman } = require("../models");

const createDeliveryman = async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;

    if (!name) {
        return res.status(401).json({
            status: "error",
            message: "Nom de livreur non fourni.",
        });
    }

    if (!phone) {
        return res.status(401).json({
            status: "error",
            message: "Numéro de portable de livreur non fourni.",
        });
    }

    if (!email) {
        return res.status(401).json({
            status: "error",
            message: "Adresse e-mail de livreur non fournie.",
        });
    }

    if (!password) {
        return res.status(401).json({
            status: "error",
            message: "Mot de passe de livreur non fourni.",
        });
    }

    if (password.length < 4) {
        return res.status(401).json({
            status: "error",
            message: "Le mot de passe doit contenir au moins 4 caractères.",
        });
    }

    // Vérifier si le livreur existe déjà par son nom et son téléphone
    const existingDeliveryman = await Deliveryman.findOne({
      where: {
        name: name,
        phone: phone,
      },
    });

    if (existingDeliveryman) {
      return res.status(409).json({
        status: "error",
        message: "Ce livreur existe déjà.",
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer le livreur
    const newDeliveryman = await Deliveryman.create({
      name: name,
      phone: phone,
      email: email,
      password: hashedPassword,
    });

    const deliverymanResponse = {
      id: newDeliveryman.id,
      name: newDeliveryman.name,
      phone: newDeliveryman.phone,
      email: newDeliveryman.email,
      createdAt: newDeliveryman.createdAt,
    };

    res.status(200).json({
      status: "success",
      deliveryman: deliverymanResponse,
    });
  } catch (error) {
    console.error(`ERROR CREATE DELIVERYMAN: ${error}`);
    res.status(500).json({
      status: "error",
      message: "Une erreur s'est produite lors de la création du livreur.",
    });
  }
};

const listDeliverymen = async (req, res) => {
    try {
        // Récupérer la liste de tous les livreurs
        const deliverymenList = await Deliveryman.findAll({
            attributes: ['id', 'name', 'phone', 'email'],
        });

        res.status(200).json({
            status: 'success',
            deliverymen: deliverymenList,
        });
    } catch (error) {
        console.error(`ERROR LIST DELIVERYMEN: ${error}`);
        res.status(500).json({
            status: 'error',
            message: "Une erreur s'est produite lors de la récupération de la liste des livreurs.",
        });
    }
};

const deleteDeliveryman = async (req, res) => {
  try {
    const deliverymanId = req.headers.deliverymanid;

    // Vérifier si le livreur existe
    const existingDeliveryman = await Deliveryman.findByPk(deliverymanId);

    if (!existingDeliveryman) {
      return res.status(404).json({
        status: "error",
        message: "Livreur non trouvé.",
      });
    }

    // Supprimer le livreur
    await existingDeliveryman.destroy();

    res.status(200).json({
      status: "success",
      message: "Livreur supprimé avec succès.",
    });
  } catch (error) {
    console.error(`ERROR DELETE DELIVERYMAN: ${error}`);
    res.status(500).json({
      status: "error",
      message: "Une erreur s'est produite lors de la suppression du livreur.",
    });
  }
};

module.exports = {
  createDeliveryman,
  listDeliverymen,
  deleteDeliveryman,
};
