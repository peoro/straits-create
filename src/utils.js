
const {readFile} = require('fs-extra');
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
	assign( ...obj ) {
		return Object.assign( this, ...obj );
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

		const callOrValue = (str)=>typeof str === 'function' ? str.call( this ) : str;

		await obj.*forEachFieldSeq( async (conf, field)=>{
			const def = await callOrValue( conf.default );

			if( this[field] === undefined && conf.temporary ) {
				temporary.push( field );
			}

			const name = ( conf.description || field ).padStart( longestName+2, ' ' );
			const defStr = getDefinedValue( def, `` );

			const opts = Object.assign( {}, conf, {
				value: await callOrValue( conf.value ),
				default: def,
				optional: await callOrValue( conf.optional ),
				current: this[field],
			});
			this[field] = await prompt.ask( `>${name} [${defStr.*yellow()}]:`, opts );
		});

		// removing temporary fields
		temporary.forEach( field=>delete this[field] );
	},
});

const exec = promisify( childProcess.exec );

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
// resolve each package `pkg` in `packages` and returns an object `{name: version}`
async function packagesToDeps( ...packages ) {
	const obj = {};
	await Promise.all( packages.map( async (pkgName)=>{
		const pkg = await pacote.manifest( pkgName );
		const prefix = getDefinedValue( getNPMConf(`save-prefix`), `^` );
		obj[ pkg.name ] = `${prefix}${pkg.version}`;
	}) );
	return obj;
}

async function readTemplateFile( packageJson, path ) {
	const {name, description} = packageJson;
	return ( await readFile(path, `utf8`) )
		.replace( /{{name}}/g, name )
		.replace( /{{description}}/g, description );
}

module.exports = {
	traits,
	exec,
	getDefinedValue,
	getNPMConf,
	packagesToDeps,
	readTemplateFile,
};
