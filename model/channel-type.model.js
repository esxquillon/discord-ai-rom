const { DataTypes, Model } = require('sequelize');

class ChannelType extends Model {}

module.exports = {
    ChannelType,
    define: (sequelize) => {
        ChannelType.init({
            channelId: {
                type: DataTypes.TEXT,
                allowNull: false
            },
            type: {
                type: DataTypes.ENUM('EVENTS', 'MUSIC'),
                allowNull: false
            }
        }, {
            sequelize,
            modelName: 'channel_type'
        });
    }
};