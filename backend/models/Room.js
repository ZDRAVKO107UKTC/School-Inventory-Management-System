'use strict';

module.exports = (sequelize, DataTypes) => {
  const Room = sequelize.define('Room', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    floor_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    path_data: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    x: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    y: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    width: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    height: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 'rooms',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Room.associate = function(models) {
    Room.belongsTo(models.Floor, {
      foreignKey: 'floor_id',
      as: 'floor'
    });
    Room.hasMany(models.Equipment, {
      foreignKey: 'room_id',
      as: 'equipment'
    });
  };

  return Room;
};
