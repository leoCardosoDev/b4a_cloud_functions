Parse.Cloud.define('v1-sign-in', async (req) => {
	const user = await Parse.User.logIn(req.params.email.toLowerCase(), req.params.password)
	return formatUser(user.toJSON())
  }, {
	fields: {
	  email: { required: true },
	  password: { required: true },
	}
  })
