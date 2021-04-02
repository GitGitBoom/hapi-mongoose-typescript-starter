const tsConfig = require('./tsconfig.json');

/**
 * Reformat tsconfig.json 'paths' object as 'module-resolve' aliases
 * Alternatively: manually maintain and match 'paths' and 'alias' maps in 
 * both files
 */
const fixAlias = str => str.replace(/\/\*$/, '');
const alias = Object.entries(tsConfig.compilerOptions.paths).reduce(
  (acc, [alias, paths]) => Object.assign(acc, {
    [fixAlias(alias)]: fixAlias(paths[0])
  }),
  {},
);

module.exports = {
  presets: [
    '@babel/preset-env',
    '@babel/preset-typescript'
  ],
  plugins: [
    '@babel/plugin-transform-runtime',
    ['module-resolver', {
      root: ["."],
      alias,
    }]
  ]
};