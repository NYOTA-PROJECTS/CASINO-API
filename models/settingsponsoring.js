'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SettingSponsoring extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  SettingSponsoring.init({
    godfatherAmount: DataTypes.DOUBLE,
    godsonAmount: DataTypes.DOUBLE
  }, {
    sequelize,
    modelName: 'SettingSponsoring',
  });
  return SettingSponsoring;
};