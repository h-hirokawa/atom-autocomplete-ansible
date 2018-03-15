import json

from libs import parse_ansible


def test_one_plus_one(capsys):
    parse_ansible.main()
    captured = capsys.readouterr()
    result = json.loads(captured.out)
    assert result.get('modules')
    assert result.get('directives')
    assert result.get('lookup_plugins')
