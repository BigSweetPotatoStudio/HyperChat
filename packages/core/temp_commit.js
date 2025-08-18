import { execSync } from 'child_process';

const commitMessage = 'test message';
const workingDir = 'D:\\projects\\HyperChat\\packages\\core';

try {
  execSync(`git commit --amend -m "${commitMessage}"`, {
    cwd: workingDir,
    stdio: 'inherit'
  });
  console.log('Commit amended successfully with message:', commitMessage);
} catch (error) {
  console.error('Failed to amend commit:', error.message);
}