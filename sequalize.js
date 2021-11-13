const { Sequelize } = require('sequelize');
const path = require("path");

const sequelize = new Sequelize(
  'database',
  'user',
  'password',
  {
    host: "0.0.0.0",
    dialect: "sqlite",
    pool: {
      max: 5,
      min: 0,
      idle: 10000
    },
    // Data is stored in the file `database.sqlite` in the folder `db`.
    // Note that if you leave your app public, this database file will be copied if
    // someone forks your app. So don't use it to store sensitive information.
    storage: path.join(__dirname, 'database.db')
  }
);

module.exports = {
  init: async () => {
    var normalizedPath = path.join(__dirname, "model");
    require("fs").readdirSync(normalizedPath).forEach(function(file) {
      require("./model/" + file).define(sequelize);
    });
    await sequelize.sync();
  }
};