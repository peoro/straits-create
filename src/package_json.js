
const fs = require('fs');
const {promisify} = require('util');

const readFile = util.promisify( fs.readFile );
const writeFile = util.promisify( fs.writeFile );

class PackageJSON {
	read( path='package.json' ) {
		return readFile('package.json', 'utf8')
			.then( data=>new PackageJSON(data, path, true) )
			.catch( ()=>new PackageJSON({}, path, false) );
	}

	constructor( data, path, loaded ) {
		this.data = data;
		this.path = path;
		this.loaded = loaded;
	}
	function write() {
		return writeFile( this.path, this.toString(), 'utf8' );
	}
	function toString() {
		return JSON.stringify( this.data, null, '\t' );
	}
}
