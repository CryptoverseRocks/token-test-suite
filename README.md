ERC-20 Token Test Suite
=======================

[![Build Status](https://travis-ci.org/CryptoverseRocks/token-test-suite.svg)](https://travis-ci.org/CryptoverseRocks/token-test-suite)

Package to test your ERC-20 token implementation from your truffle projects.

This package offers the reusable tests for your final ERC-20 token implementations. This suite will
tests whether your token conforms to the ERC-20 standard.

Installation
------------

```shell
npm install --save-dev token-test-suite
```

Getting Started
---------------

The test suite assumes it is ran from the truffle's `contract` function ([see docs](http://truffleframework.com/docs/getting_started/javascript-tests)). That ensures that `mocha` and `chai` is visible in the test suite.

Create the file `test/MyToken.erc20.js` and just add initialization boilerplate. It should look like this:

```js
const suite = require('../node_modules/token-test-suite/lib/suite');
const MyToken = artifacts.require('MyToken');

contract('MyToken', function (accounts) {
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
	};

	suite(options);
});
```

Then run:

```shell
truffle test ./test/MyToken.erc20.js
```

You should get:

![Output of the test run](./assets/test-run.png?raw=true)

More
----

The library won't test any additional logic your token might implement. It expects "classical" token
behavior. All test assume, that tokens are fully transferrable. If you implement vesting period or
freeze times, maybe specifying before/after custom callbacks in options might help. If not, perhaps
the standardized tests are not for you and you might just copy/paste and customize them.

License
-------

The library is released under the [MIT license](LICENSE.md).
