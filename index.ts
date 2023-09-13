import { Command } from './commander';

import * as install from './install';
import * as test from './test';
import * as analyze from "./analyze"

const program = new Command();

program
  .command('install')
  .description('Installs dependencies in userland')
  .action(() => {
    // Here you can do function call
    install.installDependencies();
    process.exit(0);
  });

program
  .command('test')
  .description('Run tests')
  .action(() => {
    // Here you can do function call
    test.testDependencies();
    // process.exit(0);
  });

program
  .arguments('<URL_FILE>')
  .action(async (URL_FILE) => {
    if (!URL_FILE) {
      console.error("Error: URL_FILE argument is required.");
      // process.exit(1);
    }
    await analyze.testDependencies(URL_FILE);
    // process.exit(0);
  });


// program.parse(process.argv);
