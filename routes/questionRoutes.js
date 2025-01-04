const express = require('express')
const Question = require('../models/QuestionModel')
const upload = require('../middlewares/multer')
const router = express.Router();

router.post('/create', upload.single('image'), async (req, res) => {
	try {
		const {subject, text, options, correctAnswer} = req.body
		const imagePath = req.file ? req.file.path : null
		const question = new Question({
			subject,
			text,
			// options,
			options: JSON.parse(options),
			correctAnswer,
			imagePath
		})

		await question.save()
		res.status(201).json(question)
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
})

module.exports = router;