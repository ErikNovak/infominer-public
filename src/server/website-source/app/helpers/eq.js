import { helper } from '@ember/component/helper';

export function eq([arg1, arg2, ...rest]) {
  return arg1 === arg2;
}

export default helper(eq);
