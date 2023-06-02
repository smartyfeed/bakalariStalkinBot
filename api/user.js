module.exports = async function(req, res) {
  const { user, isAdmin } = req.session;
  res.json({...user, isAdmin: isAdmin});
};
