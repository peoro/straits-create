
const assert = require('assert');
const utils = require('../src/utils.js');

describe(`utils`, function(){
	it(`getDefinedValue`, function(){
		const a = undefined, b = {}, c = [];
		assert.strictEqual(
			utils.getDefinedValue( a, undefined, b, c ),
			b
		);
		assert.strictEqual(
			utils.getDefinedValue( a, null, b, c ),
			null
		);
	});
});
