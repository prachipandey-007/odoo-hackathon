// ================================================================
        // ===== JAVASCRIPT - COMPLETE APPLICATION LOGIC =====
        // ================================================================

        // ===== DATA STORE =====
        const DB = {
            get(key, defaultVal = []) {
                try {
                    const data = localStorage.getItem('transitops_' + key);
                    return data ? JSON.parse(data) : defaultVal;
                } catch { return defaultVal; }
            },
            set(key, data) {
                localStorage.setItem('transitops_' + key, JSON.stringify(data));
            }
        };

        // ===== STATE =====
        let currentUser = null;
        let currentPage = 'dashboard';

        // ===== AUTHENTICATION =====
        // Default users for demo
        const DEFAULT_USERS = [
            { email: 'service@git.com', password: 'service123', role: 'service', name: 'Admin User' }
        ];

        // Initialize users if not exists
        if (!localStorage.getItem('transitops_users')) {
            localStorage.setItem('transitops_users', JSON.stringify(DEFAULT_USERS));
        }

        // Login handler
        document.getElementById('loginForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value.trim();
            const role = document.getElementById('loginRole').value;

            const users = JSON.parse(localStorage.getItem('transitops_users'));
            const user = users.find(u => u.email === email && u.password === password && u.role === role);

            if (user) {
                currentUser = user;
                document.getElementById('loginPage').style.display = 'none';
                document.getElementById('appContainer').style.display = 'block';
                document.getElementById('userName').textContent = user.name;
                document.getElementById('userRole').textContent = user.role.replace('_', ' ').toUpperCase();
                document.getElementById('userAvatar').textContent = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
                // Show only allowed pages based on role
                updateSidebarForRole(role);
                navigateTo('dashboard');
                renderAll();
            } else {
                const errorEl = document.getElementById('loginError');
                errorEl.textContent = 'Invalid credentials. Please check email, password, and role.';
                errorEl.classList.add('show');
            }
        });

        function updateSidebarForRole(role) {
            const allItems = document.querySelectorAll('.sidebar-item');
            const rolePages = {
                'fleet_manager': ['dashboard', 'vehicles', 'drivers', 'trips', 'maintenance', 'reports'],
                'driver': ['dashboard', 'trips'],
                'safety_officer': ['dashboard', 'drivers', 'maintenance'],
                'financial_analyst': ['dashboard', 'reports']
            };
            const allowed = rolePages[role] || [];
            allItems.forEach(item => {
                const page = item.dataset.page;
                item.style.display = allowed.includes(page) ? 'flex' : 'none';
            });
        }

        function logout() {
            currentUser = null;
            document.getElementById('appContainer').style.display = 'none';
            document.getElementById('loginPage').style.display = 'flex';
            document.getElementById('loginForm').reset();
        }

        // ===== NAVIGATION =====
        function navigateTo(page) {
            currentPage = page;
            // Update sidebar
            document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
            document.querySelector(`.sidebar-item[data-page="${page}"]`)?.classList.add('active');
            // Update pages
            document.querySelectorAll('.page-section').forEach(el => el.classList.remove('active'));
            document.getElementById('page-' + page)?.classList.add('active');
            renderAll();
        }

        // ===== MODAL HELPERS =====
        function openModal(id) {
            document.getElementById(id).classList.add('active');
        }

        function closeModal(id) {
            document.getElementById(id).classList.remove('active');
        }

        // Close modal on overlay click
        document.querySelectorAll('.modal-overlay').forEach(el => {
            el.addEventListener('click', function(e) {
                if (e.target === this) this.classList.remove('active');
            });
        });

        // ===== ALERT SYSTEM =====
        function showAlert(message, type = 'success') {
            const el = document.getElementById('alertMessage');
            el.textContent = message;
            el.className = 'alert alert-' + type + ' show';
            setTimeout(() => el.classList.remove('show'), 4000);
        }

        // ===== CRUD: VEHICLES =====
        function getVehicles() { return DB.get('vehicles'); }

        function saveVehicles(data) { DB.set('vehicles', data); }

        function renderVehicles() {
            const vehicles = getVehicles();
            const tbody = document.getElementById('vehicleTableBody');
            if (vehicles.length === 0) {
                tbody.innerHTML =
                `<tr><td colspan="7" class="text-center" style="padding:40px;color:var(--gray-600);">No vehicles registered yet.</td></tr>`;
                return;
            }
            tbody.innerHTML = vehicles.map(v => `
                <tr>
                    <td><strong>${v.registrationNumber}</strong></td>
                    <td>${v.name} (${v.model})</td>
                    <td>${v.type}</td>
                    <td>${v.capacity}</td>
                    <td>${v.odometer || 0} km</td>
                    <td><span class="status-badge ${v.status.toLowerCase().replace(' ','-')}">${v.status}</span></td>
                    <td>
                        <div class="actions-cell">
                            <button class="btn btn-primary btn-sm" onclick="editVehicle('${v.id}')">✏️</button>
                            <button class="btn btn-danger btn-sm" onclick="deleteVehicle('${v.id}')">🗑️</button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }

        function editVehicle(id) {
            const vehicles = getVehicles();
            const v = vehicles.find(x => x.id === id);
            if (!v) return;
            document.getElementById('vehicleFormId').value = v.id;
            document.getElementById('vRegNumber').value = v.registrationNumber;
            document.getElementById('vName').value = v.name;
            document.getElementById('vModel').value = v.model;
            document.getElementById('vType').value = v.type;
            document.getElementById('vCapacity').value = v.capacity;
            document.getElementById('vOdometer').value = v.odometer || 0;
            document.getElementById('vCost').value = v.cost || 0;
            document.getElementById('vStatus').value = v.status;
            document.getElementById('vehicleModalTitle').textContent = 'Edit Vehicle';
            openModal('vehicleModal');
        }

        function deleteVehicle(id) {
            if (!confirm('Are you sure you want to delete this vehicle?')) return;
            let vehicles = getVehicles();
            vehicles = vehicles.filter(v => v.id !== id);
            saveVehicles(vehicles);
            renderVehicles();
            showAlert('Vehicle deleted successfully');
            renderAll();
        }

        function saveVehicle() {
            const id = document.getElementById('vehicleFormId').value;
            const data = {
                registrationNumber: document.getElementById('vRegNumber').value.trim(),
                name: document.getElementById('vName').value.trim(),
                model: document.getElementById('vModel').value.trim(),
                type: document.getElementById('vType').value,
                capacity: parseFloat(document.getElementById('vCapacity').value),
                odometer: parseFloat(document.getElementById('vOdometer').value) || 0,
                cost: parseFloat(document.getElementById('vCost').value) || 0,
                status: document.getElementById('vStatus').value
            };

            if (!data.registrationNumber || !data.name || !data.capacity) {
                showAlert('Please fill all required fields', 'error');
                return;
            }

            let vehicles = getVehicles();

            if (id) {
                // Edit
                const idx = vehicles.findIndex(v => v.id === id);
                if (idx !== -1) {
                    vehicles[idx] = { ...vehicles[idx], ...data };
                }
                showAlert('Vehicle updated successfully');
            } else {
                // Check unique registration
                if (vehicles.some(v => v.registrationNumber === data.registrationNumber)) {
                    showAlert('Registration number must be unique', 'error');
                    return;
                }
                data.id = 'v_' + Date.now();
                vehicles.push(data);
                showAlert('Vehicle added successfully');
            }

            saveVehicles(vehicles);
            closeModal('vehicleModal');
            document.getElementById('vehicleForm').reset();
            document.getElementById('vehicleFormId').value = '';
            document.getElementById('vehicleModalTitle').textContent = 'Add Vehicle';
            renderVehicles();
            renderAll();
        }

        // ===== CRUD: DRIVERS =====
        function getDrivers() { return DB.get('drivers'); }

        function saveDrivers(data) { DB.set('drivers', data); }

        function renderDrivers() {
            const drivers = getDrivers();
            const tbody = document.getElementById('driverTableBody');
            if (drivers.length === 0) {
                tbody.innerHTML =
                    `<tr><td colspan="7" class="text-center" style="padding:40px;color:var(--gray-600);">No drivers registered yet.</td></tr>`;
                return;
            }
            const now = new Date();
            tbody.innerHTML = drivers.map(d => {
                const expiry = new Date(d.expiry);
                const isExpired = expiry < now;
                return `
                <tr>
                    <td><strong>${d.name}</strong></td>
                    <td>${d.license}</td>
                    <td>${d.category}</td>
                    <td style="${isExpired ? 'color:var(--danger);font-weight:600;' : ''}">${d.expiry} ${isExpired ? '⚠️' : ''}</td>
                    <td>${d.safetyScore || 100}</td>
                    <td><span class="status-badge ${d.status.toLowerCase().replace(' ','-')}">${d.status}</span></td>
                    <td>
                        <div class="actions-cell">
                            <button class="btn btn-primary btn-sm" onclick="editDriver('${d.id}')">✏️</button>
                            <button class="btn btn-danger btn-sm" onclick="deleteDriver('${d.id}')">🗑️</button>
                        </div>
                    </td>
                </tr>
            `}).join('');
        }

        function editDriver(id) {
            const drivers = getDrivers();
            const d = drivers.find(x => x.id === id);
            if (!d) return;
            document.getElementById('driverFormId').value = d.id;
            document.getElementById('dName').value = d.name;
            document.getElementById('dLicense').value = d.license;
            document.getElementById('dCategory').value = d.category;
            document.getElementById('dExpiry').value = d.expiry;
            document.getElementById('dContact').value = d.contact || '';
            document.getElementById('dSafety').value = d.safetyScore || 100;
            document.getElementById('dStatus').value = d.status;
            document.getElementById('driverModalTitle').textContent = 'Edit Driver';
            openModal('driverModal');
        }

        function deleteDriver(id) {
            if (!confirm('Are you sure you want to delete this driver?')) return;
            let drivers = getDrivers();
            drivers = drivers.filter(d => d.id !== id);
            saveDrivers(drivers);
            renderDrivers();
            showAlert('Driver deleted successfully');
            renderAll();
        }

        function saveDriver() {
            const id = document.getElementById('driverFormId').value;
            const data = {
                name: document.getElementById('dName').value.trim(),
                license: document.getElementById('dLicense').value.trim(),
                category: document.getElementById('dCategory').value,
                expiry: document.getElementById('dExpiry').value,
                contact: document.getElementById('dContact').value.trim(),
                safetyScore: parseInt(document.getElementById('dSafety').value) || 100,
                status: document.getElementById('dStatus').value
            };

            if (!data.name || !data.license || !data.expiry) {
                showAlert('Please fill all required fields', 'error');
                return;
            }

            let drivers = getDrivers();

            if (id) {
                const idx = drivers.findIndex(d => d.id === id);
                if (idx !== -1) {
                    drivers[idx] = { ...drivers[idx], ...data };
                }
                showAlert('Driver updated successfully');
            } else {
                if (drivers.some(d => d.license === data.license)) {
                    showAlert('License number must be unique', 'error');
                    return;
                }
                data.id = 'd_' + Date.now();
                drivers.push(data);
                showAlert('Driver added successfully');
            }

            saveDrivers(drivers);
            closeModal('driverModal');
            document.getElementById('driverForm').reset();
            document.getElementById('driverFormId').value = '';
            document.getElementById('driverModalTitle').textContent = 'Add Driver';
            renderDrivers();
            renderAll();
        }

        // ===== CRUD: TRIPS =====
        function getTrips() { return DB.get('trips'); }

        function saveTrips(data) { DB.set('trips', data); }

        function getAvailableVehicles() {
            return getVehicles().filter(v => v.status === 'Available');
        }

        function getAvailableDrivers() {
            const now = new Date();
            return getDrivers().filter(d => {
                const expiry = new Date(d.expiry);
                return d.status === 'Available' && expiry >= now && d.status !== 'Suspended';
            });
        }

        function renderTrips() {
            const trips = getTrips();
            const vehicles = getVehicles();
            const drivers = getDrivers();
            const tbody = document.getElementById('tripTableBody');

            if (trips.length === 0) {
                tbody.innerHTML =
                    `<tr><td colspan="7" class="text-center" style="padding:40px;color:var(--gray-600);">No trips created yet.</td></tr>`;
                return;
            }

            tbody.innerHTML = trips.map(t => {
                const vehicle = vehicles.find(v => v.id === t.vehicleId);
                const driver = drivers.find(d => d.id === t.driverId);
                return `
                <tr>
                    <td>${vehicle ? vehicle.registrationNumber : 'Unknown'}</td>
                    <td>${driver ? driver.name : 'Unknown'}</td>
                    <td>${t.source} → ${t.destination}</td>
                    <td>${t.cargo}</td>
                    <td>${t.distance} km</td>
                    <td><span class="status-badge ${t.status.toLowerCase()}">${t.status}</span></td>
                    <td>
                        <div class="actions-cell">
                            ${t.status === 'Draft' ? `<button class="btn btn-success btn-sm" onclick="dispatchTrip('${t.id}')">🚀 Dispatch</button>` : ''}
                            ${t.status === 'Dispatched' ? `<button class="btn btn-success btn-sm" onclick="completeTrip('${t.id}')">✅ Complete</button>` : ''}
                            ${t.status === 'Draft' || t.status === 'Dispatched' ? `<button class="btn btn-warning btn-sm" onclick="cancelTrip('${t.id}')">❌ Cancel</button>` : ''}
                            <button class="btn btn-danger btn-sm" onclick="deleteTrip('${t.id}')">🗑️</button>
                        </div>
                    </td>
                </tr>
            `}).join('');
        }

        function populateTripSelects() {
            const vehicleSelect = document.getElementById('tVehicle');
            const driverSelect = document.getElementById('tDriver');

            const availVehicles = getAvailableVehicles();
            const availDrivers = getAvailableDrivers();

            vehicleSelect.innerHTML = '<option value="">-- Select Vehicle --</option>' +
                availVehicles.map(v => `<option value="${v.id}">${v.registrationNumber} - ${v.name} (${v.capacity}kg)</option>`)
                .join('');

            driverSelect.innerHTML = '<option value="">-- Select Driver --</option>' +
                availDrivers.map(d => `<option value="${d.id}">${d.name} - ${d.license}</option>`).join('');
        }

        function editTrip(id) {
            const trips = getTrips();
            const t = trips.find(x => x.id === id);
            if (!t) return;
            document.getElementById('tripFormId').value = t.id;
            document.getElementById('tVehicle').value = t.vehicleId;
            document.getElementById('tDriver').value = t.driverId;
            document.getElementById('tSource').value = t.source;
            document.getElementById('tDestination').value = t.destination;
            document.getElementById('tCargo').value = t.cargo;
            document.getElementById('tDistance').value = t.distance;
            document.getElementById('tStatus').value = t.status;
            document.getElementById('tripModalTitle').textContent = 'Edit Trip';
            populateTripSelects();
            openModal('tripModal');
        }

        function deleteTrip(id) {
            if (!confirm('Are you sure you want to delete this trip?')) return;
            let trips = getTrips();
            trips = trips.filter(t => t.id !== id);
            saveTrips(trips);
            renderTrips();
            showAlert('Trip deleted successfully');
            renderAll();
        }

        function dispatchTrip(id) {
            let trips = getTrips();
            const trip = trips.find(t => t.id === id);
            if (!trip) return;

            // Business rules: vehicle and driver must be available
            const vehicles = getVehicles();
            const drivers = getDrivers();
            const vehicle = vehicles.find(v => v.id === trip.vehicleId);
            const driver = drivers.find(d => d.id === trip.driverId);

            if (vehicle && vehicle.status !== 'Available') {
                showAlert('Vehicle is not available for dispatch', 'error');
                return;
            }
            if (driver && driver.status !== 'Available') {
                showAlert('Driver is not available for dispatch', 'error');
                return;
            }

            // Update trip status
            trip.status = 'Dispatched';
            trip.dispatchedAt = new Date().toISOString();

            // Update vehicle and driver status
            if (vehicle) {
                vehicle.status = 'On Trip';
                const vIdx = vehicles.findIndex(v => v.id === vehicle.id);
                if (vIdx !== -1) vehicles[vIdx] = vehicle;
                saveVehicles(vehicles);
            }
            if (driver) {
                driver.status = 'On Trip';
                const dIdx = drivers.findIndex(d => d.id === driver.id);
                if (dIdx !== -1) drivers[dIdx] = driver;
                saveDrivers(drivers);
            }

            saveTrips(trips);
            renderTrips();
            showAlert('Trip dispatched successfully! Vehicle and driver are now On Trip.');
            renderAll();
        }

        function completeTrip(id) {
            let trips = getTrips();
            const trip = trips.find(t => t.id === id);
            if (!trip) return;

            // Update trip
            trip.status = 'Completed';
            trip.completedAt = new Date().toISOString();

            // Restore vehicle and driver
            const vehicles = getVehicles();
            const drivers = getDrivers();
            const vehicle = vehicles.find(v => v.id === trip.vehicleId);
            const driver = drivers.find(d => d.id === trip.driverId);

            if (vehicle) {
                vehicle.status = 'Available';
                const vIdx = vehicles.findIndex(v => v.id === vehicle.id);
                if (vIdx !== -1) vehicles[vIdx] = vehicle;
                saveVehicles(vehicles);
            }
            if (driver) {
                driver.status = 'Available';
                const dIdx = drivers.findIndex(d => d.id === driver.id);
                if (dIdx !== -1) drivers[dIdx] = driver;
                saveDrivers(drivers);
            }

            saveTrips(trips);
            renderTrips();
            showAlert('Trip completed! Vehicle and driver are now Available.');
            renderAll();
        }

        function cancelTrip(id) {
            let trips = getTrips();
            const trip = trips.find(t => t.id === id);
            if (!trip) return;

            // Restore vehicle and driver if dispatched
            if (trip.status === 'Dispatched') {
                const vehicles = getVehicles();
                const drivers = getDrivers();
                const vehicle = vehicles.find(v => v.id === trip.vehicleId);
                const driver = drivers.find(d => d.id === trip.driverId);
                if (vehicle) {
                    vehicle.status = 'Available';
                    const vIdx = vehicles.findIndex(v => v.id === vehicle.id);
                    if (vIdx !== -1) vehicles[vIdx] = vehicle;
                    saveVehicles(vehicles);
                }
                if (driver) {
                    driver.status = 'Available';
                    const dIdx = drivers.findIndex(d => d.id === driver.id);
                    if (dIdx !== -1) drivers[dIdx] = driver;
                    saveDrivers(drivers);
                }
            }

            trip.status = 'Cancelled';
            saveTrips(trips);
            renderTrips();
            showAlert('Trip cancelled.');
            renderAll();
        }

        function saveTrip() {
            const id = document.getElementById('tripFormId').value;
            const vehicleId = document.getElementById('tVehicle').value;
            const driverId = document.getElementById('tDriver').value;
            const cargo = parseFloat(document.getElementById('tCargo').value);
            const distance = parseFloat(document.getElementById('tDistance').value);

            // Validate cargo weight against vehicle capacity
            const vehicles = getVehicles();
            const vehicle = vehicles.find(v => v.id === vehicleId);
            if (vehicle && cargo > vehicle.capacity) {
                showAlert(`Cargo weight (${cargo}kg) exceeds vehicle capacity (${vehicle.capacity}kg)`, 'error');
                return;
            }

            const data = {
                vehicleId,
                driverId,
                source: document.getElementById('tSource').value.trim(),
                destination: document.getElementById('tDestination').value.trim(),
                cargo,
                distance,
                status: document.getElementById('tStatus').value
            };

            if (!data.vehicleId || !data.driverId || !data.source || !data.destination || !data.cargo || !data.distance) {
                showAlert('Please fill all required fields', 'error');
                return;
            }

            let trips = getTrips();

            if (id) {
                const idx = trips.findIndex(t => t.id === id);
                if (idx !== -1) {
                    trips[idx] = { ...trips[idx], ...data };
                }
                showAlert('Trip updated successfully');
            } else {
                data.id = 't_' + Date.now();
                data.createdAt = new Date().toISOString();
                trips.push(data);
                showAlert('Trip created successfully');
            }

            saveTrips(trips);
            closeModal('tripModal');
            document.getElementById('tripForm').reset();
            document.getElementById('tripFormId').value = '';
            document.getElementById('tripModalTitle').textContent = 'Create Trip';
            renderTrips();
            renderAll();
        }

        // ===== CRUD: MAINTENANCE =====
        function getMaintenance() { return DB.get('maintenance'); }

        function saveMaintenance(data) { DB.set('maintenance', data); }

        function renderMaintenance() {
            const records = getMaintenance();
            const vehicles = getVehicles();
            const tbody = document.getElementById('maintenanceTableBody');

            if (records.length === 0) {
                tbody.innerHTML =
                    `<tr><td colspan="7" class="text-center" style="padding:40px;color:var(--gray-600);">No maintenance records yet.</td></tr>`;
                return;
            }

            tbody.innerHTML = records.map(r => {
                const vehicle = vehicles.find(v => v.id === r.vehicleId);
                return `
                <tr>
                    <td>${vehicle ? vehicle.registrationNumber : 'Unknown'}</td>
                    <td>${r.type}</td>
                    <td>${r.description || '-'}</td>
                    <td>$${r.cost}</td>
                    <td>${r.date}</td>
                    <td><span class="status-badge ${r.status.toLowerCase()}">${r.status}</span></td>
                    <td>
                        <div class="actions-cell">
                            ${r.status === 'Active' ? `<button class="btn btn-success btn-sm" onclick="closeMaintenance('${r.id}')">✅ Close</button>` : ''}
                            <button class="btn btn-danger btn-sm" onclick="deleteMaintenance('${r.id}')">🗑️</button>
                        </div>
                    </td>
                </tr>
            `}).join('');
        }

        function populateMaintenanceSelects() {
            const select = document.getElementById('mVehicle');
            const vehicles = getVehicles().filter(v => v.status !== 'Retired');
            select.innerHTML = '<option value="">-- Select Vehicle --</option>' +
                vehicles.map(v => `<option value="${v.id}">${v.registrationNumber} - ${v.name}</option>`).join('');
        }

        function deleteMaintenance(id) {
            if (!confirm('Are you sure you want to delete this maintenance record?')) return;
            let records = getMaintenance();
            const record = records.find(r => r.id === id);
            records = records.filter(r => r.id !== id);
            saveMaintenance(records);

            // If it was active, restore vehicle status
            if (record && record.status === 'Active') {
                const vehicles = getVehicles();
                const vehicle = vehicles.find(v => v.id === record.vehicleId);
                if (vehicle && vehicle.status === 'In Shop') {
                    vehicle.status = 'Available';
                    const idx = vehicles.findIndex(v => v.id === vehicle.id);
                    if (idx !== -1) vehicles[idx] = vehicle;
                    saveVehicles(vehicles);
                }
            }

            renderMaintenance();
            showAlert('Maintenance record deleted');
            renderAll();
        }

        function closeMaintenance(id) {
            let records = getMaintenance();
            const record = records.find(r => r.id === id);
            if (!record) return;

            record.status = 'Closed';
            saveMaintenance(records);

            // Restore vehicle to Available (unless retired)
            const vehicles = getVehicles();
            const vehicle = vehicles.find(v => v.id === record.vehicleId);
            if (vehicle && vehicle.status === 'In Shop' && vehicle.status !== 'Retired') {
                vehicle.status = 'Available';
                const idx = vehicles.findIndex(v => v.id === vehicle.id);
                if (idx !== -1) vehicles[idx] = vehicle;
                saveVehicles(vehicles);
            }

            renderMaintenance();
            showAlert('Maintenance closed. Vehicle is now Available.');
            renderAll();
        }

        function saveMaintenanceRecord() {
            const vehicleId = document.getElementById('mVehicle').value;
            const data = {
                vehicleId,
                type: document.getElementById('mType').value.trim(),
                description: document.getElementById('mDesc').value.trim(),
                cost: parseFloat(document.getElementById('mCost').value) || 0,
                date: document.getElementById('mDate').value,
                status: document.getElementById('mStatus').value
            };

            if (!data.vehicleId || !data.type || !data.cost || !data.date) {
                showAlert('Please fill all required fields', 'error');
                return;
            }

            let records = getMaintenance();
            data.id = 'm_' + Date.now();
            records.push(data);
            saveMaintenance(records);

            // If active, set vehicle to In Shop
            if (data.status === 'Active') {
                const vehicles = getVehicles();
                const vehicle = vehicles.find(v => v.id === data.vehicleId);
                if (vehicle && vehicle.status !== 'Retired') {
                    vehicle.status = 'In Shop';
                    const idx = vehicles.findIndex(v => v.id === vehicle.id);
                    if (idx !== -1) vehicles[idx] = vehicle;
                    saveVehicles(vehicles);
                    showAlert(`Vehicle ${vehicle.registrationNumber} is now In Shop`);
                }
            }

            closeModal('maintenanceModal');
            document.getElementById('maintenanceForm').reset();
            renderMaintenance();
            showAlert('Maintenance record created');
            renderAll();
        }

        // ===== DASHBOARD =====
        function renderDashboard() {
            const vehicles = getVehicles();
            const drivers = getDrivers();
            const trips = getTrips();

            const activeVehicles = vehicles.filter(v => v.status === 'On Trip').length;
            const availableVehicles = vehicles.filter(v => v.status === 'Available').length;
            const inShopVehicles = vehicles.filter(v => v.status === 'In Shop').length;
            const activeTrips = trips.filter(t => t.status === 'Dispatched').length;
            const pendingTrips = trips.filter(t => t.status === 'Draft').length;
            const driversOnDuty = drivers.filter(d => d.status === 'On Trip' || d.status === 'Available').length;
            const fleetUtilization = vehicles.length > 0 ? Math.round((activeVehicles / vehicles.length) * 100) : 0;

            document.getElementById('kpiGrid').innerHTML = `
                <div class="kpi-card">
                    <div class="label">🚗 Active Vehicles</div>
                    <div class="value">${activeVehicles}</div>
                    <div class="trend">${vehicles.length} total</div>
                </div>
                <div class="kpi-card">
                    <div class="label">✅ Available Vehicles</div>
                    <div class="value">${availableVehicles}</div>
                    <div class="trend">${vehicles.length} total</div>
                </div>
                <div class="kpi-card">
                    <div class="label">🔧 In Shop</div>
                    <div class="value">${inShopVehicles}</div>
                    <div class="trend">Under maintenance</div>
                </div>
                <div class="kpi-card">
                    <div class="label">📦 Active Trips</div>
                    <div class="value">${activeTrips}</div>
                    <div class="trend">${pendingTrips} pending</div>
                </div>
                <div class="kpi-card">
                    <div class="label">👨‍✈️ Drivers On Duty</div>
                    <div class="value">${driversOnDuty}</div>
                    <div class="trend">${drivers.length} total</div>
                </div>
                <div class="kpi-card">
                    <div class="label">📊 Fleet Utilization</div>
                    <div class="value">${fleetUtilization}%</div>
                    <div class="trend">${vehicles.length} vehicles</div>
                </div>
            `;

            // Fleet Status Chart
            const statuses = ['Available', 'On Trip', 'In Shop', 'Retired'];
            const counts = statuses.map(s => vehicles.filter(v => v.status === s).length);
            const maxCount = Math.max(...counts, 1);
            const colors = ['#22c55e', '#3b82f6', '#eab308', '#ef4444'];

            document.getElementById('fleetChart').innerHTML = statuses.map((s, i) => `
                <div style="flex:1;text-align:center;">
                    <div style="height:${(counts[i] / maxCount) * 150 + 20}px;display:flex;flex-direction:column;justify-content:flex-end;">
                        <div style="background:${colors[i]};border-radius:4px 4px 0 0;min-height:20px;height:${(counts[i] / maxCount) * 150}px;transition:height 0.3s;"></div>
                    </div>
                    <div style="font-size:12px;margin-top:4px;color:var(--gray-600);">${s}</div>
                    <div style="font-weight:600;">${counts[i]}</div>
                </div>
            `).join('');
        }

        // ===== REPORTS =====
        function renderReports() {
            const vehicles = getVehicles();
            const trips = getTrips();
            const maintenance = getMaintenance();

            // Fuel Efficiency (simulated)
            const completedTrips = trips.filter(t => t.status === 'Completed');
            const totalDistance = completedTrips.reduce((sum, t) => sum + (t.distance || 0), 0);
            const fuelEfficiency = completedTrips.length > 0 ? Math.round((totalDistance / completedTrips.length) * 1.2, 1) : 0;
            document.getElementById('fuelEfficiency').textContent = fuelEfficiency || '--';

            // Fleet Utilization
            const activeVehicles = vehicles.filter(v => v.status === 'On Trip').length;
            const utilization = vehicles.length > 0 ? Math.round((activeVehicles / vehicles.length) * 100) : 0;
            document.getElementById('fleetUtilizationReport').textContent = utilization + '%';

            // Operational Cost
            const totalMaintenanceCost = maintenance.reduce((sum, m) => sum + (m.cost || 0), 0);
            document.getElementById('operationalCost').textContent = '$' + totalMaintenanceCost.toLocaleString();

            // Vehicle ROI (simplified)
            const totalRevenue = completedTrips.length * 200; // simulated revenue per trip
            const totalCost = totalMaintenanceCost + (completedTrips.length * 50); // fuel estimate
            const totalAcquisition = vehicles.reduce((sum, v) => sum + (v.cost || 0), 0);
            const roi = totalAcquisition > 0 ? ((totalRevenue - totalCost) / totalAcquisition * 100) : 0;
            document.getElementById('vehicleROI').textContent = roi.toFixed(1) + '%';

            // Trip Activity Chart
            const statusCounts = ['Draft', 'Dispatched', 'Completed', 'Cancelled'].map(s =>
                trips.filter(t => t.status === s).length
            );
            const maxTripCount = Math.max(...statusCounts, 1);
            const chartColors = ['#94a3b8', '#3b82f6', '#22c55e', '#ef4444'];

            document.getElementById('tripActivityChart').innerHTML =
                ['Draft', 'Dispatched', 'Completed', 'Cancelled'].map((s, i) => `
                <div style="flex:1;text-align:center;">
                    <div style="height:${(statusCounts[i] / maxTripCount) * 120 + 20}px;display:flex;flex-direction:column;justify-content:flex-end;">
                        <div style="background:${chartColors[i]};border-radius:4px 4px 0 0;min-height:10px;height:${(statusCounts[i] / maxTripCount) * 120}px;transition:height 0.3s;"></div>
                    </div>
                    <div style="font-size:12px;margin-top:4px;color:var(--gray-600);">${s}</div>
                    <div style="font-weight:600;">${statusCounts[i]}</div>
                </div>
            `).join('');
        }

        // ===== RENDER ALL =====
        function renderAll() {
            renderDashboard();
            if (currentPage === 'vehicles') renderVehicles();
            if (currentPage === 'drivers') renderDrivers();
            if (currentPage === 'trips') {
                populateTripSelects();
                renderTrips();
            }
            if (currentPage === 'maintenance') {
                populateMaintenanceSelects();
                renderMaintenance();
            }
            if (currentPage === 'reports') renderReports();
        }

        // ===== INIT =====
        // Check if user is already logged in (session)
        // For simplicity, we start at login page

        // Pre-populate with demo data if empty
        function initDemoData() {
            if (!localStorage.getItem('transitops_vehicles')) {
                const demoVehicles = [
                    { id: 'v_1', registrationNumber: 'VAN-001', name: 'Mercedes Sprinter', model: '2024', type: 'Van',
                        capacity: 500, odometer: 15000, cost: 45000, status: 'Available' },
                    { id: 'v_2', registrationNumber: 'TRK-001', name: 'Volvo FH', model: '2023', type: 'Truck',
                        capacity: 2500, odometer: 45000, cost: 120000, status: 'On Trip' },
                    { id: 'v_3', registrationNumber: 'BUS-001', name: 'Mercedes Tourismo', model: '2024', type: 'Bus',
                        capacity: 3000, odometer: 8000, cost: 180000, status: 'In Shop' },
                ];
                DB.set('vehicles', demoVehicles);
            }

            if (!localStorage.getItem('transitops_drivers')) {
                const now = new Date();
                const future = new Date(now);
                future.setFullYear(future.getFullYear() + 2);
                const demoDrivers = [
                    { id: 'd_1', name: 'Alex Johnson', license: 'DL-2024-001', category: 'C', expiry: future.toISOString()
                            .split('T')[0], contact: '+1-555-0123', safetyScore: 95, status: 'Available' },
                    { id: 'd_2', name: 'Maria Garcia', license: 'DL-2024-002', category: 'D', expiry: future.toISOString()
                            .split('T')[0], contact: '+1-555-0456', safetyScore: 88, status: 'On Trip' },
                    { id: 'd_3', name: 'James Smith', license: 'DL-2024-003', category: 'C', expiry: future.toISOString()
                            .split('T')[0], contact: '+1-555-0789', safetyScore: 92, status: 'Available' },
                ];
                DB.set('drivers', demoDrivers);
            }

            if (!localStorage.getItem('transitops_trips')) {
                const demoDrivers = DB.get('drivers');
                const demoVehicles = DB.get('vehicles');
                const trips = [
                    { id: 't_1', vehicleId: demoVehicles[0]?.id, driverId: demoDrivers[0]?.id, source: 'Warehouse A',
                        destination: 'Retail Store B', cargo: 450, distance: 120, status: 'Completed',
                        createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
                    { id: 't_2', vehicleId: demoVehicles[1]?.id, driverId: demoDrivers[1]?.id, source: 'Depot C',
                        destination: 'Distribution Center D', cargo: 1800, distance: 250, status: 'Dispatched',
                        createdAt: new Date().toISOString() },
                    { id: 't_3', vehicleId: demoVehicles[0]?.id, driverId: demoDrivers[2]?.id, source: 'Store E',
                        destination: 'Warehouse F', cargo: 200, distance: 80, status: 'Draft',
                    createdAt: new Date().toISOString() },
                ];
                DB.set('trips', trips);
            }

            if (!localStorage.getItem('transitops_maintenance')) {
                const demoVehicles = DB.get('vehicles');
                const maintenance = [
                    { id: 'm_1', vehicleId: demoVehicles[2]?.id, type: 'Oil Change', description: 'Regular oil and filter',
                        cost: 150, date: new Date().toISOString().split('T')[0], status: 'Active' },
                ];
                DB.set('maintenance', maintenance);
            }
        }

        // Initialize demo data
        initDemoData();

        console.log('🚛 TransitOps loaded successfully!');
        console.log('📝 Default login: admin@transitops.com / admin123');
        console.log('👤 Roles: fleet_manager, driver, safety_officer, financial_analyst');
