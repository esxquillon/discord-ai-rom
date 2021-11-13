const { DataTypes, Model } = require('sequelize');

class Channel extends Model {}

module.exports = {
    Channel,
    define: (sequelize) => {
        Channel.init({
            channelId: {
                type: DataTypes.STRING,
                allowNull: false
            },
            channelName: DataTypes.STRING(50)
        }, {
            sequelize,
            modelName: 'channel'
        });
    }
};