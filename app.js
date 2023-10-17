//jshint esversion:6
import bodyParser from 'body-parser';
import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import mongoose from 'mongoose';
import findOrCreate from 'mongoose-findorcreate';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import passportLocalMongoose from 'passport-local-mongoose';

const app = express();
const port = 3000;

// session setup
app.use(
	session({
		secret: 'Secret things',
		resave: false,
		saveUninitialized: false,
	})
);

//initialize passport and used a passport to mannage sessions
app.use(passport.initialize());
app.use(passport.session());

mongoose.set('strictQuery', true);
mongoose.connect('mongodb://127.0.0.1:27017/userDB');

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

const userSchema = new mongoose.Schema({
	email: String,
	password: String,
	googleId: String,
});

//Setup userSchema as a plugin
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model('User', userSchema);

//Create a local login strategy
passport.use(User.createStrategy());
// and set a passport to serialize and deserialze user
passport.serializeUser(function(user, cb) {
	process.nextTick(function() {
	  return cb(null, {
		id: user.id,
		username: user.username,
		picture: user.picture
	  });
	});
  });
  
  passport.deserializeUser(function(user, cb) {
	process.nextTick(function() {
	  return cb(null, user);
	});
  });

passport.use(
	new GoogleStrategy(
		{
			clientID: process.env.CLIENT_ID,
			clientSecret: process.env.CLIENT_SECRET,
			callbackURL: 'http://localhost:3000/auth/google/secrets',
			userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo',
		},
		function (accessToken, refreshToken, profile, cb) {
			// console.log(profile)
			User.findOrCreate({ googleId: profile.id }, function (err, user) {
				return cb(err, user);
			});
		}
	)
);

app.get('/', (req, res) => {
	res.render('home');
});

app.get(
	'/auth/google',
	passport.authenticate('google', { scope: ['profile'] })
);

app.get(
	'/auth/google/secrets',
	passport.authenticate('google', { failureRedirect: '/login' }),
	function (req, res) {
		// Successful authentication, redirect secrets page.
		res.redirect('/secrets');
	}
);

app.get('/login', (req, res) => {
	res.render('login');
});
app.get('/register', (req, res) => {
	res.render('register');
});

app.get('/secrets', (req, res) => {
	if (req.isAuthenticated()) {
		res.render('secrets');
	} else {
		res.redirect('/login');
	}
});

app.get('/logout', (req, res) => {
	req.logout((err) => {
		if (err) {
			console.log(err);
		} else {
			res.redirect('/');
		}
	});
});

app.post('/register', (req, res) => {
	User.register(
		{ username: req.body.username },
		req.body.password,
		(err, user) => {
			if (err) {
				console.log(err);
				res.redirect('/register');
			} else {
				passport.authenticate('local')(req, res, () => {
					res.redirect('/secrets');
				});
			}
		}
	);
});

app.post('/login', (req, res) => {
	const user = new User({
		username: req.body.username,
		password: req.body.password,
	});

	req.login(user, (err) => {
		if (err) {
			console.log(err);
		} else {
			passport.authenticate('local')(req, res, () => {
				res.redirect('/secrets');
			});
		}
	});
});

app.listen(port, () => {
	console.log(`Server is Listening on 3000`);
});
