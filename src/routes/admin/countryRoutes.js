import express from "express";
import { getCountries } from "../../controllers/admin/countryController.js";

const router = express.Router();

router.get("/", getCountries); // GET /api/countries

export default router;
