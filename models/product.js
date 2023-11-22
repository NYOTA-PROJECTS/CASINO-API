'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Product.belongsTo(models.Shop, { foreignKey: 'shopId', onDelete: 'CASCADE' });
      Product.belongsTo(models.Shelve, { foreignKey: 'shelveId', onDelete: 'CASCADE' });
      Product.belongsTo(models.SubShelve, { foreignKey: 'subShelveId', onDelete: 'CASCADE' });
    }
  }
  Product.init({
    ShopId: DataTypes.INTEGER,
    ShelveId: DataTypes.INTEGER,
    SubShelveId: DataTypes.INTEGER,
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    brcode: DataTypes.STRING,
    price: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    }
  }, {
    sequelize,
    modelName: 'Product',
  });
  return Product;
};