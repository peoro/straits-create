
const assert = require('assert');
const {Transaction, Op} = require('../src/transaction.js');

function noop(){}

describe(`Op`, function(){
	it(`new Op()`, function(){
		const op1 = new Op( `hey`, noop );
		assert.strictEqual( op1.name, `hey` );
		assert.strictEqual( op1.fn, noop );

		const op = new Op( noop );
		assert.strictEqual( op.name, undefined );
		assert.strictEqual( op.fn, noop );
	});
	it(`op.toString()`, function(){
		assert.strictEqual( new Op(`hey`, noop).toString(), `hey` );
		assert.strictEqual( new Op( ()=>`yo`, noop).toString(), `yo` );
		assert.strictEqual( new Op(noop).toString(), undefined );
	});
});

describe(`Transaction`, function(){
	it(`new Transaction()`, function(){
		new Transaction();
	});
});
