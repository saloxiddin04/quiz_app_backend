const {Schema, model} = require('mongoose')

const questionSchema = new Schema({
	subject: { type: Schema.ObjectId, ref: 'Subject', required: true },
	text: { type: String, required: true },
	options: { type: [String], required: true },
	correctAnswer: { type: String, required: true },
	imagePath: { type: String, default: null }
})

module.exports = model('Question', questionSchema)