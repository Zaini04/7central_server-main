exports.sendSuccessResponse = ( res , statusCode = 200 , logger = null , data ) => {
    const response = {
        status : 'success' ,
        success : true ,
        data 
    }
    if (logger) logger.info(JSON.stringify({
        statusCode ,
        success : true
    }))
    res.status(statusCode).json(response)
}

exports.sendErrorResponse = ( res , statusCode = 400 , logger = null , data ) => {
    const response = {
        status : 'error' ,
        success : false ,
        data 
    }
    if (logger) logger.info(JSON.stringify(response))
    res.status(statusCode).json(response)
}
exports.getLongAutoIncrementId = (prefix, newIDNumber) => {
  if (typeof prefix !== 'string')
    throw new Error('prefix should be a string');
  if (typeof newIDNumber !== 'number')
    throw new Error('newIDNumber should be a number');

  const paddedString = newIDNumber.toString().padStart(3, "0");
  const longAutoIncrementId = `${prefix}${paddedString}`;
  return longAutoIncrementId;
}

exports.displayNameFromBuyers=(buyers = []) =>{
  return buyers.map(b => `${b.name}`.trim())
               .filter(Boolean)
               .join(' + ');
}