const path = require('path');
var base64ToImage = require('base64-to-image');
const fs = require('fs');


const uploadFile = (string , directory) => {
    var base64Str = string ;
    var uploadPath = path.join(__dirname , `../uploads/${directory}/`)
    const imageName = Date.now() + '-' + Math.round(Math.random() * 1E9);
    var optionalObj = {'fileName': imageName , 'type':'jpg'};
    return base64ToImage(base64Str , uploadPath , optionalObj); 
}

const uploadImage = ( string , directory ) => {
    if(!fs.existsSync(path.join(__dirname , `../uploads/${directory}`))){
        fs.mkdirSync(path.join(__dirname , `../uploads/${directory}`) , (err) => {
            if(err) return console.log('Create image directory error' , err);
            return uploadFile(string , directory );
        });
    }
    return uploadFile(string , directory ); 
}

module.exports = uploadImage;