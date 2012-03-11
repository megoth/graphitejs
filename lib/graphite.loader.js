if (typeof module == "object" && typeof require == "function") {
	graphite = require("./graphite.core").graphite;
}

(function(graphite) {
	var loader = {};
	
	loader.init = function () {
		this.xhr = new XMLHttpRequest();
	};
	
	loader.onload = function (callback) {
		var loader = this;
		this.xhr.onload = function () {
			callback(loader.xhr.responseText || loader.responseText);
		};
	};
	
	loader.open = function(method, url) {
		if ("withCredentials" in this.xhr) {
			// XHR for Chrome/Safari/Firefox.
			this.xhr.open(method, url, true);
		} else if (typeof XDomainRequest != "undefined") {
			// XDomainRequest for IE.
			this.xhr = new XDomainRequest();
			this.xhr.open(method, url);
		} else {
			// CORS not supported.
			throw new Error("XHR is not supported, unable to enable CORS");
		}
	
		this.xhr.onerror = function () {
			throw new Error("There was an error making the CORS-request");
		};
	};
	
	loader.send = function () {
		this.xhr.send();
	};
	
	graphite.loader = loader;
	return loader;
}(graphite));
