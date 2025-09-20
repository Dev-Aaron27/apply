import { body, validationResult } from "express-validator";

export const validateApplication = [
  body("abusePerms").isString().isLength({ min: 50 }),
  body("availableDays").isArray().optional(),
  body("timezone").isString().notEmpty(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    next();
  },
];
