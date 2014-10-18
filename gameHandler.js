
var roomMouse = {};
var color = {};

function deal(room, user, data) {
	roomMouse[user.username] = data.mouse;
	color[user.username] = user.color;
	var update = {
		'roomMouse': roomMouse,
		'color': color
	}

	return update;
}

function cleanUp(user) {
	delete roomMouse[user.username];
	delete [user.username];
}

exports.deal = deal;
exports.cleanUp = cleanUp;