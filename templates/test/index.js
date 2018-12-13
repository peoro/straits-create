
const assert = require('assert');
const index = require('../src/index.js');

describe( `{{name}}`, function(){
	it( `greet()`, function(){
		use traits * from index.traits;
		assert.strictEqual( `World`.*greet(), `Hello World!` );
	});
});
