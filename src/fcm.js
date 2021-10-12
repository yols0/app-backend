const admin = require('firebase-admin');
const { UnsetEnvError } = require('./utils/errors');
const { ADMIN_TOPIC } = require('./utils/constants');

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new UnsetEnvError('GOOGLE_APPLICATION_CREDENTIALS');
}

admin.initializeApp({
    credential: admin.credential.applicationDefault(),
});

function subscribeToReportCreationTopic(userId, tokens) {
    // If no tokens are provided, do nothing.
    if (tokens === '' || tokens.length === 0) {
        return;
    }

    admin
        .messaging()
        .subscribeToTopic(tokens, ADMIN_TOPIC)
        .then(() => {
            console.log(`Subscribed ${userId} to report creation topic`);
        })
        .catch((err) => {
            console.error(err);
        });
}

function unsubscribeFromReportCreationTopic(userId, tokens) {
    // If no tokens are related to the user, do nothing.
    if (tokens === '' || tokens.length === 0) {
        return;
    }

    admin
        .messaging()
        .unsubscribeFromTopic(tokens, ADMIN_TOPIC)
        .then(() => {
            console.log(`Unsubscribed ${userId} from report creation topic`);
        })
        .catch((err) => {
            console.error(err);
        });
}

// Notify the creator of the report that the report has been resolved
async function notifyCreator(report, creator) {
    if (!creator.appNotificationsEnabled) {
        return;
    }

    const message = {
        notification: {
            title: 'El estado de tu report ha cambiado',
            body: `Tu reporte con el folio ${report._id} ha sido actualizado`,
        },
        data: {
            notificationType: 'report_update',
            reportId: report._id.toString(),
        },
    };

    return firebaseAdmin
        .messaging()
        .sendToDevice(report.creator.notificationTokens, message)
        .then((response) => {
            // See the MessagingDevicesResponse reference documentation for
            // the contents of response.
            console.log('Successfully sent message:', response);
        })
        .catch((error) => {
            console.log('Error sending message:', error);
        });
}

// Notify the admin that a report has been created
function notifyAdmins(report) {
    const message = {
        notification: {
            title: 'Nuevo reporte',
            body: `Un nuevo reporte con folio ${report._id} ha sido creado`,
        },
        data: {
            notificationType: 'report_create',
            reportId: report._id.toString(),
        },
    };

    console.log(message);

    return admin
        .messaging()
        .sendToTopic(ADMIN_TOPIC, message)
        .then((response) => {
            // See the MessagingDevicesResponse reference documentation for
            // the contents of response.
            console.log('Successfully sent message:', response);
        })
        .catch((error) => {
            console.log('Error sending message:', error);
        });
}

module.exports = {
    subscribeToReportCreationTopic,
    unsubscribeFromReportCreationTopic,
    notifyCreator,
    notifyAdmins,
};
