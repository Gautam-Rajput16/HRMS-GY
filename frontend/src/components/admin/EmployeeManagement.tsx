import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    ToggleLeft,
    ToggleRight,
    X,
    ChevronLeft,
    ChevronRight,
    Users,
    XCircle,
    ChevronDown,
    DollarSign,
} from 'lucide-react';
import { employeeAPI } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';

interface Employee {
    _id: string;
    employeeId: string;
    name: string;
    email: string;
    role: string;
    department: string;
    designation: string;
    phone: string;
    joiningDate: string;
    isActive: boolean;
    createdAt: string;
    salaryStructure?: SalaryStructure;
}

interface SalaryStructure {
    baseSalary: number;
}

interface EmployeeFormData {
    employeeId: string;
    name: string;
    email: string;
    password: string;
    role: string;
    department: string;
    designation: string;
    phone: string;
    joiningDate: string;
    salaryStructure: SalaryStructure;
}

const initialSalary: SalaryStructure = {
    baseSalary: 0,
};

const initialFormData: EmployeeFormData = {
    employeeId: '',
    name: '',
    email: '',
    password: '',
    role: 'employee',
    department: '',
    designation: '',
    phone: '',
    joiningDate: new Date().toISOString().split('T')[0],
    salaryStructure: { ...initialSalary },
};

