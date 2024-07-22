function formatSchedule(s) {
    return {
        id: s.objectId,
        startDate: s.startDate.iso,
        endDate: s.endDate.iso,
        status: s.status,
        professional: formatProfessional(s.professional),
        services: s.services.map(formatService)
    }
}

function formatService(s) {
    return {
        id: s.objectId,
        name: s.name,
        price: s.price,
		duration: s.duration,
		available: s.available,
    }
}

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

function formatUser(u) {
	return {
		id: u.objectId,
		token: u.sessionToken,
		fullname: u.fullname,
		document: u.document,
		phone: u.phone,
	}
}

module.exports = { formatUser, formatProfessional, formatSpecialty, formatService, formatSchedule };