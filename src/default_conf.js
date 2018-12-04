
const os = require('os');
const path = require('path');

const {getDefinedValue, getNPMConf} = require('./utils.js');

module.exports = {
	conf: {
		name: {
			description: `package name`,
			default() {
				const dirName = path.basename( process.cwd() );
				const parentDirName = path.basename( path.dirname(process.cwd()) );

				return parentDirName.startsWith(`@`) ?
					`${parentDirName}/${dirName}` :
					dirName;
			},
		},
		version: {
			default: getDefinedValue( getNPMConf('init-version'), `1.0.0` ),
		},
		description: {
			default: '',
		},

		main: { value:'dist/index.js' },
		scripts: { value:{} },
		dependencies: { value:{} },
		devDependencies: { value:{} },

		author: {
			default: getDefinedValue( getNPMConf('init-author-name'), os.userInfo().username ),
		},
		license: {
			default: getDefinedValue( getNPMConf('init-license'), `MIT` ),
		},
		keywords: { value:[] },

		_github: {
			temporary: true,
			description: `github`,
			default() {
				return `${this.author}/${path.basename( process.cwd() )}`;
			},
		},

		homepage: {
			optional: true,
			default() {
				if( this._github ) {
					return `https://github.com/${this._github}#readme`;
				}
			},
		},
		bugs: {
			optional: true,
			default() {
				if( this._github ) {
					return `https://github.com/${this._github}/issues`;
				}
			},
		},
		repository: {
			optional: true,
			default() {
				if( this._github ) {
					return `github:${this._github}`;
				}
			},
		},
	},
};
