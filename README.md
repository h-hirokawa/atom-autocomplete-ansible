# autocomplete-ansible package [![Build Status](https://travis-ci.org/h-hirokawa/atom-autocomplete-ansible.svg?branch=master)](https://travis-ci.org/h-hirokawa/atom-autocomplete-ansible)

An [autocomplete+](https://github.com/atom/autocomplete-plus) provider for Ansible Playbook.

## Features
* Autocompletion of Playbook directives & module names.
* Snippets for module arguments.
  * **module_name + `r`**: Complete **required** arguments.
  * **module_name + `a`**: Complete **all** arguments include optional.

![demo](https://cloud.githubusercontent.com/assets/1086022/16838450/1c3d368a-4a04-11e6-9775-64de7bf19dc2.gif)

## Requirements
* Ansible >= 2.2 and Python 2.7
or
* Ansible >= 2.4 and Python >= 3.5

## ToDo
* Autocompletion of module arguments when the cursor is in module block.
* Autocompletion of variables/factors.
