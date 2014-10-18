function game_init() {
	$('.room.gamepanel').append("<canvas id='gameCanvas' height='" + $('.room.gamepanel').height() + "' width='" + $('.room.gamepanel').width() + "'></canvas>");

	var $view = $('#gameCanvas');
	var context = $view[0].getContext('2d');

	$view.mousemove( function(evt) {
		var mouse = {
			'x': evt.pageX - $view.offset().left,
			'y': evt.pageY - $view.offset().top
		};
		drawself(context, mouse, User.color);
		socket.emit('command', {'mouse':mouse});
	});

	socket.on('update', function(data) {
		var roomMouse = data.update.roomMouse;
		var color = data.update.color;

		console.log(roomMouse);

		(function update() {
			requestAnimationFrame(update);
			render(context, roomMouse, color);
		})();
		
	});

	function render(context, roomMouse, color) {
		$view[0].width = $view[0].width;
		for(var m in roomMouse) {
			if (m == User.username) continue;
			context.beginPath();
			context.arc(roomMouse[m].x, roomMouse[m].y, 10, 0, Math.PI * 2);
			context.fillStyle = color[m];
			context.fill();
			context.lineWidth = 1;
			context.stroke();
			context.font = "12px Georgia";
			context.fillText(m, roomMouse[m].x + 10, roomMouse[m].y - 10);
			context.closePath();
		}
	}

	function drawself(context, mouse, color) {
		$view[0].width = $view[0].width;
		context.beginPath();
		context.arc(mouse.x, mouse.y, 10, 0, Math.PI * 2);
		context.fillStyle = color;
		context.fill();
		context.lineWidth = 1;
		context.stroke();
		context.font = "12px Georgia";
		context.fillText(User.username, mouse.x + 10, mouse.y - 10);
		context.closePath();
	}
}