const multer = require('multer')
const path = require('path')
const fs = require('fs')

const uploadDir = 'uploads/';

if (!fs.existsSync(uploadDir)){
	fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'uploads/');
	},
	filename: function (req, file, cb) {
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
		cb(null, uniqueSuffix + path.extname(file.originalname));
	},
});

const fileFilter = (req, file, cb) => {
	const allowedTypes = /jpeg|jpg|png/;
	const ext = path.extname(file.originalname).toLowerCase();
	if (allowedTypes.test(ext)) {
		cb(null, true);
	} else {
		cb(new Error('Invalid file type. Only JPG, JPEG, and PNG are allowed.'));
	}
};

const upload = multer({
	storage: storage,
	fileFilter: fileFilter,
});

module.exports = upload;