const {Schema, model} = require('mongoose')

const subjectSchema = new Schema({
	name: { type: String, required: true }
})

module.exports = model("Subject", subjectSchema)