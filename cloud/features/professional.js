const Professional = Parse.Object.extend('Professional');
const Service = Parse.Object.extend('Service');
const Specialty = Parse.Object.extend('Specialty');

Parse.Cloud.define('v1-save-schedule-rule', async (req) => {
    const queryProfessional = new Parse.Query(Professional);
    queryProfessional.equalTo('owner', req.user);
    const professional = await queryProfessional.first({useMasterKey: true});

    if(!professional) throw 'INVALID_PROFESSIONAL';

    const slotInterval = professional.get('slotInterval');

    if(!slotInterval) throw 'INVALID_SLOT_INTERVAL';

    const slots = req.params.slots;

    if(slots.some((s) => s.weekday > 7 || s.weekday < 1)) throw 'INVALID_WEEKDAY';
    else if(slots.some((s) => new Date(new Date(s.startTime).getTime() + slotInterval * 60 * 1000) > new Date(s.endTime))) throw 'INVALID_SLOTS';

    for(let weekday = 1; weekday <= 7; weekday++) {
        const daySlots = slots.filter((s) => s.weekday == weekday);
        if(daySlots.length == 0 || daySlots.length == 1) continue;

        daySlots.sort(function (a, b) { return new Date(a.startTime) - new Date(b.startTime)});

        for(let slotIndex = 0; slotIndex < daySlots.length - 1; slotIndex++) {
            if(new Date(daySlots[slotIndex].endTime) > new Date(daySlots[slotIndex+1].startTime)) throw 'INVALID_SLOTS';
        }
    }

    professional.set('scheduleRule', slots);
    await professional.save(null, {useMasterKey: true});
}, {
    requireUser: true
});

Parse.Cloud.define('v1-create-service', async (req) => {
    const queryProfessional = new Parse.Query(Professional);
    queryProfessional.equalTo('owner', req.user);
    const professional = await queryProfessional.first({useMasterKey: true});

    if(!professional) throw 'INVALID_PROFESSIONAL';

    const duration = req.params.duration;
    const slotInterval = professional.get('slotInterval');
    if(duration % slotInterval != 0) throw 'INVALID_DURATION';
    if(!req.params.name) throw 'INVALID_NAME';

    const service = new Service();
    service.set('name', req.params.name);
    service.set('price', req.params.price);
    service.set('duration', duration);
    service.set('available', req.params.available);
    await service.save(null, {useMasterKey: true});

    professional.add('services', service);
    await professional.save(null, {useMasterKey: true});

    return formatService(service.toJSON());
}, {
    requireUser: true,
    fields: {
        name: {
            required: true,
        },
        price: {
            required: true,
        },
        duration: {
            required: true,
        }
    }
});

Parse.Cloud.define('v1-change-service-status', async (req) => {
    const queryProfessional = new Parse.Query(Professional);
    queryProfessional.equalTo('owner', req.user);
    const professional = await queryProfessional.first({useMasterKey: true});

    if(!professional) throw 'INVALID_PROFESSIONAL';

    const services = professional.get('services');
    const service = services.find((s) => s.id == req.params.serviceId);

    if(!service) throw 'INVALID_SERVICE';
   
    service.set('available', req.params.available);
    await service.save(null, {useMasterKey: true});
    await service.fetch({useMasterKey: true});

    return formatService(service.toJSON());
}, {
    requireUser: true,
    fields: {
        serviceId: {
            required: true,
        },
        available: {
            required: true
        }
    }
});

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
	};
}