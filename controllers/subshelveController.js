const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const { Op } = require("sequelize");
const { SubShelve, Shelve } = require("../models");

const createSubShelve = async (req, res) => {
  try {
    const { shelveId, name } = req.body;

    // Vérifier si le rayon (Shelve) existe
    const existingShelve = await Shelve.findByPk(shelveId);

    if (!existingShelve) {
      return res.status(404).json({
        status: "error",
        message: "Rayon non trouvé.",
      });
    }
    // Vérifier si le sous-rayon existe déjà pour le même rayon
    const existingSubShelve = await SubShelve.findOne({
      where: {
        ShelveId: shelveId,
        name,
      },
    });
    if (existingSubShelve) {
      return res.status(409).json({
        status: "error",
        message: "Un sous-rayon avec le même nom existe déjà pour ce rayon.",
      });
    }

    // Utilisation de Sharp pour redimensionner l'image à 250x250
    const resizedImagePath = path.join(
      __dirname,
      "..",
      "public/uploads/subshelves",
      `resized_${req.file.filename}`
    );
    const resizedImageDirectory = path.dirname(resizedImagePath);

    // Crée le répertoire s'il n'existe pas
    if (!fs.existsSync(resizedImageDirectory)) {
      fs.mkdirSync(resizedImageDirectory, { recursive: true });
    }

    await sharp(req.file.path).resize(250, 250).toFile(resizedImagePath);

    // Créer le sous-rayon
    const newSubShelve = await SubShelve.create({
      ShelveId: shelveId,
      name,
      imageUrl: req.file
        ? `${req.protocol}://${req.get("host")}/uploads/subshelves/resized_${
            req.file.filename
          }`
        : null,
    });

    const subShelveResponse = {
      id: newSubShelve.id,
      shelveId: newSubShelve.ShelveId,
      name: newSubShelve.name,
      imageUrl: newSubShelve.imageUrl,
      createdAt: newSubShelve.createdAt,
    };

    res.status(200).json({
      status: "success",
      subShelve: subShelveResponse,
    });
  } catch (error) {
    console.error(`ERROR CREATING SUBSHELVE: ${error}`);
    res.status(500).json({
      status: "error",
      message: "Erreur lors de la création du sous-rayon.",
    });
  }
};

const updateShelveName = async (req, res) => {
  try {
    const { shelveId, newName } = req.body;

    // Vérifiez si le rayon existe
    const existingShelve = await Shelve.findByPk(shelveId);

    if (!existingShelve) {
      return res.status(404).json({
        status: "error",
        message: "Rayon non trouvé.",
      });
    }

    // Vérifiez si le nouveau nom est déjà utilisé pour le même magasin (évitez les conflits)
    const otherShelveWithSameName = await Shelve.findOne({
      where: {
        name: newName,
        shopId: existingShelve.shopId,
        id: { [Op.not]: shelveId }, // Exclure le rayon actuel de la recherche
      },
    });

    if (otherShelveWithSameName) {
      return res.status(409).json({
        status: "error",
        message:
          "Un autre rayon avec le même nom existe déjà pour cette boutique.",
      });
    }

    // Mise à jour du nom du rayon
    await existingShelve.update({
      name: newName,
    });

    const shelveResponse = {
      id: existingShelve.id,
      name: newName,
      shopId: existingShelve.shopId,
      createdAt: existingShelve.createdAt,
    };

    res.status(200).json({
      status: "success",
      shelve: shelveResponse,
    });
  } catch (error) {
    console.error(`ERROR UPDATING SHELVE NAME: ${error}`);
    res.status(500).json({
      status: "error",
      message:
        "Une erreur s'est produite lors de la mise à jour du nom du rayon.",
    });
  }
};

const getSubShelvesList = async (req, res) => {
  try {
    // Utilisez la méthode findAll pour récupérer tous les sous-rayons avec les informations associées
    const subShelvesList = await SubShelve.findAll({
      include: [
        {
          model: Shelve,
          attributes: ["id", "name"], // Sélectionnez uniquement les attributs nécessaires du rayon parent
        },
      ],
      attributes: ["id", "name", "imageUrl", "createdAt"], // Sélectionnez les attributs nécessaires du sous-rayon
    });

    // Transformez les données au besoin pour la réponse
    const subShelvesResponse = subShelvesList.map((subShelve) => ({
      id: subShelve.id,
      shelveId: subShelve.Shelve.id,
      shelveName: subShelve.Shelve.name,
      name: subShelve.name,
      imageUrl: subShelve.imageUrl,
      createdAt: subShelve.createdAt,
    }));

    res.status(200).json({
      status: "success",
      subShelves: subShelvesResponse,
    });
  } catch (error) {
    console.error(`ERROR GETTING SUBSHELVES LIST: ${error}`);
    res.status(500).json({
      status: "error",
      message:
        "Une erreur s'est produite lors de la récupération de la liste des sous-rayons.",
    });
  }
};

const deleteSubShelve = async (req, res) => {
  try {
    const subShelveId = req.headers.subShelveID;

    // Vérifiez si le sous-rayon existe
    const existingSubShelve = await SubShelve.findByPk(subShelveId);

    if (!existingSubShelve) {
      return res.status(404).json({
        status: "error",
        message: "Sous-rayon non trouvé.",
      });
    }

    // Suppression du sous-rayon
    await existingSubShelve.destroy();

    res.status(200).json({
      status: "success",
      message: "Sous-rayon supprimé avec succès.",
    });
  } catch (error) {
    console.error(`ERROR DELETING SUBSHELVE: ${error}`);
    res.status(500).json({
      status: "error",
      message:
        "Une erreur s'est produite lors de la suppression du sous-rayon.",
    });
  }
};

const updateSubShelveImage = async (req, res) => {
  try {
    const { subShelveId } = req.body;

    // Vérifiez si le sous-rayon existe
    const existingSubShelve = await SubShelve.findByPk(subShelveId);

    if (!existingSubShelve) {
      return res.status(404).json({
        status: "error",
        message: "Sous-rayon non trouvé.",
      });
    }

    // Vérifiez si une nouvelle image a été téléchargée
    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "Aucune nouvelle image fournie.",
      });
    }

    // Utilisation de Sharp pour redimensionner la nouvelle image
    const resizedImagePath = path.join(
      __dirname,
      "..",
      "public/uploads/subshelves",
      `resized_${req.file.filename}`
    );

    await sharp(req.file.path).resize(250, 250).toFile(resizedImagePath);

    const newImageUrl = `${req.protocol}://${req.get(
      "host"
    )}/uploads/subshelves/resized_${req.file.filename}`;

    // Mise à jour de l'image du sous-rayon
    const updatedSubShelve = await existingSubShelve.update({
      imageUrl: newImageUrl,
    });

    const subShelveResponse = {
      name: updatedSubShelve.name,
      imageUrl: updatedSubShelve.imageUrl,
      updatedAt: updatedSubShelve.updatedAt,
    };

    res.status(200).json({
      status: "success",
      subShelve: subShelveResponse,
    });
  } catch (error) {
    console.error(`ERROR UPDATING SUBSHELVE IMAGE: ${error}`);
    res.status(500).json({
      status: "error",
      message:
        "Une erreur s'est produite lors de la mise à jour de l'image du sous-rayon.",
    });
  }
};

module.exports = {
  createSubShelve,
  updateShelveName,
  getSubShelvesList,
  deleteSubShelve,
  updateSubShelveImage,
};
