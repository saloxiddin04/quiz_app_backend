const express = require('express')
const router = express.Router()
const User = require('../models/UserModel')

router.post('/signIn', async (req, res) => {
	try {
		const {username, email} = req.body
		
		const existUser = await User.findOne({ username, email })
		
		if (existUser) {
			return res.status(400).json({ error: 'This username or email already exist!' });
		}
		
		const user = new User({
			username,
			email
		})
		await user.save()
		res.status(201).json(user)
	} catch (e) {
		res.status(500).json({ error: e.message })
	}
})

module.exports = router;