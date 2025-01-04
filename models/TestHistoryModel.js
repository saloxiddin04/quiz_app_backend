const {Schema, model} = require('mongoose')

const testHistorySchema = new Schema({
	user: { type: Schema.ObjectId, ref: 'User', required: true },
	subject: { type: Schema.ObjectId, ref: 'Subject', required: true },
	questions: [
		{
			question: { type: Schema.ObjectId, ref: 'Question' },
			userAnswer: { type: String },
			isCorrect: { type: Boolean, default: false },
			// imagePath: { type: String, default: null }
		}
	],
	currentQuestionIndex: { type: Number, default: 0 },
	score: { type: Number, default: 0 },
	date: { type: Date, default: Date.now }
})

module.exports = model('TestHistory', testHistorySchema)