const { formatUser } = require( "./helpers/formart");

Parse.Cloud.define('v1-sign-in', async (req) => {
	const user = await Parse.User.logIn(req.params.email.toLowerCase(), req.params.password);
	return formatUser(user.toJSON());
}, {
	fields: {
		email: {
			required: true
		},
		password: {
			required: true
		}
	}
});

Parse.Cloud.define('v1-get-user', async (req) => {
	return formatUser(req.user.toJSON());
});

Parse.Cloud.define('v1-sign-up', async (req) => {
	const user = new Parse.User();
	user.set('email', req.params.email.toLowerCase());
	user.set('username', req.params.email.toLowerCase());
	user.set('fullname', req.params.fullname);
	user.set('phone', req.params.phone);
	user.set('document', req.params.document);
	user.set('password', req.params.password);
	await user.signUp(null, {useMasterKey: true});
	return formatUser(user.toJSON());
}, {
	fields: {
		email: {
			required: true
		},
		password: {
			required: true
		},
		fullname: {
			required: true
		},
		document: {
			required: true
		},
		phone: {
			required: true
		},
	}
});
