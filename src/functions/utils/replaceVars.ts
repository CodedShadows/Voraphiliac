import { CustomClient } from '../../typings/Extensions.js';

export const name = 'replaceVars';
// Rare case this isn't a Promise
export function execute(
  _client: CustomClient,
  string: string,
  args: Array<string>,
  values: Array<string>
): string {
  if (!string || !args || !values)
    throw new SyntaxError(
      `One or more of the required parameters are missing in [replaceVars]\n\n> ${string}\n> ${args}\n> ${values}`
    );
  if (args.length !== values.length)
    throw new SyntaxError(`The number of arguments and values do not match in [replaceVars]\n\n> ${args}\n> ${values}`);
  let newString = string;
  for (let i = 0; i < args.length; i++) {
    newString = newString.replace(new RegExp(`{{${args[i]}}}`, 'g'), values[i]);
  }
  return newString;
}
