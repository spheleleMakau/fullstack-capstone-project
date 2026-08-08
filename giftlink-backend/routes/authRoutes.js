const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const connectToDatabase = require('../models/db');
const logger = require('../logger');

router.put(
    '/update',
    [
        body('name').optional().notEmpty().withMessage('Name cannot be empty'),
        body('email').optional().isEmail().withMessage('Invalid email'),
        body('password')
            .optional()
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters')
    ],
    async (req, res) => {

        // Task 2: Validate the input
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            logger.error('Validation errors in update request', errors.array());
            return res.status(400).json({
                errors: errors.array()
            });
        }

        try {
            // Task 3: Check if email is present in the header
            const email = req.header('email');

            if (!email) {
                return res.status(400).send('Email is required in the header');
            }

            // Task 4: Connect to MongoDB
            const db = await connectToDatabase();
            const collection = db.collection('users');

            // Task 5: Find user credentials
            const existingUser = await collection.findOne({ email: email });

            if (!existingUser) {
                return res.status(404).send('User not found');
            }

            // Update user details
            if (req.body.name !== undefined) {
                existingUser.name = req.body.name;
            }

            if (req.body.email !== undefined) {
                existingUser.email = req.body.email;
            }

            if (req.body.password !== undefined) {
                existingUser.password = req.body.password;
            }

            existingUser.updatedAt = new Date();

            // Task 6: Update user credentials
            await collection.updateOne(
                { _id: existingUser._id },
                {
                    $set: {
                        name: existingUser.name,
                        email: existingUser.email,
                        password: existingUser.password,
                        updatedAt: existingUser.updatedAt
                    }
                }
            );

            // Task 7: Create JWT authentication
            const authtoken = jwt.sign(
                { user: existingUser._id },
                process.env.JWT_SECRET
            );

            res.json({ authtoken });

        } catch (e) {
            logger.error(e);
            return res.status(500).send('Internal server error');
        }
    }
);

module.exports = router;