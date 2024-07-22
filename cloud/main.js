require('./features/schedule.js')

const Professional = Parse.Object.extend('Professional');
const Specialty = Parse.Object.extend('Specialty');

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
	return formatUser(req.user.toJSON())
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

  Parse.Cloud.define('v1-get-professionals', async (req) => {
	const query = new Parse.Query(Professional);
	query.include('specialties', 'insurances', 'services');

	if(req.params.specialtyId) {
		const specialty = new Specialty();
		specialty.id = req.params.specialtyId;
		query.equalTo('specialties', specialty);
	}

	if(req.params.lat && req.params.long) {
		const point = new Parse.GeoPoint({latitude: req.params.lat, longitude: req.params.long});
		query.withinKilometers('location', point, req.params.maxDistance || 50);
	}

	if(req.params.limit && req.params.skip) {
		query.limit(req.params.limit);
		query.skip(req.params.skip);
	}
	
	const results = await query.find({useMasterKey: true});
	return results.map((r) => formatProfessional(r.toJSON()));
}, {
	fields: {
		
	}
});

function formatSpecialty(s) {
	return {
		id: s.objectId,
		name: s.name
	}
}

function formatProfessional(p) {
	return {
		id: p.objectId,
		name: p.name,
		specialties: p.specialties.map((s) => formatSpecialty(s)),
		crm: p.crm,
	};
}

  function formatUser (u) {
	return {
	  id: u.objectId,
	  token: u.sessionToken,
	  fullname: u.fullname,
	  document: u.document,
	  phone: u.phone
	}
  }
