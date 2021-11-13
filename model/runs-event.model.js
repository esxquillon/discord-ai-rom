const { DataTypes, Model } = require('sequelize');

class RunsEvent extends Model {}

module.exports = {
    RunsEvent,
    define: (sequelize) => {
        RunsEvent.init({
            channelId: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            session: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            type: {
                type: DataTypes.STRING({ length: 15 }),
                allowNull: false
            },
            data: {
                type: DataTypes.TEXT,
                allowNull: false,
                default: '{}'
            },
            status: {
                type: DataTypes.ENUM('PROGRESS', 'COMPLETE'),
                allowNull: false
            }
        }, {
            sequelize,
            modelName: 'run_event'
        });
    }
};