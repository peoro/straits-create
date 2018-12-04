
const sinon = require('sinon');

const libnpmconfig = require('libnpmconfig');
sinon.stub( libnpmconfig, 'read' )
	.returns({
		get( key ) {
			return this[key];
		},
		"a-b": `yea`,
		"x.y": `yo`,
	});

const pacote = require('pacote');
sinon.stub( pacote, 'manifest' )
	.withArgs(`pac1`).returns( Promise.resolve({name:`pac1`, version:`1.2.3`}) )
	.withArgs(`pacX`).returns( Promise.resolve({name:`pacY`, version:`0.0.1`}) );


const assert = require('assert');
const utils = require('../src/utils.js');
const {Prompt} = require('../src/prompt.js');

use traits * from utils.traits;
use traits * from require('chalk-traits');

describe(`utils`, function(){
	it(`string.*indent()`, function(){
		assert.strictEqual( `hey`.*indent(), `  hey` );
		assert.strictEqual( `hey\nyo`.*indent(), `  hey\n  yo` );
		assert.strictEqual( `hey\nyo`.*indent(`\t`), `\they\n\tyo` );
	});
	it(`obj.*forEachField()`, function(){
		const obj = {
			a: {},
			b: Symbol(),
		};

		const results = [];
		obj.*forEachField( (value, key, obj)=>results.push([value, key, obj]) );

		assert.deepStrictEqual( results, [
			[obj.a, `a`, obj],
			[obj.b, `b`, obj],
		]);
	});
	it(`obj.*forEachFieldSeq()`, async function(){
		const sym = Symbol();
		const obj = {
			a: ()=>new Promise( resolve=>setTimeout(resolve, 50) ),
			b: ()=>sym,
		};

		const results = [];
		await obj.*forEachFieldSeq( async (fn, key, obj)=>{
			const res = await fn();
			results.push( [res, key, obj] );
		});

		assert.deepStrictEqual( results, [
			[undefined, `a`, obj],
			[sym, `b`, obj],
		]);
	});
	it(`obj.*assign()`, function(){
		const obj = { a:1, x:2 };
		obj.*assign( {b:2, x:999}, {x:3} );
		assert.deepStrictEqual( obj, {a:1, b:2, x:3} );
	});
	it(`obj.*defaults()`, function(){
		const obj = { a:1, x:2 };
		obj.*defaults( {b:2, x:999}, {x:3} );
		assert.deepStrictEqual( obj, {a:1, b:2, x:2} );
	});
	it(`obj.*confFields()`, async function(){
		const obj = { a:1, x:2 };
		const prompt = new Prompt({ask:false});
		const fakePrompt = {
			results: [],
			ask( str, opts ) {
				this.results.push( {str, opts} );
				return prompt.ask( str, opts );
			}
		};

		await obj.*confFields( fakePrompt, {
			a: {
				value() { return `hey`; },
				default() { return `5`; },
			},
			b: {
				temporary: true,
				value: `hey`,
				optional() { return `yo`; },
			},
			c: {
				value: `uhm`,
				optional() { return this; },
			},
		});

		assert.deepStrictEqual( fakePrompt.results, [
			{
				str: `>  a [${`5`.*yellow()}]:`,
				opts: { current:1, default:`5`, optional:undefined, value:`hey` },
			},
			{
				str: `>  b []:`,
				opts: { current:undefined, default:undefined, optional:`yo`, value:`hey`, temporary:true },
			},
			{
				str: `>  c []:`,
				opts: { current:undefined, default:undefined, optional:obj, value:`uhm` },
			},
		]);

		assert.deepStrictEqual( obj, {
			a: 1,
			c: `uhm`,
			x: 2,
		});
	});

	it(`getDefinedValue()`, function(){
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
	it(`getNPMConf`, function() {
		assert.strictEqual( utils.getNPMConf(), undefined );
		assert.strictEqual( utils.getNPMConf(`xxx`), undefined );
		assert.strictEqual( utils.getNPMConf(`a-b`), `yea` );
		assert.strictEqual( utils.getNPMConf(`x-y`), `yo` );
	});
	it(`packagesToDeps()`, async function(){
		const packages = await utils.packagesToDeps(`pac1`, `pacX`);
		assert.deepStrictEqual( packages, {
			"pac1": `^1.2.3`,
			"pacY": `^0.0.1`,
		});
	});
});
