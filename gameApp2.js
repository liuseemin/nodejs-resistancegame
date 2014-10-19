function game_init() {
	
	var $view = $('.room.gamepanel');
	//console.log($view.offset());
	$view.css('cursor', 'none');

	$view.mousemove( function(evt) {
		var mouse = {
			'x': evt.pageX - $view.offset().left,
			'y': evt.pageY - $view.offset().top
		};
		socket.emit('command', {'mouse':mouse});
		moveMousePosDiv(User.username, mouse);
	});

	$view.mouseout( function(evt) {
		$('#mouse' + User.username).remove();
	});

	socket.on('update', function(data) {
		if (data.update.username != User.username) moveMousePosDiv(data.update.username, data.update.mouse);
	});
}

function moveMousePosDiv(username, mouse) {
	var div = $('#mouse' + username);
	//console.log(div);
	if (div.length == 0) {
		div = $('<div/>', {
			'id': 'mouse' + username,
			'class': 'mousePos',
			html: "<img src='/images/face.png'><br>" + username
		})
			.css({
				'position': 'absolute',
				'background-color': 'rgba(255,255,255,0)',
				'text-align': 'center'
			})
			.appendTo($('.room.gamepanel'));
	}
	div.css({
		left: mouse.x,
		top: mouse.y
	});
}

function game_close() {
	$('.room.gamepanel').off('mousemove');
}

function game_cleanUp(room) {
	$('.mousePos').each(function(index) {
		var del = true;
		for (var i in room.participant) {
			if ($(this).attr('id').substring(5) == i) del = false;
		}
		if (del) $(this).remove();
	});
}