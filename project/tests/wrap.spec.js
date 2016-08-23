import {test} from 'tape';
import {wrap} from '../src/js/sub/wrap';

test('wrap string', function(t) {
  t.equal( wrap('x', 'a'), 'axa');
  t.end();
});
