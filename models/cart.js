module.exports = function Cart(oldCart) {
    this.items = oldCart.items || {};
    this.totalQty = oldCart.totalQty || 0;
    this.totalPrice = oldCart.totalPrice || 0;
    this.coupons = oldCart.coupons || {
        description: 0,
        discount: 0
    };
    this.totalDiscount = oldCart.totalDiscount || this.totalPrice;
    this.add = function (item, id, quantity, size, seatCode) {
        var keyId = id + '_' + size
        var storedItem = this.items[keyId];
        if (!storedItem) {
            storedItem = this.items[keyId] = {
                item: item,
                qty: 0,
                price: 0,
                size: size,
                seatCode: seatCode
            };
            this.totalQty++;
        }
        // storedItem.qty++;
        // storedItem.qty = parseInt(storedItem.qty) + parseInt(quantity);
        storedItem.qty = parseInt(quantity);
        storedItem.price = parseInt(storedItem.item.price) * parseInt(storedItem.qty);
        this.totalPrice += (storedItem.item.price * quantity)
        this.totalDiscount = this.totalPrice
    }
    this.generateArray = function () {
        var arr = [];
        for (var id in this.items) {
            arr.push(this.items[id])
        }
        return arr;
    }
    this.removeItem = function (id) {
        //this.totalQty -= this.items[id].qty;
        this.totalQty--;
        this.totalPrice -= parseInt(this.items[id].price);
        delete this.items[id];

    }
    this.reduceByOne = function (id) {
        this.items[id].qty--;
        this.items[id].price -= this.items[id].item.price
        this.totalPrice -= this.items[id].item.price
        if (this.items[id].qty <= 0) {
            this.totalQty--;
            delete this.items[id]
        }
    }
}