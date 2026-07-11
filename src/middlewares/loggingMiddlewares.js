exports.respondNoResourceFound = (req, res) => {
  res.status(404).end();
  //next(); // don't do next().
};
