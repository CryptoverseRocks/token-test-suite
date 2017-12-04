'use strict'

import { expectRevertOrFail } from './helpers'

export default function suite(options) {
	const accounts = options.accounts

	// configure
	const initialSupply = options.initialSupply || new web3.BigNumber(0)
	const initialBalances = options.initialBalances || []
	const initialAllowances = options.initialAllowances || []
	const createToken = options.token
	const purchase = function (to, amount) { return options.purchase(token, to, amount) }

	// setup
	const expect = require('chai')
		.use(require('chai-bignumber')(web3.BigNumber))
		.expect

	// name the accounts
	const alice = accounts[1]
	const bob = accounts[2]
	const charles = accounts[3]

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

		describe('allowance(_owner, _spender)', function () {
			it('should have correct initial allowance', async function () {
				for (let i = 0; i < initialAllowances.length; i++) {
					let owner = initialAllowances[i][0]
					let spender = initialAllowances[i][1]
					let expectedAllowance = initialAllowances[i][2]
					expect(await token.allowance.call(owner, spender)).to.be.bignumber.equal(expectedAllowance)
				}
			})

			let describeAllowance = function (name, from, to) {
				describe('when ' + name, function () {
					it('should return the correct allowance', async function () {
						await token.approve(to, 1, { from: from })
						expect(await token.allowance.call(from, to)).to.be.bignumber.equal(1)
					})
				})
			}

			describeAllowance('_owner != _spender', alice, bob)
			describeAllowance('_owner == _spender', alice, alice)

			it('should return the correct allowance', async function () {
				await token.approve(bob, 1, { from: alice })
				await token.approve(charles, 2, { from: alice })
				await token.approve(charles, 3, { from: bob })
				await token.approve(alice, 4, { from: bob })
				await token.approve(alice, 5, { from: charles })
				await token.approve(bob, 6, { from: charles })

				expect(await token.allowance.call(alice, bob)).to.be.bignumber.equal(1)
				expect(await token.allowance.call(alice, charles)).to.be.bignumber.equal(2)
				expect(await token.allowance.call(bob, charles)).to.be.bignumber.equal(3)
				expect(await token.allowance.call(bob, alice)).to.be.bignumber.equal(4)
				expect(await token.allowance.call(charles, alice)).to.be.bignumber.equal(5)
				expect(await token.allowance.call(charles, bob)).to.be.bignumber.equal(6)
			})
		})

		// NOTE: assumes that approve should always succeed
		describe('approve(_spender, _value)', function () {
			let describeApprove = function (name, from, to) {
				describe('when ' + name, function () {
					it('should return true when approving 0', async function () {
						assert.isTrue(await token.approve.call(to, 0, { from: from }))
					})

					it('should return true when approving', async function () {
						assert.isTrue(await token.approve.call(to, 3, { from: from }))
					})

					it('should return true when updating approval', async function () {
						assert.isTrue(await token.approve.call(to, 2, { from: from }))
						await token.approve(to, 2, { from: from })

						// test decreasing approval
						assert.isTrue(await token.approve.call(to, 1, { from: from }))

						// test not-updating approval
						assert.isTrue(await token.approve.call(to, 2, { from: from }))

						// test increasing approval
						assert.isTrue(await token.approve.call(to, 3, { from: from }))
					})

					it('should return true when revoking approval', async function () {
						await token.approve(to, 3, { from: from })
						assert.isTrue(await token.approve.call(to, 0, { from: from }))
					})

					it('should update allowance accordingly', async function () {
						await token.approve(to, 1, { from: from })
						expect(await token.allowance(from, to)).to.be.bignumber.equal(1)

						await token.approve(to, 3, { from: from })
						expect(await token.allowance(from, to)).to.be.bignumber.equal(3)

						await token.approve(to, 0, { from: from })
						expect(await token.allowance(from, to)).to.be.bignumber.equal(0)
					})

					it('should fire Approval event', async function () {
						await testApprovalEvent(from, to, 1)
						if (from != to) {
							await testApprovalEvent(to, from, 2)
						}
					})

					it('should fire Approval when allowance was set to 0', async function () {
						await token.approve(to, 3, { from: from })
						await testApprovalEvent(from, to, 0)
					})

					it('should fire Approval even when allowance did not change', async function () {
						// even 0 -> 0 should fire Approval event
						await testApprovalEvent(from, to, 0)

						await token.approve(to, 3, { from: from })
						await testApprovalEvent(from, to, 3)
					})

					let testApprovalEvent = async function (from, to, amount) {
						let result = await token.approve(to, amount, { from: from })
						let log = result.logs[0]
						assert.equal(log.event, 'Approval')
						assert.equal(log.args.owner, from)
						assert.equal(log.args.spender, to)
						expect(log.args.value).to.be.bignumber.equal(amount)
					}
				})
			}

			describeApprove('_spender != sender', alice, bob)
			describeApprove('_spender == sender', alice, alice)
		})

		describe('transfer(_to, _value)', function () {
			it('should return true when called with amount of 0', async function () {
				assert.isTrue(await token.transfer.call(bob, 0, { from: alice }))
			})

			it('should revert when trying to transfer something while having nothing', async function () {
				await expectRevertOrFail(token.transfer(bob, 1, { from: alice }))
			})

			it('should revert when trying to transfer more than balance', async function () {
				await purchase(alice, 3)
				await expectRevertOrFail(token.transfer(bob, 4, { from: alice }))

				await token.transfer(bob, 1, { from: alice })
				await expectRevertOrFail(token.transfer(bob, 3, { from: alice }))
				await expectRevertOrFail(token.transfer(alice, 3, { from: alice }))
			})

			it('should return true when transfer can be made', async function () {
				await purchase(alice, 3)
				assert.isTrue(await token.transfer.call(bob, 1, { from: alice }))
				assert.isTrue(await token.transfer.call(bob, 2, { from: alice }))
				assert.isTrue(await token.transfer.call(bob, 3, { from: alice }))

				await token.transfer(bob, 1, { from: alice })
				assert.isTrue(await token.transfer.call(bob, 1, { from: alice }))
				assert.isTrue(await token.transfer.call(bob, 2, { from: alice }))
			})

			it('should transfer given amount', async function () {
				await purchase(alice, 3)
				let aliceBalance1 = await token.balanceOf.call(alice)
				let bobBalance1 = await token.balanceOf.call(bob)

				await token.transfer(bob, 1, { from: alice })
				let aliceBalance2 = await token.balanceOf.call(alice)
				let bobBalance2 = await token.balanceOf.call(bob)
				expect(aliceBalance2).to.be.bignumber.equal(aliceBalance1.minus(1))
				expect(bobBalance2).to.be.bignumber.equal(bobBalance1.plus(1))

				await token.transfer(bob, 2, { from: alice })
				let aliceBalance3 = await token.balanceOf.call(alice)
				let bobBalance3 = await token.balanceOf.call(bob)
				expect(aliceBalance3).to.be.bignumber.equal(aliceBalance2.minus(2))
				expect(bobBalance3).to.be.bignumber.equal(bobBalance2.plus(2))
			})

			it('should allow transferring to yourself', async function () {
				await purchase(alice, 3)
				let aliceBalance1 = await token.balanceOf.call(alice)

				await token.transfer(alice, 2, { from: alice })
				let aliceBalance2 = await token.balanceOf.call(alice)
				expect(aliceBalance2).to.be.bignumber.equal(aliceBalance1)

				await token.transfer(alice, 2, { from: alice })
				let aliceBalance3 = await token.balanceOf.call(alice)
				expect(aliceBalance3).to.be.bignumber.equal(aliceBalance1)
			})

			it('should not affect totalSupply', async function () {
				await purchase(alice, 3)
				let supply1 = await token.totalSupply.call()
				await token.transfer(bob, 3, { from: alice })
				let supply2 = await token.totalSupply.call()
				expect(supply2).to.be.be.bignumber.equal(supply1)

				await token.transfer(bob, 3, { from: bob })
				let supply3 = await token.totalSupply.call()
				expect(supply3).to.be.be.bignumber.equal(supply1)
			})

			it('should fire Transfer event', async function () {
				await testTransferEvent(alice, bob, 3)
			})

			it('should fire Transfer event when transferring to yourself', async function () {
				await testTransferEvent(alice, alice, 3)
			})

			it('should fire Transfer event when transferring amount of 0', async function () {
				await testTransferEvent(alice, bob, 0)
			})

			let testTransferEvent = async function (from, to, amount) {
				if (amount > 0) {
					await purchase(from, amount)
				}

				let result = await token.transfer(to, amount, { from: from })
				let log = result.logs[0]
				assert.equal(log.event, 'Transfer')
				assert.equal(log.args.from, from)
				assert.equal(log.args.to, to)
				expect(log.args.value).to.be.bignumber.equal(amount)
			}
		})

		describe('transferFrom(_from, _to, _value)', function () {
			beforeEach(async function () {
				// by default approve bob to withdraw from alice
				await token.approve(bob, 3, { from: alice })
			})

			it('should return true when called with amount of 0 and sender is approved', async function () {
				assert.isTrue(await token.transferFrom.call(bob, alice, 0, { from: alice }))
			})

			it('should return true when called with amount of 0 and sender is not approved', async function () {
				assert.isTrue(await token.transferFrom.call(alice, bob, 0, { from: bob }))
			})

			it('should revert when trying to transfer something while _from having nothing', async function () {
				await expectRevertOrFail(token.transferFrom(alice, bob, 1, { from: bob }))
			})

			it('should revert when trying to transfer more than balance of _from', async function () {
				await purchase(alice, 3)
				await expectRevertOrFail(token.transferFrom(alice, bob, 4, { from: bob }))

				await token.transferFrom(alice, bob, 1, { from: bob })
				await expectRevertOrFail(token.transferFrom(alice, bob, 3, { from: bob }))
			})

			it('should revert when trying to transfer while not allowed at all', async function () {
				await purchase(bob, 3)
				await expectRevertOrFail(token.transferFrom(bob, alice, 1, { from: alice }))
				await expectRevertOrFail(token.transferFrom(bob, alice, 2, { from: alice }))
				await expectRevertOrFail(token.transferFrom(bob, alice, 3, { from: alice }))
			})

			it('should revert when trying to transfer more than allowed', async function () {
				await purchase(bob, 3)
				await token.approve(alice, 2, { from: bob })
				await expectRevertOrFail(token.transferFrom(bob, alice, 3, { from: alice }))
			})

			it('should return true when transfer can be made', async function () {
				await purchase(alice, 3)
				assert.isTrue(await token.transferFrom.call(alice, bob, 1, { from: bob }))
				assert.isTrue(await token.transferFrom.call(alice, bob, 2, { from: bob }))
				assert.isTrue(await token.transferFrom.call(alice, bob, 3, { from: bob }))

				await token.transferFrom(alice, bob, 1, { from: bob })
				assert.isTrue(await token.transferFrom.call(alice, bob, 1, { from: bob }))
				assert.isTrue(await token.transferFrom.call(alice, bob, 2, { from: bob }))
			})

			it('should update balances accordingly', async function () {
				await purchase(alice, 3)
				await token.transferFrom(alice, bob, 3, { from: bob })
				expect(await token.balanceOf.call(bob)).to.be.bignumber.equal(3)
				expect(await token.balanceOf.call(alice)).to.be.bignumber.equal(0)
			})

			it('should not affect totalSupply', async function () {
				await purchase(alice, 3)
				let supply1 = await token.totalSupply.call()
				await token.transferFrom(alice, bob, 3, { from: bob })
				let supply2 = await token.totalSupply.call()
				expect(supply2).to.be.be.bignumber.equal(supply1)
			})

			it('should fire Transfer event', async function () {
				await testTransferEvent(alice, bob, 3)
			})

			it('should fire Transfer event when transferring amount of 0', async function () {
				await testTransferEvent(alice, bob, 0)
			})

			it('should fire Transfer event when transferring amount of 0 and sender is not approved', async function () {
				await testTransferEvent(bob, alice, 0)
			})

			it('should transfer given amount', async function () {
				await purchase(alice, 3)
				let balance1 = await token.balanceOf.call(bob)

				await token.transferFrom(alice, bob, 1, { from: bob })
				let balance2 = await token.balanceOf.call(bob)
				expect(balance2).to.be.bignumber.equal(balance1.plus(1))

				await token.transferFrom(alice, bob, 2, { from: bob })
				let balance3 = await token.balanceOf.call(bob)
				expect(balance3).to.be.bignumber.equal(balance2.plus(2))
			})

			let testTransferEvent = async function (from, to, amount) {
				if (amount > 0) {
					await purchase(from, amount)
				}

				let result = await token.transferFrom(from, to, amount, { from: to })
				let log = result.logs[0]
				assert.equal(log.event, 'Transfer')
				assert.equal(log.args.from, from)
				assert.equal(log.args.to, to)
				expect(log.args.value).to.be.bignumber.equal(amount)
			}
		})
	})
}
