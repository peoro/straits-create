
const os = require('os');
const {promisify} = require('util');

const exec = util.promisify( require('child_process').exec );

async function getDefaultFieldConf() {
	const fieldConf = {
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

		main: { value:'dist/index.js' },
		scripts: { value:{} },
		dependencies: { value:{} },
		devDependencies: { value:{} },

		author: {
			npmConf: 'init-author-name',
			suggested: os.userInfo().username,
		},
		license: {
			npmConf: 'init-license',
			suggested: `ISC`,
		},
		keywords: { value:[] },

		homepage: { value:'' },
		bugs: { value:'' },
		repository: {
			optional: true,
			description: `git repository`,
			suggested: await exec(`git remote get-url origin`)
				.then( url=>url.trim() )
				.catch( ()=>undefined ),
		},
	};
}

export {
	getDefaultFieldConf
};
