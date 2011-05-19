var wompt  = require("./includes")
   ,constants = wompt.env.constants
   ,events = require("events")
   ,util = require("util")
   ,logger = wompt.logger;

// Callback executed once DB record is loaded
function Channel(config, callback){
	var channel = this;
	
	this.name = config.name;
	this.namespace = config.namespace;
	this.messages = new wompt.MessageList(this);
	this.clients = new wompt.ClientPool();
	this.opsUsers = {};
	
	// Called from the context of the client
	this._message_from_client = function(msg){
		msg.from_client = this;
		channel.receive_message(msg);
	}
	
	this._client_disconnected = function(){
		var client = this;
		channel.touch();
		delete client.meta_data;
		if(client.user.visible){
			// Anonymous clients are treated independently for the userlist (anon count = anonymous clients)
			if(!client.user.authenticated() || channel.clients.other_clients_from_same_user(client).length == 0){
				channel.broadcast_user_list_change({'part': client.user});
				
				if(client.user.authenticated()){
					var ops = channel.opsUsers[client.uid];
					if(ops)
						ops.lastSeen = new Date();
				}				
			}
		}
	}
	
	wompt.Room.findOrCreate({name:this.name, namespace:this.namespace}, function(room){
		channel.room = room;
		callback(channel);
	});	
}


var proto = {
	add_client: function(client, token, joinMsg){
		this.touch();
		client.meta_data = {
			channel: this,
			token: token
		};

		// TODO: this should also check if another user has a claim on the Ops
		if(this.clients.userCount == 0 && client.user.authenticated())
			this.give_ops(client)

		this.clients.add(client);

		if(client.user.visible){
			// Anonymous clients are treated independently for the userlist (anon count = anonymous clients)
			if(!client.user.authenticated() || this.clients.other_clients_from_same_user(client).length == 0)
				this.broadcast_user_list_change({
					join: client.user,
					except: client
				});
		}
		
		client.on('message', this._message_from_client);
		client.on('disconnect', this._client_disconnected);
		
		this.send_initial_data(client, joinMsg);
	},
	
	touch: function(type){
		this.touched = new Date();
	},
	
	send_initial_data: function(client, joinMsg){
		client.bufferSends(function(){
			if(!this.messages.is_empty())
				client.send({action: 'batch', messages: this.messages.since(joinMsg.last_timestamp)});
				
			this.send_ops(client);
			client.send({action: 'who',	users: this.get_user_list(client)});
		}, this);
	},
	
	send_ops: function(client){
		var ops = this.opsUsers[client.uid]
		if(ops){
			if(!ops.lastSeen || (new Date() - ops.lastSeen) < wompt.env.ops.keep_when_absent_for){
				client.send({action: 'ops'});
			}else
				delete this.opsUsers[client.uid];
		}
	},
	
	give_ops: function(client){
		var ops = this.opsUsers;
		ops[client.uid] = {};
	},
	
	receive_message: function(data){
		this.touch();
		var responder = this.action_responders[data.action];
		if(responder)
			responder.call(this, data);
		else
			throw "No such action handler:" + data.action;
	},
	
	action_responders: {
		post: function post(data){
			if(data.from_client.user.readonly) return;
			if(data.msg && data.msg.length > constants.messages.max_length) return;
			var message = {
				t: new Date().getTime(),
				action: 'message',
				msg: data.msg,
				from:{
					name: data.from_client.user.doc.name,
					id: data.from_client.user.id()
				}
			};
			this.broadcast_message(message, {first:data.from_client});
		},
		
		kick: function kick(kick){
			if(!this.opsUsers[kick.from_client.uid]) return;
			
			this.clients.each(function(client){
				if(client == kick.from_client) return;
				if(client.uid != kick.id) return;
				client.send({
					action:'kick'
					,from:{
						name: kick.from_client.user.doc.name,
						id: kick.from_client.user.id()
					}
				});
			})
		}
	},
	
	get_user_list: function(client){
		var users = {anonymous:{count:0}}, list = this.clients.list;
		
		for(var id in list){
			var cl = list[id],
			    doc = cl.user.doc,
			    uid = cl.user.id();
			
			if(cl.user.visible && doc){
				if(!users[uid]){
					users[uid]={
						name: doc.name || 'anonymous'
					};
				}
			}else {
				users.anonymous.count++;
			}
		}
		
		if(users.anonymous.count == 0) delete users.anonymous;
		
		return users;
	},
	
	broadcast_user_list_change: function(opt){
		var action, dont_emit;
		
		if(opt.part) action='part';
		else if(opt.join) action='join';
		
		var users = {}, user = opt.part || opt.join;
		if(user.authenticated()){
			users[user.id()] = {
				'name': user.doc.name || user.doc.email
			}
		} else {
			users.anonymous = {count:1};
			// anonymous join / parts shouldn't be emitted (and thus logged to disk)
			dont_emit = true;
		}
		
		var message = {
			t: new Date().getTime(),
			action:action,
			users: users
		};
		this.broadcast_message(message, opt.except, dont_emit);
	},
	
	broadcast_message: function(msg, except, dont_emit){
		if(!dont_emit)
			this.emit('msg', msg);
		this.clients.broadcast(msg, except);
	},
	
	clean_up: function(){
		delete this.messages;
		delete this.clients;
		delete this.room;
		this.emit('destroy');
	}
}

util.inherits(Channel, events.EventEmitter);
for(var k in proto) Channel.prototype[k] = proto[k];

Channel.generalizeName = function(name){
	return name.toLowerCase();
}

Channel.hashName = function(name){
	return wompt.util.md5(name);
}

exports.Channel = Channel;
