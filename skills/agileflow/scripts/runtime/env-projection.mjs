import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { bandForStep } from '../validate-atlas/lib/flow.mjs';

function parseEnv(raw) {
  const values = {};
  for (const line of String(raw || '').split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) values[match[1]] = match[2].trim();
  }
  return values;
}

export function projectRunToEnv(projectRoot, run) {
  const envPath = path.join(projectRoot, 'atlas', 'agileflow.env');
  const current = fs.existsSync(envPath) ? parseEnv(fs.readFileSync(envPath, 'utf8')) : {};
  const firstStep = run.currentStep[0] || '';
  const next = {
    AF_PHASE: String(bandForStep(firstStep) || current.AF_PHASE || '0'),
    AF_DECIDE: run.decisionMode || current.AF_DECIDE || 'user',
    AF_TIER: current.AF_TIER || 'full',
    AF_STACK_SOURCE: current.AF_STACK_SOURCE || 'pending',
    AF_HOST_CAPABILITY: current.AF_HOST_CAPABILITY || 'pending',
    AF_STEP: run.currentStep.join(','),
  };
  fs.mkdirSync(path.dirname(envPath), { recursive: true });
  const tempPath = path.join(
    path.dirname(envPath),
    `.${path.basename(envPath)}.${process.pid}.${crypto.randomUUID()}.tmp`,
  );
  fs.writeFileSync(
    tempPath,
    `${Object.entries(next).map(([key, value]) => `${key}=${value}`).join('\n')}\n`,
    'utf8',
  );
  fs.renameSync(tempPath, envPath);
}
