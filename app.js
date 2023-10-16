//jshint esversion:6
import bodyParser from 'body-parser';
import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
// import encrypt from 'mongoose-encryption';
// import md5 from 'md5';
import bcrypt from 'bcrypt';
const saltRounds = 10;

const app = express();
const port = 3000;
// console.log(process.env.API_KEY)

mongoose.set('strictQuery', true);
mongoose.connect('mongodb://127.0.0.1:27017/userDB');

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

const userSchema = new mongoose.Schema({
	email: String,
	password: String,
});

// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields:['password'] });

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
	bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
		const user = new User({
			email: req.body.username,
			password: hash,
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
});

app.post('/login', (req, res) => {
	const email = req.body.username;
	const password = req.body.password;

	User.findOne({ email: email })
		.then((foundUser) => {
			if (foundUser) {
				bcrypt.compare(password, foundUser.password, function (err, result) {
					if (result === true) {
						res.render('secrets');
					}
					else{
						console.log(err)
					}
				});
			}
		})
		.catch((err) => {
			console.log(err);
		});
});

app.listen(port, () => {
	console.log(`Server is Listening on 3000`);
});
