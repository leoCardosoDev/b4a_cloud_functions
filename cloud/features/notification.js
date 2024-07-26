const Device = Parse.Object.extend('Device');
const DynamicNotification = Parse.Object.extend('DynamicNotification');
const Notification = Parse.Object.extend('Notification');

var admin = require('firebase-admin');

var serviceAccount = require('../keys/app-agendamento-142c2-firebase-adminsdk-yhz4v-99ddefc0f6.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

Parse.Cloud.define('v1-register-device', async (req) => {
	const queryDevice = new Parse.Query(Device);
	queryDevice.equalTo('deviceId', req.params.deviceId);
	let device = await queryDevice.first({useMasterKey: true});

	if(device == null) device = new Device();

	device.set('deviceId', req.params.deviceId);
	device.set('platform', req.params.platform);
	device.set('fcmToken', req.params.fcmToken);
	device.set('buildNumber', req.params.buildNumber);
	device.set('user', req.user);
	device.set('locale', req.params.locale);
	await device.save(null, {useMasterKey: true});
}, {
	requireUser: true,
});

Parse.Cloud.define('v1-send-push-notification', async (req) => {
	return await sendPushNotification(req.params.userId, req.params.dynamicNotificationKey, req.params.variables);
});

Parse.Cloud.define('v1-mark-notification-read', async (req) => {
	const notification = new Notification();
	notification.id = req.params.notificationId;
	await notification.fetch({useMasterKey: true});

	if(req.user.id != notification.get('user').id) throw 'INVALID_USER';

	notification.set('isRead', true);
	await notification.save(null, {useMasterKey: true});
}, {
	requireUser: true,
	fields: {
		notificationId: {
			required: true
		}
	}
});

Parse.Cloud.define('v1-get-notifications', async (req) => {
	const queryNotifications = new Parse.Query(Notification);
	queryNotifications.equalTo('user', req.user);
	queryNotifications.descending('createdAt');
	queryNotifications.include('notification');
	queryNotifications.exclude('user');
	queryNotifications.limit(20);
	queryNotifications.skip(20 * req.params.page);
	const notifications = await queryNotifications.find({useMasterKey: true});

	return notifications.map((n) => formatNotification(n.toJSON()));
}, {
	requireUser: true,
	fields: {
		page: {
			required: true
		}
	}
});

Parse.Cloud.define('v1-count-unread-notifications', async (req) => {
	const queryNotifications = new Parse.Query(Notification);
	queryNotifications.equalTo('user', req.user);
	queryNotifications.equalTo('isRead', false);
	const notificationsCount = await queryNotifications.count({useMasterKey: true});
	return notificationsCount;
}, {
	requireUser: true,
});

async function sendPushNotification(userId, dynamicNotificationKey, variables) {
	const user = new Parse.User();
	user.id = userId;

	const queryDynamicNotification = new Parse.Query(DynamicNotification);
	queryDynamicNotification.equalTo('key', dynamicNotificationKey);
	const dynamicNotification = await queryDynamicNotification.first({useMasterKey: true});

	if(dynamicNotification == null) throw 'INVALID_KEY';

	const title = replaceVariables(dynamicNotification.get('title'), variables);
	const subtitle = replaceVariables(dynamicNotification.get('subtitle'), variables);
	const page = replaceVariables(dynamicNotification.get('page'), variables);
	
	const notification = new Notification();
	notification.set('user', user);
	notification.set('isRead', false);
	notification.set('notification', dynamicNotification);
	notification.set('variables', variables);
	await notification.save(null, {useMasterKey: true});

	const queryDevices = new Parse.Query(Device);
	queryDevices.equalTo('user', user);
	queryDevices.notEqualTo('fcmToken', null);
	queryDevices.select('fcmToken', 'locale');
	const devices = await queryDevices.find({useMasterKey: true});

    const registrationTokens = devices.map((d) => d.get('fcmToken'));

    const message = {
        data: {page: page, id: notification.id},
        notification:{
            title: title,
            body: subtitle
        },
        tokens: registrationTokens,
    };

    const result = await admin.messaging().sendMulticast(message);
    
	return result;
}

function formatNotification(n) {
	return {
		id: n.objectId,
		isRead: n.isRead,
		title: replaceVariables(n.notification.title, n.variables),
		subtitle: replaceVariables(n.notification.subtitle, n.variables),
		page: replaceVariables(n.notification.page, n.variables)
	}
}

function replaceVariables(text, variables) {
	let newText = text;

	for (const [key, value] of Object.entries(variables)) {
		newText = newText.replace(new RegExp('{{' + key + '}}', 'g'), value);
	}

	if(newText.includes('{') || newText.includes('}')) throw 'INVALID_VARIABLES' + newText;

	return newText;
}

module.exports = {
	sendPushNotification,
  };