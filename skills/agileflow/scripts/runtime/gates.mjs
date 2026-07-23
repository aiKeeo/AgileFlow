export const STEP_EXIT_GATE = {
  'af-init': 'init-confirm',
  'af-req': 'req-confirm',
  'af-mod': 'mod-confirm',
  'af-sol': 'sol-confirm',
  'af-dev': 'dev-complete',
  'af-test': 'test-entry',
};

export const GATE_TO_STEP = Object.fromEntries(
  Object.entries(STEP_EXIT_GATE).map(([stepId, gateId]) => [gateId, stepId]),
);

GATE_TO_STEP['dev-step1-literal'] = 'af-dev';
GATE_TO_STEP['write-code'] = 'af-dev';
GATE_TO_STEP['req-trace'] = 'af-test';
