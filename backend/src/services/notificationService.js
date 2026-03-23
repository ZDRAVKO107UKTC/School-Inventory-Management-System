'use strict';

const { Op } = require('sequelize');
const {
  NotificationDelivery,
  Request,
  Equipment,
  User,
  Room
} = require('../../models');
const { sendEmail, isEmailEnabled, getFromAddress } = require('./emailService');

const DEFAULT_LOW_STOCK_THRESHOLD = Number.parseInt(process.env.LOW_STOCK_THRESHOLD || '2', 10);

const NOTIFICATION_TYPES = {
  OVERDUE_REMINDER: 'overdue_reminder',
  LOW_STOCK_ALERT: 'low_stock_alert',
  REQUEST_SUBMITTED_CONFIRMATION: 'request_submitted_confirmation',
  REQUEST_SUBMITTED_ADMIN_ALERT: 'request_submitted_admin_alert',
  REQUEST_APPROVED: 'request_approved',
  REQUEST_REJECTED: 'request_rejected',
  REQUEST_RETURNED_CONFIRMATION: 'request_returned_confirmation',
  REQUEST_RETURNED_ADMIN_ALERT: 'request_returned_admin_alert'
};

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const buildDedupeKey = (...parts) => parts.filter((part) => part !== null && part !== undefined).join(':');

const listLowStockItems = async () => {
  return Equipment.findAll({
    where: {
      status: { [Op.ne]: 'retired' },
      quantity: { [Op.lte]: DEFAULT_LOW_STOCK_THRESHOLD }
    },
    attributes: ['id', 'name', 'type', 'serial_number', 'quantity', 'status', 'room_id', 'updated_at'],
    include: [{
      model: Room,
      as: 'room',
      attributes: ['id', 'name'],
      required: false
    }],
    order: [['quantity', 'ASC'], ['updated_at', 'DESC']]
  });
};

const listOverdueRequests = async () => {
  return Request.findAll({
    where: {
      status: 'approved',
      due_date: { [Op.lt]: new Date() },
      return_date: { [Op.is]: null }
    },
    attributes: ['id', 'user_id', 'equipment_id', 'quantity', 'request_date', 'due_date', 'notes'],
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'email']
      },
      {
        model: Equipment,
        as: 'equipment',
        attributes: ['id', 'name', 'type', 'serial_number']
      }
    ],
    order: [['due_date', 'ASC']]
  });
};

const listAdminRecipients = async () => {
  return User.findAll({
    where: { role: { [Op.in]: ['admin', 'teacher'] } },
    attributes: ['id', 'username', 'email'],
    order: [['id', 'ASC']]
  });
};

const createDeliveryRecord = async (payload) => {
  try {
    return await NotificationDelivery.create(payload);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return null;
    }
    throw error;
  }
};

const deliverEmailNotification = async ({
  type,
  dedupeKey,
  recipientEmail,
  subject,
  text,
  userId = null,
  equipmentId = null,
  requestId = null,
  metadata = null
}) => {
  if (!recipientEmail) {
    return { status: 'skipped', reason: 'missing_email', type, requestId, userId };
  }

  const baseRecord = {
    type,
    channel: 'email',
    dedupe_key: dedupeKey,
    recipient_email: recipientEmail,
    user_id: userId,
    equipment_id: equipmentId,
    request_id: requestId,
    subject,
    message: text,
    metadata,
    sent_at: new Date()
  };

  const reserved = await createDeliveryRecord({
    ...baseRecord,
    status: 'skipped',
    error_message: 'reserved_for_send'
  });

  if (!reserved) {
    return { status: 'skipped', reason: 'duplicate', type, requestId, userId };
  }

  try {
    await sendEmail({
      to: recipientEmail,
      subject,
      text
    });

    await reserved.update({
      status: 'sent',
      error_message: null,
      sent_at: new Date()
    });

    return { status: 'sent', type, requestId, userId };
  } catch (error) {
    await reserved.update({
      status: 'failed',
      error_message: error.message,
      sent_at: new Date()
    });

    return { status: 'failed', reason: error.message, type, requestId, userId };
  }
};

const summarizeResults = (results) => ({
  sent: results.filter((item) => item.status === 'sent').length,
  failed: results.filter((item) => item.status === 'failed').length,
  skipped: results.filter((item) => item.status === 'skipped').length
});

const logNotificationFailure = (scope, error) => {
  console.error(`[notification-service] ${scope} failed:`, error);
};

const buildRequestDetailsLines = (request, extraLines = []) => ([
  `Request ID: ${request.id}`,
  `Equipment: ${request.equipment?.name || 'Equipment'}`,
  `Quantity: ${request.quantity}`,
  `Borrow date: ${formatDate(request.request_date)}`,
  `Due date: ${formatDate(request.due_date)}`,
  ...extraLines
]);

