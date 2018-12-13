
const traits = {
	greet: Symbol(),
};
use traits * from traits;

String.prototype.*greet =  function() {
	return `Hello ${this}!`;
};

if( require.main === module ) {
	console.log( `World`.*greet() );
}

module.exports = {traits};
