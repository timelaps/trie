var b = require('@timelaps/batterie');
// b.REWRITABLE_LOG = false;
b.capture(function () {
    require('./tests');
});
b.finish().then(b.logger());