
const {readJson, readFile, pathExists} = require('fs-extra');

const {traits, packagesToDeps} = require('./utils.js');
use traits * from traits;

const templateDir = `${__dirname}/../templates`;

module.exports = {
	packageJson( conf ) {
		return async function( prompt, transaction, data ) {
			const srcPackage = await readJson( 'package.json' ).catch( ()=>{} );
			const packageJson = data.packageJson = {};
			packageJson.*assign( srcPackage );

			if( srcPackage ) {
				if( ! await prompt.confirm(`package.json already exists. Should we update it?`) ) {
					return;
				}
			}

			await packageJson.*confFields( prompt, conf );
			prompt.print();

			data.writingPackageJson = true;
			transaction.writeJson( `package.json`, packageJson, {verbose:true} );
		};
	},

	async straitsBabel( prompt, transaction, data ) {
		const {packageJson} = data;

		data.babel = true;

		if( ! await pathExists(`src/.babelrc.js`) ) {
			transaction.mkdir( `src` );
			transaction.copyFile( `${templateDir}/babelrc.js`, `src/.babelrc.js`);
		}

		await packageJson.devDependencies.*assign(
			packagesToDeps(`@babel/cli`, `@babel/core`, `@babel/node`, `@babel/plugin-transform-strict-mode`, `straits-babel`)
		);
		packageJson.scripts.*defaults({
			start: 'babel-node src/index.js',
			prepare: 'babel src --out-dir dist',
			watch: 'babel --watch src --out-dir dist',
		});
	},

	async git( prompt, transaction, data ) {
		const git = await pathExists(`.git`);
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

		if( ! await pathExists(`.gitignore`) && await prompt.confirm(`Generate .gitignore?`) ) {
			transaction.copyFile( `${templateDir}/gitignore`,`.gitignore`);
		}
	},

	async npmIgnore( prompt, transaction, data ) {
		if( ! await pathExists(`.npmignore`) && await prompt.confirm(`Generate .npmignore?`) ) {
			transaction.copyFile( `${templateDir}/npmignore`, `.npmignore` );
		}
	},

	async readme( prompt, transaction, data ) {
		const {packageJson={}} = data;
		const {name='', description=''} = packageJson;

		if( ! await pathExists(`README.md`) && await prompt.confirm(`Generate README.md?`) ) {
			const readme = ( await readFile(`${templateDir}/README.md`, `utf8`) )
				.replace( /{{name}}/g, name )
				.replace( /{{description}}/g, description );

			transaction.writeFile( `README.md`, readme, `utf8` );
		}
	},

	async license( prompt, transaction, data ) {
		const {packageJson} = data;

		const templateLicensePath = `${templateDir}/licenses/${packageJson.license}`;
		const license = await readFile( templateLicensePath, `utf8` ).catch( ()=>'' );

		if( license ) {
			if( ! await pathExists(`LICENSE`) && await prompt.confirm(`Generate LICENSE file?`) ) {
				const {author=''} = packageJson;
				const organization = await prompt.ask( `>  organization [${author}]:`, {default:author} );

				transaction.writeFile( `LICENSE`, license
					.replace( /{{year}}/g, new Date().getFullYear() )
					.replace( /{{organization}}/g, organization ),
				`utf8` );
			}
		}
	},

	async mocha( prompt, transaction, data ) {
		const {packageJson} = data;

		if( ! await pathExists(`.gitignore`) && ! packageJson.scripts.test && await prompt.confirm(`Setup mocha tests?`) ) {
			await packageJson.devDependencies.*assign(
				packagesToDeps(`@babel/register`, `mocha`)
			);
			packageJson.scripts.*defaults({
				test: "mocha --require @babel/register test/index.js",
			});

			if( data.babel ) {
				transaction.mkdir( `test` );
				transaction.copyFile( `${templateDir}/babelrc.js`, `test/.babelrc.js`);
			}
		}
	},

	async eslint( prompt, transaction, data ) {
		const {packageJson} = data;

		if( ! await pathExists(`.eslintrc.js`) && await prompt.confirm(`Create and use ESLint config?`) ) {
			await packageJson.devDependencies.*assign(
				packagesToDeps(`@straits/eslint-config`, `eslint`)
			);
			packageJson.scripts.*defaults({
				pretest: "eslint src",
			});
			transaction.copyFile( `${templateDir}/eslintrc.js`, `.eslintrc.js`);
		}
	},
};
