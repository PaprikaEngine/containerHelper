import type { EnvironmentConfig } from '../types/config';

export const generateDockerfile = (config: EnvironmentConfig): string => {
  const lines: string[] = [];

  // Generate FROM instruction
  const osImage = getOSImage(config.os.type, config.os.version);
  lines.push(`FROM ${osImage}`);
  lines.push('');

  // Set working directory
  lines.push('WORKDIR /app');
  lines.push('');

  // Install languages and their dependencies
  config.languages.forEach((language) => {
    const languageCommands = getLanguageInstallCommands(
      language.name,
      language.version,
      config.os.type
    );

    if (languageCommands.length > 0) {
      lines.push(`# Install ${language.name} ${language.version}`);
      lines.push(...languageCommands);
      lines.push('');
    }
  });

  // Add SSH server if enabled
  if (config.ssh?.enabled) {
    const sshCommands = getSSHInstallCommands(config.os.type, config.ssh.password);
    lines.push('# Install and configure SSH server');
    lines.push(...sshCommands);
    lines.push('');
    lines.push(`EXPOSE ${config.ssh.port}`);
    lines.push('');
  }

  // Add common helpful commands
  lines.push('# Copy application files');
  lines.push('# COPY . .');
  lines.push('');
  lines.push('# Set default command');
  if (config.ssh?.enabled) {
    lines.push('CMD ["/usr/sbin/sshd", "-D"]');
  } else {
    lines.push('CMD ["/bin/bash"]');
  }

  return lines.join('\n');
};

const getOSImage = (osType: string, version: string): string => {
  switch (osType) {
    case 'ubuntu':
      return `ubuntu:${version}`;
    case 'debian':
      return `debian:${version}`;
    case 'alpine':
      return 'alpine:latest';
    default:
      return 'ubuntu:22.04';
  }
};

const getSSHInstallCommands = (osType: string, password: string): string[] => {
  const isAlpine = osType === 'alpine';

  if (isAlpine) {
    return [
      'RUN apk update && \\',
      '    apk add openssh-server && \\',
      '    ssh-keygen -A && \\',
      `    echo "root:${password}" | chpasswd && \\`,
      '    sed -i "s/#PermitRootLogin.*/PermitRootLogin yes/" /etc/ssh/sshd_config && \\',
      '    sed -i "s/#PasswordAuthentication.*/PasswordAuthentication yes/" /etc/ssh/sshd_config && \\',
      '    mkdir -p /run/sshd && \\',
      '    rm -rf /var/cache/apk/*',
    ];
  }

  // Debian/Ubuntu
  return [
    'RUN apt-get update && \\',
    '    apt-get install -y openssh-server && \\',
    '    mkdir -p /var/run/sshd && \\',
    `    echo "root:${password}" | chpasswd && \\`,
    '    sed -i "s/#PermitRootLogin.*/PermitRootLogin yes/" /etc/ssh/sshd_config && \\',
    '    sed -i "s/#PasswordAuthentication.*/PasswordAuthentication yes/" /etc/ssh/sshd_config && \\',
    '    rm -rf /var/lib/apt/lists/*',
  ];
};

const getLanguageInstallCommands = (
  languageName: string,
  version: string,
  osType: string
): string[] => {
  const isAlpine = osType === 'alpine';
  const packageManager = isAlpine ? 'apk' : 'apt-get';
  const updateCmd = isAlpine ? 'apk update' : 'apt-get update';
  const installFlag = isAlpine ? 'add' : 'install -y';

  switch (languageName) {
    case 'python':
      if (isAlpine) {
        return [
          `RUN ${updateCmd} && \\`,
          `    ${packageManager} ${installFlag} python3 py3-pip && \\`,
          `    rm -rf /var/cache/apk/*`,
        ];
      }
      return [
        `RUN ${updateCmd} && \\`,
        `    ${packageManager} ${installFlag} python${version} python3-pip && \\`,
        `    rm -rf /var/lib/apt/lists/*`,
      ];

    case 'nodejs':
      if (isAlpine) {
        return [
          `RUN ${updateCmd} && \\`,
          `    ${packageManager} ${installFlag} nodejs npm && \\`,
          `    rm -rf /var/cache/apk/*`,
        ];
      }
      return [
        `RUN ${updateCmd} && \\`,
        `    ${packageManager} ${installFlag} curl && \\`,
        `    curl -fsSL https://deb.nodesource.com/setup_${version}.x | bash - && \\`,
        `    ${packageManager} ${installFlag} nodejs && \\`,
        `    rm -rf /var/lib/apt/lists/*`,
      ];

    case 'rust':
      return [
        `RUN ${updateCmd} && \\`,
        `    ${packageManager} ${installFlag} curl build-essential && \\`,
        `    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y ${version === 'nightly' ? '--default-toolchain nightly' : ''} && \\`,
        `    rm -rf ${isAlpine ? '/var/cache/apk/*' : '/var/lib/apt/lists/*'}`,
        'ENV PATH="/root/.cargo/bin:${PATH}"',
      ];

    default:
      return [];
  }
};
