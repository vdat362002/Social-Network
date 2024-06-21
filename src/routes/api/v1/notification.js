import { NOTIFICATIONS_LIMIT } from '../../../constants/constants.js';
import { makeResponseJson } from '../../../helpers/utils.js';
import { ErrorHandler, isAuthenticated } from '../../../middlewares/index.js';
import { Notification } from '../../../schemas/index.js';
import express from 'express';
const { Request, Response, Router } = express
const router = Router({ mergeParams: true });

router.get(
    '/v1/notifications',
    isAuthenticated,
    async (req, res, next) => {
        try {
            let offset = parseInt(req.query.offset) || 0;

            const limit = NOTIFICATIONS_LIMIT;
            const skip = offset * limit;

            const notifications = await Notification
                .find({ target: req.user._id })
                .populate('target initiator', 'profilePicture username fullname firstname lastname')
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(skip);
            const unreadCount = await Notification.find({ target: req.user._id, unread: true });
            const count = await Notification.find({ target: req.user._id });
            const result = { notifications, unreadCount: unreadCount.length, count: count.length };

            if (notifications.length === 0 && offset === 0) {
                return next(ErrorHandler(404, 'You have no notifications.'));
            } else if (notifications.length === 0 && offset >= 1) {
                return next(ErrorHandler(404, 'No more notifications.'));
            }

            res.status(200).send(makeResponseJson(result));
        } catch (e) {
            console.log(e);
            return res.status(404).json({ data: [], status_code: 404, error: { message: "No more notification" }, success: true, time_stamp: new Date(), message: "No more feed" })

            next(e);
        }
    }
);

router.get(
    '/v1/notifications/unread',
    isAuthenticated,
    async (req, res, next) => {
        try {
            const notif = await Notification.find({ target: req.user._id, unread: true });

            res.status(200).send(makeResponseJson({ count: notif.length }));
        } catch (e) {
            console.log('CANT GET UNREAD NOTIFICATIONS', e);
            next(e);
        }
    }
);

router.patch(
    '/v1/notifications/mark',
    isAuthenticated,
    async (req, res, next) => {
        try {
            await Notification
                .updateMany(
                    { target: req.user._id },
                    {
                        $set: {
                            unread: false
                        }
                    });
            res.status(200).send(makeResponseJson({ state: false }));
        } catch (e) {
            console.log('CANT MARK ALL AS UNREAD', e);
            next(e);
        }
    }
);

router.patch(
    '/v1/read/notification/:id',
    isAuthenticated,
    async (req, res, next) => {
        try {
            const { id } = req.params;
            const notif = await Notification.findById(id);
            if (!notif) return res.sendStatus(400);

            await Notification
                .findByIdAndUpdate(id, {
                    $set: {
                        unread: false
                    }
                });

            res.status(200).send(makeResponseJson({ state: false })) // state = false EQ unread = false
        } catch (e) {
            next(e);
        }
    }
);

export default router;
