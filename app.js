const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const subjectRoutes = require('./routes/subjectRoutes');
const questionRoutes = require('./routes/questionRoutes');
const testRoutes = require('./routes/testRoutes');

const app = express();

const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(bodyParser.json());
app.use(cors());

app.use('/subjects', subjectRoutes);
app.use('/questions', questionRoutes);
// app.use('/tests', testRoutes);

const PORT = process.env.PORT || 8080

const bootstrap = async () => {
	try {
		await mongoose.connect(process.env.MONGO_URI).then(() => console.log('Connected DB'))
		app.listen(PORT, () => console.log(`Listening on - http://localhost:${PORT}`))
	} catch (error) {
		console.log(`Error connecting with DB: ${error}`)
	}
}
bootstrap()
