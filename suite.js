'use strict'

export default function suite(options) {
	const accounts = options.accounts

	// configure
	const initialSupply = options.initialSupply || new web3.BigNumber(0)
	const initialBalances = options.initialBalances || []
	const createToken = options.token
	const purchase = function (to, amount) { return options.purchase(token, to, amount) }

	// setup
	const expect = require('chai')
		.use(require('chai-bignumber')(web3.BigNumber))
		.expect

	// name the accounts
	const alice = accounts[1]
	const bob = accounts[2]

	let token = null

	beforeEach(async function () {
		token = await createToken()
	})

	describe('ERC-20', function () {
		describe('totalSupply()', function () {
			it('should have initial supply of ' + initialSupply.toFormat(), async function () {
				expect(await token.totalSupply.call()).to.be.bignumber.equal(initialSupply)
			})

			it('should return the correct supply', async function () {
				await purchase(alice, 1)
				expect(await token.totalSupply.call()).to.be.bignumber.equal(initialSupply.plus(1))

				await purchase(alice, 2)
				expect(await token.totalSupply.call()).to.be.bignumber.equal(initialSupply.plus(3))

				await purchase(bob, 3)
				expect(await token.totalSupply.call()).to.be.bignumber.equal(initialSupply.plus(6))
			})
		})

		describe('balanceOf(_owner)', function () {
			it('should have correct initial balances', async function () {
				for (let i = 0; i < initialBalances.length; i++) {
					let address = initialBalances[i][0]
					let balance = initialBalances[i][1]
					expect(await token.balanceOf.call(address)).to.be.bignumber.equal(balance)
				}
			})

			it('should return the correct balances', async function () {
				await purchase(alice, 1)
				expect(await token.balanceOf.call(alice)).to.be.bignumber.equal(1)

				await purchase(alice, 2)
				expect(await token.balanceOf.call(alice)).to.be.bignumber.equal(3)

				await purchase(bob, 3)
				expect(await token.balanceOf.call(bob)).to.be.bignumber.equal(3)
			})
		})
	})
}
