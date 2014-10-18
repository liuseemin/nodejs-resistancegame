var http = require("http");
var url = require('url');
var fs = require('fs');
var io = require('socket.io'); // 加入 Socket.IO

var server = http.createServer(function(request, response) {
	var path = url.parse(request.url).pathname;

	switch (path) {
		case '/':
			response.writeHead(200, {'Content-Type': 'text/html'});
			response.write('Hello, World.');
			response.end();
			break;
		case '/socket.js':
		case '/socket.html':
		case '/style.css':
		case '/notice.wav':
		case '/test.html':
			fs.readFile(__dirname + path, function(error, data) {
				if (error){
					response.writeHead(404);
					response.write("opps this doesn't exist - 404");
				} else {
					response.writeHead(200, {"Content-Type": "text/html"});
					response.write(data, "utf8");
				}
				response.end();
			});
			break;
		default:
			response.writeHead(404);
			response.write("opps this doesn't exist - 404");
			response.end();
			break;
	}
});

var server_port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';

server.listen(server_port, server_ip_address);

var serv_io = io.listen(server);
console.log('server listening...')

function randomColor() {
	var rand = Math.ceil(Math.random() * 10 % 6);
	var color;
	switch(rand) {
		case 1: color = {'name':'PapayaWhip'	, 'code':'#FFEFD5'};  break;
		case 2: color = {'name':'Honeydew'		, 'code':'#F0FFF0'};  break; 
		case 3: color = {'name':'Azure'			, 'code':'#F0FFFF'};  break; 
		case 4: color = {'name':'LightYellow'	, 'code':'#FFFFE0'};  break;
		case 5: color = {'name':'lavender'		, 'code':'#E6E6FA'};  break;
		case 6: color = {'name':'LavenderBlush'	, 'code':'#FFF0F5'};  break;
	}
	return color;
}

function reUnite(str) {
	var result = '';
	for (var i in str) {
		result = result + str[i];
	}
	return result;
}

function user(username) {
	this.username = username;
	this.color = randomColor();
}

function room(id, owner) {
	this.id = id;
	this.participant = {};
	this.num = 0;
	this.owner = owner;
}	
room.prototype = {
	addUser: function(user) {
		this.participant[user.username] = user;
		this.num++;
	},

	removeUser: function(user) {
		delete this.participant[user.username];
		this.num--;
	},

	broadcast: function(sockets, event, data) {
		for (var i in this.participant) {
			var s = this.participant[i].username;
			sockets.registered[s].emit(event, data);
		}
	}
}

//var watchers = { 'num': 0 };

var lobby = new room('$root', '$root');

var names = [];

var rooms = {};

var sockets = {
	registered: {},
	broadcast: function(event, data) {
		for (var s in this.registered) {
			this.registered[s].emit(event, data);
		}
	}
};

serv_io.sockets.on('connection', function(socket) {

	var ThisUser;
	var status = '@login';
	var RoomNow;

	socket.on('login', function(data) {
		console.log('User login: ' + data.username);
		if (names.indexOf(data.username) != -1)
			socket.emit('userinfo', {});
		else {
			names.push(data.username);
			ThisUser = new user(data.username);
			lobby.addUser(ThisUser);
			sockets.registered[data.username] = socket;
			socket.emit('userinfo', { 'userinfo':ThisUser });
			sockets.broadcast('updateRoomInfo', { 'rooms': rooms });
			sockets.broadcast('updateLobbyInfo', { 'lobby': lobby });
			status = '@lobby';
		}
	});

	socket.on('create room', function(data) {
		console.log('A new room was created: ' + data.roomID);
		var NewRoom = new room(data.roomID, ThisUser);
		rooms[data.roomID] = NewRoom;
		sockets.broadcast('updateRoomInfo', { 'rooms': rooms });
	});

	socket.on('joinRoom', function(data) {
		lobby.removeUser(ThisUser);
		RoomNow = rooms[data.roomToJoin];
		RoomNow.addUser(ThisUser);
		RoomNow.broadcast(sockets, 'updateRoom', {'RoomNow':RoomNow});
		sockets.broadcast('updateRoomInfo', { 'rooms': rooms });
		sockets.broadcast('updateLobbyInfo', { 'lobby': lobby });
		status = '@room';
	});

	socket.on('deleteRoom', function(data) {
		var DeletedRoom = rooms[data.roomToDel];
		DeletedRoom.broadcast(sockets, 'kickout', {'owner': ThisUser});
		delete rooms[data.roomToDel];
		console.log('Room ' + data.roomToDel + ' is deleted.');
		sockets.broadcast('updateRoomInfo', { 'rooms': rooms });
	});

	socket.on('leaveRoom', function(data) {
		RoomNow.removeUser(ThisUser);
		lobby.addUser(ThisUser);
		RoomNow.broadcast(sockets, 'updateRoom', {'RoomNow':RoomNow});
		RoomNow = null;
		sockets.broadcast('updateRoomInfo', { 'rooms': rooms });
		sockets.broadcast('updateLobbyInfo', { 'lobby': lobby });
		status = '@lobby';
	});

	socket.on('message', function(data) {
		console.log('Recieve message from ' + ThisUser.username + ": " + data.message);
		console.log(ThisUser.username + " status:" + status);
		var msg = reUnite(data.message.split('<script>'));
		if (status == '@lobby' || RoomNow == null) {
			sockets.broadcast('message', {
				'message':  ThisUser.username+ ": " + msg,
				'target': '.lobby.chatarea',
				'color': ThisUser.color.code
			});
		} else if (status == '@room') {
			RoomNow.broadcast(sockets, 'message', {
				'message':  ThisUser.username+ ": " + msg,
				'target': '.room.chatarea',
				'color': ThisUser.color.code
			});
		}
	});

	socket.on('disconnect', function() {
		for (var i in rooms) {
			if (rooms[i].owner == ThisUser) {
				if (rooms[i].num > 0) {
					for (var u in rooms[i].participant) {
						rooms[i].owner = rooms[i].participant[u];
						console.log('The owner of room ' + i + ' is changed to ' + rooms[i].owner.username);
						break;
					}
				} else {
					delete rooms[i];
					console.log('Room ' + i + ' is deleted.');
				}
			}
		}
		if (status == '@lobby') {
			console.log(ThisUser.username + ' disconnected.')
			lobby.removeUser(ThisUser);
			delete sockets.registered[ThisUser.username];
			sockets.broadcast('updateLobbyInfo', { 'lobby': lobby });
			sockets.broadcast('updateRoomInfo', { 'rooms': rooms });
			names.splice(names.indexOf(ThisUser.username), 1);
		} else if (status == '@room') {
			RoomNow.removeUser(ThisUser);
			RoomNow.broadcast(sockets, 'updateRoom', {'RoomNow':RoomNow});
			delete sockets.registered[ThisUser.username];
			sockets.broadcast('updateRoomInfo', { 'rooms': rooms });
			names.splice(names.indexOf(ThisUser.username), 1);
		}
	});


});