const notifyUserRequestSubmitted = async (request) => {
  const user = request.user;
  const subject = `Request received: ${request.equipment?.name || `Request #${request.id}`}`;
  const text = [
    `Hello ${user.username},`,
    '',
    'Your equipment request has been submitted and is awaiting review.',
    ...buildRequestDetailsLines(request),
    '',
    'You will receive another email when the request is approved or rejected.',
    '',
    `Sent from ${getFromAddress()}`
  ].join('\n');

  return deliverEmailNotification({
    type: NOTIFICATION_TYPES.REQUEST_SUBMITTED_CONFIRMATION,
    dedupeKey: buildDedupeKey(NOTIFICATION_TYPES.REQUEST_SUBMITTED_CONFIRMATION, request.id, user.id),
    recipientEmail: user.email,
    subject,
    text,
    userId: user.id,
    equipmentId: request.equipment_id,
    requestId: request.id,
    metadata: {
      event: 'request_submitted',
      due_date: request.due_date
    }
  });
};

const notifyAdminsRequestSubmitted = async (request, admins) => {
  const results = [];

  for (const admin of admins) {
    const subject = `New request pending approval: ${request.equipment?.name || `Request #${request.id}`}`;
    const text = [
      `Hello ${admin.username},`,
      '',
      'A new equipment request is waiting for review.',
      ...buildRequestDetailsLines(request, [
        `Requested by: ${request.user?.username || 'Unknown'} (${request.user?.email || 'no email'})`,
        `Notes: ${request.notes || 'None'}`
      ]),
      '',
      'Please review it in the admin request queue.',
      '',
      `Sent from ${getFromAddress()}`
    ].join('\n');

    results.push(await deliverEmailNotification({
      type: NOTIFICATION_TYPES.REQUEST_SUBMITTED_ADMIN_ALERT,
      dedupeKey: buildDedupeKey(NOTIFICATION_TYPES.REQUEST_SUBMITTED_ADMIN_ALERT, request.id, admin.id),
      recipientEmail: admin.email,
      subject,
      text,
      userId: admin.id,
      equipmentId: request.equipment_id,
      requestId: request.id,
      metadata: {
        event: 'request_submitted',
        target_role: 'admin',
        requester_id: request.user_id
      }
    }));
  }

  return results;
};

const sendRequestSubmittedNotifications = async (request) => {
  if (!request?.user || !request?.equipment) {
    return { sent: 0, failed: 0, skipped: 0 };
  }

  try {
    const admins = await listAdminRecipients();
    const results = [
      await notifyUserRequestSubmitted(request),
      ...(await notifyAdminsRequestSubmitted(request, admins))
    ];
    return summarizeResults(results);
  } catch (error) {
    logNotificationFailure('request submitted notifications', error);
    return { sent: 0, failed: 1, skipped: 0 };
  }
};

const sendRequestApprovedNotification = async (request) => {
  if (!request?.user || !request?.equipment) {
    return { status: 'skipped', reason: 'missing_context', type: NOTIFICATION_TYPES.REQUEST_APPROVED };
  }

  try {
    const approverName = request.approver?.username || 'an administrator';
    const subject = `Request approved: ${request.equipment?.name || `Request #${request.id}`}`;
    const text = [
      `Hello ${request.user.username},`,
      '',
      `Your request has been approved by ${approverName}.`,
      ...buildRequestDetailsLines(request),
      '',
      'Please make arrangements to collect the equipment before the due date.',
      '',
      `Sent from ${getFromAddress()}`
    ].join('\n');

    return await deliverEmailNotification({
      type: NOTIFICATION_TYPES.REQUEST_APPROVED,
      dedupeKey: buildDedupeKey(NOTIFICATION_TYPES.REQUEST_APPROVED, request.id, request.user.id),
      recipientEmail: request.user.email,
      subject,
      text,
      userId: request.user.id,
      equipmentId: request.equipment_id,
      requestId: request.id,
      metadata: {
        event: 'request_approved',
        approved_by: request.approved_by
      }
    });
  } catch (error) {
    logNotificationFailure('request approved notification', error);
    return { status: 'failed', reason: error.message, type: NOTIFICATION_TYPES.REQUEST_APPROVED };
  }
};

