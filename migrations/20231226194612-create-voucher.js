'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Vouchers', {
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
          model: 'Caisses',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      amount: {
        type: Sequelize.DOUBLE,
        allowNull: false,
        defaultValue: 0
      },
      expirateDate: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      ticketDate: {
        type: Sequelize.STRING,
        allowNull: true
      },
      ticketNumber: {
        type: Sequelize.STRING,
        allowNull: true
      },
      ticketAmount: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      ticketCashback: {
        type: Sequelize.DOUBLE,
        allowNull: true
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
    await queryInterface.dropTable('Vouchers');
  }
};