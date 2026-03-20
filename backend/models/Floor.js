'use strict';

module.exports = (sequelize, DataTypes) => {
  const Floor = sequelize.define('Floor', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    tableName: 'floors',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Floor.associate = function(models) {
    Floor.hasMany(models.Room, {
      foreignKey: 'floor_id',
      as: 'rooms'
    });
  };

  return Floor;
};
