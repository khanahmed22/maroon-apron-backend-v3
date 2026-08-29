//
import { Router } from "express";
import { subscribeToNotifications,getNotificationStatus } from "../controllers/firebaseNotification.js";
import { protect } from '../authMiddleware/protect.js';

const firebaseNotif = Router();

firebaseNotif.post("/subscribe", protect, subscribeToNotifications);
firebaseNotif.get("/status", protect, getNotificationStatus);

export default firebaseNotif;