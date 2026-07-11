const isBase64 = (str) => {
    if (str === "" || str.trim() === "") return false;
    const regex = /^data:(.*);base64,(.*)$/;
    const match = str.match(regex);
    if (!match) return false;
    const [, mimeType, base64String] = match;
    if (!mimeType || !base64String) return false;
    try {
        const decodedString = atob(base64String);
        const binaryString = new Array(decodedString.length);
        for (let i = 0; i < decodedString.length; i++) {
            binaryString[i] = decodedString.charCodeAt(i);
        }
        const binaryData = new Uint8Array(binaryString);
        const blob = new Blob([binaryData], { type: mimeType });
        return blob.size === binaryData.length;
    } catch (err) {
        return false;
    }
};

module.exports = isBase64;