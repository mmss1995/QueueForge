/**
 * Resolves which .env filename to load based on NODE_ENV.
 * - "production" -> ".env" (used by Docker Compose, with service hostnames like "rabbitmq"/"redis")
 * - anything else (or unset) -> ".env.local" (used for local development, with "localhost")
 *
 * @param {string | undefined} nodeEnv - typically process.env.NODE_ENV
 * @returns {string} the env filename to load
 */
export function resolveEnvFile(nodeEnv) {
  return nodeEnv === 'production' ? '.env' : '.env.local';
}