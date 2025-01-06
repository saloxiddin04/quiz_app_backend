const express = require('express')
const Question = require('../models/QuestionModel')
const TestHistory = require('../models/TestHistoryModel')
const router = express.Router();

router.get('/start', async (req, res) => {
	try {
		// params
		const { userId, subjectId, limit } = req.query;
		
		const questions = await Question.find({ subject: subjectId }).limit(limit)
		
		const testHistory = new TestHistory({
			user: userId,
			subject: subjectId,
			questions: questions?.map((q) => ({ question: q?._id }))
		})
		await testHistory.save(testHistory)
		
		res.status(200).json({
			testId: testHistory?._id,
			question: questions[0]
		})
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
})

router.post('/submit', async (req, res) => {
	try {
		const { testId, answer, userId } = req.body;
		
		const testHistory = await TestHistory.findOne({_id: testId, user: userId}).populate('questions.question');
		
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
				: {
					_id: testHistory.questions[testHistory.currentQuestionIndex].question._id,
					text: testHistory.questions[testHistory.currentQuestionIndex].question.text,
					options: testHistory.questions[testHistory.currentQuestionIndex].question.options
				},
			isCompleted,
			score: testHistory.score,
		});
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
})

router.get('/history/:userId', async (req, res) => {
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

router.post('/end', async (req, res) => {
	try {
		const { userId, testId } = req.body
		
		const testHistory = await TestHistory.findOne({ _id: testId, user: userId }).populate('questions.question')
		
		if (!testHistory) {
			return res.status(404).json({ error: 'Test not found' })
		}
		
		if (testHistory?.currentQuestionIndex >= testHistory?.questions?.length) {
			return res.status(400).json({ message: 'Test is already completed.' });
		}
		
		for(let i = testHistory?.currentQuestionIndex; i < testHistory?.questions?.length; i++) {
			if (testHistory.questions[i]) { // Check if the question exists
				testHistory.questions[i].userAnswer = null;
				testHistory.questions[i].isCorrect = false;
			}
		}
		
		// Finalize the test
		testHistory.currentQuestionIndex = testHistory.questions.length; // Mark as completed
		await testHistory.save();
		
		res.status(200).json({
			message: 'Test ended successfully.',
			testId: testHistory._id,
			totalQuestions: testHistory.questions.length,
			score: testHistory.score,
			questions: testHistory.questions.map((q) => ({
				questionId: q.question._id,
				text: q.question.text,
				correctAnswer: q.question.correctAnswer,
				userAnswer: q.userAnswer,
				isCorrect: q.isCorrect,
			})),
		});
	} catch (e) {
		res.status(500).json({error: e.message})
	}
})

router.get('/review/:testId', async (req, res) => {
	try {
		const {testId} = req.params
		const {index} = req.query
		const currentIndex = parseInt(index, 10);
		
		if (isNaN(currentIndex) || currentIndex < 0) {
			return res.status(400).json({ error: 'Invalid or missing index' });
		}
		
		const testHistory = await TestHistory.findById(testId)
			.populate('questions.question', 'text options correctAnswer')
		
		if (!testHistory) {
			return res.status(404).json({ error: "Test history not found" })
		}
		
		if (currentIndex >= testHistory.questions.length) {
			return res.status(400).json({ error: 'Index exceeds total questions' });
		}
		
		const questionReview = testHistory.questions[currentIndex];
		const totalQuestions = testHistory.questions.length;
		
		res.status(200).json({
			testId: testHistory._id,
			userId: testHistory.user,
			totalQuestions,
			currentIndex,
			question: {
				_id: questionReview.question._id,
				text: questionReview.question.text,
				options: questionReview.question.options,
				correctAnswer: questionReview.question.correctAnswer,
				userAnswer: questionReview.userAnswer,
				isCorrect: questionReview.isCorrect,
			},
			isLastQuestion: currentIndex === totalQuestions - 1,
		});
	} catch (e) {
		res.status(500).json({ error: e.message })
	}
})

module.exports = router;