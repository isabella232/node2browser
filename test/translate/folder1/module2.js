var module1 = require('./module1');

module.exports = function() {
    return module1() + 1;
}