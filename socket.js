function hashCodeGenerator(Hashpool) {
	var code = '';
	while(code.length < 8) {
		for (var i = 0; i < 8; i++) {
			var rand = Math.ceil(Math.random() * 72 % 36) + 47;
			var charcode;
			if (rand <= 57)
				charcode = String.fromCharCode(rand);
			else
				charcode = String.fromCharCode(rand + 7);
			code = code + charcode;
		}
		if (Hashpool.indexOf(code) != -1) code = '';
	}
	Hashpool.push(code);
	return code;
}

//var socket = io.connect('ws://nodejs-hsimingliu.rhcloud.com:8000');
var socket = io.connect(); //debug
var User;
var sound = true;

var autoEnter = false;

$(document).ready(function () {
	$('#username').keydown(function(event) {
		if (event.which == 13) {
			$('#login').trigger('click');
		}
	});

	$('#login').click(function() {
		console.log('login clicked!');
		var username = $('#username').val();
		socket.emit('login', { 'username': username });
	});

	$('#createRoom').click(function() {
		var roomName = prompt('Enter room name:');
		if (roomName) {
			socket.emit('create room', {
				'roomName': roomName
			});
			autoEnter = true;
		}
	});

	//lobby chat
	$('.lobby.chatsend').click(function() {
		if ($('.lobby.chatinput').val() != '') {
			socket.emit('message', { 'message': $('.lobby.chatinput').val()} );
			$('.lobby.chatinput').val('');
		}
	});

	$('.lobby.chatinput').keydown(function(event) {
		if (event.which == 13) {
			$('.lobby.chatsend').trigger('click');
		}
	});

	//room chat
	$('.room.chatsend').click(function() {
		if ($('.room.chatinput').val() != '') {
			socket.emit('message', { 'message': $('.room.chatinput').val()} );
			$('.room.chatinput').val('');
		}
	});

	$('.room.chatinput').keydown(function(event) {
		if (event.which == 13) {
			$('.room.chatsend').trigger('click');
		}
	});

	$('.sound').click( function() {
		sound = !sound;
		if (sound)
			$('.sound').html('Sound: ON');
		else
			$('.sound').html('Sound: OFF');
	});
});

socket.on('userinfo', function(data) {
	console.log(data.userinfo);
	if (!data.userinfo)
		$('#sameName').fadeIn();
	else {
		User = data.userinfo;
		$('#userinfo').empty();
		$('#userinfo').append('Welcome, ' + User.username + '!');
		$('.login.page').fadeOut();
		$('.lobby.page').fadeIn();
		//$('.lobby.chat').height(($('body').height() - $('.lobby.chat').offset().top));
	}
});

socket.on('updateRoomInfo', function(data) {
	$('#roomInfo').empty();
	for (var i in data.rooms) {
		var roomID = data.rooms[i].id;
		var roomName = data.rooms[i].name;
		var P_num = data.rooms[i].num;
		var roomDiv = "<div class='room box' id='room" + roomID + "'>[#" + roomID + "] Room " + roomName + ", participant number: " + P_num + " <button class='join' value='" + roomID + "'>Join</button></div>";
		$('#roomInfo').append(roomDiv);
		console.log(data.rooms[i].owner.username + ", " + User.username);
		console.log(data.rooms[i].owner.username == User.username);
		if (data.rooms[i].owner.username == User.username) {
			$('#room' + roomID).append("<button class='delete' value='" + roomID + "'>Delete</button>");
			$('.delete').off('click');
			$('.delete').click(function() {
				socket.emit('deleteRoom', {'roomToDel': $(this).val()});
			});
		}
		$('.join').off('click');
		$('.join').click(function() {
			socket.emit('joinRoom', {'roomToJoin': $(this).val()});
			$('.lobby.page').fadeOut();
			$('.lobby.chatarea').empty();
			$('.room.page').fadeIn();
			game_init();
		});
		console.log(autoEnter);
		if (autoEnter && data.rooms[i].owner.username == User.username) {
			socket.emit('joinRoom', {'roomToJoin': i});
			$('.lobby.page').fadeOut();
			$('.lobby.chatarea').empty();
			$('.room.page').fadeIn();
			game_init();
			autoEnter = false;
		}
	}
});

socket.on('updateLobbyInfo', function(data) {
	var w_num = data.lobby.num;
	$('#lobbyInfo').empty();
	$('#lobbyInfo').append("<div>== " + w_num + " user(s) in lobby now ==</div>");
	for (var i in data.lobby.participant) {
		var username = data.lobby.participant[i].username;
		var color = data.lobby.participant[i].color.code;
		var userDiv = "<div class='user box' style='background-color: " + color + "'>User: " + username + "</div>";
		$('#lobbyInfo').append(userDiv);
	}
});

socket.on('updateRoom', function(data) {
	var p_num = data.RoomNow.num;
	$('#roomUsers').empty();
	$('#roomUsers').append("<div>== " + p_num + " user(s) in Room " + data.RoomNow.name + " now ==</div>");
	for (var i in data.RoomNow.participant) {
		var username = data.RoomNow.participant[i].username;
		var color = data.RoomNow.participant[i].color.code;
		var userDiv = "<div class='user box' style='background-color: " + color + "'>User: " + username + "</div>";
		$('#roomUsers').append(userDiv);
	}
	var leavebtn = "<button class='leaveRoom' value='" + data.RoomNow.id + "'>Leave Room</button>";
	$('#roomUsers').append(leavebtn);
	$('.leaveRoom').click(function() {
		socket.emit('leaveRoom', {'roomToLeave': $(this).val()});
		$('.room.page').fadeOut();
		$('.room.chatarea').empty();
		$('.lobby.page').fadeIn();
		game_close();
	});
	game_cleanUp(data.RoomNow);
});

socket.on('kickout', function(data) {
	socket.emit('leaveRoom', {});
	alert('Room was closed!');
	$('.room.page').fadeOut();
	$('.room.chatarea').empty();
	$('.lobby.page').fadeIn();
});

hashpool = [];
socket.on('message', function(data) {
	console.log('Recieve message: ' + data.message);
	console.log('Message target: ' + data.target);
	console.log('Message color: ' + data.color);
	var hashcode = hashCodeGenerator(hashpool);
			
	var chatContext = "<div class='msgbox' id='message" + hashcode + "' style='display:none; background-color: " + data.color + "'>" + data.message + "</div>";
	$(data.target).append(chatContext);
	if (sound) {
		$('#notice')[0].load();
		$('#notice')[0].play();
	}
	$('#message' + hashcode).fadeIn();
	$(data.target).animate({ scrollTop: $(data.target)[0].scrollHeight });
});