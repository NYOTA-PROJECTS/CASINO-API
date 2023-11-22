'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SubShelve extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      SubShelve.belongsTo(models.Shelve, { foreignKey: 'shelveId', onDelete: 'CASCADE' });
    }
  }
  SubShelve.init({
    ShelveId: DataTypes.INTEGER,
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      minLength: 3
    },
    image: {
      type: DataTypes.STRING,
      allowNull: false,
    }
  }, {
    sequelize,
    modelName: 'SubShelve',
  });
  return SubShelve;
};