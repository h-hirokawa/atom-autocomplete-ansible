#!/usr/bin/env python
# -*- coding: utf-8 -*-
from __future__ import print_function, unicode_literals

import __main__
import json
import os

from ansible.cli.doc import DocCLI
from ansible.playbook import Play
from ansible.playbook.block import Block
from ansible.playbook.role import Role
from ansible.playbook.task import Task
from ansible.utils.display import Display

try:
    from ansible.plugins.loader import lookup_loader, module_loader
    from ansible.utils import plugin_docs
    use_old_loader = False
    REJECTED_MODULES_LIST = plugin_docs.BLACKLIST['MODULE']
except AttributeError:  # Added to support 2.11 forward
    from ansible.plugins.loader import lookup_loader, module_loader
    from ansible.utils import plugin_docs
    use_old_loader = False
    REJECTED_MODULES_LIST = plugin_docs.REJECTLIST['MODULE']
except ImportError:
    from ansible.plugins import lookup_loader, module_loader
    from ansible.utils import module_docs as plugin_docs
    use_old_loader = True
    REJECTED_MODULES_LIST = plugin_docs.REJECTED_MODULES_LIST

try:
    from ansible.plugins.loader import fragment_loader
    USE_FRAGMENT_LOADER = True
except ImportError:
    fragment_loader = None
    USE_FRAGMENT_LOADER = False

__main__.display = Display()
doc_cli = DocCLI(['ansible atom'])


def get_module_list():
    module_paths = module_loader._get_paths()
    for path in module_paths:
        if use_old_loader:
            doc_cli.find_modules(path)
        else:
            try:
                founds = doc_cli.find_plugins(path, 'module')
            except TypeError:
                founds = doc_cli.find_plugins(path, 'plugins', 'module')
            if founds:
                doc_cli.plugin_list.update(founds)
    module_list = (
        doc_cli.module_list if use_old_loader else doc_cli.plugin_list)
    return sorted(set(module_list))


def main():
    module_keys = ('module', 'short_description', 'options', 'deprecated')
    result = {'modules': [], 'directives': {}, 'lookup_plugins': []}

    for module in get_module_list():
        if module in REJECTED_MODULES_LIST:
            continue
        filename = module_loader.find_plugin(module, mod_type='.py')
        if filename is None:
            continue
        if filename.endswith(".ps1"):
            continue
        if os.path.isdir(filename):
            continue
        get_docstring_args = ((filename, fragment_loader)
                              if USE_FRAGMENT_LOADER else (filename,))
        try:
            doc = plugin_docs.get_docstring(*get_docstring_args)[0]
            filtered_doc = {key: doc.get(key, None) for key in module_keys}
            result['modules'].append(filtered_doc)
        except Exception as e:
            pass

    for aclass in (Play, Role, Block, Task):
        aobj = aclass()
        name = type(aobj).__name__

        for attr in aobj.__dict__['_attributes']:
            if 'private' in attr and attr.private:
                continue
            direct_target = result['directives'].setdefault(attr, [])
            direct_target.append(name)
            if attr == 'action':
                local_action = result['directives'].setdefault(
                    'local_action', [])
                local_action.append(name)
    result['directives']['with_'] = ['Task']

    for lookup in lookup_loader.all(path_only=True):
        name = os.path.splitext(os.path.basename(lookup))[0]
        result['lookup_plugins'].append(name)

    return json.dumps(result)


if __name__ == '__main__':
    print(main())
