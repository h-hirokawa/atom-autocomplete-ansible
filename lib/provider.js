'use babel';

import { execFile } from 'child_process';
import { format } from 'util';
import { filter } from 'fuzzaldrin';

export default class Provider {
  constructor() {
    let self = this;
    self.selector = '.source.yaml';
    self.disableForSelector = '.source.yaml .comment';
    self.modules = [];
    self.directives = [];
    execFile(__dirname + '/parse_ansible.py', {maxBuffer: 5*1024*1024}, function (err, stdout) {
      if (err) {
        if (err.message.match(/No module named ['"]?ansible/)) {
          atom.notifications.addWarning(
            'autocomplete-ansible unable to import ansible.', {
              detail: 'Install ansible using pip.',
              dismissable: true
            }
          );
        } else {
          atom.notifications.addError(
            'autocomplete-python traceback output:', {
              detail: err.message,
              dismissable: true
            }
          );
        }
        throw err;
      }
      let ansibleData = JSON.parse(stdout);
      self.modules = ansibleData.modules.map(function (element) {
        return {
          text: element.module,
          type: 'property',
          leftLabel: 'module',
          rightLabel: element.deprecated ? 'Deprecated' : null,
          description: element.short_description || '',
          descriptionMoreURL: format('http://docs.ansible.com/ansible/%s_module.html', element.module),
          _options: element.options
        };
      });
      Object.keys(ansibleData.directives).forEach(function (key) {
        self.directives.push({
          text: key,
          type: 'keyword',
          leftLabel: 'directive',
          description: 'directive for ' + ansibleData.directives[key].join(', ') + '.'
        });
      });
    });
  }

  getSuggestions(request) {
    let self = this;

    if (request.prefix.length < 2) {
      return [];
    }

    let bufferPosition = request.bufferPosition,
      nextChar = request.editor.getTextInRange([bufferPosition, [bufferPosition.row, bufferPosition.column + 1]]),
      line = request.editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);

    let snippetRegexp = /^\s*(-?)[^:]*(:?)\s+(([0-9a-zA-Z_]+)([ao]))$/,
      moduleRegexp = new RegExp('^\\s*-?\\s+(action\\s*:\\s+|local_action\\s*:\\s+|)' + request.prefix + '$');

    return new Promise(function(resolve) {
      let result = self.getSnippets(line.match(snippetRegexp));
      let moduleMatch = line.match(moduleRegexp);
      if (moduleMatch) {
        if (!moduleMatch[1]) {
          Array.prototype.push.apply(result, getFuzzySuggestions(self.directives, request.prefix, 'text', (nextChar === ':') ? '' : ': '));
        }
        Array.prototype.push.apply(result, getFuzzySuggestions(self.modules, request.prefix, 'text'));
      }
      return resolve(result);
    });
  }

  getSnippets(match) {
    if (!match) { return []; }
    let self = this,
      indent = match[1] ? '\t' : '',
      hasColon = match[2],
      replacementPrefix = match[3],
      moduleName = match[4],
      addOptions = match[5] === 'o',
      moduleIndex = self.modules.map(function(elm) {return elm.text;}).indexOf(moduleName),
      moduleObj = null,
      lines = [moduleName + (hasColon ? '' : ':')];

    if (moduleIndex === -1) {
      return [];
    }
    moduleObj = self.modules[moduleIndex];

    if (hasColon) { lines.push('args:'); }

    let args = Object.keys(moduleObj._options).sort(function(a, b) {
      let aObj = moduleObj._options[a],
        bObj = moduleObj._options[b];
      if (aObj.required && !bObj.required) {return -1;}
      if (!aObj.required && bObj.required) {return 1;}
      return 0;
    });

    for (let i = 0; i < args.length; i++) {
      let argName = args[i],
        option = moduleObj._options[argName];
      if (!addOptions && !option.required) {continue;}
      let defaultValue = option.default === 'None' ? null : option.default;
      defaultValue = (defaultValue) ? (defaultValue + ' ') : '';
      let snip = format('${%d:%s# %s}', i + 1, defaultValue, option.description);
      if (['free_form', 'free-form'].indexOf(argName) >= 0) {
        if (hasColon) {
          lines.push('\t_low_params: ' + snip);
        } else {
          lines[0] += ' ' + snip;
        }
      } else {
        lines.push('\t' + argName + ': ' + snip);
      }
    }
    if (lines.length === 2 && lines[1] === 'args:') {lines.pop();}

    return [{
      snippet: lines.join('\n' + indent),
      displayText: moduleName,
      type: 'snippet',
      leftLabel: 'module snippet',
      rightLabel: moduleObj.deprecated ? 'Deprecated' : null,
      description: moduleObj.short_description || '',
      descriptionMoreURL: format('http://docs.ansible.com/ansible/%s_module.html', moduleName),
      replacementPrefix: replacementPrefix
    }];
  }
}

function getFuzzySuggestions(data, prefix, key, suffix) {
  return filter(data, prefix, {key: key}).map(function(elm) {
    let cloned = Object.assign({}, elm);
    if (suffix) {
      cloned.displayText = elm.text;
      cloned.text += suffix;
    }
    cloned.replacementPrefix = prefix;
    return cloned;
  });
}
