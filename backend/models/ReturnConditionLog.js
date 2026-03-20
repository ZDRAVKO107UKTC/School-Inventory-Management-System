'use strict';

module.exports = (sequelize, DataTypes) => {
  const ReturnConditionLog = sequelize.define('ReturnConditionLog', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    request_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'requests',
        key: 'id'
      }
    },
    equipment_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'equipment',
        key: 'id'
      }
    },
    condition: {
      type: DataTypes.ENUM('new', 'good', 'fair', 'damaged'),
      allowNull: false
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    recorded_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'return_condition_logs',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  ReturnConditionLog.associate = function(models) {
    ReturnConditionLog.belongsTo(models.Request, {
      foreignKey: 'request_id',
      as: 'request'
    });

    ReturnConditionLog.belongsTo(models.Equipment, {
      foreignKey: 'equipment_id',
      as: 'equipment'
    });
  };

  return ReturnConditionLog;
};
