function formatSchedule(s) {
    return {
        id: s.objectId,
        startDate: s.startDate.iso,
        endDate: s.endDate.iso,
        status: s.status,
        professional: s.professional != null ? _formatProfessional(s.professional) : undefined,
        services: s.services.map(formatService),
		user: s.user != null ? {
			id: s.user.objectId,
			fullname: s.user.fullname,
			phone: s.user.phone
		} : null,
    }
}

function _formatProfessional(p) {
	return {
		id: p.objectId,
		name: p.name,
		specialties: p.specialties != null ? p.specialties.map((s) => formatSpecialty(s)) : undefined,
		crm: p.crm,
	};
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
		services: p.services.filter((s) => s.available).map((s) => formatService(s)),
		rating: p.rating,
		ratingCount: p.ratingCount,
		address: p.address,
		phone: p.phone,
		insurances: p.insurances.map((i) => formatInsurance(i)),
		picture: p.profilePicture != null ? p.profilePicture?.url : null
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

function formatRating(r) {
    return {
        id: r.objectId,
        comments: r.comments,
        stars: r.stars,
        userName: r.user.fullname,
        createdAt: r.createdAt,
    }
}

function formatInsurance(i) {
    return {
        id: i.objectId,
        name: i.name
    }
}

module.exports = { 
	formatUser, 
	formatProfessional, 
	formatSpecialty, 
	formatService, 
	formatSchedule,
	formatRating,
	formatInsurance
};