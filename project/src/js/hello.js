import {wrap} from './sub/wrap';

export function hello(name) {
  return wrap('Hello, ' + name + '!', '"');
}
