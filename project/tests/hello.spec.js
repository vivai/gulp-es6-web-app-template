import {test} from 'tape';
import {hello} from '../src/js/hello';

test ('Is hello imported', function(t) {
  t.ok(typeof hello === 'function');
  t.end();
});

