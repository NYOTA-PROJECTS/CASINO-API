const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User, Caisse, Shop, Voucher, TransactionFidelityCard } = require("../models");

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

const updatePassword = async (req, res) => {
  try {
    const { caisseId, password } = req.body;

    if (!caisseId) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir l'ID de la caissière.",
      });
    }

    if (!password) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir le nouveau mot de passe.",
      });
    }

    // Récupérer la caissière depuis la base de données
    const caisse = await Caisse.findByPk(caisseId);

    if (!caisse) {
      return res.status(404).json({
        status: "error",
        message: "La caissière n'existe pas.",
      });
    }

    // Vérifier si le nouveau mot de passe a une longueur minimale de 4 caractères
    if (password.length < 4) {
      return res.status(400).json({
        status: "error",
        message:
          "Le nouveau mot de passe doit avoir une longueur minimale de 4 caractères.",
      });
    }

    // Hacher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Mettre à jour le mot de passe dans la base de données
    await caisse.update({ password: hashedPassword });

    res.status(200).json({
      status: "success",
      message: "Mot de passe mis à jour avec succès.",
    });
  } catch (error) {
    console.error(`ERROR UPDATE PASSWORD CAISSE: ${error}`);
    res.status(500).json({
      status: "error",
      message:
        "Une erreur s'est produite lors de la mise à jour du mot de passe de la caissière.",
    });
  }
};

const deleteCaisse = async (req, res) => {
  try {
      const { caisseId } = req.headers.caisseid;

      if (!caisseId) {
          return res.status(400).json({
              status: "error",
              message: "Veuillez fournir l'ID de la caissière à supprimer.",
          });
      }

      // Vérifier si la caissière existe
      const caisse = await Caisse.findByPk(caisseId);

      if (!caisse) {
          return res.status(404).json({
              status: "error",
              message: "La caissière n'existe pas.",
          });
      }

      // Supprimer la caissière de la base de données
      await caisse.destroy();

      res.status(200).json({
          status: "success",
          message: "Caissière supprimée avec succès.",
      });
  } catch (error) {
      console.error(`ERROR DELETE CAISSE: ${error}`);
      res.status(500).json({
          status: "error",
          message: "Une erreur s'est produite lors de la suppression de la caissière.",
      });
  }
};

const listCaissesByShop = async (req, res) => {
  try {
    const shopId = req.headers.shopid;

    if (!shopId) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir l'ID du magasin.",
      });
    }

    // Vérifier si le magasin existe
    const existingShop = await Shop.findByPk(shopId);
    if (!existingShop) {
      return res.status(404).json({
        status: "error",
        message: "Le magasin n'existe pas.",
      });
    }

    // Récupérer la liste des caisses pour le magasin spécifié
    const caisses = await Caisse.findAll({
      where: { shopId },
      attributes: ["id", "firstName", "lastName", "phone"],
    });

    res.status(200).json({
      status: "success",
      caisses,
    });
  } catch (error) {
    console.error(`ERROR LIST CAISSES: ${error}`);
    res.status(500).json({
      status: "error",
      message: "Une erreur s'est produite lors de la récupération des caisses.",
    });
  }
};

const clientInfos = async (req, res) => {
  try {
    const { barcode } =  req.body;
    if (!barcode) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez scanner le QR du client.",
      });
    }

    const client = await User.findOne({
      where: { barcode },
      attributes: ["id", "barcode", "firstName", "lastName", "phone", "imageUrl"],
    });

    if (!client) {
      return res.status(404).json({
        status: "error",
        message: "Cette carte de fidelité n'existe pas, veuillez scanner une autre carte ou réessayer à nouveau.",
      });
    }

    const clientResponse = {
      id: client.id,
      barcode: client.barcode,
      firstName: client.firstName,
      lastName: client.lastName,
      phone: client.phone,
      imageUrl: client.imageUrl,
    };
    
    res.status(200).json({
      status: "success",
      client: clientResponse,
    })
    
  } catch (error) {
    console.error(`ERROR RECUPERATION INFOS CLIENT: ${error}`);
    res.status(500).json({
      status: "error",
      message: "Une erreur s'est produite lors de la création de la caisse.",
    });
  }
}

