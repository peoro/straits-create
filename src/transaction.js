
const fs = require('fs-extra');
const utils = require('./utils.js');

use traits * from utils.traits;
use traits * from require('chalk-traits');

class Op {
	constructor( name, fn ) {
		if( fn === undefined ) {
			fn = name;
			name = undefined;
		}

		this.name = name;
		this.fn = fn;
	}

	commit( prompt ) {
		return this.fn( prompt );
	}
	toString() {
		if( typeof this.name === 'function' ) {
			return this.name();
		}
		return this.name;
	}
}

class Transaction {
	constructor() {
		this.ops = [];
	}

	cancel() {
		this.ops = [];
	}
	confirm( prompt, msg ) {
		const str = this.toString();
		if( ! str ) { return true; }

		prompt.print(`About to...`);
		prompt.print( str.*indent() );
		prompt.print();
		return prompt.confirm( msg );
	}
	async commit( prompt ) {
		let some = false;
		for( let op of this.ops ) {
			const str = op.toString();
			const success = await op.commit( prompt );
			if( str ) {
				const img = success ? `✓`.*green() : `✗`.*red();
				prompt.print( `${img} ${str}`.*indent() );
			}
			some = some || success;
		}
		return some;
	}
	toString() {
		return this.ops.map( op=>op.toString() ).filter( str=>str ).join(`\n`);
	}

	push( ...ops ) {
		this.ops.push( ...ops );
	}
	op( name, fn ) {
		this.push( new Op(name, fn) );
	}
	transaction() {
		const transaction = new this.constructor();
		this.push( transaction );
		return transaction;
	}

	mkdirp( dir ) {
		this.op( ()=>fs.mkdirp(dir) );
	}
	exec( cmd ) {
		this.op( `run \`${cmd.*cyan()}\``, ()=>utils.exec(cmd) );
	}
	writeFile( dest, data, options={} ) {
		let opts = Object.assign( {}, options );
		return this.op( `create ${dest.*green()}`, tryWrite(dest, (overwrite)=>{
			const flag = overwrite ? 'w' : 'wx';
			return fs.writeFile( dest, data, Object.assign({flag}, opts) ).then( ()=>true );
		}) );
	}
	writeJson( dest, data, options={} ) {
		let opts = Object.assign( {}, options );
		return this.op( `create ${dest.*green()}`, tryWrite(dest, (overwrite)=>{
			const flag = overwrite ? 'w' : 'wx';
			return fs.writeJson( dest, data, Object.assign({flag, spaces:`\t`}, opts) ).then( ()=>true );
		}) );
	}
	copyFile( src, dest, flags=0 ) {
		return this.op( `create ${dest.*green()}`, tryWrite(dest, (overwrite)=>{
			const owFlag = overwrite ? 0 : fs.constants.COPYFILE_EXCL;
			return fs.copyFile( src, dest, flags|owFlag ).then( ()=>true );
		}) );
	}
	async copyTemplateFile( data, src, dest, options ) {
		const file = await utils.readTemplateFile( data, src );
		return this.writeFile( dest, file, options );
	}

}

function tryWrite( dest, fn ) {
	return function( prompt ) {
		return fn( false )
			.catch( async (err)=>{
				if( err.code !== 'EEXIST' ) {
					throw err;
				}

				if( await prompt.confirmOverwrite(`overwrite \`${dest.*red()}\``) ) {
					return fn( true );
				}
				return false;
			});
	};
}


module.exports = {
	Transaction,
	Op,
};
