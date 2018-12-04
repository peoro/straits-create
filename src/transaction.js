
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

	op( name, fn ) {
		this.ops.push( new Op(name, fn) );
	}

	mkdir( dir ) {
		this.op( ()=>{
			utils.mkdir(dir).catch( (err)=>{
				if( err.code !== 'EEXIST' ) {
					throw err;
				}
			});
		});
	}
	writeFile( dest, data, options, {verbose=false}={} ) {
		const name = verbose ?
			()=>`create ${dest.*yellow()}:\n${data.*indent().*white().*bold()}` :
			`create ${dest.*yellow()}`;

		this.op( name, ()=>utils.writeFile(dest, data, options) );
	}
	writeJSON( dest, data, {verbose=false}={} ) {
		const name = verbose ?
			()=>`create ${dest.*yellow()}:\n${JSON.stringify(data, null, '  ').*indent().*white().*bold()}` :
			`create ${dest.*yellow()}`;

		this.op( name, ()=>utils.writeJSON(dest, data) );
	}
	copyFile( src, dest ) {
		this.op( `create ${dest.*yellow()}`, ()=>utils.copyFile(src, dest) );
	}
	exec( cmd ) {
		this.op( `run \`${cmd.*green()}\``, ()=>utils.exec(cmd) );
	}

	async commit( prompt ) {
		if( ! this.ops.length ) {
			return false;
		}

		prompt.print();
		prompt.print(`About to create the following files...`);
		this.ops.forEach( op=>{
			if( op.name ) {
				prompt.print( op.toString().*indent() );
			}
		});
		prompt.print();

		if( await prompt.confirm(`Is this OK?`) ) {
			for( let op of this.ops ) {
				await op.fn();
			}
		}
		return true;
	}
}

module.exports = {
	Transaction,
	Op,
};
