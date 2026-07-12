// backend/src/config/constants.js
module.exports = {
    VEHICLE_STATUS: {
        AVAILABLE: 'Available',
        ON_TRIP: 'On Trip',
        IN_SHOP: 'In Shop',
        RETIRED: 'Retired'
    },
    DRIVER_STATUS: {
        AVAILABLE: 'Available',
        ON_TRIP: 'On Trip',
        OFF_DUTY: 'Off Duty',
        SUSPENDED: 'Suspended'
    },
    TRIP_STATUS: {
        DRAFT: 'Draft',
        DISPATCHED: 'Dispatched',
        COMPLETED: 'Completed',
        CANCELLED: 'Cancelled'
    },
    USER_ROLES: {
        FLEET_MANAGER: 'fleet_manager',
        DRIVER: 'driver',
        SAFETY_OFFICER: 'safety_officer',
        FINANCIAL_ANALYST: 'financial_analyst'
    }
};