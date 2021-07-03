const mongoose = require("mongoose")

const Schema = mongoose.Schema


const electronicSchema = new Schema({
    name:{type :String , required : true},
    image:{type :String , required : true},
    price:{type :Number , required : true}
})



module.exports = mongoose.model("Electronic" , electronicSchema)