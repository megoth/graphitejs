/*
Old code that might be handy later on


loader.open = function(method, url) {
	buster.log(method, url);
	return;
};
loader.init.call(loader);
if(options.url) {
	loader.open.call(loader, options.method, options.uri);
	buster.log(options.url);
	return;
}
loader.responseText = options.responseText;
if(options.success) {
	loader.onload.call(loader, options.success);
}

xhr.prototype.send = function() {
	if(typeof this.onload === "function") {
		this.onload.call(loader);
	} else {
		this.onload.handleEvent.call(loader, {});
	}
}

if(options.send) {
	loader.send();
}

return loader;,
		
		/**
		 * Load a given context
		 *
		 * @param {Integer} number The order which the context have
		 * @param {Varies} context The context to load
		 */
		run: function(order, context) {
			if(graphite.isString(context)) {
				/*
				var cl = this;
				this.loader.open("GET", context);
				this.loader.onload(function(uris) {
					graphite.each(uris, function(methods, uri) {
						graphite.each(methods, function(result, method) {
							cl.contextsResolved[uri] = JSON.parse(result);
						});
					});
					cl.callback();
				});
				*/
			} else if(graphite.isArray(context)) {
				/*
				var cl = this;
				this.contexts[order] = [];
				graphite.each(context, function(con, key) {
					cl.contexts[order].push(cl.add(con));
				});
				var start = this.contexts.length - context.length;
				this.load(this.callback);
				*/
			} else {
				/*
				this.contextsResolved[order] = context;
				var cl = this;
				this.loader.onload(function() {
					cl.callback();
				});
				*/
			}
		}
*/
