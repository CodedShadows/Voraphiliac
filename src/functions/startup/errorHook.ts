import { CustomClient } from '../../typings/Extensions.js';
import { toConsole } from '../../functions.js';
import { default as fs } from 'node:fs';

export const name = 'errorHook';
export async function execute(client: CustomClient, ready: boolean): Promise<void> {
  const recentErrors: { promise: Promise<unknown>; reason: string; time: Date }[] = [];
  process.on('uncaughtExceptionMonitor', (err, origin) => {
    console.error('Process exiting shortly due to uncaughtException. go fix it.', err);
    toConsole(`Monitor caught an exception!\n>>> ${err}\n: ${origin}`, err.stack || new Error().stack, client);
    return;
  });
  process.on('unhandledRejection', async (reason, promise) => {
    // Anti-spam System
    if (recentErrors.length > 2) {
      recentErrors.push({ promise, reason: String(reason), time: new Date() });
      recentErrors.shift();
    } else {
      recentErrors.push({ promise, reason: String(reason), time: new Date() });
    }
    // If all three errors are the same, exit
    if (
      recentErrors.length === 3 &&
      recentErrors[0].reason === recentErrors[1].reason &&
      recentErrors[1].reason === recentErrors[2].reason
    ) {
      // Write the error to a file
      fs.writeFileSync(
        './latest-error.log',
        JSON.stringify(
          {
            code: 15,
            info: {
              source: 'Anti spam triggered! Three errors with the same content have occurred recently',
              r: String(promise) + ' <------------> ' + reason
            },
            time: new Date().toString()
          },
          null,
          2
        )
      );
      return process.exit(17);
    }

    toConsole('An [unhandledRejection] has occurred.\n\n> ' + reason, new Error().stack!, client);
  });
  process.on('warning', async (warning) => {
    toConsole(`A [warning] has occurred.\n\n> ${warning}`, warning.stack || new Error().stack!, client);
  });
  process.on('exit', (code) => {
    console.error('[EXIT] The process is exiting!');
    console.error(`[EXIT] Code: ${code}`);
  });
  return;
}