const sendRequestRejectedNotification = async (request, reason) => {
  if (!request?.user || !request?.equipment) {
    return { status: 'skipped', reason: 'missing_context', type: NOTIFICATION_TYPES.REQUEST_REJECTED };
  }

  try {
    const reviewerName = request.approver?.username || 'an administrator';
    const subject = `Request rejected: ${request.equipment?.name || `Request #${request.id}`}`;
    const text = [
      `Hello ${request.user.username},`,
      '',
      `Your request was rejected by ${reviewerName}.`,
      ...buildRequestDetailsLines(request, [
        `Reason: ${reason || request.notes || 'No reason provided'}`
      ]),
      '',
      'You can submit a new request or contact an administrator if you need more information.',
      '',
      `Sent from ${getFromAddress()}`
    ].join('\n');

    return await deliverEmailNotification({
      type: NOTIFICATION_TYPES.REQUEST_REJECTED,
      dedupeKey: buildDedupeKey(NOTIFICATION_TYPES.REQUEST_REJECTED, request.id, request.user.id),
      recipientEmail: request.user.email,
      subject,
      text,
      userId: request.user.id,
      equipmentId: request.equipment_id,
      requestId: request.id,
      metadata: {
        event: 'request_rejected',
        rejected_by: request.approved_by,
        reason: reason || request.notes || null
      }
    });
  } catch (error) {
    logNotificationFailure('request rejected notification', error);
    return { status: 'failed', reason: error.message, type: NOTIFICATION_TYPES.REQUEST_REJECTED };
  }
};

const sendRequestReturnedNotifications = async (request, actor) => {
  if (!request?.user || !request?.equipment) {
    return { sent: 0, failed: 0, skipped: 0 };
  }

  try {
    const results = [];
    const actorLabel = actor?.username || 'a user';

    results.push(await deliverEmailNotification({
      type: NOTIFICATION_TYPES.REQUEST_RETURNED_CONFIRMATION,
      dedupeKey: buildDedupeKey(NOTIFICATION_TYPES.REQUEST_RETURNED_CONFIRMATION, request.id, request.user.id),
      recipientEmail: request.user.email,
      subject: `Return recorded: ${request.equipment?.name || `Request #${request.id}`}`,
      text: [
        `Hello ${request.user.username},`,
        '',
        `Your return has been recorded by ${actorLabel}.`,
        ...buildRequestDetailsLines(request, [
          `Return date: ${formatDate(request.return_date)}`,
          `Condition: ${request.return_condition || 'Not recorded'}`,
          `Return notes: ${request.return_notes || 'None'}`
        ]),
        '',
        `Sent from ${getFromAddress()}`
      ].join('\n'),
      userId: request.user.id,
      equipmentId: request.equipment_id,
      requestId: request.id,
      metadata: {
        event: 'request_returned',
        actor_id: actor?.id || null,
        return_condition: request.return_condition || null
      }
    }));

    const admins = await listAdminRecipients();
    for (const admin of admins) {
      results.push(await deliverEmailNotification({
        type: NOTIFICATION_TYPES.REQUEST_RETURNED_ADMIN_ALERT,
        dedupeKey: buildDedupeKey(NOTIFICATION_TYPES.REQUEST_RETURNED_ADMIN_ALERT, request.id, admin.id),
        recipientEmail: admin.email,
        subject: `Equipment returned: ${request.equipment?.name || `Request #${request.id}`}`,
        text: [
          `Hello ${admin.username},`,
          '',
          'A request return has been recorded.',
          ...buildRequestDetailsLines(request, [
            `Returned by: ${request.user?.username || 'Unknown'} (${request.user?.email || 'no email'})`,
            `Processed by: ${actorLabel}`,
            `Return date: ${formatDate(request.return_date)}`,
            `Condition: ${request.return_condition || 'Not recorded'}`,
            `Return notes: ${request.return_notes || 'None'}`
          ]),
          '',
          `Sent from ${getFromAddress()}`
        ].join('\n'),
        userId: admin.id,
        equipmentId: request.equipment_id,
        requestId: request.id,
        metadata: {
          event: 'request_returned',
          target_role: 'admin',
          requester_id: request.user_id,
          actor_id: actor?.id || null,
          return_condition: request.return_condition || null
        }
      }));
    }

    return summarizeResults(results);
  } catch (error) {
    logNotificationFailure('request returned notifications', error);
    return { sent: 0, failed: 1, skipped: 0 };
  }
};

const sendOverdueReminder = async (request, windowStart) => {
  if (!request.user?.email) {
    return { status: 'skipped', reason: 'missing_email', requestId: request.id };
  }

  const dedupeKey = buildDedupeKey(NOTIFICATION_TYPES.OVERDUE_REMINDER, request.id, windowStart.toISOString().slice(0, 10));
  const subject = `Overdue equipment reminder: ${request.equipment?.name || `Request #${request.id}`}`;
  const text = [
    `Hello ${request.user.username},`,
    '',
    'This is a reminder that your borrowed equipment is overdue.',
    `Item: ${request.equipment?.name || 'Equipment'}`,
    `Due date: ${formatDate(request.due_date)}`,
    `Quantity: ${request.quantity}`,
    '',
    'Please return the item as soon as possible or contact an administrator if you need help.',
    '',
    `Sent from ${getFromAddress()}`
  ].join('\n');

  return deliverEmailNotification({
    type: NOTIFICATION_TYPES.OVERDUE_REMINDER,
    dedupeKey,
    recipientEmail: request.user.email,
    subject,
    text,
    userId: request.user.id,
    equipmentId: request.equipment_id,
    requestId: request.id,
    metadata: {
      due_date: request.due_date,
      equipment_name: request.equipment?.name || null
    }
  });
};

