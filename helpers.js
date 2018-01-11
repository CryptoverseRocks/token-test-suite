'use strict'

/**
 * Converts given value to BigNumber object if it is number or string. Otherwise defaultValue is
 * returned in case given value is not truthy.
 *
 * @param {number|string|BigNumber|null} number
 * @param {number|string|BigNumber|null} [defaultValue]
 * @returns {BigNumber|null}
 */
export function toBigNumber(number, defaultValue = null) {
	if (typeof number === 'string' || typeof number === 'number') {
		return new web3.BigNumber(number)
	}
	else if (number) {
		return number
	}
	else if (defaultValue == null) {
		return null
	}
	else {
		return new web3.BigNumber(defaultValue)
	}
}

/**
 * Asserts that given promise will throw because of revert().
 * @param {Promise} promise
 */
export async function expectRevert(promise) {
	await expectError(promise, ['revert'])
}

/**
 * Asserts that given promise will throw because of revert() or failed assertion.
 * @param {Promise} promise
 */
export async function expectRevertOrFail(promise) {
	await expectError(promise, ['revert', 'invalid opcode'])
}

/**
 * Asserts that given promise will throw and that thrown message will contain one of the given
 * search strings.
 *
 * @param {Promise} promise The promise expecting to throw.
 * @param {string[]} messages List of expected thrown message search strings.
 */
async function expectError(promise, messages) {
	try {
		await promise
	} catch (error) {
		for (let i = 0; i < messages.length; i++) {
			if (error.message.search(messages[i]) >= 0) {
				return
			}
		}
		assert.fail("Expected revert, got '" + error + "' instead.")
	}
	assert.fail('Expected revert not received.')
}
