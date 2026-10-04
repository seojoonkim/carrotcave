"""Run a CarrotCave i18n script with the local Hermes Codex-LB credentials in env (never printed)."""
import os, subprocess, sys
import yaml
c = yaml.safe_load(open(os.path.expanduser('/Users/gimseojun/.hermes/config.yaml')))
p = c['providers']['codex-lb']
env = dict(os.environ, CC_LLM_BASE_URL=p['base_url'], CC_LLM_API_KEY=p['api_key'], CC_LLM_MODEL=os.environ.get('CC_LLM_MODEL', p.get('default_model', 'gpt-6-astra')))
sys.exit(subprocess.call(sys.argv[1:], env=env))
