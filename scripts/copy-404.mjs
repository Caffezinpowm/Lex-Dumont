import { copyFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';

const source = 'dist/index.html';
const target = 'dist/404.html';

try {
  await access(source, constants.F_OK);
  await copyFile(source, target);
  console.log('✓ dist/404.html criado para fallback de rotas no GitHub Pages.');
} catch {
  console.error('Não foi possível criar dist/404.html: execute o build primeiro.');
  process.exitCode = 1;
}
