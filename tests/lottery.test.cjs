const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const root = path.join(__dirname, '..');

function load(crypto = webcrypto) {
  const context = vm.createContext({ crypto, console: { log() {} } });
  vm.runInContext(fs.readFileSync(path.join(root, '로또추첨.js'), 'utf8'), context);
  return context;
}

test('6/45 draws six unique, sorted integers within 1–45', () => {
  const context = load();
  for (let i = 0; i < 10000; i++) {
    const numbers = vm.runInContext('generateLotto645()', context);
    assert.equal(numbers.length, 6);
    assert.equal(new Set(numbers).size, 6);
    assert.ok(numbers.every((n, j) => Number.isInteger(n) && n >= 1 && n <= 45 && (!j || numbers[j - 1] < n)));
  }
});

test('pension mode preserves repeated digits and leading zeros', () => {
  const context = load({ getRandomValues(values) { values[0] = 0; return values; } });
  assert.equal(vm.runInContext('formatLottoDigits(generateLottoDigits())', context), '0 0 0 0 0 0');
});

test('random integer rejects the biased remainder at the upper boundary', () => {
  let calls = 0;
  const context = load({ getRandomValues(values) { values[0] = 0; return values; } });
  context.crypto = { getRandomValues(values) { values[0] = calls++ ? 44 : 4294967295; return values; } };
  assert.equal(vm.runInContext('randomInteger(45)', context), 44);
  assert.equal(calls, 2);
});

test('soft taps stay finite, below clipping, and end at silence', () => {
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(root, 'flap-sound.js'), 'utf8'), context);
  for (const rate of [44100, 48000]) {
    const samples = vm.runInContext(`createSoftTapSamples(${rate})`, context);
    assert.equal(samples.length, Math.ceil(rate * 0.085));
    assert.equal(Math.abs(samples[0]), 0);
    assert.equal(Math.abs(samples[samples.length - 1]), 0);
    assert.ok(samples.every(n => Number.isFinite(n) && Math.abs(n) < 1));
    assert.ok(samples.some(n => Math.abs(n) > 0.05));
  }
});
