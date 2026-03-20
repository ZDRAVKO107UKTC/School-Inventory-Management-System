'use strict';

module.exports = (sequelize, DataTypes) => {
  const Equipment = sequelize.define('Equipment', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    serial_number: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    condition: {
      type: DataTypes.ENUM('new', 'good', 'fair', 'damaged'),
      allowNull: false,
      validate: {
        isIn: [['new', 'good', 'fair', 'damaged']]
      }
    },
    status: {
      type: DataTypes.ENUM('available', 'checked_out', 'under_repair', 'retired'),
      allowNull: false,
      defaultValue: 'available'
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true
    },
    photo_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 0
      }
    },
    room_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 'equipment',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Equipment.associate = function(models) {
    // Equipment can have many requests
    Equipment.hasMany(models.Request, {
      foreignKey: 'equipment_id',
      as: 'requests'
    });

    Equipment.hasMany(models.ReturnConditionLog, {
      foreignKey: 'equipment_id',
      as: 'conditionLogs'
    });
    Equipment.belongsTo(models.Room, {
      foreignKey: 'room_id',
      as: 'room'
    });
  };

  return Equipment;
};
