function game_init(room) {
	
	var $view = $('.room.gamepanel');


	$view.mousemove( function(evt) {
		var mouse = {
			'x': evt.pageX - $view.offset().left,
			'y': evt.pageY - $view.offset().top
		};
		console.log(mouse);
		socket.emit('command', {'mouse':mouse});
		moveMousePosDiv(User.username, mouse);
	});

	$view.mouseout( function(evt) {
		$('#mouse' + User.username).remove();
	});

	socket.on('update', function(data) {
		if (data.username != User.username)	moveMousePosDiv(data.username, data.mouse);
	});
}

function moveMousePosDiv(username, mouse) {
	var div = $('#mouse' + username);
	if (!div) {
		div = $('<div/>', {
			'id': 'mouse' + username,
			'width': 10,
			'height': 10
		})
			.css('position', 'absolute')
			.css('background-color', User.color.code)
			.appendTo($view);
	}
	div.offset({
		'left': mouse.x,
		'top': mouse.y
	});
}

function game_close() {
	$view.off('mousemove');
}