const path = require('path'),
fs = require('fs');

function fromDir(startPath: string, filter: RegExp, callback: (pathName: string) => void) {

    if (!fs.existsSync(startPath)) {
        return;
    }

    const files = fs.readdirSync(startPath);

    files.forEach((file: any) => {
        const filename = path.join(startPath, file);
        const stat = fs.lstatSync(filename);

        if (stat.isDirectory()) {
            fromDir(filename, filter, callback);
        }
        else if (filter.test(filename)) {
            callback(filename);
        }
    })
};

const packagesPath = path.resolve(__dirname, '../../../..');
const regex = /\.cetmpl$/;

fromDir(packagesPath, regex, (pathName) => {
    const newPathName = pathName.replace(regex, '');
    
    fs.copyFile(pathName, newPathName, (err: any) => {
        if (err) throw err;
    });

    console.log('Created: ', newPathName);
});