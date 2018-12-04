
const {Prompt} = require('../src/prompt.js');

describe(`prompt`, function(){
	it(`new Prompt()`, function(){
		new Prompt();
		new Prompt({});
	});
});
