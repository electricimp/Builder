const stringFunctions = {};
const stringMethodNames = [
  'concat',
  'endsWith',
  'includes',
  'padEnd',
  'padStart',
  'repeat',
  'split',
  'startsWith',
  'substr',
  'substring',
  'toLowerCase',
  'toUpperCase',
  'trim',
  'trimLeft',
  'trimRight',
];

// Generate functions from method names
for (const name of stringMethodNames) {
  stringFunctions[name] = (...args) => {
    if (args.length < 1) {
      throw new Error('Missing string as required first argument in ' + name + '()');
    }
    const str = args[0].toString();
    return str[name].apply(str, args.slice(1));
  }
}

module.exports = {
  S: stringFunctions
};
