
const {readJSON, readFile, fileExists, traits} = require('./utils.js');

use traits * from traits;

const templateDir = `${__dirname}/../templates`;

module.exports = {
	packageJSON( conf ) {
		return async function( prompt, transaction, data ) {
			const srcPackage = await readJSON( 'package.json' );
			const packageJSON = data.packageJSON = {};
			packageJSON.*assign( srcPackage );

			if( srcPackage ) {
				if( ! await prompt.confirm(`package.json already exists. Should we update it?`) ) {
					return;
				}
			}

			await packageJSON.*confFields( prompt, conf );
			prompt.print();

			data.writingPackageJSON = true;
			transaction.writeJSON( `package.json`, packageJSON, {verbose:true} );
		};
	},

	async straitsBabel( prompt, transaction, data ) {
		const {packageJSON} = data;

		data.babel = true;

		if( ! await fileExists(`src/.babelrc.js`) ) {
			transaction.mkdir( `src` );
			transaction.copyFile( `${templateDir}/babelrc.js`, `src/.babelrc.js`);
		}

		await packageJSON.devDependencies.*install(`@babel/cli`, `@babel/core`, `@babel/node`, `@babel/plugin-transform-strict-mode`, `straits-babel`);

		packageJSON.scripts.*defaults({
			start: 'babel-node src/index.js',
			prepare: 'babel src --out-dir dist',
			watch: 'babel --watch src --out-dir dist',
		});
	},

	async git( prompt, transaction, data ) {
		const git = await fileExists(`.git`);
		if( git ) {
			data.git = true;
		}
		else {
			if( await prompt.confirm(`Init git?`) ) {
				data.git = true;
				transaction.exec( `git init` );
			}
			else {
				data.git = false;
			}
		}
	},

	async gitignore( prompt, transaction, data ) {
		// if( data.git === false ) { return; }

		if( ! await fileExists(`.gitignore`) && await prompt.confirm(`Generate .gitignore?`) ) {
			transaction.copyFile( `${templateDir}/gitignore`,`.gitignore`);
		}
	},

	async npmIgnore( prompt, transaction, data ) {
		if( ! await fileExists(`.npmignore`) && await prompt.confirm(`Generate .npmignore?`) ) {
			transaction.copyFile( `${templateDir}/npmignore`, `.npmignore` );
		}
	},

	async readme( prompt, transaction, data ) {
		const {packageJSON={}} = data;
		const {name='', description=''} = packageJSON;

		if( ! await fileExists(`README.md`) && await prompt.confirm(`Generate README.md?`) ) {
			const readme = ( await readFile(`${templateDir}/README.md`, `utf8`) )
				.replace( /{{name}}/g, name )
				.replace( /{{description}}/g, description );

			transaction.writeFile( `README.md`, readme, `utf8` );
		}
	},

	async license( prompt, transaction, data ) {
		const {packageJSON} = data;

		const templateLicensePath = `${templateDir}/licenses/${packageJSON.license}`;
		const license = await readFile( templateLicensePath, `utf8` ).catch( ()=>'' );

		if( license ) {
			if( ! await fileExists(`LICENSE`) && await prompt.confirm(`Generate LICENSE file?`) ) {
				const {author=''} = packageJSON;
				const organization = await prompt.ask( `>  organization [${author}]:`, {default:author} );

				transaction.writeFile( `LICENSE`, license
					.replace( /{{year}}/g, new Date().getFullYear() )
					.replace( /{{organization}}/g, organization ),
				`utf8` );
			}
		}
	},

	async mocha( prompt, transaction, data ) {
		const {packageJSON} = data;

		if( ! await fileExists(`.gitignore`) && ! packageJSON.scripts.test && await prompt.confirm(`Setup mocha tests?`) ) {
			await packageJSON.devDependencies.*install(`@babel/register`, `mocha`);
			packageJSON.scripts.*defaults({
				test: "mocha --require @babel/register test/index.js",
			});

			if( data.babel ) {
				transaction.mkdir( `test` );
				transaction.copyFile( `${templateDir}/babelrc.js`, `test/.babelrc.js`);
			}
		}
	},

	async eslint( prompt, transaction, data ) {
		const {packageJSON} = data;

		if( ! await fileExists(`.eslintrc.js`) && await prompt.confirm(`Create and use ESLint config?`) ) {
			await packageJSON.devDependencies.*install(`@straits/eslint-config`, `eslint`);
			packageJSON.scripts.*defaults({
				pretest: "eslint src",
			});
			transaction.copyFile( `${templateDir}/eslintrc.js`, `.eslintrc.js`);
		}
	},
};
