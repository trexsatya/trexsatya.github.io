function addScriptTag(filePath) {
	document.write('<script src="' + filePath + '"></script>');
}

function includeScript(files) {
	var fn = function(runningStr, s) {
		if (_.isString(s))
			addScriptTag(runningStr + "/" + s);
		else if (_.isArray(s))
			_.each(s, function(data, indx) {
				fn(runningStr, data);
			})
		else if (_.isObject(s))
			_.each(s, function(data, indx) {
				fn(runningStr + "/" + indx, data);
			});
	};
	fn("", files);
}
