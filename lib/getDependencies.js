var async = require('async'),
    nodeResolve = require('./nodeResolve');

var requireRegEx = /(^r|=r| r)equire\( *['"]([^'"]*)['"] *\)/g,
    commentRegEx = /\/\*(.|\n)*?\*\/|\/\/.*/g;

function getModuleDependencies(path, data, callback) {
    var matches,
        dependencies = [];

    function finished(err) {
        callback(err || null, dependencies);
    }

    data = data.replace(commentRegEx, '');  // strip out comments
    matches = data.match(requireRegEx);  // extracting all require statements
    if (matches) {
        async.forEach(
            matches,
            function eachMatch(match, callback) {
                match = match.replace(/(^r|=r| r)equire\( *['"]/, '') // removes leading require('
                    .replace(/['"] *\)/, ''); // removes trailing ')
                nodeResolve(path, match, function resolved(err, result) {
                    if (!err) {
                        dependencies.push(result);
                    }
                    callback(err);
                });
            },
            finished
        )
    } else {
        finished(null);
    }
}

function getPackageDependencies(path, data, callback) {
    var singleRequire;

    function done(err, result) {
        callback(err, [result]);
    }

    try {
        singleRequire = JSON.parse(data).main;
        if (singleRequire.charAt(0) !== '.') {  // If the main file is not a relative path, make it relative. Node does it the same way.
            singleRequire = './' + singleRequire;
        }
        nodeResolve(path, singleRequire, done);
    } catch (err) {
        callback(err);
    }
}

function getDependencies(path, data, callback) {
    if (/\/package\.json$/i.test(path)) {
        getPackageDependencies(path, data, callback);
    } else {
        getModuleDependencies(path, data, callback);
    }
}

module.exports = getDependencies;