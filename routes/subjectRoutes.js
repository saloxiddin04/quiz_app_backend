const express = require('express')
const Subject = require('../models/SubjectModel')
const router = express.Router();

router.post('/create', async (req, res) => {
	try {
		const {name} = req.body
		const subject = new Subject({name})
		await subject.save()
		res.status(201).json(subject)
	} catch (e) {
		console.log(e)
		res.status(500).json({error: e.message})
	}
})

module.exports = router