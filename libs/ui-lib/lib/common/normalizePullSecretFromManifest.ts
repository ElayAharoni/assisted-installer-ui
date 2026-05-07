import { load } from 'js-yaml';

function formatAuthsJson(auths: unknown): string {
  return JSON.stringify({ auths }, null, 2);
}

/**
 * Mounted pull secret is a fixed-shape Secret manifest (`stringData['.dockerconfigjson']` holds JSON).
 * The form expects pull-secret JSON `{ "auths": … }` for the API.
 */
export function normalizePullSecretFromManifest(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return '';
  }

  let doc: unknown;
  try {
    doc = load(trimmed);
  } catch {
    return trimmed;
  }

  if (!doc || typeof doc !== 'object') {
    return trimmed;
  }

  const dockerJson = (doc as { stringData?: Record<string, string> }).stringData?.[
    '.dockerconfigjson'
  ];
  if (typeof dockerJson !== 'string' || !dockerJson.trim()) {
    return trimmed;
  }

  try {
    const parsed = JSON.parse(dockerJson.trim()) as unknown;
    if (
      parsed &&
      typeof parsed === 'object' &&
      'auths' in parsed &&
      typeof (parsed as { auths: unknown }).auths === 'object' &&
      (parsed as { auths: unknown }).auths !== null
    ) {
      return formatAuthsJson((parsed as { auths: unknown }).auths);
    }
  } catch {
    return trimmed;
  }

  return trimmed;
}
