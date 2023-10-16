//jshint esversion:6
import 'dotenv/config'
import bodyParser from 'body-parser';
import express from 'express';
import mongoose from 'mongoose';
import encrypt from 'mongoose-encryption';

const app = express();
const port = 3000;
console.log(process.env.API_KEY)

mongoose.set('strictQuery', true);
mongoose.connect('mongodb://127.0.0.1:27017/userDB');

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

const userSchema = new mongoose.Schema({
	email: String,
	password: String,
});


userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields:['password'] });

const User = new mongoose.model('User', userSchema);

app.get('/', (req, res) => {
	res.render('home');
});
app.get('/login', (req, res) => {
	res.render('login');
});
app.get('/register', (req, res) => {
	res.render('register');
});

app.post('/register', (req, res) => {
	const user = new User({
		email: req.body.username,
		password: req.body.password,
	});
	user
		.save()
		.then(() => {
			res.render('secrets');
		})
		.catch((err) => {
			console.log(err.message);
		});
});

app.post('/login', (req, res) => {
	const email = req.body.username;
	const password = req.body.password;

	User.findOne({ email: email })
		.then((foundUser) => {
			if (foundUser) {
				if (foundUser.password === password) {
					res.render('secrets');
				}
			}
		})
		.catch((err) => {
			console.log(err.message);
		});
});

app.listen(port, () => {
	console.log(`Server is Listening on 3000`);
});
