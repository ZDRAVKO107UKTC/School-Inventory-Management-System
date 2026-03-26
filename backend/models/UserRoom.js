'use strict';

module.exports = (sequelize, DataTypes) => {
  const UserRoom = sequelize.define('UserRoom', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    room_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'rooms',
        key: 'id'
      }
    }
  }, {
    tableName: 'user_rooms',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return UserRoom;
};
