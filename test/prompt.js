
const assert = require('assert');
const sinon = require('sinon');
const {Prompt} = require('../src/prompt.js');
const promptly = require('promptly');

use traits * from require('chalk-traits');

const sym = Symbol();

function opts( opts={} ) {
	return Object.assign( {yes:false, ask:true, trim:true}, opts, {
		silent: false,
		replace: '',
		input: process.stdin,
		output: process.stdout,
	});
}
function confirm( str, def=`y` ) {
	return `${str} [${def.*yellow()}]`;
}

describe(`Prompt`, function(){

	let sandbox, pro, con;
	beforeEach(function() {
		sandbox = sinon.createSandbox();

		pro = sandbox.stub( promptly, 'prompt' ).returns( sym );
		con = sandbox.stub( promptly, 'confirm' ).returns( sym );
	});
	afterEach(function() {
		sandbox.restore();
	});

	it(`new Prompt()`, function(){
		new Prompt();
		new Prompt({});

		sandbox.assert.notCalled( promptly.prompt );
		sandbox.assert.notCalled( promptly.confirm );
	});

	it(`prompt.print()`, function(){
		const log = sinon.stub( console, 'log' );
		try {
			const prompt1 = new Prompt();
			prompt1.print( `hey`, 3 );
			sinon.assert.calledOnce( console.log );
			sinon.assert.calledWith( console.log, `hey`, 3 );

			const prompt2 = new Prompt( {ask:false} );
			prompt2.print( `hey`, 3 );
			sinon.assert.calledOnce( console.log );
		}
		finally {
			log.restore();
		}
	});

	describe(`prompt.ask()`, function(){
		it( `forwards args and return value`, function(){
			const prompt = new Prompt( {hey:`yo`, xxx:sym, trim:false} );

			const res1 = prompt.ask( `hey` );
			assert.strictEqual( res1, sym );
			assert.strictEqual( pro.callCount, 1 );
			assert.deepStrictEqual( pro.args[0], [ `hey`, opts({hey:`yo`, xxx:sym, trim:false}) ] );

			const res2 = prompt.ask( `yo`, {xxx:3, yo:`hey`} );
			assert.strictEqual( res2, sym );
			assert.strictEqual( pro.callCount, 2 );
			assert.deepStrictEqual( pro.args[1], [ `yo`, opts({hey:`yo`, xxx:3, trim:false, yo:`hey`}) ] );
		});
		it( `current is returned immediately`, function(){
			const prompt = new Prompt();
			const res = prompt.ask( `hey`, {current:44, default:7, value:12} );
			assert.strictEqual( res, 44 );
			assert.strictEqual( pro.callCount, 0 );
		});
		it( `value is returned after current`, function(){
			const prompt = new Prompt();
			const res = prompt.ask( `hey`, {default:7, value:12} );
			assert.strictEqual( res, 12 );
			assert.strictEqual( pro.callCount, 0 );
		});
		it( `if default is not set, optional returns it`, function(){
			const prompt = new Prompt();
			const res1 = prompt.ask( `hey`, {optional:true} );
			assert.strictEqual( res1, undefined );
			assert.strictEqual( pro.callCount, 0 );

			const res2 = prompt.ask( `hey`, {} );
			assert.strictEqual( res2, sym );
			assert.strictEqual( pro.callCount, 1 );
			assert.deepStrictEqual( pro.args[0], [ `hey`, opts() ] );
		});
		it( `ask:false returns default`, function(){
			const prompt = new Prompt();
			const res1 = prompt.ask( `hey`, {ask:false} );
			assert.strictEqual( res1, undefined );
			assert.strictEqual( pro.callCount, 0 );

			const res2 = prompt.ask( `hey`, {ask:false, default:666} );
			assert.strictEqual( res2, 666 );
			assert.strictEqual( pro.callCount, 0 );
		});
		it( `yes:true is unused`, function(){
			const prompt = new Prompt();
			const res = prompt.ask( `hey`, {yes:true} );
			assert.strictEqual( res, sym );
			assert.strictEqual( pro.callCount, 1 );
			assert.deepStrictEqual( pro.args[0], [ `hey`, opts({yes:true}) ] );
		});
	});

	describe(`prompt.confirm()`, function(){
		it( `forwards args and return value`, function(){
			const prompt = new Prompt( {hey:`yo`, xxx:sym, trim:false} );

			const res1 = prompt.confirm( `hey` );
			assert.strictEqual( res1, sym );
			assert.strictEqual( con.callCount, 1 );
			assert.deepStrictEqual( con.args[0], [ confirm(`hey`), opts({hey:`yo`, xxx:sym, trim:false, default:`y`}) ] );

			const res2 = prompt.confirm( `yo`, {xxx:3, default:`n` } );
			assert.strictEqual( res2, sym );
			assert.strictEqual( con.callCount, 2 );
			assert.deepStrictEqual( con.args[1], [ confirm(`yo`), opts({hey:`yo`, xxx:3, trim:false, default:`n`}) ] );
		});
		it( `yes:true returns true`, function(){
			const prompt = new Prompt();
			const res = prompt.confirm( `hey`, {yes:true, ask:false, default:`n`} );
			assert.strictEqual( res, true );
			assert.strictEqual( con.callCount, 0 );
		});
		it( `ask:false returns default`, function(){
			const prompt = new Prompt();
			const res = prompt.confirm( `hey`, {ask:false, default:55} );
			assert.strictEqual( res, 55 );
			assert.strictEqual( con.callCount, 0 );
		});
	});

	it(`isCancelError()`, function(){
		assert( Prompt.isCancelError(new Error(`canceled`)) );
	});
});
