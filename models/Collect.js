var mongoose = require('mongoose');
var collectSchema = require('../schemas/collect');

module.exports =  mongoose.model('Collect',collectSchema);