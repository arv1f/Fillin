/**
 * TS 5+ убрал suppressImplicitAnyIndexErrors; в @egjs/react-view360 старый tsconfig
 * в node_modules даёт ошибку в IDE. Удаляем опцию после установки зависимостей.
 */
import fs from 'node:fs'
import path from 'node:path'

const file = path.join(
  process.cwd(),
  'node_modules',
  '@egjs',
  'react-view360',
  'tsconfig.json',
)
if (!fs.existsSync(file)) process.exit(0)
const raw = fs.readFileSync(file, 'utf8')
const data = JSON.parse(raw)
if (data.compilerOptions?.suppressImplicitAnyIndexErrors !== undefined) {
  delete data.compilerOptions.suppressImplicitAnyIndexErrors
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n')
}
