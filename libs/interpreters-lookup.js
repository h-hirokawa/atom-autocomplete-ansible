const fs = require('fs'),
  os = require('os'),
  path = require('path'),
  log = require('./log');

let self = module.exports = {
  pythonExecutableRe: () => {
    if (/^win/.test(process.platform)) {
      return /^python(\d+(.\d+)?)?\.exe$/;
    } else {
      return /^python(\d+(.\d+)?)?$/;
    }
  },
  possibleGlobalPythonPaths: () => {
    if (/^win/.test(process.platform)) {
      return [
        'C:\\Python2.7',
        'C:\\Python3.4',
        'C:\\Python3.5',
        'C:\\Program Files (x86)\\Python 2.7',
        'C:\\Program Files (x86)\\Python 3.4',
        'C:\\Program Files (x86)\\Python 3.5',
        'C:\\Program Files (x64)\\Python 2.7',
        'C:\\Program Files (x64)\\Python 3.4',
        'C:\\Program Files (x64)\\Python 3.5',
        'C:\\Program Files\\Python 2.7',
        'C:\\Program Files\\Python 3.4',
        'C:\\Program Files\\Python 3.5',
        `${os.homedir()}\\AppData\\Local\\Programs\\Python\\Python35-32`
      ];
    } else {
      return ['/usr/local/bin', '/usr/bin', '/bin', '/usr/sbin', '/sbin'];
    }
  },
  readDir: dirPath => {
    try {
      return fs.readdirSync(dirPath);
    } catch (_error) {
      return [];
    }
  },
  isBinary: filePath => {
    try {
      fs.accessSync(filePath, fs.X_OK);
      return true;
    } catch (_error) {
      return false;
    }
  },
  lookupInterpreters: dirPath => {
    let interpreters = new Set();
    const files = self.readDir(dirPath),
      matches = files.filter(f => self.pythonExecutableRe().test(f));
    for (const fileName of matches) {
      const potentialInterpreter = path.join(dirPath, fileName);
      if (self.isBinary(potentialInterpreter)) {
        interpreters.add(potentialInterpreter);
      }
    }
    return interpreters;
  },
  applySubstitutions: paths => {
    let modPaths = [];
    for (let p of paths) {
      const projectPaths = window.atom.project.getPaths();
      for (const project of projectPaths) {
        const projectName = project.split(path.sep).pop();
        p = p.replace(/\$PROJECT_NAME/i, projectName);
        p = p.replace(/\$PROJECT/i, project);
        if (!(p in modPaths)) {
          modPaths.push(p);
        }
      }
      if (!projectPaths.length && p.indexOf('$PROJECT') === -1) {
        modPaths.push(p);
      }
    }
    return modPaths;
  },
  getInterpreter: () => {
    const userDefinedPythonPaths = self.applySubstitutions(
        window.atom.config.get('autocomplete-ansible.pythonPaths').split(';'));
    let interpreters = new Set(userDefinedPythonPaths.filter(
        p => self.isBinary(p)));
    if (interpreters.size > 0) {
      log.debug('User defined interpreters found', interpreters);
      return interpreters.keys().next().value;
    }
    log.debug('No user defined interpreter found, trying automatic lookup');
    interpreters = new Set();
    for (const project of window.atom.project.getPaths()) {
      for (const f of self.readDir(project)) {
        self.lookupInterpreters(path.join(project, f, 'bin')).forEach(
          i => interpreters.add(i)
        );
      }
    }
    log.debug('Project level interpreters found', interpreters);
    let envPath = (process.env.PATH || '').split(path.delimiter);
    envPath = new Set(envPath.concat(self.possibleGlobalPythonPaths()));
    envPath.forEach(potentialPath => {
      self.lookupInterpreters(potentialPath).forEach(i => {
        interpreters.add(i);
      });
    });
    log.debug('Total automatically found interpreters', interpreters);

    if (interpreters.size) {
      return interpreters.keys().next().value;
    }
  }
};
