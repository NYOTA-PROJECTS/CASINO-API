'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TransactionFidelityCards', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      caisseId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Caisse',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      paymentType: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      ticketDate: {
        type: Sequelize.STRING,
        allowNull: false
      },
      ticketNumber: {
        type: Sequelize.STRING,
        allowNull: false
      },
      ticketAmount: {
        type: Sequelize.DOUBLE,
        allowNull: false,
        defaultValue: 0
      },
      ticketCashback: {
        type: Sequelize.DOUBLE,
        allowNull: false,
        defaultValue: 0
      },
      state: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('TransactionFidelityCards');
  }
};