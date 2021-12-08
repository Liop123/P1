const { Int32 } = require('bson');
const mongoose = require('mongoose');

var inventorySchema = new mongoose.Schema({
    name: String,
    type: String,
    quantity: Number,
    img:
    {
        data: Buffer,
        contentType: String
    },
    inventory_address:
    {
        street: String,
        bg: String,
        country: String,
        zipcode: String,
        coord: {
            latitude: String,
            longitude: String
        }
    },
    manager: String
});
module.exports = mongoose.model('inventory', inventorySchema)