var request = require("request");
var config = require("./config.json");
var token = config.token;

var api_url = "https://erikberg.com";
var headers = {
	'Authorization': 'Bearer ' + token,
	'User-Agent': config.ua
};

var today = new Date();
var offset = today.getDay() - 1;

if (offset < 0) {
	offset = 6;
}

var oneDayMs = 1000 * 60 * 60 * 24;
var monday = new Date(today.getTime() - offset * oneDayMs);
var date = new Date(monday.getTime());

var teams = {};

function tryInitTeam(team) {
	if (!teams[team]) {
		teams[team] = {
			won: 0,
			lost: 0
		};
	}
}

var eventExpectedCount = 0;

var eventProcessor = function(error, response, body) {
	var winner, loser;

	if (body.away_totals.points > body.home_totals.points) {
		winner = body.away_team.team_id;
		loser = body.home_team.team_id;
	} else {
		winner = body.home_team.team_id;
		loser = body.away_team.team_id;
	}

	tryInitTeam(winner);
	tryInitTeam(loser);

	teams[winner].won++;
	teams[loser].lost++;

	eventExpectedCount--;

	if (eventExpectedCount === 0) {
		console.log(teams);
	}
};

var dataProcessor = function(error, response, body) {
	var events = body.event;

	if (events && events.length) {
		events.forEach(function(event) {
			if (event.event_status === 'completed') {
				var id = event.event_id;
				var request_url = api_url + '/nba/boxscore/' + id + '.json';

				eventExpectedCount++;

				request({
					url: request_url,
					json: true,
					headers: headers
				},
				eventProcessor);
			}
		});
	}
};

while (date.getTime() <= today.getTime()) {
	var month = date.getMonth() + 1,
		d = date.getDate(),
		date_string = date.getFullYear().toString() +
						(month < 10 ? ('0' + month) : month) +
						(d < 10 ? ('0' + d) : d);
		request_url = api_url + '/events.json?sport=nba&date=' + date_string;


	request({
		url: request_url,
		json: true,
		headers: headers
	}, dataProcessor);

	date = new Date(date.getTime() + oneDayMs);
}
