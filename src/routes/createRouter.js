import { Router } from 'express';
import authRouter from "./api/v1/auth.js"
import bookmarkRouter from "./api/v1/bookmark.js"
import commentRouter from "./api/v1/comment.js"
import feedRouter from "./api/v1/feed.js"
import followRouter from "./api/v1/follow.js"
import messageRouter from "./api/v1/message.js"
import notificationRouter from "./api/v1/notification.js"
import postRouter from "./api/v1/post.js"
import searchRouter from "./api/v1/search.js"
import userRouter from "./api/v1/user.js"
import otpRouter from "./api/v1/otp.js";

const loadRoutes = () => {
    const rootRouter = Router({ mergeParams: true });
    rootRouter.use(authRouter)
    rootRouter.use(bookmarkRouter)
    rootRouter.use(commentRouter)
    rootRouter.use(feedRouter)
    rootRouter.use(followRouter)
    rootRouter.use(notificationRouter)
    rootRouter.use(messageRouter)
    rootRouter.use(postRouter)
    rootRouter.use(searchRouter)
    rootRouter.use(userRouter)
    rootRouter.use(otpRouter);
    // rootRouter.use(bookmarkRouter)

    return rootRouter;
};

export default loadRoutes;
