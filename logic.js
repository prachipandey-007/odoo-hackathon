
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            background-image: url();
        }

        :root {
            --primary: #2563eb;
            --primary-dark: #1d4ed8;
            --success: #22c55e;
            --warning: #eab308;
            --danger: #ef4444;
            --gray-50: #f8fafc;
            --gray-100: #f1f5f9;
            --gray-200: #e2e8f0;
            --gray-300: #cbd5e1;
            --gray-600: #475569;
            --gray-700: #334155;
            --gray-900: #0f172a;
            --shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
            --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);
            --radius: 8px;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--gray-50);
            color: var(--gray-900);
            line-height: 1.6;
        }

        /* ===== Login Page ===== */
        .login-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
        }

        .login-box {
            background: white;
            padding: 40px;
            border-radius: var(--radius);
            box-shadow: var(--shadow-lg);
            width: 100%;
            max-width: 400px;
        }

        .login-box h1 {
            text-align: center;
            margin-bottom: 8px;
            color: var(--gray-900);
        }

        .login-box .subtitle {
            text-align: center;
            color: var(--gray-600);
            margin-bottom: 30px;
        }

        .form-group {
            margin-bottom: 20px;
        }

        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
            color: var(--gray-700);
        }

        .form-group input,
        .form-group select {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid var(--gray-200);
            border-radius: var(--radius);
            font-size: 14px;
            transition: border-color 0.2s;
        }

        .form-group input:focus,
        .form-group select:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: var(--radius);
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
        }

        .btn-primary {
            background: var(--primary);
            color: white;
            width: 100%;
        }

        .btn-primary:hover {
            background: var(--primary-dark);
        }

        .btn-success {
            background: var(--success);
            color: white;
        }

        .btn-success:hover {
            background: #16a34a;
        }

        .btn-danger {
            background: var(--danger);
            color: white;
        }

        .btn-danger:hover {
            background: #dc2626;
        }

        .btn-warning {
            background: var(--warning);
            color: white;
        }

        .btn-sm {
            padding: 5px 12px;
            font-size: 12px;
        }

        /* ===== Main App ===== */
        .app-container {
            display: none;
            min-height: 100vh;
        }

        /* Navbar */
        .navbar {
            background: white;
            padding: 0 24px;
            box-shadow: var(--shadow);
            display: flex;
            justify-content: space-between;
            align-items: center;
            height: 64px;
            position: sticky;
            top: 0;
            z-index: 100;
        }

        .navbar-brand {
            font-size: 20px;
            font-weight: 700;
            color: var(--primary);
        }

        .navbar-brand span {
            color: var(--gray-900);
        }

        .navbar-right {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .user-info {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .user-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: var(--primary);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 14px;
        }

        .logout-btn {
            background: none;
            border: none;
            color: var(--gray-600);
            cursor: pointer;
            padding: 8px;
            border-radius: var(--radius);
        }

        .logout-btn:hover {
            background: var(--gray-100);
        }

        /* Sidebar & Main Layout */
        .main-layout {
            display: flex;
            min-height: calc(100vh - 64px);
        }

        .sidebar {
            width: 250px;
            border-right: 1px solid var(--gray-200);
            padding: 20px 0;
            flex-shrink: 0;
        }

        .sidebar-item {
            padding: 12px 24px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 12px;
            color:#2563eb;
            transition: all 0.2s;
            border-left: 3px solid transparent;
        }

        .sidebar-item:hover {
            background: var(--gray-50);
            color: var(--gray-900);
        }

        .sidebar-item.active {
            background: var(--gray-50);
            color: var(--primary);
            border-left-color: var(--primary);
            font-weight: 800;
        }

        .sidebar-item .icon {
            font-size: 20px;
        }

        .content {
            flex: 1;
            padding: 24px;
            overflow-x: auto;
        }

        /* ===== Dashboard ===== */
        .kpi-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
        }

        .kpi-card {
            background: white;
            padding: 20px;
            border-radius: var(--radius);
            box-shadow: var(--shadow);
        }

        .kpi-card .label {
            font-size: 13px;
            color: var(--gray-600);
            margin-bottom: 4px;
        }

        .kpi-card .value {
            font-size: 28px;
            font-weight: 700;
        }

        .kpi-card .trend {
            font-size: 12px;
            margin-top: 4px;
        }

        .kpi-card .trend.up { color: var(--success); }
        .kpi-card .trend.down { color: var(--danger); }

        /* ===== Tables ===== */
        .table-container {
            background: white;
            border-radius: var(--radius);
            box-shadow: var(--shadow);
            overflow: hidden;
        }

        .table-header {
            padding: 16px 20px;
            border-bottom: 1px solid var(--gray-200);
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 12px;
        }

        .table-header h3 {
            font-size: 16px;
        }

        .table-actions {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
        }

        table th {
            text-align: left;
            padding: 12px 16px;
            background: var(--gray-50);
            font-weight: 600;
            color: var(--gray-700);
            border-bottom: 2px solid var(--gray-200);
        }

        table td {
            padding: 12px 16px;
            border-bottom: 1px solid var(--gray-100);
        }

        table tr:hover {
            background: var(--gray-50);
        }

        .status-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            display: inline-block;
        }

        .status-badge.available { background: #dcfce7; color: #166534; }
        .status-badge.on-trip { background: #dbeafe; color: #1e40af; }
        .status-badge.in-shop { background: #fef3c7; color: #92400e; }
        .status-badge.retired { background: #fee2e2; color: #991b1b; }
        .status-badge.draft { background: var(--gray-200); color: var(--gray-600); }
        .status-badge.dispatched { background: #dbeafe; color: #1e40af; }
        .status-badge.completed { background: #dcfce7; color: #166534; }
        .status-badge.cancelled { background: #fee2e2; color: #991b1b; }
        .status-badge.off-duty { background: var(--gray-200); color: var(--gray-600); }
        .status-badge.suspended { background: #fee2e2; color: #991b1b; }

        .actions-cell {
            display: flex;
            gap: 4px;
            flex-wrap: wrap;
        }

        /* ===== Modal ===== */
        .modal-overlay {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .modal-overlay.active {
            display: flex;
        }

        .modal {
            background: white;
            border-radius: var(--radius);
            max-width: 500px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: var(--shadow-lg);
        }

        .modal-header {
            padding: 16px 24px;
            border-bottom: 1px solid var(--gray-200);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .modal-header h3 {
            font-size: 18px;
        }

        .modal-close {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: var(--gray-600);
        }

        .modal-close:hover {
            color: var(--gray-900);
        }

        .modal-body {
            padding: 24px;
        }

        .modal-footer {
            padding: 16px 24px;
            border-top: 1px solid var(--gray-200);
            display: flex;
            justify-content: flex-end;
            gap: 8px;
        }

        /* ===== Alerts ===== */
        .alert {
            padding: 12px 16px;
            border-radius: var(--radius);
            margin-bottom: 16px;
            display: none;
        }

        .alert.show {
            display: block;
        }

        .alert-success {
            background: #dcfce7;
            color: #166534;
            border: 1px solid #86efac;
        }

        .alert-error {
            background: #fee2e2;
            color: #991b1b;
            border: 1px solid #fca5a5;
        }

        /* ===== Page sections ===== */
        .page-section {
            display: none;
        }

        .page-section.active {
            display: block;
        }

        /* ===== Responsive ===== */
        @media (max-width: 768px) {
            .sidebar {
                width: 60px;
                padding: 12px 0;
            }

            .sidebar-item span:not(.icon) {
                display: none;
            }

            .sidebar-item {
                padding: 12px;
                justify-content: center;
            }

            .kpi-grid {
                grid-template-columns: repeat(2, 1fr);
            }

            .table-header {
                flex-direction: column;
                align-items: stretch;
            }

            .modal {
                max-width: 100%;
                margin: 10px;
            }
        }

        @media (max-width: 480px) {
            .kpi-grid {
                grid-template-columns: 1fr;
            }

            .navbar {
                padding: 0 12px;
            }

            .content {
                padding: 12px;
            }
        }

        /* ===== Utility ===== */
        .hidden { display: none !important; }
        .mt-16 { margin-top: 16px; }
        .mb-16 { margin-bottom: 16px; }
        .text-center { text-align: center; }
        .gap-8 { gap: 8px; }
        .flex { display: flex; }
        .flex-wrap { flex-wrap: wrap; }
        .items-center { align-items: center; }
