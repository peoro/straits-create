#!/usr/bin/env node

const defaultConf = require('./default_conf.js');
const {Prompt} = require('./prompt.js');
const {Transaction} = require('./transaction.js');
const ops = require('./ops.js');

async function initPackage( prompt, operations ) {
	const transaction = new Transaction();
	const data = {};

	for( let op of operations ) {
		await op( prompt, transaction, data );
	}

	prompt.print();
	return transaction.commit( prompt );
}

function main( argc, argv ) {
	const prompt = new Prompt();

	return initPackage( prompt, [
		ops.packageJson( defaultConf.conf ),
		ops.straitsBabel,
		ops.git,
		ops.gitignore,
		ops.npmIgnore,
		ops.readme,
		ops.license,
		ops.mocha,
		ops.eslint,
	])
		.catch( (err)=>{
			if( Prompt.isCancelError(err) ) {
				prompt.print(`^C`);
				return;
			}
			throw err;
		})
		.then( (result)=>{
			if( ! result ) {
				console.log(`Nothing was altered.`);
			}
		});
}

module.exports = {
	initPackage,
	main
};

if( require.main === module ) {
	main().catch( (err)=>void console.error( err ) );
}
