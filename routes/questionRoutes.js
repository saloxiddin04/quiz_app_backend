const express = require('express')
const Question = require('../models/QuestionModel')
const upload = require('../middlewares/multer')
const fs = require('fs')
const router = express.Router();

router.get('/', async (req, res) => {
	try {
		const { page = 1, limit = 10 } = req.query;
		const pageNum = parseInt(page, 10);
		const limitNum = parseInt(limit, 10);
		
		const query = {};
		
		// Execute the query with pagination (skip and limit)
		const questions = await Question.find(query)
			.skip((pageNum - 1) * limitNum)
			.limit(limitNum)
			.sort({ createdAt: -1 });
		
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

router.get('/:id', async (req, res) => {
	try {
		const {id} = req.params
		
		const result = await Question.findById({_id: id})
		res.status(200).json({success: true, data: result})
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

router.patch('/:id', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'correctAnswerImg', maxCount: 1 }]),  async (req, res) => {
	try {
		const { id } = req.params;
		const { subject, text, options, correctAnswer } = req?.body;
		
		const question = await Question.findById({_id: id})
		if (!question) {
			res.status(404).json({success: false, message: "Question not found!"})
		}
		
		// Update question fields
		if (subject) question.subject = subject;
		if (text) question.text = text;
		if (options) question.options = JSON.parse(options);
		if (correctAnswer) question.correctAnswer = correctAnswer;
		
		// Handle file replacements
		if (req?.files && req?.files['image']) {
			if (question?.imagePath && fs.existsSync(question.imagePath)) {
				fs.unlinkSync(question?.imagePath); // Remove old image
			}
			question.imagePath = req?.files['image'][0]?.path;
		}
		if (req?.files && req?.files['correctAnswerImg']) {
			if (question.correctAnswerImg && fs.existsSync(question.correctAnswerImg)) {
				fs.unlinkSync(question.correctAnswerImg); // Remove old correctAnswerImg
			}
			question.correctAnswerImg = req?.files['correctAnswerImg'][0]?.path;
		}
		
		await question.save();
		res.status(200).json({ success: true, message: 'Question updated successfully', question });
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