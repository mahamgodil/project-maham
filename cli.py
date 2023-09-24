import argparse
import subprocess
import os
import json

def is_ts_node_installed(base_dir="."):
    ts_node_path = os.path.join(base_dir, 'node_modules', 'ts-node')
    return os.path.isdir(ts_node_path)

parser = argparse.ArgumentParser(description='CLI tool for installing, testing, and analyzing dependencies.')

subparsers = parser.add_subparsers(dest='command')
install_parser = subparsers.add_parser('install', help='Installs dependencies in userland')
test_parser = subparsers.add_parser('test', help='Run tests')

parser.add_argument('file', nargs='?', help='Path to the URL file')

import sys
if len(sys.argv) == 2 and os.path.isfile(sys.argv[1]):
    args = argparse.Namespace(command=None, file=sys.argv[1])
else:
    args = parser.parse_args()

if not is_ts_node_installed():
    # print("ts-node is not installed. Installing...")
    subprocess.run(['npm', 'install', 'ts-node'])
    if not is_ts_node_installed():
        # print("Failed to install ts-node. Exiting.")
        exit(1)

ts_node_bin_path = os.path.join('.', 'node_modules', '.bin', 'ts-node')


if args.file and not args.command:
    if os.path.isfile(args.file):
        # print(f"Analyzing {args.file}...")
        # subprocess.run([ts_node_bin_path, './analyze.ts', 'analyzeDependencies', args.file])
        subprocess.run([ts_node_bin_path, './analyze.ts', args.file], env=os.environ)


    else:
        # print(f"Error: {args.file} does not exist.")
        exit(1)        
elif args.command == 'install':
    # print("Installing dependencies...")
    subprocess.run([ts_node_bin_path, './install.ts'])

elif args.command == 'test':
    subprocess.run(['npm', 'test', '--silent'], env=os.environ)
    with open('test_output.json', 'r') as f:
        test_results = json.load(f)

# Sample Output (to Stdout):

# Total: 10
# Passed: 9
# Coverage: 90%
# 9/10 test cases passed. 90% line coverage achieved.

    total_tests = test_results['numTotalTests']
    passed_tests = test_results['numPassedTests']
    coverage = (passed_tests / total_tests) * 100
    # print(f"\nTotal: {total_tests}")
    # print(f"Passed: {passed_tests}")
    # print(f"Coverage: {coverage:.2f}%")
    print(f"{passed_tests}/{total_tests} test cases passed. {int(coverage)}% line coverage achieved.", end='')


    exit(0)


else:
    parser.print_help()
    exit(1)
