const express = require('express')
const Question = require('../models/QuestionModel')
const upload = require('../middlewares/multer')
const fs = require('fs')
const router = express.Router();

router.get('/', async (req, res) => {
	try {
		const {limit} = req.query
		const limitNum = limit ? parseInt(limit, 10) : null;
		
		const questions = limitNum
			? await Question.find().limit(limitNum).sort({createdAt: -1})
			: await Question.find().sort({createdAt: -1})
		
		const totalQuestions = await Question.countDocuments()
		
		res.status(200).json({
			success: true,
			data: questions,
			count: totalQuestions
		})
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
})

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

router.delete('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const existQuestion = await Question.findById({_id: id});
		if (!existQuestion) {
			return res.status(404).json({ success: false, message: 'Question not found' });
		}
		
		// Delete files if they exist
		if (existQuestion.imagePath && fs.existsSync(existQuestion.imagePath)) {
			fs.unlinkSync(existQuestion.imagePath);
		}
		if (existQuestion.correctAnswerImg && fs.existsSync(existQuestion.correctAnswerImg)) {
			fs.unlinkSync(existQuestion.correctAnswerImg);
		}
		
		await existQuestion.deleteOne();
		res.status(200).json({ success: true, message: 'Question deleted successfully' });
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
})

module.exports = router;