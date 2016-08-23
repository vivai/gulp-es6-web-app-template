// @flow

export function wrap(str:string, wrapStr:string):string {
  return wrapStr + str + wrapStr;
}

function unknownAndUntested(x:number) {
  // This funciton will break the eslint check.
  x += "flow";
  return x;
}
