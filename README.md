# autocomplete-ansible package

An [autocomplete+](https://github.com/atom/autocomplete-plus) provider for Ansible Playbook.

## Features
* Autocompletion of Playbook directives & module names.
* Snippets for module arguments.
  * **module_name + `r`**: Complete **required** arguments.
  * **module_name + `a`**: Complete **all** arguments include optional.

![demo](https://cloud.githubusercontent.com/assets/1086022/16838450/1c3d368a-4a04-11e6-9775-64de7bf19dc2.gif)

## Requirements
* ansible >= 2.2

## ToDo
* Autocompletion of module arguments when the cursor is in module block.
* Autocompletion of variables/factors.
