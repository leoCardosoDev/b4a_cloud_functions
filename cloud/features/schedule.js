const Professional = Parse.Object.extend('Professional');
const Schedule = Parse.Object.extend('Schedule');

Parse.Cloud.define('v1-get-scheduling-slots', async (req) => {
	const duration = req.params.duration;
	const professionalId = req.params.professionalId;
	const startDate = new Date(req.params.startDate);
	const endDate = new Date(req.params.endDate);

	const professional = new Professional();
	professional.id = professionalId;
	await professional.fetch({useMasterKey: true});

	const schedulingsQuery = new Parse.Query(Schedule);
	schedulingsQuery.equalTo('professional', professional);
	schedulingsQuery.greaterThanOrEqualTo('startDate', startDate);
	schedulingsQuery.lessThanOrEqualTo('endDate', endDate);
	schedulingsQuery.ascending('startDate');
	const schedulings = await schedulingsQuery.find({useMasterKey: true});

	let days = 0;
	const availableSlots = [];

	while(days < 60) {
		const currentDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
		days += 1;

		if(currentDate >= endDate) break;

		let weekday = currentDate.getDay();
		if(weekday == 0) weekday = 7;

		const workSlots = professional.get('scheduleRule').filter((s) => s.weekday == weekday);

		const availableSlotsInDay = [];

		for(const workSlot of workSlots) {
			const diffStart = new Date(workSlot.startTime) - new Date('2000-01-01T00:00:00.000Z');
			const diffEnd = new Date(workSlot.endTime) - new Date('2000-01-01T00:00:00.000Z');
		
			const workSlotStart = new Date(currentDate.getTime() + diffStart);
			const workSlotEnd = new Date(currentDate.getTime() + diffEnd);

			let minutes = 0;

			while(minutes < 24 * 60) {
				const testSlotStart = new Date(workSlotStart.getTime() + minutes * 60 * 1000);
				const testSlotEnd = new Date(testSlotStart.getTime() + duration * 60 * 1000);

				minutes += professional.get('slotInterval');

				if(testSlotEnd > workSlotEnd) break;

				for(const schedule of schedulings) {
					if(testSlotEnd <= schedule.get('startDate')) {
						availableSlotsInDay.push(
							{
								startDate: testSlotStart.toISOString(),
								endDate: testSlotEnd.toISOString()
							}
						);
						break;
					} else if(testSlotEnd <= schedule.get('endDate') || testSlotStart < schedule.get('endDate')){
						break;
					} else if(schedule === schedulings[schedulings.length - 1]) {
						availableSlotsInDay.push(
							{
								startDate: testSlotStart.toISOString(),
								endDate: testSlotEnd.toISOString()
							}
						);
						break;
					}
				}
			}
		}

		availableSlots.push(
			{
				date: currentDate.toISOString(),
				slots: availableSlotsInDay,
			}
		)
	}

	return availableSlots;

}, {
	fields: {
		duration: {
			required: true,
		},
		professionalId: {
			required: true
		}
	}
});