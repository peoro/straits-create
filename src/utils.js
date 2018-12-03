
const {TraitSet} = require('@straits/utils');
use traits * from TraitSet;

// defining a few functions on all objects, to ease setting package.json's fields
const traits = new TraitSet().*defineAndImplTraits( Object.prototype, {
	assign( obj ) {
		Object.assign( this, obj );
	},
	defaults( obj ) {
		for( let field in obj ) {
			if( ! this[field] ) {
				this[field] = obj[field];
			}
		}
	},
	forEachField( fn ) {
		for( let field in this ) {
			fn( this[field], field, this );
		}
	},
	async forEachFieldSeq( fn ) {
		for( let field in this ) {
			await fn( this[field], field, this );
		}
	},
});

module.exports = {
	traits
};
