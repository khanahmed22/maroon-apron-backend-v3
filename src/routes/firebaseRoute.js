//
import { Router } from "express";
import { subscribeToNotifications,getNotificationStatus,unsubscribeFromNotifications } from "../controllers/firebaseNotification.js";
import { protect } from '../authMiddleware/protect.js';

const firebaseNotif = Router();

firebaseNotif.post("/subscribe", protect, subscribeToNotifications);
firebaseNotif.get("/status", protect, getNotificationStatus);
firebaseNotif.post("/unsubscribe", protect, unsubscribeFromNotifications);

export default firebaseNotif;