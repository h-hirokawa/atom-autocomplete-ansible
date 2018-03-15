'use babel';

import Provider from './provider';

export default {
  config: {
    pythonPaths: {
      type: 'string',
      default: '',
      order: 1,
      title: 'Python Executable Paths',
      description: `Optional semicolon separated list of paths to python\
        executables, where the first one will take\
        higher priority over the last one. By default autocomplete-ansible will\
        automatically look for virtual environments inside of your project and\
        try to use them as well as try to find global python executable. If you\
        use this config, automatic lookup will have lowest priority.
        Use \`$PROJECT\` or \`$PROJECT_NAME\` substitution for project-specific\
        paths to point on executables in virtual environments.
        For example:
        \`/Users/name/.virtualenvs/$PROJECT_NAME/bin/python;$PROJECT/venv/bin/python;/usr/bin/python\`.
        Such config will fall back on \`/usr/bin/python\` for projects not presented\
        with same name in \`.virtualenvs\` and without \`venv\` folder inside of one\
        of project folders.
        If you are using ansible installed via Homebrew, you should set:\
        \`/usr/local/Cellar/ansible/2.2.0.0_1/libexec/bin/python2.7\`.
        The path differs depending on installed ansible version. Therefore, you should check the actual path by running \`head -1 /usr/local/bin/ansible\`.`
    },
    outputDebug: {
      type: 'boolean',
      default: false,
      order: 2,
      title: 'Output Debug Logs',
      description: 'Select if you would like to see debug information in\
        developer tools logs. May slow down your editor.'
    }
  },

  getProvider() {
    return new Provider();
  }
};
