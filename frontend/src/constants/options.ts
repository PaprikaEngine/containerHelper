export const OS_OPTIONS = [
  { type: 'ubuntu', name: 'Ubuntu', versions: ['20.04', '22.04', '24.04'] },
  { type: 'debian', name: 'Debian', versions: ['bullseye', 'bookworm'] },
  { type: 'alpine', name: 'Alpine', versions: ['latest'] },
] as const;

export const LANGUAGE_OPTIONS = [
  { name: 'python', displayName: 'Python', versions: ['3.9', '3.10', '3.11', '3.12'] },
  { name: 'nodejs', displayName: 'Node.js', versions: ['18', '20', '22'] },
  { name: 'rust', displayName: 'Rust', versions: ['stable', 'nightly'] },
] as const;

export const TOTAL_STEPS = 2;