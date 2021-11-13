const { DataTypes, Model } = require('sequelize');

class User extends Model {}

module.exports = {
    User,
    define: (sequelize) => {
        User.init({
            userId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            type: {
                type: DataTypes.ENUM('MASTER', 'FRIEND')
            }
        }, {
            sequelize,
            modelName: 'user'
        });
    }
};