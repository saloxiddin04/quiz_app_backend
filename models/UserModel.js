const {Schema, model} = require('mongoose')

const userSchema = new Schema({
	email: {
		type: String, required: [true, 'Email is required'], unique: [true, 'Email must be unique'], lowercase: true
	},
	password: {
		type: String, required: [true, 'Password is required'], trim: true, select: false
	},
	role: { type: String, default: "student" },
	verified: {
		type: Boolean, default: false
	},
	verificationCode: {
		type: String, select: false
	},
	verificationCodeValidation: {
		type: Number, select: false
	},
	forgotPasswordCode: {
		type: String, select: false
	},
	forgotPasswordCodeValidation: {
		type: Number, select: false
	}
}, { timestamps: true })

module.exports = model('User', userSchema)