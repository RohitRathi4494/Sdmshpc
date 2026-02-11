
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const pdfPath = path.resolve(__dirname, '../../HPC III Onwards.pdf');
console.log('Reading PDF from:', pdfPath);

if (!fs.existsSync(pdfPath)) {
    console.error('PDF file not found!');
    process.exit(1);
}

const dataBuffer = fs.readFileSync(pdfPath);

pdf(dataBuffer).then(function (data) {
    console.log('--- Page Count: ---');
    console.log(data.numpages);
    console.log('\n--- Text Content: ---');
    console.log(data.text);
}).catch(err => {
    console.error('Error parsing PDF:', err);
});
