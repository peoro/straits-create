
const assert = require('assert');
const childProcess = require('child_process');
const {promisify} = require('util');
const devNull = require('dev-null');
const tmp = require('tmp');
const {main} = require('../src/index.js');

const exec = promisify( childProcess.exec );

describe(`main`, function(){
	it(`creates a working project`, function(done){
		this.timeout( 60000 );

		tmp.dir( {unsafeCleanup:true}, async(err, path, cleanup)=>{
			if( err ) { throw err; }

			try {
				process.chdir( path );
				await main({
					promptOptions: {
						output: devNull(),
						yes: true,
						ask: false,
					},
				});

				await exec(`npm install`);

				const {stdout} = await exec(`npm start`);
				assert( stdout.match(`Hello World!\n$`) );

				await exec(`npm test`);

				done();
			}
			catch( err ) {
				done( err );
			}
			finally {
				cleanup();
			}
		});
	});
});
