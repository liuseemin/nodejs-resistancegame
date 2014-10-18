$('.room.gamepanel').append("<canvas id='gameCanvas' style='height:100%;width:100%'></canvas>");

$view = $('#gameCanvas');

$view.mousemove( function(evt) {
	var mouse = {
		'x': evt.pageX - $view.offset().left,
		'y': evt.pageY - $view.offset().top
	};
	socket.emit('command', {'mouse':mouse});
});

socket.on('update', function(data) {
	var context = document.getElementsById('gameCanvas').getContext('2d');
	var roomMouse = data.update.roomMouse;
	var color = data.update.color;

	(function update() {
		requestAnimationFrame(update);
		render(context, roomMouse, color);
	})();
	
});

function render(context, roomMouse, color) {
	for(var m in roomMouse) {
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