const clientInfosVoucher = async (req, res) => {
  try {
    const { barcode } =  req.body;
    if (!barcode) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez scanner le QR du client.",
      });
    }

    const client = await User.findOne({
      where: { barcode },
      attributes: ["id", "barcode", "firstName", "lastName", "phone", "imageUrl"],
    });

    if (!client) {
      return res.status(404).json({
        status: "error",
        message: "Cette carte de fidelité n'existe pas, veuillez scanner une autre carte ou réessayer à nouveau.",
      });
    }

    const clientVoucher = await Voucher.findOne({
      where: { userId: client.id },
    }) 

    if (!clientVoucher) {
      return res.status(404).json({
        status: "error",
        message: "Le client n'a pas de bon d'achat.",
      });
    }

    const clientResponse = {
      id: client.id,
      barcode: client.barcode,
      firstName: client.firstName,
      lastName: client.lastName,
      phone: client.phone,
      imageUrl: client.imageUrl,
      amount: clientVoucher.amount || 0
    };
    
    res.status(200).json({
      status: "success",
      client: clientResponse,
    })
    
  } catch (error) {
    console.error(`ERROR RECUPERATION INFOS CLIENT: ${error}`);
    res.status(500).json({
      status: "error",
      message: "Une erreur s'est produite lors de la création de la caisse.",
    });
  }
}

const validateTicket = async (req, res) => {
  try {
    const { caisseId, userId, paymentType, date, number, amount, cashback } = req.body;

    if (!caisseId) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir l'ID de la caisse.",
      });  
    }

    if (!userId) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir l'ID de l'utilisateur.",
      });  
    }

    if (!paymentType) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir le type de paiement.",
      });  
    }

    if (!date) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir la date de la validation.",
      });  
    }

    if (!number) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir le numéro du ticket.",
      });
    }

    if (!amount) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir le montant du ticket.",
      });
    }

    if (!cashback) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir le montant du cashback.",
      });
    }

    const caisse = await Caisse.findOne({ where: { id: caisseId } });

    if (!caisse) {
      return res.status(404).json({
        status: "error",
        message: "La caisse n'existe pas.",
      });
    }

    const user = await User.findOne({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "L'utilisateur n'existe pas.",
      });
    }

    const transaction = await TransactionFidelityCard.create({
      userId,
      caisseId,
      paymentType: 1,
      ticketDate: date,
      ticketNumber: number,
      ticketAmount: amount,
      ticketCashback: cashback,
      state: 1
    });

    res.status(201).json({
      status: "success",
      message: "La validation de la commande a été effectuée avec succès.",
      transaction: transaction
    });

  } catch (error) {
    console.error(`ERROR VALIDATION DE TICKET: ${error}`);
    res.status(500).json({
      status: "error",
      message: "Une erreur s'est produite lors de la validation du ticket de l'utilisateur.",
    });
  }
}

const validateVoucher = async (req, res) => {
  try {
    const { caisseId, userId, date, number, amount, cashback } = req.body;

    if (!caisseId) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir l'ID de la caisse.",
      });  
    }

    if (!userId) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir l'ID de l'utilisateur.",
      });  
    }

    if (!date) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir la date de la validation.",
      });  
    }

    if (!number) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir le numéro du ticket.",
      });
    }

    if (!amount) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir le montant du ticket.",
      });
    }

    if (!cashback) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir le montant du cashback.",
      });
    }

    const caisse = await Caisse.findOne({ where: { id: caisseId } });

    if (!caisse) {
      return res.status(404).json({
        status: "error",
        message: "La caisse n'existe pas.",
      });
    }

    const user = await User.findOne({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "L'utilisateur n'existe pas.",
      });
    }

    const voucher = await Voucher.update(
      {
        caisseId: caisseId,
        ticketDate: date,
        ticketNumber: number,
        ticketAmount: amount,
        ticketCashback: cashback,
        state: 2
      },
      {
        where: { userId: userId },
      }
    );

    if (voucher && voucher[0] === 1) {
      res.status(200).json({
        status: "success",
        message: "Le bon d'achat a été validé avec succès.",
      });
    } else {
      res.status(500).json({
        status: "error",
        message: "Une erreur s'est produite lors de la validation du bon d'achat.",
      });
    }

  } catch (error) {
    console.error(`ERROR VALIDATION DE BON D'ACHAT: ${error}`);
    res.status(500).json({
      status: "error",
      message: "Une erreur s'est produite lors de la validation du bon d'achat.",
    });
  }
}

module.exports = {
  createCaisse,
  loginCaisse,
  updatePassword,
  deleteCaisse,
  listCaissesByShop,
  clientInfos,
  clientInfosVoucher,
  validateTicket,
  validateVoucher
};
