'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Voucher extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      this.belongsTo(models.Caisse, { foreignKey: 'caisseId', as: 'caisse', allowNull: true });
    }
  }
  Voucher.init({
     userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    }, 
    caisseId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    amount: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0
    },
    expirateDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    ticketDate: {
      type: DataTypes.STRING,
      allowNull: true
    },
    ticketNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    ticketAmount: {
      type: DataTypes.DOUBLE,
      allowNull: true
    },
    ticketCashback: {
      type: DataTypes.DOUBLE,
      allowNull: true
    },
    state: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    }
  }, {
    sequelize,
    modelName: 'Voucher',
  });
  return Voucher;
};