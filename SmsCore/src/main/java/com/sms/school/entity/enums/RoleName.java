package com.sms.school.entity.enums;

/**
 * All roles in the system.
 * SUPER_ADMIN operates across all schools; all other roles are scoped to a single school.
 */
public enum RoleName {
    SUPER_ADMIN,      // Platform owner – can manage all schools
    SCHOOL_ADMIN,     // Per-school administrator
    TEACHER,          // Manages academic activities
    PARENT,           // Views child's info, pays fees
    ACCOUNTANT,       // Manages fees and payments
    LIBRARIAN,        // Manages books
    TRANSPORT_MANAGER, // Manages buses and routes
    SUPPORT_STAFF,    // General staff – access to all modules except fees & payment reconciliation
    STUDENT           // Logs in to view own academics
}
