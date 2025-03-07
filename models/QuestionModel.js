const {Schema, model} = require('mongoose')

const optionSchema = new Schema({
	key: { type: String, required: true },
	answer: { type: String, required: true }
});

const questionSchema = new Schema({
	subject: { type: Schema.ObjectId, ref: 'Subject', required: true },
	text: { type: String, required: true },
	options: { type: [optionSchema], required: true },
	correctAnswer: { type: String, required: true },
	imagePath: { type: String, default: null },
	correctAnswerImg: { type: String, default: null },
	explanation: {type: String, default: null}
})

module.exports = model('Question', questionSchema)