var Hoptoad = require('airbrake')
  ,	env = require('../environment')
  , shouldReport = env.hoptoad && env.hoptoad.reportErrors;
	
	
Hoptoad = Hoptoad.createClient(env.hoptoad.apiKey);

process.addListener('uncaughtException', function(err) {
	if(shouldReport)
		Hoptoad.notify(err, function(){});
	console.error("~~~ Error ~~~   " + Date())
	console.error(err.stack);
});

Hoptoad.expressErrorNotifier = function(err,req,res,next){
	if(shouldReport)
		Hoptoad.notify(err, function(){});
	next(err);
}

Hoptoad.notifyCallback = function(err){
	if(shouldReport && err)
		Hoptoad.notify(err, function(){});
}

module.exports = Hoptoad;
