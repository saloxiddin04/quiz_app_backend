const express = require('express')
const Subject = require('../models/SubjectModel')
const router = express.Router();

router.get('/', async (req, res) => {
	try {
		const result = await Subject.find()
		return res.status(200).json({ success: true, data: result })
	} catch (e) {
		res.status(500).json({error: e.message})
	}
})

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

router.delete('/:id', async (req, res) => {
	try {
		const {id} = req.params
		
		const existSubject = await Subject.findOne({_id: id})
		if (!existSubject) {
			res.status(400).json({success: false, message: 'Subject not found!'})
		}
		
		await Subject.deleteOne({_id: id})
		res.status(204).json({ success: true, message: "Deleted!" })
	} catch (e) {
		res.status(500).json({error: e.message})
	}
})

module.exports = router