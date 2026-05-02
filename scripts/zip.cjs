const fs = require('fs');
const archiver = require('archiver');

if (!fs.existsSync('public')) {
  fs.mkdirSync('public', { recursive: true });
}

const output = fs.createWriteStream('public/codigo-intellixy.zip');
const archive = archiver('zip', {
  zlib: { level: 9 }
});

output.on('close', function() {
  console.log(archive.pointer() + ' total bytes');
  console.log('Zip created successfully');
});

archive.on('error', function(err) {
  throw err;
});

archive.pipe(output);

archive.glob('**/*', {
  ignore: ['node_modules/**', 'dist/**', '.git/**', '.next/**', 'public/codigo-intellixy.zip', '.env']
});

archive.finalize();
