const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

/**
 * @desc    Get all employees
 * @route   GET /api/employees
 * @access  Private (Admin)
 */
const getAllEmployees = async (req, res) => {
    try {
        const { page = 1, limit = 20, search, status } = req.query;

        const query = { role: 'employee' };

        // Search by name or employee ID
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { employeeId: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        // Filter by status
        if (status === 'active') {
            query.isActive = true;
        } else if (status === 'inactive') {
            query.isActive = false;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [employees, total] = await Promise.all([
            User.find(query)
                .select('-password')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            User.countDocuments(query),
        ]);

        res.status(200).json({
            success: true,
            data: {
                employees,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / parseInt(limit)),
                    total,
                },
            },
        });
    } catch (error) {
        console.error('Get All Employees Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching employees',
        });
    }
};

/**
 * @desc    Get single employee
 * @route   GET /api/employees/:id
 * @access  Private (Admin)
 */
const getEmployee = async (req, res) => {
    try {
        const employee = await User.findById(req.params.id).select('-password');

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found',
            });
        }

        res.status(200).json({
            success: true,
            data: employee,
        });
    } catch (error) {
        console.error('Get Employee Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching employee',
        });
    }
};

/**
 * @desc    Add new employee
 * @route   POST /api/employees
 * @access  Private (Admin)
 */
const addEmployee = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array(),
            });
        }

        const { employeeId, name, email, password, department, designation, phone, role, joiningDate, salaryStructure } = req.body;

        // Check if employee ID or email already exists
        const existingUser = await User.findOne({
            $or: [{ employeeId }, { email }],
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: existingUser.email === email
                    ? 'Email already registered'
                    : 'Employee ID already exists',
            });
        }

        // Create employee
        const employee = await User.create({
            employeeId,
            name,
            email,
            password,
            role: role || 'employee',
            department: department || '',
            designation: designation || '',
            phone: phone || '',
            joiningDate: joiningDate || Date.now(),
            salaryStructure: salaryStructure || {},
            isActive: true,
        });

        res.status(201).json({
            success: true,
            message: 'Employee added successfully',
            data: {
                id: employee._id,
                employeeId: employee.employeeId,
                name: employee.name,
                email: employee.email,
                department: employee.department,
                designation: employee.designation,
                phone: employee.phone,
                isActive: employee.isActive,
            },
        });
    } catch (error) {
        console.error('Add Employee Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error adding employee',
        });
    }
};

/**
 * @desc    Update employee
 * @route   PUT /api/employees/:id
 * @access  Private (Admin)
 */
const updateEmployee = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array(),
            });
        }

        const { name, email, department, designation, phone, password } = req.body;

        const employee = await User.findById(req.params.id);

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found',
            });
        }

        // Check if email is being changed and if it's already taken
        if (email && email !== employee.email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already registered',
                });
            }
            employee.email = email;
        }

        // Update fields
        if (name) employee.name = name;
        if (department !== undefined) employee.department = department;
        if (designation !== undefined) employee.designation = designation;
        if (phone !== undefined) employee.phone = phone;

        // Update password if provided
        if (password) {
            employee.password = password; // Will be hashed by pre-save hook
        }

        await employee.save();

        res.status(200).json({
            success: true,
            message: 'Employee updated successfully',
            data: {
                id: employee._id,
                employeeId: employee.employeeId,
                name: employee.name,
                email: employee.email,
                department: employee.department,
                designation: employee.designation,
                phone: employee.phone,
                isActive: employee.isActive,
            },
        });
    } catch (error) {
        console.error('Update Employee Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating employee',
        });
    }
};

/**
 * @desc    Toggle employee active status
 * @route   PATCH /api/employees/:id/toggle
 * @access  Private (Admin)
 */
const toggleEmployeeStatus = async (req, res) => {
    try {
        const employee = await User.findById(req.params.id);

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found',
            });
        }

        if (employee.role === 'admin') {
            return res.status(400).json({
                success: false,
                message: 'Cannot change admin status',
            });
        }

        employee.isActive = !employee.isActive;
        await employee.save();

        res.status(200).json({
            success: true,
            message: `Employee ${employee.isActive ? 'activated' : 'deactivated'} successfully`,
            data: {
                id: employee._id,
                isActive: employee.isActive,
            },
        });
    } catch (error) {
        console.error('Toggle Employee Status Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating employee status',
        });
    }
};

/**
 * @desc    Delete employee
 * @route   DELETE /api/employees/:id
 * @access  Private (Admin)
 */
const deleteEmployee = async (req, res) => {
    try {
        const employee = await User.findById(req.params.id);

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found',
            });
        }

        if (employee.role === 'admin') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete admin user',
            });
        }

        await User.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Employee deleted successfully',
        });
    } catch (error) {
        console.error('Delete Employee Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting employee',
        });
    }
};

module.exports = {
    getAllEmployees,
    getEmployee,
    addEmployee,
    updateEmployee,
    toggleEmployeeStatus,
    deleteEmployee,
};
