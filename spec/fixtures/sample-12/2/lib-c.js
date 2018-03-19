'use strict';
let num = 0;

module.exports = {
	lib_c: {
		upper: function(s) { return s.toUpperCase(); },
		counter: function() { return ++num; },
	}
};
