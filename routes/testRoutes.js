const express = require('express')
const Question = require('../models/QuestionModel')
const TestHistory = require('../models/TestHistoryModel')
const router = express.Router();

router.post('/start', async (req, res) => {
	try {
		const { userId, subjectId, limit } = req.body;
		
		const questions = await Question.find({ subject: subjectId }).limit(limit)
		
		const testHistory = new TestHistory({
			user: userId,
			subject: subjectId,
			questions: questions?.map((q) => ({ question: q?._id }))
		})
		await TestHistory.save(testHistory)
		
		res.status(200).json({
			testId: testHistory?._id,
			question: questions[0]
		})
	} catch (e) {
		res.status(500).json({ error: err.message });
	}
})

router.post('/submit', async (req, res) => {
	try {
		const { testId, answer } = req.body;
		
		const testHistory = await TestHistory.findById(testId).populate('questions.question');
		
		if (!testHistory) {
			return res.status(404).json({ error: 'Test not found' });
		}
		
		const currentIndex = testHistory.currentQuestionIndex;
		if (currentIndex >= testHistory.questions.length) {
			return res.status(400).json({ error: 'Test is already completed' });
		}
		
		const currentQuestion = testHistory.questions[currentIndex];
		const isCorrect = currentQuestion.question.correctAnswer === answer;
		
		// Update the current question with the user's answer
		testHistory.questions[currentIndex].userAnswer = answer;
		testHistory.questions[currentIndex].isCorrect = isCorrect;
		
		// Update the score if the answer is correct
		if (isCorrect) {
			testHistory.score += 1;
		}
		
		// Increment the current question index
		testHistory.currentQuestionIndex += 1;
		
		await testHistory.save();
		
		// Check if the test is completed
		const isCompleted = testHistory.currentQuestionIndex >= testHistory.questions.length;
		
		res.status(200).json({
			message: isCompleted ? 'Test completed' : 'Answer submitted successfully',
			nextQuestion: isCompleted
				? null
				: testHistory.questions[testHistory.currentQuestionIndex].question, // Send the next question if not completed
			isCompleted,
			score: testHistory.score,
		});
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
})

router.post('/history/:userId', async (req, res) => {
	try {
		const {userId} = req.params
		
		const history = await TestHistory.find({user: userId})
			.populate('subject', 'name')
			.populate('questions.question', 'text options correctAnswer')
			.sort({date: - 1})
		
		if (!history || history.length === 0) {
			return res.status(404).json({ message: 'No test history found for this user.' });
		}
		
		res.status(200).json(history);
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
})