/**
 * 闸门回执 + step sync 前进约束
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  appendGateReceipt,
  hasGatePassReceipt,
  STEP_EXIT_GATE,
} from './lib/gate-receipts.mjs';
import { receiptGapForAdvance } from '../../cli/step-sync.mjs';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'af-receipt-'));
assert.equal(hasGatePassReceipt(tmp, 'req-confirm'), false);
appendGateReceipt(tmp, { gateId: 'req-confirm', passed: false });
assert.equal(hasGatePassReceipt(tmp, 'req-confirm'), false, 'FAIL 不算 PASS');
appendGateReceipt(tmp, { gateId: 'req-confirm', passed: true });
assert.equal(hasGatePassReceipt(tmp, 'req-confirm'), true);
appendGateReceipt(tmp, { gateId: 'req-confirm', passed: false });
assert.equal(hasGatePassReceipt(tmp, 'req-confirm'), false, '最新 FAIL 须覆盖历史 PASS');
appendGateReceipt(tmp, { gateId: 'req-confirm', passed: true });

const flow = {
  version: 1,
  steps: [
    { id: 'af-req', mode: 'strict', prompt: 'req', depends: [], outputs: [] },
    { id: 'af-sol', mode: 'strict', prompt: 'sol', depends: [], outputs: [] },
  ],
};
assert.equal(STEP_EXIT_GATE['af-req'], 'req-confirm');
assert.equal(
  receiptGapForAdvance(tmp, ['af-req'], ['af-sol'], flow),
  null,
  '有 req-confirm PASS 应可前进',
);
const tmp2 = fs.mkdtempSync(path.join(os.tmpdir(), 'af-receipt2-'));
assert.ok(
  String(receiptGapForAdvance(tmp2, ['af-req'], ['af-sol'], flow) || '').includes('req-confirm'),
  '无回执应拦前进',
);

void path;
console.log('gate-receipts tests passed');
