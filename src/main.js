
async function main() {
	const updater = Updater.loadPackageJSON();
	if( ! updater ) {
		return;
	}

	const fieldConf = await getDefaultFieldConf();
	await updater.confFields( fieldConf );

	updater.defaultFields({
		dependencies: {
			'straits': '^1',
		},
		devDependencies: {
			'@babel/cli': '^7',
			'@babel/core': '^7',
			'@babel/node': '^7',
			'@babel/plugin-transform-strict-mode': '^7',
			'@babel/register': '^7',
			'straits-babel': '^2',
		},
		scripts: {
			start: 'babel-node src/index.js',
			prepare: 'babel src --out-dir dist',
			test: 'mocha --require @babel/register test/index.js',
			watch: 'babel --watch src --out-dir dist',
		},
	});

	await updatePackage();
	await copyTemplate();
}

main()
	.then( (result=>{
		if( ! result ) {
			console.log(`Nothing was altered.`);
		}
	});
	.catch( (err)=>{
		if( err.message !== 'canceled' ) {
			throw err;
		}
		else {
			console.log(`^C`);
		}
	});
