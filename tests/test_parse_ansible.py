import json

from libs import parse_ansible


def test_parse_ansible():
    resjson = parse_ansible.main()
    result = json.loads(resjson)
    assert result.get('modules')
    assert result.get('directives')
    assert result.get('lookup_plugins')
