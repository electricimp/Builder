'use strict';
module.exports = {
	lib_d: {
		log: function() {
			console.log.apply(console, [].slice.call(arguments));
			return '';
		}
	}
};
