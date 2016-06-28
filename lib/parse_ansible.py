#!/usr/bin/env python
# -*- coding: utf-8 -*-
import json
import os

from ansible.cli.doc import DocCLI
from ansible.playbook import  Play
from ansible.playbook.block import  Block
from ansible.playbook.role import  Role
from ansible.playbook.task import  Task
from ansible.plugins import lookup_loader, module_loader
from ansible.utils import module_docs

doc_cli = DocCLI([])
module_paths = module_loader._get_paths()

module_keys = ('module', 'short_description', 'options', 'deprecated')

for path in module_paths:
    doc_cli.find_modules(path)

result = {'modules': [], 'directives': {}}

# モジュール情報の収集
for module in sorted(set(doc_cli.module_list)):
    if module in module_docs.BLACKLIST_MODULES:
        continue
    filename = module_loader.find_plugin(module, mod_type='.py')
    if filename is None:
        continue
    if filename.endswith(".ps1"):
        continue
    if os.path.isdir(filename):
        continue
    try:
        doc, plainexamples, returndocs = module_docs.get_docstring(filename)
        filtered_doc = {key: doc.get(key, None) for key in module_keys}
        result['modules'].append(filtered_doc)
    except:
        pass

# ディレクティブを収集するクラス一覧
class_list = [ Play, Role, Block, Task ]

# ディレクティブ情報の収集
for aclass in class_list:
    aobj = aclass()
    name = type(aobj).__name__

    for attr in aobj.__dict__['_attributes']:
        if 'private' in attr and attr.private:
            continue
        direct_target = result['directives'].setdefault(attr, [])
        direct_target.append(name)
        if attr == 'action':
            local_action = result['directives'].setdefault('local_action', [])
            local_action.append(name)

# ループ用lookupプラグインの収集
for lookup in lookup_loader.all():
    name = os.path.splitext(os.path.basename(lookup._original_path))[0]
    result['directives']['with_' + name] = ['Task']

print(json.dumps(result))
