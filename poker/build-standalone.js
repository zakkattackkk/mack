// Assembles a single self-contained HTML file (engine + app inlined) for
// hosting as an Artifact or opening directly. Run: node build-standalone.js
var fs = require('fs');
var engine = fs.readFileSync(__dirname + '/engine.js', 'utf8');
var html = fs.readFileSync(__dirname + '/index.html', 'utf8');

var title = (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || "Hold'em Odds Advisor";
var style = (html.match(/<style>[\s\S]*?<\/style>/) || [])[0];
var bodyInner = (html.match(/<body>([\s\S]*?)<\/body>/) || [])[1];

// drop the external engine script reference; we inline it instead
var body = bodyInner.replace(/<script src="engine\.js"><\/script>/, '');

// separate the trailing app <script> from the markup
var appScript = (body.match(/<script>[\s\S]*<\/script>\s*$/) || [''])[0];
var markup = body.replace(appScript, '');

var engineScript = '<script>\n' + engine + '\n</script>\n';
var out = '<title>' + title + '</title>\n' + style + '\n' +
  markup.trim() + '\n' + engineScript + appScript + '\n';

fs.writeFileSync(__dirname + '/standalone.html', out);
console.log('wrote standalone.html, bytes:', out.length);
console.log('doctype?', /<!DOCTYPE/i.test(out), '| <html>?', /<html/i.test(out),
  '| <body>?', /<body/i.test(out));
