# GitHub Metrics CLI

## Overview

The GitHub Metrics CLI is a versatile command-line tool designed for assessing and analyzing software repositories hosted on GitHub. This CLI empowers users to effortlessly evaluate key aspects of GitHub projects, including code correctness, responsiveness of maintainers, licensing, bus factor, and more. It will install dependencies, calculate metrics for a list of repositories, and perform automated grading.

## How to Use

1. **Installation**: Start by installing the necessary dependencies with the `./run install` command.

2. **Metric Assessments**: Run individual metric assessments or analyze multiple repositories from a list using the `./run URL_file` command.

3. **Automated Grading**: Execute the `./run test` command to validate the correctness of your CLI commands.

## Getting Started

1. Clone this repository to your local machine.

2. Ensure you have Node.js and NPM installed on your system.

3. Install project dependencies with the `./run install` command.

4. Use the CLI to assess GitHub repositories and analyze their metrics.

## Example Usage

```bash
./run install             # Install project dependencies
./run URL_file            # Analyze a list of GitHub repositories from a file
./run test                # Autograde CLI commands
