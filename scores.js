var request = require("request");

var config = require("./config.json");
var teams = require("./teams.json");

var token = config.token;
var apiGraceMs = 10 * 1000;

var headers = {
	'Authorization': 'Bearer ' + token,
	'User-Agent': config.ua
};

var apiUrl = "https://erikberg.com";

var today = new Date();
var offset = today.getDay() - 1;

if (offset < 0) {
	offset = 6;
}

var oneDayMs = 1000 * 60 * 60 * 24;
var monday = new Date(today.getTime() - offset * oneDayMs);

function api(url, success, error) {
	var requestUrl = apiUrl + url,
		waitTime = 0;

	if (api._lastMade) {
		waitTime = (api._lastMade + apiGraceMs) -
			(new Date()).getTime();
	}

	if (waitTime > 0) {
		setTimeout(function() {
			api(url, success, error);
		}, waitTime);
	} else {
		api._lastMade = (new Date()).getTime();

		request({
			url: requestUrl,
			json: true,
			headers: headers
		}, function(err, resp, data) {
			if (err) {
				console.log(err);
			} else if (success) {
				success(data);
			}
		});
	}
}

function isTeamWon(event) {
	return event.team_event_result === 'win';
}

function isTeamLost(event) {
	return event.team_event_result === 'loss';
}

function toDateString(date) {
	var month = date.getMonth() + 1,
		d = date.getDate(),
		dateString = date.getFullYear().toString() +
						(month < 10 ? ('0' + month) : month) +
						(d < 10 ? ('0' + d) : d);
	return dateString;
}

function getResults(success) {
	var results = {}, counter = teams.length;

	teams.forEach(function(team) {
		getResultsForTeam(team, function(result) {
			console.log(team.team_id, result);

			results[team.team_id] = result;
			counter--;

			if (counter === 0) {
				success(results);
			}
		});
	});
}

function getResultsForTeam(team, success, error) {
	var id = team.team_id, won, lose;

	api('/nba/results/' + id + '.json?season=2014&since=' + toDateString(monday) + '&until=' + toDateString(today),
		function(results) {
		won = results.filter(isTeamWon).length;
		lost = results.filter(isTeamLost).length;
		success({
			won: won,
			lost: lost
		});
	}, function() {
		console.log(arguments);
	});
}

getResults(console.log);
