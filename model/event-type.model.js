const { DataTypes, Model } = require('sequelize');

class EventType extends Model {}

module.exports = {
    EventType,
    define: (sequelize) => {
        EventType.init({
            eventName: {
                type: DataTypes.STRING({ length: 15 }),
                allowNull: false
            },
            memberCount: {
                type: DataTypes.INTEGER,
                allowNull: false
            }
        }, {
            sequelize,
            modelName: 'event_type'
        });
    }
};