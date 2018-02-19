ERC-20 Token Test Suite
=======================

Package to test your ERC-20 token implementation from your truffle projects.

Installation
------------

```
npm install --save-dev token-test-suite
```

Getting Started
---------------

Add test suite initialization boilerplate. Create the file `test/MyToken.erc20.js`:

```js
var suite = require('../node_modules/token-test-suite/lib/suite');
// or as a ES6 module:
// import suite from '../node_modules/token-test-suite/lib/suite';

const MyToken = artifacts.require('MyToken');
let options = {
	// accounts to test with, accounts[0] being the contract owner
	accounts: accounts,

	// factory method to create new token contract
	create: async function () {
		return await MyToken.new();
	},

	// factory callbacks to mint the tokens
	// use "transfer" instead of "mint" for non-mintable tokens
	mint: async function (token, to, amount) {
		return await token.transfer(to, amount, { from: accounts[0] });
	},

	// optional:
	// also test the increaseApproval/decreaseApproval methods (not part of the ERC-20 standard)
	increaseDecreaseApproval: true,

	// token info to test
	name: 'MyToken',
	symbol: 'MTK',
	decimals: 18,

	// initial state to test
	initialSupply: 100,
	initialBalances: [
		[accounts[0], 100]
	],
	initialAllowances: [
		[accounts[0], accounts[1], 0]
	]
}

contract('MyToken', function (accounts) { suite(options) });
```

Then run:

```
truffle test ./test/MyToken.erc20.js
```

You should get:

![Output of the test run](./assets/test-run.png?raw=true)

License
-------

The library is released under the [MIT license](LICENSE.md).
