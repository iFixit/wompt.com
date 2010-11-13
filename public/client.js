$(document).ready(function(){
	$('#message').keydown(function(e){
		if(e.keyCode == 13){
			var el = $(this);
			socket.send({chan: channel, action:'post', msg:el.val()});
			el.val('');
		}
	});
	
	$('#stats').click(function(e){
		socket.send({chan: channel, action:'stats'});
	});
	
	
	socket = new io.Socket(window.location.hostname);
	socket.connect();
	socket.send({chan: channel, action: 'join'});
	socket.on('message', function(data){
		switch(data.action){
			case 'stats':
				append_message("Clients: " + JSON.stringify(data.clients));
				break;
			default:
				append_message(data);
		}
	});
});

function append_message(data){
	var line = $('<div>'),
	    nick = $('<div>'),
			msg  = $('<div>');
			
	nick.append(data.from.name);
	nick.addClass('name');
	
	msg.append(data.msg);
	msg.addClass('msg');
	
	line.append(nick, msg);
	line.addClass('line')
	
	$('#messages').append(line);		
}

function which_channel(){
	if(window.location.search && window.location.search.length > 0)
		return window.location.search;
	else
		return "default";
}

var channel = which_channel();
