// To support using nodejs modules that do module.exports = ...
var module = {};

var Util = {
Text: (function Text(){
	var my_name = (window.Me && Me.name && Me.name.toLowerCase()) || '';
	var filter = (function(){
		var f = window.UiOptions && UiOptions.wordFilter;
		return f && new RegExp(f.join('|'), 'gi');
	})();

	return {
		newlineMatcher: /\n|\r\n/gim,

      linkify: function(text) {
         var lines = text.split("\n");
         text = "";
         for (i = 0; i < lines.length; ++i) {
            var words = lines[i].split(" ");
            lines[i] = "";
            for (j = 0; j < words.length; ++j) {
               var tmp = words[j];
               words[j] = this.parseYoutube(words[j]);

               if (words[j] == tmp) {
                  words[j] = this.parseImg(words[j]);

                  if (words[j] == tmp) {
                     words[j] = this.parseLink(words[j]);
                  }
               }

               lines[i] += words[j] + (j != words.length - 1 ? " " : "");
            }
            // add 4chan-style greentext filter
            if (words[0].indexOf("&gt;") == 0) {
               lines[i] = '<span style="color:green">' + lines[i] + '</span>';
            }
            text += lines[i] + (i != lines.length - 1 ? "\n" : "");
         }

         return text;
      },

      parseImg: function(text) {
         var url = "";
         if (this.matchHttp(text)) {
            url = text;
         } else if (this.matchWWW(text)) {
            url = "http://" + text;
         }

         if (url != "" && this.matchImgSuffix(url)) {
            return '<a href="' + url + '" target="_blank"><img src="' + url + '" style="max-width: 300px; max-height: 300px;" /></a>';
         }

         return text;
      },

      parseYoutube: function(text) {
         var id = this.getYoutubeId(text);
         var rr = id == "oHg5SJYRHA0" ? 1 : 0;
         var url = 'https://www.youtube.com/v/' + id + '?version=3&autoplay=' + rr;
         if ((this.matchHttp(text) || this.matchWWW(text)) && this.matchYoutube(text)) {
               return '<object width="384" height="234"><param name="movie" value="' + url + '"></param><param name="allowScriptAccess" value="always"></param><embed src="' + url + '" type="application/x-shockwave-flash" allowscriptaccess="always" width="384" height="234"></embed></object>'
         }

         return text;
      },

      parseLink: function(text) {
         if (this.matchHttp(text)) {
            return '<a href="' + text + '" target = "_blank">' + text + '</a>';
         } else if (this.matchWWW(text)) {
            var url = "http://" + text;
            return '<a href="' + url + '" target="_blank">' + text + '</a>';
         } else {
            return text;
         }
      },

		linkifyTest: function(text){
			return this.matchHttp(text) ||
			       this.matchWWW(text) ||
			       this.matchMailto(text) ||
                text.indexOf(">") > -1;
		},

      // We need these four match methods because regex.test() is buggy when
      // you reuse a regex object. Other regex functions are fine though...
      matchHttp: function(text) {
         return (/^((https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim).test(text);
      },

      matchWWW: function(text) {
         return (/^(www\.[\S]+)/gim).test(text);
      },

      matchMailto: function(text) {
         return (/(\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,6})/gim).test(text);
      },

      matchYoutube: function(text) {
         return (/youtube\.com|youtu\.be/).test(text);
      },

      getYoutubeId: function(text) {
         var id = (/[a-zA-Z0-9\-\_]{11}/).exec((/(v=|\/v\/|\/embed\/)[a-zA-Z0-9\-\_]{11}/).exec(text));
         return id;
      },

      matchImgSuffix: function(text) {
         return (/\.(gif|jpg|jpeg|png|tiff|tif|svg|mini|thumbnail|standard|medium|large|huge)/gim).test(text);
      },

		mentionMatcher: function(text){
			var matches = text.match(/@([^\s]+)/g);
			return matches && matches.some(function(match){
				match = match.substr(1).toLowerCase();
            // does it match @<name> or @all or @everyone or @everybody?
            var matches_name_or_all = 
             my_name.indexOf(match) >= 0 ||
             match == "all" ||
             match == "everybody" ||
             match == "everyone";
				return match.length >= 2 && matches_name_or_all;
			});
		},

      imageDisplay: function(text){
         if (this.matchHttp(text) || this.matchWWW(text)) {
            if (this.matchWWW(text))
               text = 'http://' + text;

            if (this.imageSuffixMatch(text)) {
               text = text.replace(http_matcher, '<a href="$1" target="_blank"><img src="$1" style="max-width: 100%; max-height: 800px;" /></a> ');
            }
         }
         return text;
      },

		wordFilter: function(text){
			if(!filter) return text;
			return text.replace(filter, function(m) {
				return Array(m.length+1).join("*");
			});
		},
	};
})(),

nextTick: function(f){
	return setTimeout(f,0);
},

ts:function(){
	return new Date().getTime();
},

time:function time(t){
	var H = t.getHours(),
			h = H % 12,
			m = t.getMinutes();

	return (h==0 ? 12 : h) + ":" + (m < 10 ? '0' + m : m) + (H > 11 ? 'pm' : 'am');
},

date:function date(t){
	var d = t.getDate(),
	    m = t.getMonth() + 1;

	return m + "/" + (d < 10 ? '0' + d : d);
},

url:function(){
	return window.location.href.split('?')[0];
},

inherits:function(to, from){
	$.extend(to.prototype, from.prototype, {_super: from});
}
};

if(window.EventEmitter){
	EventEmitter.prototype.muteEvents = function(fn){
		this.emit = function(){}
		fn();
		delete this.emit;
	}
}
