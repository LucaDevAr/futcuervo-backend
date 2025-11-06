// routes/users.js
import { Router } from "express";
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../../controllers/admin/userController.js";
// import { protect, isAdmin } from "../middlewares/authMiddleware.js";

const router = Router();

// Perfil del usuario autenticado
router.get("/me", (req, res) => {
  res.json(req.user);
});

// Solo admin
router.get("/", getUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
