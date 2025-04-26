/** @type {import('typedoc').TypeDocOptions} */
module.exports = {
  $schema: 'https://typedoc.org/schema.json',
  name: 'node-app-passport',
  tsconfig: '../tsconfig.json',
  entryPoints: ['../src'],
  entryPointStrategy: 'expand',
  readme: '../README.md',
  includeVersion: true
}