const sendLowStockDigest = async (recipient, items, windowStart) => {
  if (!recipient.email) {
    return { status: 'skipped', reason: 'missing_email', userId: recipient.id };
  }

  const dedupeKey = buildDedupeKey(NOTIFICATION_TYPES.LOW_STOCK_ALERT, recipient.id, windowStart.toISOString().slice(0, 10));
  const subject = `Low stock alert: ${items.length} item${items.length === 1 ? '' : 's'} need attention`;
  const lines = items.map((item) => {
    const roomName = item.room?.name ? `, room ${item.room.name}` : '';
    return `- ${item.name} (${item.type}) | qty=${item.quantity}${roomName}`;
  });
  const text = [
    `Hello ${recipient.username},`,
    '',
    `The following equipment items are at or below the low stock threshold (${DEFAULT_LOW_STOCK_THRESHOLD}):`,
    ...lines,
    '',
    'Please review inventory and restocking needs.',
    '',
    `Sent from ${getFromAddress()}`
  ].join('\n');

  return deliverEmailNotification({
    type: NOTIFICATION_TYPES.LOW_STOCK_ALERT,
    dedupeKey,
    recipientEmail: recipient.email,
    subject,
    text,
    userId: recipient.id,
    metadata: {
      low_stock_threshold: DEFAULT_LOW_STOCK_THRESHOLD,
      equipment_ids: items.map((item) => item.id)
    }
  });
};

const processNotificationCycle = async () => {
  const windowStart = startOfToday();
  const [overdueRequests, lowStockItems, adminRecipients] = await Promise.all([
    listOverdueRequests(),
    listLowStockItems(),
    listAdminRecipients()
  ]);

  const overdueResults = [];
  for (const request of overdueRequests) {
    overdueResults.push(await sendOverdueReminder(request, windowStart));
  }

  const lowStockResults = [];
  if (lowStockItems.length > 0) {
    for (const admin of adminRecipients) {
      lowStockResults.push(await sendLowStockDigest(admin, lowStockItems, windowStart));
    }
  }

  return {
    emailEnabled: isEmailEnabled(),
    thresholds: {
      lowStock: DEFAULT_LOW_STOCK_THRESHOLD
    },
    overdue: {
      detected: overdueRequests.length,
      deliveries: summarizeResults(overdueResults),
      items: overdueRequests.map((request) => ({
        id: request.id,
        due_date: request.due_date,
        user: request.user?.username || null,
        email: request.user?.email || null,
        equipment: request.equipment?.name || null
      }))
    },
    lowStock: {
      detected: lowStockItems.length,
      deliveries: summarizeResults(lowStockResults),
      items: lowStockItems.map((item) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        quantity: item.quantity,
        room: item.room?.name || null
      }))
    }
  };
};

const getNotificationSummary = async () => {
  const [overdueRequests, lowStockItems, recentDeliveries] = await Promise.all([
    listOverdueRequests(),
    listLowStockItems(),
    NotificationDelivery.findAll({
      attributes: ['id', 'type', 'status', 'recipient_email', 'subject', 'sent_at', 'created_at'],
      order: [['sent_at', 'DESC']],
      limit: 20
    })
  ]);

  const deliveryCounts = recentDeliveries.reduce((accumulator, delivery) => {
    accumulator[delivery.type] = (accumulator[delivery.type] || 0) + 1;
    return accumulator;
  }, {});

  return {
    emailEnabled: isEmailEnabled(),
    thresholds: {
      lowStock: DEFAULT_LOW_STOCK_THRESHOLD
    },
    counts: {
      overdueRequests: overdueRequests.length,
      lowStockItems: lowStockItems.length,
      recentDeliveries: recentDeliveries.length,
      deliveriesByType: deliveryCounts
    },
    overdue: overdueRequests.map((request) => ({
      id: request.id,
      due_date: request.due_date,
      user: request.user?.username || null,
      email: request.user?.email || null,
      equipment: request.equipment?.name || null,
      quantity: request.quantity
    })),
    lowStock: lowStockItems.map((item) => ({
      id: item.id,
      name: item.name,
      type: item.type,
      quantity: item.quantity,
      room: item.room?.name || null,
      status: item.status
    })),
    recentDeliveries
  };
};

module.exports = {
  NOTIFICATION_TYPES,
  getNotificationSummary,
  processNotificationCycle,
  sendRequestSubmittedNotifications,
  sendRequestApprovedNotification,
  sendRequestRejectedNotification,
  sendRequestReturnedNotifications
};
