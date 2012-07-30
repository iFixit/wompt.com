require('./redirector');
var wompt     = require("./lib/includes");

if (wompt.env.pid_file) {
	var fs = require('fs');
	fs.writeFileSync(wompt.env.pid_file, process.pid);
}

var app = new wompt.App({
	config: wompt.env,
	root: __dirname
});

app.start_server();
