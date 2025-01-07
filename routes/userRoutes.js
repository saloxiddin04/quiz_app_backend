const express = require('express')
const router = express.Router()
const User = require('../models/UserModel')
const jwt = require('jsonwebtoken')
const {signupSchema, acceptCodeSchema} = require("../middlewares/validator");
const {hash, compare} = require('bcryptjs')
const {createHmac} = require('crypto')
const transport = require('../middlewares/sendMail')
const {identifier} = require("../middlewares/identification");

router.post('/signUp', async (req, res) => {
	try {
		const {email, password} = req.body
		
		const {error, value} = signupSchema.validate({email, password})
		
		if (error) {
			return res.status(401).json({success: false, message: error.details[0].message})
		}
		
		const existUser = await User.findOne({email})
		
		if (existUser) {
			return res.status(400).json({error: 'This email already exist!'});
		}
		
		const hashedPassword = await hash(password, 12);
		
		const user = new User({
			email,
			password: hashedPassword
		})
		const result = await user.save()
		result.password = undefined
		res.status(201).json({success: true, message: "Your account has been created successfully!", result})
	} catch (e) {
		res.status(500).json({error: e.message})
	}
})

router.post('/signIn', async (req, res) => {
	try {
		const {email, password} = req.body
		
		const {error, value} = signupSchema.validate({email, password})
		
		if (error) {
			return res.status(401).json({success: false, message: error.details[0].message})
		}
		
		const existUser = await User.findOne({email}).select('+password')
		
		if (!existUser) {
			return res.status(400).json({error: 'User does not exist!'});
		}
		
		const result = await compare(password, existUser.password)
		if (!result) {
			return res.status(400).json({error: 'Invalid credentials!'});
		}
		
		const token = jwt.sign({
			userId: existUser?._id,
			email: existUser?.email,
			verified: existUser?.verified
		}, process.env.TOKEN_SECRET)
		
		res.cookie('Authorization', 'Bearer ' + token, {
			expires: new Date(Date.now() * 8 + 3600000),
			httpOnly: process.env.NODE_ENV === 'production',
			secure: process.env.NODE_ENV === 'production'
		}).json({
			message: "Logged in successfully",
			token,
			success: true
		})
	} catch (e) {
		res.status(500).json({error: e.message})
	}
})

router.patch('/send-verification-code', identifier, async (req, res) => {
	try {
		const {email} = req.body;
		
		const existUser = await User.findOne({email})
		
		if (!existUser) {
			return res.status(404).json({success: false, message: "User does not exists!"})
		}
		
		if (existUser?.verified) {
			return res.status(400).json({success: false, message: "You are already verified!"})
		}
		
		const codeValue = Math.floor(Math.random() * 1000000).toString()
		let info = await transport.sendMail({
			from: process.env.NODE_SENDING_EMAIL,
			to: existUser?.email,
			subject: 'Verification code',
			html: '<h1>' + codeValue + '</h1>'
		})
		
		if (info.accepted[0] === existUser?.email) {
			const hashedCodeValue = createHmac('sha256', process.env.HMAC_VERIFICATION_CODE).update(codeValue).digest('hex')
			existUser.verificationCode = hashedCodeValue
			existUser.verificationCodeValidation = Date.now()
			await existUser.save()
			return res.status(200).json({success: true, message: "Code sent"})
		}
		
		return res.status(400).json({success: true, message: "Code sent failed!"})
	} catch (e) {
		res.status(500).json({error: e.message})
	}
})

router.patch('/verify-code', identifier, async (req, res) => {
	try {
		const {email, providedCode} = req.body;
		const {error, value} = acceptCodeSchema.validate({email, providedCode})
		
		if (error) {
			return res.status(401).json({success: false, message: error.details[0].message})
		}
		
		const codeValue = providedCode.toString()
		const existingUser = await User.findOne({ email }).select(
			'+verificationCode +verificationCodeValidation'
		);
		if (!existingUser) {
			return res.status(401).json({success: false, message: 'User does not exists!'})
		}
		
		if (existingUser.verfied) {
			return res.status(400).json({success: false, message: "You are already verified!"})
		}
		
		if (
			!existingUser.verificationCode ||
			!existingUser.verificationCodeValidation
		) {
			return res.status(400).json({success: false, message: "Something is wrong with the code"})
		}
		
		if (Date.now() - existingUser.verificationCodeValidation > 5 * 60 * 1000) {
			return res.status(400).json({success: false, message: "Code has been expired!"})
		}
		
		const hashedCodeValue = createHmac('sha256', process.env.HMAC_VERIFICATION_CODE).update(codeValue).digest('hex')
		if (hashedCodeValue === existingUser.verificationCode) {
			existingUser.verfied = true
			existingUser.verificationCode = undefined
			existingUser.verificationCodeValidation = undefined
			
			await existingUser.save()
			return res.status(200).json({success: false, message: "Your account has been verified!"})
		}
		
		return res.status(400).json({success: false, message: "Something went wrong!"})
	} catch (e) {
		res.status(500).json({error: e.message})
	}
})

router.post('/logout', identifier, async (req, res) => {
	res.clearCookie('Authorization').status(200).json({success: true, message: "logged out successfully"})
})

module.exports = router;