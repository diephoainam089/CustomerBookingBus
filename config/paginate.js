var Product = require('../models/product')
module.exports = async function paginate(pages, limitNum) {
    var productChunks = [];
    await Product.paginate({}, {
        page: pages,
        limit: limitNum
    }, function (err, result) {
        var chuckSize = 4;
        for (var i = 0; i < result.docs.length; i += chuckSize) {
            productChunks.push(result.docs.slice(i, i + chuckSize))
        }
    });
    return await productChunks;
}