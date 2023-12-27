'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TransactionFidelityCard extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      this.belongsTo(models.Caisse, { foreignKey: 'caisseId', as: 'caisse' });
    }
  }
  TransactionFidelityCard.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    caisseId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    paymentType: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    ticketDate: {
      type: DataTypes.STRING,
      allowNull: false
    },
    ticketNumber: {
      type: DataTypes.STRING,
      allowNull: false
    },
    ticketAmount: {
      type: DataTypes.DOUBLE(20, 2),
      allowNull: false
    },
    ticketCashback: {
      type: DataTypes.DOUBLE(20, 2),
      allowNull: false
    },
    state: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    }
  }, {
    sequelize,
    modelName: 'TransactionFidelityCard',
  });
  return TransactionFidelityCard;
};