var wompt = require("../includes"),
    mongoose = wompt.mongoose;

var Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var Authentication = new Schema({
	'provider'      : String
	,'uid'          : String
	,info           : {}
});

// number defines index sort order (1=asc)
Authentication.index({provider: 1, uid:1});

var Session = new Schema({
	'token'         : {type: String, index:true}
	,last_used      : Date
	,created_at     : Date
});


var User = new Schema({
	//simple attributes
	'name'             : String
	,'email'           : {type: String, index:true}
	,'one_time_token'  : String
	,'account_id'      : ObjectId
	,'account_user_id' : String
	
	// embedded documents
	,'sessions'        : [Session]
	,'authentications' : [Authentication]
});

User.index({account_id: 1, account_user_id: 1});
	

User.method({
	wrap: function(){
		return new wompt.MetaUser(this);
	},
		
	authentication_for: function(provider){
		var auths = this.authentications ;
		if(!auths) return null;
		var auth;
		for(var i=0; auth=auths[i]; i++){
			if(auth['provider'] == provider) return auth;
		}
		return null;
	},
	
	provider_attribute: function(provider, attr){
		var info       = this.authentication_for(provider),
		provider_info  = info          && providerAuthInfo[provider],
		attr_getter    = provider_info && provider_info[attr];
		if(attr_getter)
			return attr_getter && attr_getter.call(info);
		else if(info) {
			var value;
			(value = info.info) && 
			(value = value.user_info) &&
			(value = value[attr]);
			return value
		}
	},
	
	same_user: function(u){
		return u && (u == this || this._id.id == u._id.id);
	},
	
	is_admin: function(){
		return (this.email in {
			'daniel@ifixit.com': true,
			'kyle@ifixit.com': true
		});
	}
});

// Model name, Schema, collection name
mongoose.model('User', User, 'users');
module.exports = mongoose.model('User');

var providerAuthInfo = {
	facebook: {
		profile: function(){
			return get_urls_hash(this).Facebook || "http://facebook.com/profile.php?id=" + this.uid;
		}
	},
	
	twitter: {
		profile: function(){
			var nick;
			return get_urls_hash(this).Twitter || (
				(nick = this.get("info.user_info.nickname")) &&
				("http://twitter.com/" + nick));
		}
	},
	
	github: {
		profile: function(){
			var url = get_urls_hash(this).GitHub, nick;
			return url ||
				((nick = this.get('info')) && (nick = nick.user_info) && (nick = nick.nickname)
				  && ("http://github.com/" + nick));
		}
	},
	
	google: {
		profile: function(){
			var name;
			(name = this.get('info')) && (name = name.user_info) && (name = name.email) && (name = name.split('@')[0]);
			return name ? 'http://profiles.google.com/' + name : null;
		}
	}
}

function get_urls_hash(auth){
	var urls;
	return (urls = auth.get('info')) && (urls = urls.user_info) && urls.urls;
}

