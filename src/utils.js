
const fs = require('fs');
const childProcess = require('child_process');
const {promisify} = require('util');
const pacote = require('pacote');
const npmConf = require('libnpmconfig').read();

const {TraitSet} = require('@straits/utils');

use traits * from TraitSet;
use traits * from require('chalk-traits');

// defining a few functions on all objects, to ease setting package.json's fields
const traits = new TraitSet();

traits.*defineAndImplTraits( String.prototype, {
	indent( prefix='  ' ) {
		return this.split(`\n`).map( (line)=>`${prefix}${line}` ).join(`\n`);
	}
});

traits.*defineAndImplTraits( Object.prototype, {
	forEachField( fn ) {
		for( let field in this ) {
			fn( this[field], field, this );
		}
	},
	async forEachFieldSeq( fn ) {
		for( let field in this ) {
			await fn( this[field], field, this );
		}
	},
	assign( obj ) {
		Object.assign( this, obj );
	},
	defaults( obj ) {
		use traits * from traits;

		obj.*forEachField( (value, field)=>{
			if( this[field] === undefined ) {
				this[field] = value;
			}
		});
	},
	async confFields( prompt, obj ) {
		use traits * from traits;

		const longestName = Object.keys( obj )
			.map( (key)=>obj[key].description || key )
			.reduce( (max,str)=>Math.max(max, str.length), 0 );

		const temporary = [];

		await obj.*forEachFieldSeq( async (conf, field)=>{
			const def = typeof conf.default === 'function' ?
				await conf.default.call( this ) :
				conf.default;

			if( this[field] === undefined && conf.temporary ) {
				temporary.push( field );
			}

			const name = ( conf.description || field ).padStart( longestName+2, ' ' );
			const defStr = getDefinedValue( def, `` );

			const opts = Object.assign( {}, conf, {default:def, current:this[field]} );
			this[field] = await prompt.ask( `>${name} [${defStr.*yellow()}]:`, opts );
		});

		// removing temporary fields
		temporary.forEach( field=>delete this[field] );
	},

	// resolve each package `pkg` in `packages` and set on `this[pkg.name] = pkg.version`
	// it's meant to be used as: `packageJSON.dependencies.*install( '@straits/utils', 'mocha' )`
	install( ...packages ) {
		return Promise.all( packages.map( async (pkg)=>{
			return pacote.manifest( pkg ).then( (pkg)=>{
				const prefix = getDefinedValue( getNPMConf(`save-prefix`), `^` );
				this[ pkg.name ] = `${prefix}${pkg.version}`;
			});
		}) );
	}
});

const mkdir = promisify( fs.mkdir );
const readFile = promisify( fs.readFile );
const writeFile = promisify( fs.writeFile );
const copyFile = promisify( fs.copyFile );
const stat = promisify( fs.stat );
const fileExists = (path)=>stat( path ).then( ()=>true ).catch( ()=>false );
const exec = promisify( childProcess.exec );

async function readJSON( path ) {
	const file = await readFile( path, `utf8` ).catch( ()=>{} );
	if( file !== undefined ) {
		return JSON.parse( file );
	}
}
async function writeJSON( path, obj ) {
	const json = JSON.stringify( obj, null, `\t` );
	return writeFile( path, json, `utf8` );
}

function getDefinedValue( ...values ) {
	for( let value of values ) {
		if( value !== undefined ) {
			return value;
		}
	}
}
function getNPMConf( key ) {
	if( key !== undefined ) {
		return getDefinedValue(
			npmConf.get( key ),
			npmConf.get( key.replace(/-/g, '.') )
		);
	}
}

module.exports = {
	traits,
	mkdir, readFile, writeFile, copyFile, stat, fileExists, exec,
	readJSON, writeJSON,
	getDefinedValue,
	getNPMConf,
};
