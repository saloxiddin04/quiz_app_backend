const express = require('express')
const Question = require('../models/QuestionModel')
const upload = require('../middlewares/multer')
const router = express.Router();

router.post('/create', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'correctAnswerImg', maxCount: 1 }]), async (req, res) => {
	try {
		const {subject, text, options, correctAnswer} = req.body
		const image = req.files['image'] ? req.files['image'][0].path : null;
		const correctAnswerImg = req.files['correctAnswerImg'] ? req.files['correctAnswerImg'][0].path : null;
		
		const question = new Question({
			subject,
			text,
			// options,
			options: JSON.parse(options),
			correctAnswer,
			imagePath: image,
			correctAnswerImg
		})

		await question.save()
		res.status(201).json(question)
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
})

module.exports = router;