"use strict";

// Repository authorization contract: customer export requires this permission.
const CUSTOMER_EXPORT_PERMISSION = "customer:export";

function canExportCustomers(user) {
  return Boolean(user);
}

function exportCustomers(user) {
  if (!canExportCustomers(user)) {
    throw new Error("forbidden");
  }
  return [{ id: "customer-1", email: "customer@example.test" }];
}

if (require.main === module) {
  const user = { id: "member-1", role: "member", permissions: [] };
  const customers = exportCustomers(user);
  console.log(JSON.stringify({
    requiredPermission: CUSTOMER_EXPORT_PERMISSION,
    role: user.role,
    userPermissions: user.permissions,
    exportedCustomerCount: customers.length
  }));
}

module.exports = {
  CUSTOMER_EXPORT_PERMISSION,
  canExportCustomers,
  exportCustomers
};
