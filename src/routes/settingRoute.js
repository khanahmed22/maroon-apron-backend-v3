import express from "express";
import { Router } from "express";
import {updateRestaurantSettings } from "../controllers/settingController.js";
const settingRouter = Router()

settingRouter.put('/',updateRestaurantSettings)

export default settingRouter