#!/usr/bin/env node

const os = require('os');
const fs = require('fs');
var path = require('path');
const util = require('util');
const npmConf = require('npm-conf')();

const exec = util.promisify( require('child_process').exec );
const readFile = util.promisify( fs.readFile );
const writeFile = util.promisify( fs.writeFile );
const copyFile = util.promisify( fs.copyFile );
const mkdir = util.promisify( fs.mkdir );

const {prompt} = require('promptly');

function ynValidator( str ) {
	str = str.toLowerCase();
	switch( str ) {
		case 'yes':
		case 'y':
			return true;
		case 'no':
		case 'n':
			return false;
		default:
			throw new Error(`Y[es] or N[o] needed`);
	}
}

function defaults( obj, def ) {
	const tmp = Object.assign({}, def, obj );
	Object.assign( obj, tmp );
}

async function updatePackage() {
	const packageFile = await readFile('package.json', 'utf8')
		.catch( ()=>undefined );
	let package = JSON.parse( packageFile || `{}` );

	if( packageFile !== undefined ) {
		const update = await prompt(`package.json already exists. Should we update it? [no]`, {default:'n', validator:ynValidator} );
		if( ! update ) {
			console.log( `Nothing done.` );
			return false;
		}
	}
	else {
		console.log( `Generating a new \`package.json\`` );
	}

	const fieldConfig = {
		name: {
			description: `package name`,
			suggested: path.basename( process.cwd() ),
		},
		version: {
			config: 'init-version',
			suggested: `1.0.0`,
		},
		description: {
			optional: true,
		},
		repository: {
			optional: true,
			description: `git repository`,
			suggested: await exec(`git remote get-url origin`).then( url=>url.trim() ).catch( ()=>undefined ),
		},
		author: {
			config: 'init-author-name',
			suggested: os.userInfo().username,
		},
		license: {
			config: 'init-license',
			suggested: `ISC`,
		},
	};

	for( let field in fieldConfig ) {
		// not changing fields...
		if( package[field] ) {
			continue;
		}

		const conf = fieldConfig[field];
		let suggested;

		if( conf.config ) {
			suggested = npmConf.get( conf.config ) || npmConf.get( conf.config.replace(/-/g, '.') );
		}
		if( ! suggested ) {
			suggested = conf.suggested || '';
		}

		if( conf.optional && ! suggested ) {
			continue;
		}

		const name = (conf.description || field).padStart(15, ' ');
		const str = `>${name} [${suggested}]:`;
		const value = await prompt( str, {default:suggested} );
		package[field] = value;
	}

	defaults( package, {
		main: 'dist/index.js',
		dependencies: {},
		devDependencies: {},
		scripts: {},
		keywords: [],
	});

	defaults( package.devDependencies, {
		'@babel/cli': '^7',
		'@babel/core': '^7',
		'@babel/node': '^7',
		'@babel/plugin-transform-strict-mode': '^7',
		'@babel/register': '^7',
		'straits-babel': '^2',
	});
	defaults( package.dependencies, {
		'straits': '^1',
	});
	defaults( package.scripts, {
		'start': 'babel-node src/index.js',
		'prepare': 'babel src --out-dir dist',
		'test': 'mocha --require @babel/register test/index.js',
		'watch': 'babel --watch src --out-dir dist',
	});

	const out = JSON.stringify(package, null, '\t');

	console.log();
	console.log( JSON.stringify(package, null, '\t') );
	console.log();

	const update = await prompt(`Is this OK? [yes]`, {default:'y', validator:ynValidator} );
	if( update ) {
		return writeFile( 'package.json', out, 'utf8' )
			.then( ()=>true );
	}
	return false;
}
async function copyTemplate() {
	console.log();
	const generate = await prompt(`Generate configuration files? [yes]`, {default:'y', validator:ynValidator});
	if( generate ) {
		await Promise.all([
			mkdir(`src`).catch( ()=>{} ),
			mkdir(`test`).catch( ()=>{} ),
		]);

		const files = [
			{ src:`templates/gitignore`, dest:`.gitignore` },
			{ src:`templates/npmignore`, dest:`.npmignore` },
			{ src:`templates/babelrc.js`, dest:`src/.babelrc.js` },
			{ src:`templates/babelrc.js`, dest:`test/.babelrc.js` },
		];

		await Promise.all(
			files.map( f=>{
				return copyFile( `${__dirname}/${f.src}`, f.dest, fs.constants.COPYFILE_EXCL )
					.then( ()=>console.log(`  ${f.dest}`) )
					.catch( (err)=>console.log(`  ${f.dest} not regenerated: ${err.code}`) );
			})
		);
	}
	return false;
}

async function main() {
	await updatePackage();
	await copyTemplate();
}

main()
	.catch( (err)=>{
		if( err.message !== 'canceled' ) {
			throw err;
		}
		else {
			console.log(`^C`);
		}
	});
