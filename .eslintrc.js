module.exports = {
	"env": {
		"browser": true,
		"es6": true,
		"node": true
	},
	"extends": "eslint:recommended",
	"parserOptions": {
		"ecmaVersion": 2018
	},
	"rules": {
		"indent": [
			"error",
			"tab",
			{ "SwitchCase": 1 }
		],
		"linebreak-style": [
			"error",
			"unix"
		],
		"quotes": [
			"error",
			"single",
			{ "allowTemplateLiterals": true }
		],
		"semi": [
			"error",
			"always"
		],
		"no-unused-vars": [
			"error",
			{ "args": "none" }
		],
		"no-console": "off",
	}
};
