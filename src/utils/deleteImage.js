const fs = require('fs');
const path = require('path');

const deleteImage = (dir , fileName) => {
    let targetName = fileName.split(`/${dir}/`)[1];
    const targetPath = path.join(__dirname , `../uploads/${dir}/${targetName}`)
    if(fs.existsSync(targetPath)){
        fs.unlink(targetPath , (err) => {
            if(err) return console.log('Delete Image error' , err);
            return ;
        })
    }
    return;
};

module.exports = deleteImage;