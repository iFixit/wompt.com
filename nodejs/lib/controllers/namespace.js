var wompt = require("../includes"),
Util = wompt.util;

function NamespaceController(app){
	var express = app.express,
	self = this;
	this.namespaces = {};
	
	this.register = function(){
		//Lookup Chat namespaces in the namespace hash, and respond.
		express.get("*", function(req, res, next){
			var namespace_id = Util.extractFirstUrlPart(req),
			namespace = namespace_id && self.namespaces[namespace_id];
			
			if(namespace){
				namespace.handler.apply(this, arguments);
			}else
				next();
		});
	}


	this.createNamespace = function(namespace_id, options){
		app.namespaces = app.namespaces || {};
		otions = options || {};
		options.namespace = namespace_id;

		var	channelManager = new wompt.ChannelManager(options);
		
		app.namespaces[namespace_id] = channelManager;
		
		if(options.logged){
			new wompt.loggers.LoggerCreator(channelManager, namespace_id);
		}
		
		//if(options.fakeUsers) argumentsForGet.push(wompt.Auth.fake_user_middleware());
		
		function handleChatRoomGet(req, res){

			// Trim off ending slash
			if(req.url.substr(-1,1) == '/')
				return res.redirect(wompt.util.chop(req.url));
				
			// Trim of ending slash when we have query parameters
			if(req.url.indexOf('/?') >=0){
				req.url = req.url.replace('/?', '?');
				req.params[0] = wompt.util.chop(req.params[0]);
			}

			var meta_user = req.meta_user,
					channel = req.params[0];
					
			var token = wompt.Auth.get_or_set_token(req, res);

			var connector = app.client_connectors.add({
				meta_user:meta_user,
				namespace:channelManager,
				token: token
			});
			
			var locals = app.standard_page_vars(req, {
				channel: channel,
				namespace: namespace_id,
				connector_id: connector.id,
				url: req.url,
				jquery: true,
				page_name: 'chat',
				page_js: 'channel'
			});
			
			var opt = {
				locals:locals
			};
			
			if(options.allowIframe && req.query.iframe == '1'){
				opt.layout = 'layouts/iframe';
				locals.w.embedded = true;
				locals.w.ga_source = 'embedd';
				if(options.allowCSS) locals.w.css_file = req.query.css_file;
			}
			
			res.render('chat', opt);
		}
		
		this.namespaces[namespace_id] = {
			handler:  handleChatRoomGet
			,manager: channelManager
		}
		
		return channelManager;
	}
}

module.exports = NamespaceController;
