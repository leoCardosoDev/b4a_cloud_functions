Parse.Cloud.define('v1-sign-in', async (req) => {
	const user = await Parse.User.logIn(req.params.email.toLowerCase(), req.params.password)
	return formatUser(user.toJSON())
  }, {
	fields: {
	  email: { required: true },
	  password: { required: true },
	}
  })

  Parse.Cloud.define('v1-get-user', async (req) => {
	return req.user
  })

  Parse.Cloud.define('v1-sign-up', async (req) => {
	const user = new Parse.User()
	user.set('email', req.params.email.toLowerCase())
	user.set('username', req.params.email.toLowerCase())
	user.set('password', req.params.password)
	user.set('fullname', req.params.fullname)
	user.set('document', req.params.document)
	user.set('phone', req.params.phone)
	await user.signUp(null, { useMasterKey: true })
	return formatUser(user.toJSON())
  }, {
	fields: {
	  email: { required: true },
	  password: { required: true },
	  fullname: { required: true },
	  document: { required: true },
	  phone: { required: true },
	}
  })

  function formatUser (u) {
	return {
	  id: u.objectId,
	  token: u.sessionToken,
	  fullname: u.fullname,
	  document: u.document,
	  phone: u.phone
	}
  }
