module.exports = {
  prefix: 'autocomplete-ansible:',
  debug: (...msg) => {
    if (window.atom.config.get('autocomplete-ansible.outputDebug')) {
      return window.console.debug(this.prefix, ...msg);
    }
  },
  warning: (...msg) => window.console.warn(this.prefix, ...msg)
};
