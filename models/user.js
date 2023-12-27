'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.User, { foreignKey: 'sponsorId', onDelete: 'CASCADE' });
      this.hasOne(models.Cashback, { foreignKey: 'userId', as: 'cashback' });
      this.hasOne(models.UserCashback, { foreignKey: 'userId', as: 'usercashback' });
      this.hasOne(models.Voucher, { foreignKey: 'userId', as: 'voucher' });
      this.hasMany(models.SponsoringWallet, { foreignKey: 'userId', as: 'sponsoringwallet' });
    }
  }
  User.init({
    barcode: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    sponsorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    sponsoringCode: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    birthday: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isWhatsapp: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};