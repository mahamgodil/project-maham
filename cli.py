# FILEPATH: /Users/mateusz/Desktop/ECE_461/project-mateusz/index.py
import argparse
import subprocess
import os

def is_tool(name):
    from shutil import which
    return which(name) is not None
    
    # Check if the tool is available globally
    try:
        result = subprocess.run([name, '--version'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return result.returncode == 0
    except FileNotFoundError:
        return False

parser = argparse.ArgumentParser(description='CLI tool for installing, testing and analyzing dependencies.')
subparsers = parser.add_subparsers(dest='command')

install_parser = subparsers.add_parser('install', help='Installs dependencies in userland')
test_parser = subparsers.add_parser('test', help='Run tests')
analyze_parser = subparsers.add_parser('analyze', help='Analyze dependencies from a URL file')

analyze_parser.add_argument('url_file', help='Path to the URL file')

args = parser.parse_args()

if not is_tool('ts-node'):
    print("ts-node is not installed. Installing...")
    subprocess.run(['npm', 'install', 'ts-node'])
    if not is_tool('ts-node'):
        print("Failed to install ts-node. Exiting.")
        exit(1)

if args.command == 'install':
  subprocess.run(['ts-node', './install.ts', 'installDependencies'])
elif args.command == 'test':
  subprocess.run(['ts-node', './test.ts', 'testDependencies'])
elif args.command == 'analyze':
  subprocess.run(['ts-node', './analyze.ts', 'testDependencies', args.url_file])
else:
  parser.print_help()