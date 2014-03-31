var defaults = require('./defaults'),
    path = require('path'),
		shared = path.normalize(defaults.root + '/../shared');

module.exports = {
	  port: 16999
	, db_name: 'wompt_prod'
	, minify_assets: true
	, perform_caching: true
	, pid_file: path.normalize(shared + "/pids/wompt.pid")

	, hoptoad: {
		  apiKey: '2d12a5a4e55714b1d7a3fbae31c5e0ae'
		, reportErrors: false
	}
	, logs: {
		root: path.normalize(shared + '/log')
		,channels:{
			root: path.normalize(shared + '/log/channels')
		}
	}
	
	, socketio: {
		serverOptions: {
			// Port to serve the flash policy doc from, iptables maps port 843 -> 16843
			'flash policy port': 16843,
			// level = warn, leave out: info and debug
			'log level': 1
		}
	}
	// Allow access to user profile pages
	, userProfiles: false
	// Allow access to the home page
	, homePage: false

	// Allow access to the public non-account namespaces (/chat, /mod, ...)
	, publicNamespaces: false

	, redirectWww	: true
	, ipWhitelist: ['72.29.166.163']
}
