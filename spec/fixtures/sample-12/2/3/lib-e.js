'use strict';
const testString = 'test string';

class TestClass {
	constructor() {
		this._string = testString;
	}

	testThis() {
		if (this && this._string === testString) {
			return '"this" works';
		} else {
			return '"this" does not work';
		}
	}
}

const object = new TestClass();

module.exports = {
	lib_e: {
		object,
	}
};
