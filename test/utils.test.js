(function(global) {
	function mockLoader(options) {
		var mockedLoader = {
			init: function() {
				this.callback = function() {};
				this.responseText = {};
				this.uris = this.uris || {};
			},
		
			listenTo: function(uris) {
				var self = this;
				if(graphite.isArray(uris)) {
					for(var uri in uris) {
						self.listenTo(uris[uri]);
					}
				} else {
					for(var uri in uris) {
						self.uris[uri] = self.uris[uri] || {};
						for(var method in uris[uri]) {
							self.uris[uri][method] = uris[uri][method]
						}
					}
				}
			},
		
			onload: function(callback) {
				this.callback = callback;
			},
		
			open: function(method, uri) {
				this.responseText = this.uris[uri][method];
			},
		
			send: function() {
				this.callback(this.responseText);
			}
		};
	
		var loader = Object.create(mockedLoader);
		loader.init();
		if(options) {
			options.uri && loader.listenTo(options.uri);
			options.success && loader.onload(options.success);
		}
		return loader;
	}
	
	global.mockLoader = mockLoader;
}(typeof window === 'undefined' ? this : window));
