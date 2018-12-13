
const {readJson, pathExists} = require('fs-extra');

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
			transaction.writeJson( `package.json`, packageJson, {flag:'w'} );
		};
	},

	async straitsBabel( prompt, transaction, data ) {
		const {packageJson} = data;

		data.babel = true;

		transaction.mkdirp( `src` );
		transaction.copyFile( `${templateDir}/src/index.js`, `src/index.js`);
		transaction.copyFile( `${templateDir}/src/babelrc.js`, `src/.babelrc.js`);

		packageJson.devDependencies.*assign(
			await packagesToDeps(`@babel/cli`, `@babel/core`, `@babel/node`, `@babel/plugin-transform-strict-mode`, `straits-babel`)
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

		if( await prompt.confirm(`Generate .gitignore?`) ) {
			transaction.copyFile( `${templateDir}/gitignore`,`.gitignore`);
		}
	},

	async npmIgnore( prompt, transaction, data ) {
		if( await prompt.confirm(`Generate .npmignore?`) ) {
			transaction.copyFile( `${templateDir}/npmignore`, `.npmignore` );
		}
	},

	async readme( prompt, transaction, data ) {
		const {packageJson={}} = data;

		if( await prompt.confirm(`Generate README.md?`) ) {
			transaction.copyTemplateFile( packageJson, `${templateDir}/README.md`, `README.md` );
		}
	},

	async license( prompt, transaction, data ) {
		const {packageJson} = data;

		const templateLicensePath = `${templateDir}/licenses/${packageJson.license}`;
		if( await pathExists(templateLicensePath) ) {
			if( await prompt.confirm(`Generate LICENSE file?`) ) {
				const {author=''} = packageJson;
				const organization = await prompt.ask( `>  organization [${author}]:`, {default:author} );

				const vars = {
					year: new Date().getFullYear(),
					organization,
				};
				transaction.copyTemplateFile( vars, `${templateDir}/licenses/${packageJson.license}`, `LICENSE` );
			}
		}
	},

	async mocha( prompt, transaction, data ) {
		const {packageJson} = data;

		if( ! await prompt.confirm(`Setup mocha tests?`) ) {
			data.tests = data.mocha = !! packageJson.devDependencies.mocha;
			return;
		}

		data.tests = data.mocha = true;

		packageJson.devDependencies.*assign(
			await packagesToDeps(`@babel/register`, `mocha`)
		);
		packageJson.scripts.*defaults({
			test: "mocha --require @babel/register test/index.js",
		});

		transaction.mkdirp( `test` );
		transaction.copyTemplateFile( packageJson, `${templateDir}/test/index.js`, `test/index.js` );
		if( data.babel ) {
			transaction.copyFile( `${templateDir}/test/babelrc.js`, `test/.babelrc.js`);
		}
	},

	async eslint( prompt, transaction, data ) {
		const {packageJson} = data;

		if( await prompt.confirm(`Setup ESLint?`) ) {
			packageJson.devDependencies.*assign(
				await packagesToDeps(`@straits/eslint-config`, `eslint`)
			);
			packageJson.scripts.*defaults({
				pretest: data.tests ? "eslint src test" : "eslint src",
			});
			transaction.copyFile( `${templateDir}/src/eslintrc.js`, `src/.eslintrc.js`);

			if( data.mocha ) {
				transaction.copyFile( `${templateDir}/test/eslintrc.js`, `test/.eslintrc.js`);
			}
		}
	},
};
