
const promptly = require('promptly');

const utils = require('./utils.js');

use traits * from utils.traits;
use traits * from require('chalk-traits');

// Our options are...
//   `yes`: true=>all questions true, otherwise ask
//   `ask`: true=>ask on stdin, otherwise accept default value
// if `yes` is defined, `ask` won't be used for confirmations
// `yes` will only be used for confirmations
// `ask` will be used for all kinds of input

// other options are:
//   `value`: a value was already chosen - prompting nothing
//   `current`: the current value of the field
//   `overwrite`: true=>change current fields and files, otherwise don't change current fields/files
//   `default`: default value to supply if no value was supplied or if not ask

// other options inherited by promptly:
//   `default`: default value to supply if no value was supplied
//   `retry`
//   `validator`
//   `trim`

const PROMPTLY_OPTIONS = {
	silent: false,
	replace: '',
};

class Prompt {
	static isCancelError( err ) {
		return err.message === `canceled`;
	}

	constructor( opts={} ) {
		this.opts = Object.assign( {yes:false, ask:true, trim:true, input:process.stdin, output:process.stdout}, opts );
	}

	print( ...args ) {
		if( ! this.opts.ask ) {
			return;
		}
		console.log( ...args );
	}
	ask( msg, opts={} ) {
		opts = Object.assign( {}, this.opts, opts, PROMPTLY_OPTIONS );
		const {current, overwrite, value, optional, ask} = opts;

		if( current !== undefined && ! overwrite ) {
			// not overriding current value
			return current;
		}

		if( value ) {
			// the value was already chosen
			return value;
		}

		if( opts.default === undefined && optional ) {
			// let's not bother the user with fields we have no default for
			return;
		}

		if( ! ask ) {
			return opts.default;
		}

		return promptly.prompt( msg, opts );
	}
	confirm( msg, opts={} ) {
		opts = Object.assign( {default:'y'}, this.opts, opts, PROMPTLY_OPTIONS );
		const {yes, ask} = opts;

		if( yes ) {
			return true;
		}
		if( ask ) {
			return promptly.confirm( `${msg} [${(opts.default ? `y` : `n`).*yellow()}]`, opts );
		}
		return opts.default;
	}
	confirmOverwrite( msg, opts={} ) {
		opts = Object.assign( {}, this.opts, opts );
		if( ! opts.overwrite ) {
			return false;
		}
		return this.confirm( msg, opts );
	}
}

module.exports = {
	Prompt
};
