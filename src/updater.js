
const fs = require('fs');
const promptly = require('promptly');
const npmConfig = require('libnpmconfig');

const {PackageJSON} = require('./package_json.js');

const copyFile = util.promisify( fs.copyFile );
const mkdir = util.promisify( fs.mkdir );
const npmConf = npmConfig.read();

use traits * from require('./utils.js').traits;

// `Updater` options are...
//   `update`: true=>update existing files, false=>don't change existing files, undefined=>ask
//   `override`: true=>change current fields, otherwise don't change current fields
//   `yes`: true=>all questions true, otherwise ask
//   `ask`: true=>ask on stdin, otherwise accept default value
// if `update` is defined, packagj.json will be updated regardless of `yes` and `ask`
// if `yes` is defined, `ask` won't be used for confirmations
// `update` will only be used for confirmation on updating files
// `yes` will only be used for confirmations
// `ask` will be used for all kinds of input

class Updater {
	static prompt( msg, opts ) {
		const {ask} = opts;

		if( ask ) {
			return promptly.prompt( msg, opts );
		}
		return opts.default;
	}
	static confirm( msg, opts ) {
		const {yes, ask} = opts;

		if( yes ) {
			return true;
		}
		if( ask ) {
			return promptly.confirm( msg, opts );
		}
		return opts.default;
	}
	static async loadPackageJSON( path='./package.json', {update, yes, ask}={} ) {
		const {update, yes, ask=true} = opts;

		const packageJSON = await PackageJSON.load( path );

		// checking if we should overwrite package.json...
		if( packageJSON.loaded ) {
			if( update === undefined ) {
				update = await Updater.confirm( `package.json already exists. Should we update it? [no]`, {yes, ask, default:'n'} );
			}

			switch( update ) {
				true: break;
				false: return undefined;
				default: throw new Error(`\`overwrite\` must be true, false or undefined`);
			}
		}

		return new Updater( packageJSON, opts );
	}

	constructor( packageJSON, opts ) {
		this.packageJSON = packageJSON;
		this.filesToCopy = [];
		this.opts = opts;
	}
	async write() {
		const {yes, ask} = this.opts;

		if( ! yes && ask ) {
			console.log(`About to create the following files...`);
			console.log(`  package.json:`);
			console.log( JSON.stringify(this.packageJSON.data, null, '  ').split(`\n`).map( line=>`    ${line}` ).join(`\n`) );
			this.filesToCopy.forEach( ([src, dest])=>console.log(`  ${dest}`) );
			console.log();
		}

		const write = await this.confirm( `Is this OK? [yes]`, {default:'y'} );
		if( write ) {
			const promises = [];
			const do = (str, promise)=>{
				promises.push(
					promise
						.then( ()=>console.log(`  ✓ ${str}`) )
						.catch( ()=>console.log(`  ✗ ${str}`) )
				);
			};

			do( this.packageJSON.path, this.packageJSON.write() );

			this.dirsToMake.forEach( dir=>{

			});
			this.filesToCopy.forEach( ([src, dest])=>{
				do( dest, copyFile(src, dest) );
			}) );

			return Promise.all( promises ).then( ()=>true );
		}

		return false;
	}

	mkdir( dir ) {
		this.dirsToMake.push( dir );
	}
	copyFile( src, dest ) {
		this.filesToCopy.push( [src, dest] );
	}
	async confField( field, fieldConf ) {
		const {override} = this.opts;
		const data = this.packageJSON.data;

		if( ! override && data[field] ) {
			// not overriding fields
			return;
		}

		if( fieldConf.value ) {
			// we already have a final value for this field
			return data[field] = value;
		}

		const missing = fieldConf.hasOwnProperty(`missing`) ? fieldConf.missing : '';

		// getting a suggested value (possibly from `npm config`)
		const suggested = (()=>{
			if( ! fieldConf.npmConf ) {
				return fieldConf.suggested;
			}

			return npmConf.get( fieldConf.npmConf ) ||
				npmConf.get( fieldConf.npmConf.replace(/-/g, '.') ) ||
				fieldConf.suggested;
		})();

		if( fieldConf.optional && ! suggested ) {
			// no suggested value - field is optional anyways, so skipping it
			return;
		}

		const name = (conf.description || field).padStart(15, ' ');
		const str = `>${name} [${suggested || ''}]:`;
		const value = await this.prompt( str, {default:suggested} );
		return data[field] = value || missing;
	}
	confFields( fieldConfObj ) {
		return fieldConfObj.*forEachFieldSeq( (conf, field)=>this.confField(field, fieldConf) );
	}

	defaultField( field, obj ) {
		const data = this.packageJSON.data;

		if( ! data[field] ) {
			data[field] = obj;
			return true;
		}

		if( typeof data[field] === 'object' && typeof obj === 'object' ) {
			data[field].*defaults( obj );
		}
	}
	defaultFields( obj ) {
		return obj.*forEachFieldSeq( (value, key)=>this.defaultField(key, value) );
	}

	confirm( msg, opts ) {
		const {yes, ask} = this.opts;
		return Updater.confirm( msg, {yes, ask}.*defaults(opts) );
	}
	prompt( msg, opts ) {
		const {yes, ask} = this.opts;
		return Updater.prompt( msg, {yes, ask}.*defaults(opts) );
	}
}
