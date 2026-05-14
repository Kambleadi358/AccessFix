import { spawnSync } from 'child_process';
import path from 'path';

function runTsc(packagePath: string) {
  console.log(`\n--- Compiling ${path.basename(packagePath)} ---`);
  const result = spawnSync('npx', ['tsc'], {
    cwd: packagePath,
    shell: true,
    encoding: 'utf-8'
  });

  if (result.status === 0) {
    console.log('✅ Compilation successful');
  } else {
    console.error('❌ Compilation failed');
    console.error(result.stdout);
    console.error(result.stderr);
  }
}

const root = path.resolve(__dirname, '../../..');
runTsc(path.join(root, 'packages/shared'));
runTsc(path.join(root, 'packages/backend'));
runTsc(path.join(root, 'packages/frontend'));
