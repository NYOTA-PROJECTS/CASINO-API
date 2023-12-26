const { Setting } = require("../models");

const updateCashbackAmount = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir le montant du cashback.",
      });
    }

    const setting = await Setting.findByPk(1);

    if (!setting) {
      setting = await Setting.create({ cashbackAmount: 0 });
    }

    setting.cashbackAmount = amount;

    await setting.save();
    res.status(200).json({
      status: "success",
      message: "Le montant du cashback a été mis à jour avec succès.",
    });
  } catch (error) {
    console.error(`ERROR UPDATE CASHBACK AMOUNT: ${error}`);
    res.status(500).json({
      status: "error",
      message:
        "Une erreur s'est produite lors de la mise à jour du montant du cashback.",
    });
  }
};

const getCashbackAmount = async (req, res) => {
  try {
    const setting = await Setting.findByPk(1);
    if (!setting) {
      setting = await Setting.create({ cashbackAmount: 0 });
    }

    res.status(200).json({
      status: "success",
      amount: setting.cashbackAmount,
    });
  } catch (error) {
    console.error(`ERROR GET CASHBACK AMOUNT: ${error}`);
    res.status(500).json({
      status: "error",
      message:
        "Une erreur s'est produite lors de la recuperation du montant du cashback.",
    });
  }
};

module.exports = { updateCashbackAmount, getCashbackAmount };
