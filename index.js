const model = require('./sequalize');
const main = require('./src/main');

(async () => {
    await model.init();
    await main();
})();