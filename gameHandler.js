

function deal(room, user, data) {
	var update = {
		'username': user.username,
		'mouse': data.mouse
	}

	return update;
}

exports.deal = deal;