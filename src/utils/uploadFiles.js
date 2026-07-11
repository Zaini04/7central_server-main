const path = require("path");
const fsPromises = require("node:fs/promises");
const fs = require("fs");
// const { fileTypeFromBuffer } = require( "file-type");

async function getFileExtension(base64String) {
  const buffer = Buffer.from(base64String, "base64");
  // Dynamically import file-type (ESM-only module)
  const { fileTypeFromBuffer } = await import("file-type");
  const fileInfo = await fileTypeFromBuffer(buffer);

  if (!fileInfo) {
    throw new Error("Unable to determine file type");
  }

  return fileInfo.ext; //doesn't includes a leading dot i.e., jpg and not .jpg
}

const uploadDataFile = async (
  base64String,
  directoryName,
  clientFileNameIncludingExtension,
) => {
  try {
    let shouldCreateDirectory = false;
    if (!fs.existsSync(path.join(__dirname, `../uploads/${directoryName}`))) {
      shouldCreateDirectory = true;
    }
    if (shouldCreateDirectory) {
      //fsPromises.mkdir: Upon success, fulfills with undefined
      const dirCreationResult = await fsPromises.mkdir(
        path.join(__dirname, `../uploads/${directoryName}`),
      );
    }
    const randomPrefix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    let fileNameOnServerDisk;
    if (clientFileNameIncludingExtension) {
      fileNameOnServerDisk =
        randomPrefix + clientFileNameIncludingExtension;
    } else {
      fileNameOnServerDisk = randomPrefix;
    }
    let file = path.join(
      __dirname,
      "../uploads",
      directoryName,
      fileNameOnServerDisk,
    );
    const fileCreationResult = await fsPromises.writeFile(
      file,
      base64String,
      "base64",
    );
    return Promise.resolve(fileNameOnServerDisk);
  } catch (error) {
    return Promise.reject(error);
  }
};

const deleteDataFile = async (directoryName, fileNameOnServerDisk) => {
  let filePath = path.join(
    __dirname,
    "../uploads",
    directoryName,
    fileNameOnServerDisk,
  );
  try {
    await fsPromises.unlink(filePath);
    return Promise.resolve(true);
  } catch (error) {
    return Promise.reject(error);
  }
};


const uploadBase64Image = async(base64String, uploadDirPath)  =>{
  try {
    // Convert Base64 → Buffer
    const buffer = Buffer.from(base64String, "base64");

    // Detect file type (png, jpg, webp, etc)
      const { fileTypeFromBuffer } = await import("file-type");

    const fileInfo = await fileTypeFromBuffer(buffer);

    if (!fileInfo) {
      throw new Error("Invalid or unsupported file type");
    }
    
    // Create directory if not exists
    if (!fs.existsSync(path.join(__dirname , `../${uploadDirPath}`))) {
      fs.mkdirSync(path.join(__dirname , `../${uploadDirPath}`), { recursive: true });
    }

    // Generate unique file name
    const fileName = `${Date.now()}-${Math.round(
      Math.random() * 1e12
    )}.${fileInfo.ext}`;

    // Save file
        var uploadPath = path.join(__dirname , `../${uploadDirPath}`)
    const filePath = path.join(uploadPath, fileName);
    fs.writeFileSync(filePath, buffer);

    return {
      fileName,
      filePath,
      ext: fileInfo.ext,
      mime: fileInfo.mime,
    };
  } catch (error) {
    console.error("Upload Error:", error);
    throw error;
  }
}
module.exports = { uploadDataFile, deleteDataFile, getFileExtension,uploadBase64Image };
