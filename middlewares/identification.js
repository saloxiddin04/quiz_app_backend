const jwt = require('jsonwebtoken')

exports.identifier = (req, res, next) => {
	let token;
	if (req.headers.client === 'not-browser') {
		token = req.headers.authorization
	} else {
		token = req.cookies['Authorization']
	}
	
	if (!token) {
		res.status(401).json({ message: "Unauthorized", success: false })
	}
	
	try {
		const userToken = token.split(' ')[1]
		const jwtVerified = jwt.verify(userToken, process.env.TOKEN_SECRET)
		if (jwtVerified) {
			req.user = jwtVerified
			next()
		} else {
			throw new Error('Error in then token')
		}
		
	} catch (e) {
		console.log(e)
	}
}