export function EmployeeManagement() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [formData, setFormData] = useState<EmployeeFormData>(initialFormData);
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchEmployees();
    }, [page, searchQuery, statusFilter]);

    const fetchEmployees = async () => {
        setIsLoading(true);
        try {
            const response = await employeeAPI.getAll({ page, limit: 10, search: searchQuery, status: statusFilter });
            setEmployees(response.data.data.employees);
            setTotalPages(response.data.data.pagination.pages);
        } catch (error) {
            console.error('Error fetching employees:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (value: string) => {
        setSearchQuery(value);
        setPage(1);
    };

    const openAddModal = () => {
        setEditingEmployee(null);
        setFormData(initialFormData);
        setFormError('');
        setShowModal(true);
    };

    const openEditModal = (employee: Employee) => {
        setEditingEmployee(employee);
        setFormData({
            employeeId: employee.employeeId,
            name: employee.name,
            email: employee.email,
            password: '',
            role: employee.role || 'employee',
            department: employee.department,
            designation: employee.designation,
            phone: employee.phone,
            joiningDate: employee.joiningDate ? employee.joiningDate.split('T')[0] : '',
            salaryStructure: employee.salaryStructure || { ...initialSalary },
        });
        setFormError('');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingEmployee(null);
        setFormData(initialFormData);
        setFormError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        setIsSubmitting(true);

        try {
            if (editingEmployee) {
                const updateData: Partial<EmployeeFormData> = {
                    name: formData.name,
                    email: formData.email,
                    department: formData.department,
                    designation: formData.designation,
                    phone: formData.phone,
                };
                if (formData.password) updateData.password = formData.password;
                await employeeAPI.update(editingEmployee._id, updateData);
            } else {
                if (!formData.password) {
                    setFormError('Password is required for new employees');
                    setIsSubmitting(false);
                    return;
                }
                await employeeAPI.create(formData);
            }
            closeModal();
            fetchEmployees();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setFormError(error.response?.data?.message || 'Failed to save employee');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleStatus = async (employee: Employee) => {
        if (!confirm(`Are you sure you want to ${employee.isActive ? 'deactivate' : 'activate'} ${employee.name}?`)) return;
        try {
            await employeeAPI.toggleStatus(employee._id);
            fetchEmployees();
        } catch (error) {
            console.error('Error toggling status:', error);
        }
    };

    const handleDelete = async (employee: Employee) => {
        if (!confirm(`Delete ${employee.name}? This action cannot be undone.`)) return;
        try {
            await employeeAPI.delete(employee._id);
            fetchEmployees();
        } catch (error) {
            console.error('Error deleting employee:', error);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
                    <p className="text-gray-500 mt-1">Add, edit, and manage employee accounts</p>
                </div>
                <Button onClick={openAddModal} className="shadow-sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Employee
                </Button>
            </div>

            {/* Filters */}
            <Card className="shadow-sm">
                <CardContent className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-3 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search by name, ID, or email..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-full h-10 pl-10 pr-4 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow placeholder-gray-400"
                            />
                        </div>
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                                className="w-full h-10 pl-4 pr-10 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none cursor-pointer transition-shadow"
                            >
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Spinner size="lg" />
                    <p className="text-gray-500 text-sm mt-3">Loading employees...</p>
                </div>
            ) : employees.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Users className="w-6 h-6 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No employees found</h3>
                    <p className="text-gray-500 text-sm mt-1">{searchQuery ? 'Try a different search term' : 'Add your first employee'}</p>
                </div>
            ) : (
                <>
                    <Card className="shadow-sm overflow-hidden border border-gray-200">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/80 border-b border-gray-200">
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Designation</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {employees.map((employee) => (
                                        <tr key={employee._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm ring-2 ring-white">
                                                        {employee.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{employee.name}</p>
                                                        <p className="text-xs text-gray-500 mt-0.5">{employee.employeeId} • {employee.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge variant="info" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">{employee.department || 'Unassigned'}</Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">{employee.designation || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge variant={employee.isActive ? 'success' : 'secondary'} className={employee.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}>
                                                    {employee.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => openEditModal(employee)}
                                                        className="h-8 w-8 p-0 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleToggleStatus(employee)}
                                                        className={`h-8 w-8 p-0 rounded-full transition-colors ${employee.isActive ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}
                                                    >
                                                        {employee.isActive ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4" />}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(employee)}
                                                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-4 mt-6">
                            <Button variant="outline" size="icon" disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="h-9 w-9">
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <span className="text-sm text-gray-500">
                                Page <span className="font-medium text-gray-900">{page}</span> of <span className="font-medium text-gray-900">{totalPages}</span>
                            </span>
                            <Button variant="outline" size="icon" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="h-9 w-9">
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </>
            )}

            {/* Modal */}
            {showModal && createPortal(
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
                    onClick={closeModal}
                >
                    <div
                        className="w-full max-w-lg bg-white rounded-xl shadow-2xl ring-1 ring-gray-900/5 transform transition-all flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-t-xl shrink-0">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">
                                    {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
                                </h3>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    {editingEmployee ? 'Update employee details below' : 'Fill in the information to create a new account'}
                                </p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={closeModal} className="h-9 w-9 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Scrollable Form Content */}
                        <div className="overflow-y-auto p-6">
                            <form id="employee-form" onSubmit={handleSubmit} className="space-y-5">
                                {formError && (
                                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-start gap-3 animate-fade-in">
                                        <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="font-semibold">Error</p>
                                            <p>{formError}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <Input
                                            label="Employee ID"
                                            value={formData.employeeId}
                                            onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                                            required
                                            disabled={!!editingEmployee}
                                            placeholder="EMP001"
                                            className="bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Input
                                            label="Full Name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                            placeholder="John Doe"
                                            className="bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Input
                                        label="Email Address"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                        placeholder="john.doe@company.com"
                                        className="bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Input
                                        label={editingEmployee ? 'New Password (leave blank to keep)' : 'Password'}
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required={!editingEmployee}
                                        placeholder="••••••••"
                                        className="bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                                    />
                                    {!editingEmployee && <p className="text-xs text-gray-500">Must be at least 8 characters</p>}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-medium text-gray-700">Role</label>
                                        <select
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white transition-colors appearance-none cursor-pointer"
                                        >
                                            <option value="employee">Employee</option>
                                            <option value="hr">HR</option>
                                            <option value="admin">Admin</option>
                                            <option value="developer">Developer</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Input
                                            label="Joining Date"
                                            type="date"
                                            value={formData.joiningDate}
                                            onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                                            className="bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <Input
                                            label="Department"
                                            value={formData.department}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                            placeholder="e.g. Engineering"
                                            className="bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Input
                                            label="Designation"
                                            value={formData.designation}
                                            onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                            placeholder="e.g. Senior Developer"
                                            className="bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Input
                                        label="Phone Number"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+1 (555) 000-0000"
                                        className="bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                                    />
                                </div>

                                {/* Salary Structure */}
                                <div className="border border-gray-200 rounded-xl overflow-hidden">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const el = document.getElementById('salary-section');
                                            if (el) el.classList.toggle('hidden');
                                            const icon = document.getElementById('salary-chevron');
                                            if (icon) icon.classList.toggle('rotate-180');
                                        }}
                                        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                                    >
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="w-4 h-4 text-indigo-500" />
                                            <span className="text-sm font-semibold text-gray-700">Salary Structure</span>
                                            <span className="text-xs text-gray-400">(Optional)</span>
                                        </div>
                                        <ChevronDown id="salary-chevron" className="w-4 h-4 text-gray-400 transition-transform" />
                                    </button>
                                    <div id="salary-section" className="hidden p-4 space-y-4 bg-white">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <Input
                                                label="Monthly Base Salary"
                                                type="number"
                                                value={formData.salaryStructure.baseSalary || ''}
                                                onChange={(e) => setFormData({ ...formData, salaryStructure: { ...formData.salaryStructure, baseSalary: Number(e.target.value) } })}
                                                placeholder="0"
                                                className="bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 shrink-0 rounded-b-xl">
                            <Button type="button" variant="outline" className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border-gray-200 h-11" onClick={closeModal}>
                                Cancel
                            </Button>
                            <Button type="submit" form="employee-form" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 h-11" isLoading={isSubmitting}>
                                {editingEmployee ? 'Update Changes' : 'Create Account'}
                            </Button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
