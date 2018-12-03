#!/usr/bin/env node

const fs = require('fs');
var path = require('path');


use traits * from require('./utils.js').traits;


function generatePackageJSON( packageJSON, fieldConfObj, {update, yes, ask=true, path}={} ) {
	const data = package.data;

	await data.*setFields( fieldConfObj, {yes, ask} );

	data.devDependencies.*defaults({
		'@babel/cli': '^7',
		'@babel/core': '^7',
		'@babel/node': '^7',
		'@babel/plugin-transform-strict-mode': '^7',
		'@babel/register': '^7',
		'straits-babel': '^2',
	});
	data.dependencies.*defaults({
		'straits': '^1',
	});
	data.scripts.*defaults({
		start: 'babel-node src/index.js',
		prepare: 'babel src --out-dir dist',
		test: 'mocha --require @babel/register test/index.js',
		watch: 'babel --watch src --out-dir dist',
	});

	return packageJSON;
}

/*
async function copyTemplate() {
	console.log();
	const generate = await confirm(`Generate configuration files? [yes]`, {default:'y'});
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
*/
const {defaultFieldConf} = require('./default_conf.js');

async function main() {
	const conf = defaultFieldConf()
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
