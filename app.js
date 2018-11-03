var express = require('express');
var path = require('path');
var redis = require('redis');
var session = require('express-session')
var RedisStore = require('connect-redis')(session);
var client  = redis.createClient();

// Login requirements
var passport = require('passport');
var steamStrategy = require('passport-steam').Strategy;
passport.serializeUser(function(user, done) {
	done(null, user);
});
passport.deserializeUser(function(obj, done) {
	done(null, obj);
});
passport.use(new steamStrategy({
		returnURL: 'http://spchalloween.oniz.me/auth/steam/return',
		realm: 'http://spchalloween.oniz.me/',
		apiKey: '1690BE836A150C2B88CC1F51A9D33673'
	},
	function(identifier, profile, done) {
		process.nextTick(function () {
			profile.identifier = identifier;
			return done(null, profile);
		});
	}
));

// MySQL integration
var mysql = require('mysql');
var db_config = {
	host: 'localhost',
	user: 'spaziopc',
	password: 'stocazzo',
	database: 'spaziopc'
};
var db;

var app = express();

// Start DB and reconnect on inactivity
function handleDisconnect(){
	db = mysql.createConnection(db_config);
	db.connect(function(err){
		if (!err) {
			console.log('\nMySQL connected successfully');
		} else {
			console.log('\nError while connecting to MySQL:', err);
			setTimeout(handleDisconnect, 2000);
		}
	});
	db.query('SET sql_mode = "";');
	db.on('error', function(err){
		console.log('\nDatabase error', err.code);
		if(err.code === 'PROTOCOL_CONNECTION_LOST'){
			console.log('\nReconnecting MySQL...');
			handleDisconnect();
		} else {
			console.log('\nMySQL did not reconnect automatically, error:', err);
			throw err;
		}
	});
}
handleDisconnect();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Session
app.use(session({
	secret: 'PFjc53qrGa8CSXPPe8dx',
	store: new RedisStore({
		host: 'localhost',
		port: 6379,
		client: client,
		ttl: 1800
	}),
	resave: true,
	saveUninitialized: true,
	cookie: {
		maxAge: 1800000,
		secure: false
	}
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));


// ------------- GET ROUTES --------------- //

// Login and logout
app.get('/login', function(req, res, next) {
	res.render('login', {
		title: 'SpazioPC Halloween - Login'
	});
});
app.get('/logout', function(req, res){
	req.logout();
	delete req.session.score;
	delete req.session.time;
	delete req.session.timeattackscore;
	delete req.session.timeattacktime;
	res.redirect('/');
});
app.get('/auth/steam', passport.authenticate('steam', { failureRedirect: '/' }),
	function(req, res) {
		res.redirect('/');
	}
);
app.get('/auth/steam/return', passport.authenticate('steam', { failureRedirect: '/' }),
	function(req, res) {
		res.redirect('/');
	}
);

// Endless
app.get('/', function(req, res, next) {
	if (req.user=='' || req.user==undefined){
		res.redirect('/login');
	} else if (req.user.id!='' || req.user.id!=undefined){
		db.query('SELECT * FROM halloween2018 WHERE steam_id = "'+req.user.id+'";', function(err, registeredUser){
			if(err) throw err;
			if(registeredUser==''){
				var newUser = {
					steam_id: req.user.id,
					username: req.user.displayName,
					avatar_url: req.user.photos[2].value,
					score: 1,
					last_save: new Date()
				};
				db.query('INSERT INTO halloween2018 SET ?', newUser, function(err, result){
					if(err) throw err;
					console.log('\nRegistered user '+req.user.displayName+' with ID '+result.insertId);
					req.session.score = 1;
					req.session.time = new Date();
					var score = req.session.score;
					res.render('index', {
						title: 'SpazioPC Halloween',
						score: score,
						user: req.user
					});
				});
			} else {
				if (req.session.score && req.session.time) {
					var score = req.session.score;
					req.session.time = new Date();
				} else {
					req.session.score = registeredUser[0].score;
					req.session.time = new Date();
					var score = req.session.score;
				}
				res.render('index', {
					title: 'SpazioPC Halloween',
					score: score,
					user: req.user
				});
			}
		});
	}
});

// Time attack
app.get('/timeattack', function(req, res, next) {
	if (req.user=='' || req.user==undefined){
		res.redirect('/login');
	} else if (req.user.id!='' || req.user.id!=undefined){
		db.query('SELECT * FROM halloween2018 WHERE steam_id = "'+req.user.id+'";', function(err, registeredUser){
			if(err) throw err;
			if(registeredUser==''){
				var newUser = {
					steam_id: req.user.id,
					username: req.user.displayName,
					avatar_url: req.user.photos[2].value,
					score: 1,
					last_save: new Date()
				};
				db.query('INSERT INTO halloween2018 SET ?', newUser, function(err, result){
					if(err) throw err;
					console.log('\nRegistered user '+req.user.displayName+' with ID '+result.insertId);
					req.session.score = 1;
					req.session.time = new Date();
					req.session.timeattacktime = new Date();
					req.session.timeattackscore = 0;
					var score = req.session.timeattackscore;
					res.render('timeattack', {
						title: 'SpazioPC Halloween - Time Attack',
						score: score,
						user: req.user
					});
				});
			} else {
				req.session.timeattackscore = 0;
				req.session.timeattacktime = new Date();
				var score = req.session.timeattackscore;
				res.render('timeattack', {
					title: 'SpazioPC Halloween - Time Attack',
					score: score,
					user: req.user
				});
			}
		});
	}
});

// Leaderboard
app.get('/classifica', function(req, res, next) {
	db.query('SELECT * FROM halloween2018 ORDER BY score DESC;', function(err, endless){
		if(err) throw err;
		db.query('SELECT * FROM halloween2018timeattack ORDER BY score DESC LIMIT 30;', function(err, timeattack){
			if(err) throw err;
			res.render('leaderboard', {
				title: 'SpazioPC Halloween - Classifica',
				endless: endless,
				timeattack: timeattack
			});
		});
	});
});


// ------------- POST ROUTES --------------- //

// ENDLESS MODE //

// Add point to score in session
app.post('/scoreplus', function(req, res, err) {
	if (req.session.score && req.session.time) {
		var lastSave = new Date(req.session.time);
		var now = new Date();
		if ( (new Date(lastSave.getTime() + 500)) > now ) {
			console.log(now, req.user.displayName, 'cerca di barare.')
			req.session.time = new Date();
			res.send({ msg:'Non barare! Gabe ti osserva.'} );
		} else {
			req.session.score++;
			req.session.time = new Date();
			res.send({ msg:''} );
		}
	} else if (req.session.score && !req.session.time) {
		req.session.time = new Date();
		req.session.score++;
		res.send({ msg:''} );
	} else {
		req.session.score = 1;
		req.session.score++;
		req.session.time = new Date();
		res.send({ msg:''} );
	}
});

// Halve score in session
app.post('/scorehalf', function(req, res, err) {
	if (req.session.score) {
		req.session.score = Math.round(req.session.score/2);
		res.send((err === null) ? { msg: '' } : { msg:'error: ' + err });
	} else {
		req.session.score = 1;
		res.send((err === null) ? { msg: '' } : { msg:'error: ' + err });
	}
});

// Save game from session to DB
app.post('/savegame/:steamid', function(req, res, err) {
	var steamid = req.params.steamid;
	if (steamid == req.user.id) {
		if (req.session.score) {
			score = parseInt(req.session.score);
		} else {
			score = parseInt(1);
		}
		var update = {
			score: score,
			last_save: new Date()
		}
		db.query('UPDATE halloween2018 SET ? WHERE steam_id = "'+steamid+'";', update, function(err,result){
			if(err) throw err;
			res.send((err === null) ? { msg: '' } : { msg:'error: ' + err });
		});
	} else {
		res.send({ msg:'Supa hacka'} );
		console.log('Salvataggio bloccato: SteamID non combacia.', req.user.displayName);
	}
});


// TIME ATTACK MODE //

// Add point to score in session
app.post('/scoreplustimeattack', function(req, res, err) {
	if (req.session.timeattackscore && req.session.timeattacktime) {
		var lastSave = new Date(req.session.timeattacktime);
		var now = new Date();
		if ( (new Date(lastSave.getTime() + 500)) > now ) {
			console.log(now, req.user.displayName, 'cerca di barare.')
			req.session.timeattacktime = new Date();
			res.send({ msg:'Non barare! Gabe ti osserva.'} );
		} else {
			req.session.timeattackscore++;
			req.session.timeattacktime = new Date();
			res.send({ msg:''} );
		}
	} else if (req.session.timeattackscore && !req.session.timeattacktime) {
		req.session.timeattacktime = new Date();
		req.session.timeattackscore++;
		res.send({ msg:''} );
	} else {
		req.session.timeattackscore = 1;
		req.session.timeattackscore++;
		req.session.timeattacktime = new Date();
		res.send({ msg:''} );
	}
});

// Halve score in session
app.post('/scorehalftimeattack', function(req, res, err) {
	if (req.session.timeattackscore) {
		req.session.timeattackscore = Math.round(req.session.timeattackscore/2);
		res.send((err === null) ? { msg: '' } : { msg:'error: ' + err });
	} else {
		req.session.timeattackscore = 0;
		res.send((err === null) ? { msg: '' } : { msg:'error: ' + err });
	}
});

// Save game from session to DB
app.post('/savegametimeattack/:steamid', function(req, res, err) {
	var steamid = req.params.steamid;
	if (steamid == req.user.id) {
		if (req.session.timeattackscore) {
			score = parseInt(req.session.timeattackscore);
		} else {
			score = parseInt(0);
		}
		var newScore = {
			steam_id: req.user.id,
			username: req.user.displayName,
			score: score,
			date: new Date()
		}
		db.query('INSERT INTO halloween2018timeattack SET ?', newScore, function(err,result){
			if(err) throw err;
			req.session.timeattackscore = 0;
			res.send((err === null) ? { msg: '' } : { msg:'error: ' + err });
		});
	} else {
		res.send({ msg:'Supa hacka'} );
		console.log('Salvataggio bloccato: SteamID non combacia.', req.user.displayName);
	}
});


// Catch 404
app.use(function(req, res) {
	res.render('404', {
		title: 'SpazioPC Halloween - Pagina non trovata'
	});
});

module.exports = app;
