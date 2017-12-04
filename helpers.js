'use strict'

export async function expectRevert(promise) {
	await expectError(promise, ['revert'])
}

export async function expectRevertOrFail(promise) {
	await expectError(promise, ['revert', 'invalid opcode'])
}

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
