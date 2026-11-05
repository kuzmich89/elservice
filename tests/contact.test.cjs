const {test} = require('node:test');
const assert = require('node:assert/strict');
const {sendMessage, validPhone} = require('../assets/contact.js');
test('formatted international and local phone numbers are valid', () => {
  for (const value of ['+380 (50) 123-45-67', '0501234567']) assert.ok(validPhone(value));
  for (const value of ['', '123', '0000000000', '1234567890', 'abc0501234567']) assert.equal(validPhone(value), false);
});
test('confirmed submission forwards user fields and strips metadata', async () => {
  await sendMessage(new URLSearchParams('Name=Test&Phone=0501234567&page=internal&_hp_email=&internal=ignored'), async (url, options) => {
    assert.match(url, /^https:\/\/formsubmit.co\/ajax\//);
    const data = new URLSearchParams(options.body);
    assert.equal(data.get('Name'), 'Test');
    for (const key of ['page', '_hp_email', 'internal']) assert.equal(data.has(key), false);
    return {ok: true, json: async () => ({success: 'true'})};
  });
});
for (const [name, fetch] of [
  ['HTTP error', async () => ({ok: false, status: 500})],
  ['service rejection', async () => ({ok: true, json: async () => ({success: false})})],
  ['invalid JSON', async () => ({ok: true, json: async () => {throw Error('JSON');}})],
  ['network failure', async () => {throw Error('offline');}]
]) test(name + ' rejects instead of confirming delivery', async () => {
  await assert.rejects(sendMessage(new URLSearchParams('Name=Test'), fetch));
});
