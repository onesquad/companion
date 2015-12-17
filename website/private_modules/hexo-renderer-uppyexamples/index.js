// We listen for hexo changes on *.es6 extensions.
// We fire our own build-examples.js and tell it which example to build -
// that script then writes temporary js files
// which we return via the callback.
var exec             = require('child_process').exec;
var path             = require('path');
var fs               = require('fs');
var uuid             = require('uuid');
var webRoot          = path.dirname(path.dirname(__dirname));
var uppyRoot         = path.dirname(webRoot);
var browserifyScript = webRoot + '/build-examples.js'


hexo.extend.renderer.register('es6', 'js', function(data, options, callback) {
  if (!data || !data.path) {
    return callback(null);
  }

  if (!data.path.match(/\/examples\//)) {
    callback(null, data.text);
  }

  var slug    = data.path.replace(/[^a-zA-Z0-9\_\.]/g, '-');
  var slug    = uuid.v4();
  var dstPath = '/tmp/' + slug + '.js';
  var cmd     = 'node ' + browserifyScript + ' ' + data.path + ' ' + dstPath + ' --colors';
  // hexo.log.i('hexo-renderer-uppyexamples: change detected in examples. running: ' + cmd);
  exec(cmd, function(err, stdout, stderr) {
    if (err) {
      return callback(err);
    }

    hexo.log.i('hexo-renderer-uppyexamples: ' + stdout.trim());

    fs.readFile(dstPath, 'utf-8', function(err, bundledJS) {
      if (err) {
        return callback(err);
      }
      hexo.log.i('hexo-renderer-uppyexamples: read: ' + dstPath);

      callback(null, bundledJS);

      // @TODO REMOVE THIS MASSIVE HACK!
      // Once this is resolved: https://github.com/hexojs/hexo/issues/1663
      var finalDest = data.path.replace('/src/', '/public/')
      finalDest = finalDest.replace('.es6', '.js');

      setTimeout(function(){
        hexo.log.i('hexo-renderer-uppyexamples: applying hack for: ' + finalDest);
        fs.writeFileSync(finalDest, bundledJS);
      }, 1000)

    });
  });
});
