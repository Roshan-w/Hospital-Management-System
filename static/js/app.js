const { createApp, ref, onMounted } = Vue;
const { createRouter, createWebHistory } = VueRouter;

// handles all my api requests with auth tokens automatically
const fetchApi = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    if (token) {
        options.headers = { ...options.headers, 'Authorization': `Bearer ${token}` };
    }
    const res = await fetch(url, options);

    // wipe storage and send them to login if the session is dead
    if (res.status === 401 || res.status === 422) {
        if (!url.includes('/login')) {
            localStorage.clear();
            alert("Session expired. Please log in again.");
            window.location.href = '/login';
            return;
        }
    }

    const contentType = res.headers.get("content-type");
    let data;
    if (contentType && contentType.includes("application/json")) {
        data = await res.json();
    } else {
        const text = await res.text();
        throw new Error(`Server returned non-JSON response: ${res.status} ${res.statusText}`);
    }

    if (!res.ok) throw new Error(data.message || 'Error occurred');
    return data;
};

// this is the main home page you see when you first visit
const Home = {
    template: `
    <div class="landing-page overflow-hidden" style="background: #fff;">
        <!-- Navigation -->
        <nav class="navbar navbar-expand-lg py-4 px-md-5 bg-transparent sticky-top mb-0">
            <div class="container-fluid">
                <a class="navbar-brand d-flex align-items-center" href="#">
                    <div class="theme-orb me-3" style="width:40px; height:40px; border-radius:12px; background: linear-gradient(135deg, #6366f1, #a855f7); box-shadow: 0 4px 12px rgba(99,102,241,0.3);"></div>
                    <span class="fw-bold fs-3 ls-tighter mb-0" style="color: #1e1b4b; letter-spacing:-1px;">HMS <span class="text-primary-gradient">V2.0</span></span>
                </a>
                <div class="ms-auto d-flex align-items-center gap-4 d-none d-md-flex">
                    <router-link to="/login" class="text-decoration-none fw-bold text-dark hover-translate">Sign In</router-link>
                    <router-link to="/register" class="btn btn-dark rounded-pill px-4 shadow-sm hover-grow py-2 fw-bold">Get Started</router-link>
                </div>
            </div>
        </nav>

        <!-- Hero Section -->
        <div class="hero-section position-relative py-5">
            <div class="container py-lg-5 px-md-5">
                <div class="row align-items-center g-5">
                    <div class="col-lg-6 text-start">
                        <div class="badge rounded-pill px-3 py-2 mb-4 shadow-sm" style="background:#f1f5f9; color:#4f46e5; font-weight:700; border: 1px solid #e2e8f0; letter-spacing: 0.5px;">SMART HEALTHCARE PLATFORM</div>
                        <h1 class="display-3 fw-bold ls-tight mb-4" style="color: #1e1b4b; line-height: 1.1;">
                            Digital Care, <br>
                            <span style="background: linear-gradient(135deg, #4f46e5, #9333ea); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Smarter Outcomes.</span>
                        </h1>
                        <p class="lead text-secondary mb-5 pe-lg-5" style="font-size: 1.25rem;">
                            A unified ecosystem connecting doctors, patients, and administrators. Experience the future of medical management with automated scheduling and secure patient records.
                        </p>
                        <div class="d-flex flex-wrap gap-3">
                            <router-link to="/login" class="btn btn-primary-lg shadow-lg hover-scale">
                                <i class="bi bi-person-heart me-2"></i>Patient Gateway
                            </router-link>
                            <router-link to="/login" class="btn btn-outline-dark-lg hover-scale">
                                <i class="bi bi-shield-lock me-2"></i>Staff Portal
                            </router-link>
                        </div>
                        <div class="mt-5 d-flex align-items-center gap-4 text-muted small fw-bold">
                            <span><i class="bi bi-check-circle-fill text-success me-2"></i>SECURE DATA</span>
                            <span><i class="bi bi-check-circle-fill text-success me-2"></i>LIVE SYNC</span>
                            <span><i class="bi bi-clock-history text-success me-2"></i>24/7 ACCESS</span>
                        </div>
                    </div>
                    <div class="col-lg-6 position-relative text-center">
                        <div class="illustration-container d-flex align-items-center justify-content-center" style="min-height: 500px;">
                            <!-- Stylized Medical Plus -->
                            <div class="medical-plus-wrapper illustration-floating">
                                <svg width="280" height="280" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 20px 40px rgba(79,70,229,0.25));">
                                    <rect x="35" y="0" width="30" height="100" rx="15" fill="url(#plus-grad)" />
                                    <rect x="0" y="35" width="100" height="30" rx="15" fill="url(#plus-grad)" />
                                    <defs>
                                        <linearGradient id="plus-grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                                            <stop stop-color="#4f46e5" />
                                            <stop offset="1" stop-color="#9333ea" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <div class="plus-glow"></div>
                            </div>
                        </div>
                        <!-- Decorative Orbs -->
                        <div class="position-absolute z-n1" style="top:10%; right:10%; width:100px; height:100px; background:rgba(99,102,241,0.05); border-radius:50%; filter:blur(30px);"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Role Access Cards -->
        <div class="container py-5 px-md-5 mb-5">
            <h4 class="fw-bold text-center mb-5" style="color: #1e1b4b;">Specialized Access Ports</h4>
            <div class="row g-4">
                <div class="col-md-4">
                    <div class="portal-card h-100" style="--portal-color: #6366f1;">
                        <div class="portal-icon"><i class="bi bi-grid-1x2-fill"></i></div>
                        <h4>Administrators</h4>
                        <p>Centralized control over departments, staff credentials, and analytics dashboards.</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="portal-card h-100" style="--portal-color: #0ea5e9;">
                        <div class="portal-icon"><i class="bi bi-heart-pulse-fill"></i></div>
                        <h4>Medical Staff</h4>
                        <p>Streamlined patient history management, live availability tracking, and digital Rx issuance.</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="portal-card h-100 shadow-highlight" style="--portal-color: #10b981;">
                        <div class="portal-icon"><i class="bi bi-person-check-fill"></i></div>
                        <h4>Patients</h4>
                        <p>Instant slot booking, downloadable formal prescriptions, and private medical repositories.</p>
                    </div>
                </div>
            </div>
        </div>

        <style>
            .btn-primary-lg { background: linear-gradient(135deg, #4f46e5, #9333ea); color: white; border: none; padding: 18px 40px; border-radius: 50px; font-weight: 700; transition: all 0.3s; }
            .btn-outline-dark-lg { border: 2.3px solid #1e1b4b; background: transparent; color: #1e1b4b; padding: 18px 40px; border-radius: 50px; font-weight: 700; transition: all 0.3s; }
            .btn-primary-lg:hover, .btn-outline-dark-lg:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(0,0,0,0.1); }
            .medical-plus-wrapper { position: relative; z-index: 2; }
            .plus-glow { 
                position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                width: 250px; height: 250px; background: radial-gradient(circle, rgba(79,70,229,0.2) 0%, transparent 70%); 
                z-index: -1; animation: glow-pulse 4s ease-in-out infinite; 
            }
            @keyframes glow-pulse { 0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); } 50% { opacity: 1; transform: translate(-50%, -50%) scale(1.3); } }
            .portal-card { background: #fff; border: 1px solid #f1f5f9; padding: 45px 35px; border-radius: 35px; position: relative; }
            .portal-card:hover { border-color: var(--portal-color); }
            .portal-icon { font-size: 2.8rem; color: var(--portal-color); margin-bottom: 25px; }
            .portal-card h4 { font-weight: 800; color: #1e1b4b; margin-bottom: 18px; font-size: 1.4rem; }
            .portal-card p { color: #64748b; font-size: 0.95rem; line-height: 1.6; font-weight: 400; }
            .shadow-highlight { border: 2px solid #10b981 !important; box-shadow: 0 0 50px rgba(16,185,129,0.08) !important; }
            .text-primary-gradient { background: linear-gradient(135deg, #4f46e5, #9333ea); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
            .hover-translate:hover { transform: translateX(5px); color: #4f46e5 !important; }
            .illustration-floating { animation: float 6s ease-in-out infinite; }
            @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-30px); } 100% { transform: translateY(0px); } }
            .ls-tight { letter-spacing: -2px; }
            .ls-tighter { letter-spacing: -1.5px; }
        </style>
    </div>`
};

// login screen logic for everyone
const Login = {
    setup() {
        const username = ref('');
        const password = ref('');
        const error = ref('');
        const router = VueRouter.useRouter();
        const login = async () => {
            try {
                const res = await fetchApi('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: username.value, password: password.value })
                });
                localStorage.setItem('token', res.access_token);
                localStorage.setItem('role', res.role);
                if (res.role === 'Admin') router.push('/admin');
                else if (res.role === 'Doctor') router.push('/doctor');
                else router.push('/patient');
            } catch (err) { error.value = err.message; }
        };
        return { username, password, login, error };
    },
    template: `
    <div class="container d-flex align-items-center justify-content-center min-vh-100">
        <div class="card p-4 shadow-lg border-0" style="max-width: 450px; width:100%; border-radius: 24px;">
            <div class="text-center mb-5">
                <div class="bg-primary d-inline-block p-3 rounded-circle mb-3 shadow">
                    <i class="bi bi-shield-lock text-white fs-2"></i>
                </div>
                <h3 class="fw-bold">Welcome Back</h3>
                <p class="text-muted small">Sign in to access your healthcare portal</p>
            </div>
            <div v-if="error" class="alert alert-danger rounded-3 small">{{ error }}</div>
            <form @submit.prevent="login">
                <div class="mb-3">
                    <label class="form-label fw-bold small text-secondary">Username</label>
                    <div class="input-group">
                        <span class="input-group-text bg-light border-0"><i class="bi bi-person"></i></span>
                        <input v-model="username" class="form-control bg-light border-0" placeholder="Enter username" required />
                    </div>
                </div>
                <div class="mb-4">
                    <label class="form-label fw-bold small text-secondary">Password</label>
                    <div class="input-group">
                        <span class="input-group-text bg-light border-0"><i class="bi bi-key"></i></span>
                        <input type="password" v-model="password" class="form-control bg-light border-0" placeholder="••••••••" required />
                    </div>
                </div>
                <button type="submit" class="btn btn-primary w-100 shadow py-2 fw-bold">Login to Dashboard</button>
                <div class="mt-4 text-center">
                    <span class="text-muted small">New patient? </span>
                    <router-link to="/register" class="small fw-bold text-decoration-none" style="color:var(--admin-theme);">Create Account</router-link>
                </div>
            </form>
        </div>
    </div>`
};

// where new patients register their accounts
const Register = {
    setup() {
        const username = ref('');
        const registerForm = ref({ username: '', email: '', password: '', contact_number: '' });
        const msg = ref('');
        const router = VueRouter.useRouter();
        const register = async () => {
            try {
                if (registerForm.value.contact_number.length !== 10) throw new Error('Phone must be 10 digits');
                await fetchApi('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(registerForm.value)
                });
                msg.value = "Registration successful. Please login.";
                setTimeout(() => router.push('/login'), 2000);
            } catch (err) { msg.value = err.message; }
        };
        return { registerForm, register, msg };
    },
    template: `
    <div class="container d-flex align-items-center justify-content-center min-vh-100">
        <div class="card p-4 shadow-lg border-0" style="max-width: 450px; width:100%; border-radius: 24px;">
            <div class="text-center mb-5">
                <div class="bg-success d-inline-block p-3 rounded-circle mb-3 shadow">
                    <i class="bi bi-person-plus text-white fs-2"></i>
                </div>
                <h3 class="fw-bold">Patient Registration</h3>
                <p class="text-muted small">Join our smart healthcare platform</p>
            </div>
            <div v-if="msg" class="alert" :class="msg.includes('success') ? 'alert-success':'alert-danger'">{{ msg }}</div>
            <form @submit.prevent="register">
                <div class="mb-3">
                    <label class="form-label fw-bold small text-secondary">User Name</label>
                    <input v-model="registerForm.username" class="form-control bg-light border-0 shadow-none" placeholder="User Name" required />
                </div>
                <div class="mb-3">
                    <label class="form-label fw-bold small text-secondary">Email Address</label>
                    <input type="email" v-model="registerForm.email" class="form-control bg-light border-0 shadow-none" placeholder="email@example.com" required />
                </div>
                <div class="mb-3">
                    <label class="form-label fw-bold small text-secondary">Contact Number</label>
                    <input type="tel" v-model="registerForm.contact_number" pattern="[0-9]{10}" maxlength="10" class="form-control bg-light border-0 shadow-none" placeholder="10-digit number" required />
                </div>
                <div class="mb-4">
                    <label class="form-label fw-bold small text-secondary">Create Password</label>
                    <input type="password" v-model="registerForm.password" class="form-control bg-light border-0 shadow-none" placeholder="••••••••" required />
                </div>
                <button type="submit" class="btn btn-primary btn-success w-100 shadow border-0 py-2 fw-bold" style="background:var(--patient-theme);">Create Profile</button>
                <div class="mt-4 text-center">
                    <span class="text-muted small">Already a patient? </span>
                    <router-link to="/login" class="small fw-bold text-decoration-none" style="color:var(--admin-theme);">Login here</router-link>
                </div>
            </form>
        </div>
    </div>`
};

// --- ADMIN DASHBOARD ---
const AdminDashboard = {
    setup() {
        const stats = ref({});
        const currentTab = ref('dashboard');
        const doctors = ref([]);
        const patients = ref([]);
        const appointments = ref([]);
        const departments = ref([]);
        const docForm = ref({ id: null, username: '', email: '', password: '', specialization: '', department_id: '', experience_years: 0 });
        const patForm = ref({ id: null, username: '', email: '', contact_number: '', dob: '', blood_group: '' });
        const deptForm = ref({ name: '', description: '' });
        const patientHistory = ref([]);
        const showHistoryModal = ref(false);
        const activePatient = ref(null);
        const showDocModal = ref(false);
        const showPatModal = ref(false);
        const showDeptModal = ref(false);
        const router = VueRouter.useRouter();

        const loadDashboard = async () => { try { stats.value = await fetchApi('/api/admin/dashboard'); } catch { router.push('/login'); } };
        const loadDoctors = async () => { doctors.value = await fetchApi('/api/admin/doctors'); };
        const loadPatients = async () => { patients.value = await fetchApi('/api/admin/patients'); };
        const loadAppointments = async () => { appointments.value = await fetchApi('/api/admin/appointments'); };
        const loadDepartments = async () => { departments.value = await fetchApi('/api/departments'); };

        onMounted(() => { loadDashboard(); loadDoctors(); loadPatients(); loadAppointments(); loadDepartments(); });

        const logout = () => { localStorage.clear(); router.push('/'); };
        const switchTab = (tab) => { currentTab.value = tab; };

        const doctorSearchQuery = ref('');
        const patientSearchQuery = ref('');
        const quickSearchResults = ref({ doctors: [], patients: [] });

        const searchAdminDoctors = async (redirect = true) => {
            // Ensure redirect is boolean (avoids event objects triggering true)
            const shouldRedirect = redirect === true;
            const results = await fetchApi('/api/admin/doctors?q=' + encodeURIComponent(doctorSearchQuery.value));
            doctors.value = results;
            quickSearchResults.value.doctors = results.slice(0, 5);
            if (shouldRedirect) currentTab.value = 'doctors';
        };

        const searchAdminPatients = async (redirect = true) => {
            const shouldRedirect = redirect === true;
            const results = await fetchApi('/api/admin/patients?q=' + encodeURIComponent(patientSearchQuery.value));
            patients.value = results;
            quickSearchResults.value.patients = results.slice(0, 5);
            if (shouldRedirect) currentTab.value = 'patients';
        };

        const clearQuickResults = () => {
            setTimeout(() => { quickSearchResults.value = { doctors: [], patients: [] }; }, 200);
        };

        const saveDoctor = async () => {
            if (docForm.value.id) {
                await fetchApi(`/api/admin/doctors/${docForm.value.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(docForm.value) });
            } else {
                await fetchApi('/api/admin/doctors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(docForm.value) });
            }
            showDocModal.value = false;
            loadDoctors(); loadDashboard();
        };

        const toggleDoctorStatus = async (doc) => {
            await fetchApi(`/api/admin/doctors/${doc.id}`, { method: doc.active ? 'DELETE' : 'PUT', headers: { 'Content-Type': 'application/json' }, body: doc.active ? null : JSON.stringify({ active: true }) });
            loadDoctors();
        };

        const openDocForm = (doc = null) => {
            if (doc) {
                const d = departments.value.find(dp => dp.name === doc.department);
                docForm.value = { id: doc.id, username: doc.name, email: doc.email, specialization: doc.specialization, department_id: d ? d.id : '', experience_years: doc.experience_years || 0 };
            } else {
                docForm.value = { id: null, username: '', email: '', password: '', specialization: '', department_id: '', experience_years: '' };
            }
            showDocModal.value = true;
        };

        const savePatient = async () => {
            if (patForm.value.contact_number.length !== 10) { alert('Phone must be 10 digits'); return; }
            await fetchApi(`/api/admin/patients/${patForm.value.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patForm.value) });
            showPatModal.value = false; loadPatients();
        };

        const togglePatientStatus = async (pat) => {
            await fetchApi(`/api/admin/patients/${pat.id}`, { method: pat.active ? 'DELETE' : 'PUT', headers: { 'Content-Type': 'application/json' }, body: pat.active ? null : JSON.stringify({ active: true }) });
            loadPatients();
        };

        const openPatForm = (pat) => { patForm.value = { id: pat.id, contact_number: pat.contact_number || '', email: pat.email || '', dob: pat.dob || '', blood_group: pat.blood_group || '' }; showPatModal.value = true; };

        const saveDepartment = async () => {
            await fetchApi('/api/admin/departments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(deptForm.value) });
            showDeptModal.value = false; deptForm.value = { name: '', description: '' }; loadDepartments();
        };

        const deleteDepartment = async (id) => {
            if (!confirm('Are you sure? This will remove the department.')) return;
            await fetchApi(`/api/admin/departments/${id}`, { method: 'DELETE' });
            loadDepartments();
        };

        const viewPatientHistory = async (p) => {
            activePatient.value = p;
            patientHistory.value = await fetchApi(`/api/admin/patient/${p.id}/history`);
            showHistoryModal.value = true;
        };

        return {
            stats, currentTab, doctors, patients, appointments, departments, patientHistory, showHistoryModal, activePatient, switchTab,
            docForm, patForm, deptForm, saveDoctor, toggleDoctorStatus, openDocForm, savePatient, togglePatientStatus, openPatForm,
            saveDepartment, deleteDepartment, viewPatientHistory, showDocModal, showPatModal, showDeptModal, logout,
            doctorSearchQuery, searchAdminDoctors, patientSearchQuery, searchAdminPatients, quickSearchResults, clearQuickResults
        };
    },
    template: `
    <div class="container-fluid py-4 px-md-5">
        <div class="d-flex flex-wrap justify-content-between align-items-center mb-5 p-4 bg-white shadow-sm rounded-4">
            <div>
                <h2 class="fw-bold mb-0 text-indigo"><i class="bi bi-grid-fill me-2"></i>Admin Dashboard</h2>
                <small class="text-muted">Enterprise Healthcare Control Panel</small>
            </div>
            <div class="nav nav-pills gap-2 mt-3 mt-md-0">
                <button @click="switchTab('dashboard')" class="btn px-4 py-2 rounded-pill" :class="currentTab==='dashboard'?'btn-primary shadow':'btn-light text-muted'">Overview</button>
                <button @click="switchTab('doctors')" class="btn px-4 py-2 rounded-pill" :class="currentTab==='doctors'?'btn-primary shadow':'btn-light text-muted'">Doctors</button>
                <button @click="switchTab('patients')" class="btn px-4 py-2 rounded-pill" :class="currentTab==='patients'?'btn-primary shadow':'btn-light text-muted'">Patients</button>
                <button @click="switchTab('departments')" class="btn px-4 py-2 rounded-pill" :class="currentTab==='departments'?'btn-primary shadow':'btn-light text-muted'">Departments</button>
                <button @click="logout" class="btn btn-outline-danger px-4 py-2 rounded-pill">Logout</button>
            </div>
        </div>

        <div v-if="currentTab === 'dashboard'">
            <div class="row g-4 mb-5">
                <div class="col-md-3">
                    <div class="card p-4 text-center h-100 border-0 shadow-sm">
                        <div class="text-indigo mb-2"><i class="bi bi-people-fill fs-1"></i></div>
                        <h2 class="fw-bold mb-0 text-dark">{{ stats.total_doctors || 0 }}</h2>
                        <div class="text-muted small fw-bold">TOTAL DOCTORS</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card p-4 text-center h-100 border-0 shadow-sm" style="border-bottom: 4px solid var(--patient-theme) !important;">
                        <div class="text-success mb-2"><i class="bi bi-person-heart fs-1"></i></div>
                        <h2 class="fw-bold mb-0 text-dark">{{ stats.total_patients || 0 }}</h2>
                        <div class="text-muted small fw-bold">ACTIVE PATIENTS</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card p-4 text-center h-100 border-0 shadow-sm">
                        <div class="text-warning mb-2"><i class="bi bi-calendar-check-fill fs-1"></i></div>
                        <h2 class="fw-bold mb-0 text-dark">{{ stats.total_appointments || 0 }}</h2>
                        <div class="text-muted small fw-bold">TOTAL BOOKINGS</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card p-4 text-center h-100 border-0 shadow-sm">
                        <div class="text-danger mb-2"><i class="bi bi-clipboard-pulse fs-1"></i></div>
                        <h2 class="fw-bold mb-0 text-dark">{{ departments.length }}</h2>
                        <div class="text-muted small fw-bold">DEPARTMENTS</div>
                    </div>
                </div>
            </div>

            <div class="card shadow-sm border-0 p-4">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h4 class="fw-bold mb-0"><i class="bi bi-clock-history me-2"></i>Day Overview</h4>
                    <span class="badge bg-light text-dark border p-2 px-3 fw-normal"> Live Records</span>
                </div>
                <table class="table table-hover align-middle">
                    <thead class="bg-light">
                        <tr><th>Date</th><th>Time</th><th>Patient</th><th>Doctor</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                        <tr v-for="a in appointments" :key="a.id">
                            <td class="small fw-bold">{{ a.date }}</td>
                            <td><i class="bi bi-clock me-1 text-muted"></i>{{ a.start_time.substring(0,5) }}</td>
                            <td><img src="https://ui-avatars.com/api/?name=P&background=f1f5f9&color=64748b" class="rounded-circle me-2" width="24">{{ a.patient_name }}</td>
                            <td class="fw-bold text-indigo">Dr. {{ a.doctor_name }}</td>
                            <td><span class="badge rounded-pill" :class="a.status==='Booked'?'bg-primary':'bg-secondary'">{{ a.status }}</span></td>
                        </tr>
                        <tr v-if="appointments.length === 0"><td colspan="5" class="text-center text-muted p-5">No appointments listed today.</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div v-if="currentTab === 'doctors'">
            <div class="d-flex flex-wrap justify-content-between align-items-center mb-4">
                <h3 class="fw-bold mb-0">Doctor's Registry</h3>
                <div class="d-flex gap-2 mt-3 mt-md-0">
                    <div class="input-group" style="width:300px;">
                        <input v-model="doctorSearchQuery" @input="searchAdminDoctors(false)" placeholder="Search name/specialty..." class="form-control border-0 bg-white">
                        <span class="input-group-text bg-white border-0"><i class="bi bi-search"></i></span>
                    </div>
                    <button @click="openDocForm()" class="btn btn-primary px-4"><i class="bi bi-plus-lg me-1"></i>Add Doctor</button>
                </div>
            </div>
            <div class="card border-0 shadow-sm overflow-hidden">
                <table class="table table-hover mb-0">
                    <thead class="table-light">
                        <tr><th>Doctor</th><th>Specialization</th><th>Dept</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        <tr v-for="doc in doctors" :key="doc.id">
                            <td class="fw-bold text-indigo"><i class="bi bi-person-vcard me-2"></i>Dr. {{ doc.name }}</td>
                            <td>{{ doc.specialization }}</td>
                            <td><span class="badge bg-soft-info text-info border border-info px-3 py-1" style="background:rgba(14,165,233,0.1);">{{ doc.department }}</span></td>
                            <td><span class="badge rounded-pill" :class="doc.active?'bg-success':'bg-danger'">{{ doc.active?'Active':'Inactive' }}</span></td>
                            <td>
                                <div class="d-flex gap-3">
                                    <button @click="openDocForm(doc)" class="btn btn-sm btn-outline-primary px-3 rounded-pill">Edit</button>
                                    <button @click="toggleDoctorStatus(doc)" class="btn btn-sm px-3 rounded-pill" :class="doc.active?'btn-outline-danger':'btn-outline-success'">{{ doc.active?'Suspend':'Activate' }}</button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div v-if="currentTab === 'patients'">
            <div class="d-flex flex-wrap justify-content-between align-items-center mb-4">
                <h3 class="fw-bold mb-0">Patient Directory</h3>
                <input v-model="patientSearchQuery" @input="searchAdminPatients(false)" placeholder="Quick search ID, Name or Contact..." class="form-control bg-white shadow-sm border-0" style="width:350px;">
            </div>
            <div class="card border-0 shadow-sm overflow-hidden">
                <table class="table table-hover mb-0">
                    <thead class="table-light">
                        <tr><th>ID</th><th>Basic Details</th><th>Contact</th><th>Account Status</th><th>History</th></tr>
                    </thead>
                    <tbody>
                        <tr v-for="p in patients" :key="p.id">
                            <td><span class="text-muted small">#{{ 1000 + p.id }}</span></td>
                            <td>
                                <div class="fw-bold">{{ p.name }}</div>
                                <div class="text-muted small">{{ p.email }}</div>
                            </td>
                            <td><i class="bi bi-telephone-fill me-1 small text-muted"></i>{{ p.contact_number }}</td>
                            <td><span class="badge rounded-pill" :class="p.active?'bg-success':'bg-danger'">{{ p.active?'Active':'Inactive' }}</span></td>
                            <td>
                                <div class="d-flex gap-3">
                                    <button @click="openPatForm(p)" class="btn btn-sm btn-outline-primary px-3 rounded-pill">Edit</button>
                                    <button @click="viewPatientHistory(p)" class="btn btn-sm btn-outline-secondary px-3 rounded-pill">Records</button>
                                    <button @click="togglePatientStatus(p)" class="btn btn-sm px-3 rounded-pill" :class="p.active?'btn-outline-danger':'btn-outline-success'">{{ p.active ? 'Blacklist' : 'Restore' }}</button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div v-if="currentTab === 'departments'">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h3 class="fw-bold mb-0">Specialized Units</h3>
                <button @click="showDeptModal = true" class="btn btn-primary px-4"><i class="bi bi-plus-lg me-1"></i>New Unit</button>
            </div>
            <div class="row g-4">
                <div v-for="dept in departments" :key="dept.id" class="col-md-4">
                    <div class="card border-0 shadow-sm p-4 h-100 position-relative">
                        <div class="text-end position-absolute top-0 end-0 p-3">
                            <button @click="deleteDepartment(dept.id)" class="btn btn-sm btn-link text-danger p-0"><i class="bi bi-trash3 fs-5"></i></button>
                        </div>
                        <h5 class="fw-bold text-indigo"><i class="bi bi-hospital fs-4 me-2"></i>{{ dept.name }}</h5>
                        <p class="text-muted small mb-0">{{ dept.description }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Admin Modals (Refined) -->
        <!-- Doctor Modal -->
        <div v-if="showDocModal" class="modal d-block" style="background: rgba(30,41,59,0.5); z-index: 1050;">
            <div class="modal-dialog modal-lg"><div class="modal-content p-4">
                <form @submit.prevent="saveDoctor">
                    <div class="modal-header border-0"><h4 class="fw-bold">{{ docForm.id ? 'Modify Doctor Info':'Onboard New Doctor' }}</h4><button type="button" class="btn-close" @click="showDocModal = false"></button></div>
                    <div class="modal-body py-4">
                        <div class="row g-3">
                            <div class="col-md-6"><label class="form-label small fw-bold">User Name</label><input v-model="docForm.username" class="form-control" placeholder="Dr. Name" required></div>
                            <div class="col-md-6"><label class="form-label small fw-bold">Email</label><input v-model="docForm.email" type="email" class="form-control" required></div>
                            <div v-if="!docForm.id" class="col-md-6"><label class="form-label small fw-bold">Password</label><input v-model="docForm.password" class="form-control" type="password" required></div>
                            <div class="col-md-6"><label class="form-label small fw-bold">Specialization</label><input v-model="docForm.specialization" class="form-control" required></div>
                            <div class="col-md-6"><label class="form-label small fw-bold">Hospital Unit</label><select v-model="docForm.department_id" class="form-select" required><option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option></select></div>
                        </div>
                    </div>
                    <div class="modal-footer border-0 pt-0"><button type="submit" class="btn btn-primary px-5 rounded-pill shadow">Save Credentials</button></div>
                </form>
            </div></div>
        </div>

        <!-- Patient Modal -->
        <div v-if="showPatModal" class="modal d-block" style="background: rgba(30,41,59,0.5)">
            <div class="modal-dialog modal-lg"><div class="modal-content p-4">
                <form @submit.prevent="savePatient">
                    <div class="modal-header border-0"><h4 class="fw-bold">Update Patient Record</h4><button type="button" class="btn-close" @click="showPatModal = false"></button></div>
                    <div class="modal-body">
                        <div class="row g-3">
                            <div class="col-md-6"><label class="form-label small fw-bold">Email Address</label><input v-model="patForm.email" type="email" class="form-control" required></div>
                            <div class="col-md-6"><label class="form-label small fw-bold">Contact Number</label><input v-model="patForm.contact_number" type="tel" pattern="[0-9]{10}" maxlength="10" class="form-control" placeholder="10-digit number"></div>
                            <div class="col-md-6"><label class="form-label small fw-bold">Date of Birth</label><input v-model="patForm.dob" type="date" :max="new Date().toISOString().split('T')[0]" class="form-control"></div>
                            <div class="col-md-6"><label class="form-label small fw-bold">Blood Group</label><input v-model="patForm.blood_group" class="form-control" placeholder="O+"></div>
                        </div>
                    </div>
                    <div class="modal-footer border-0 pt-0"><button type="submit" class="btn btn-primary px-5 rounded-pill shadow">Save Changes</button></div>
                </form>
            </div></div>
        </div>

        <!-- Department Modal -->
        <div v-if="showDeptModal" class="modal d-block" style="background: rgba(30,41,59,0.5)">
            <div class="modal-dialog"><div class="modal-content p-4">
                <form @submit.prevent="saveDepartment">
                    <div class="modal-header border-0"><h4 class="fw-bold">Create New Unit</h4><button type="button" class="btn-close" @click="showDeptModal = false"></button></div>
                    <div class="modal-body">
                        <div class="mb-3"><label class="form-label small fw-bold">Name of Department</label><input v-model="deptForm.name" class="form-control" placeholder="Cardiology" required></div>
                        <div class="mb-2"><label class="form-label small fw-bold">Unit Description</label><textarea v-model="deptForm.description" class="form-control" rows="3" placeholder="Primary heart healthcare services..."></textarea></div>
                    </div>
                    <div class="modal-footer border-0"><button type="submit" class="btn btn-primary w-100 rounded-pill shadow">Register Unit</button></div>
                </form>
            </div></div>
        </div>

        <!-- History Modal -->
        <div v-if="showHistoryModal" class="modal d-block" style="background: rgba(30,41,59,0.5); z-index:1060;">
            <div class="modal-dialog modal-xl modal-dialog-scrollable">
                <div class="modal-content border-0 shadow-lg rounded-4">
                    <div class="modal-header border-0 bg-light p-4">
                        <h4 class="fw-bold mb-0 text-dark"><i class="bi bi-clock-history me-3 text-indigo"></i>Medical Records: {{ activePatient?.name }}</h4>
                        <button type="button" class="btn-close" @click="showHistoryModal = false"></button>
                    </div>
                    <div class="modal-body p-4 bg-white" style="min-height: 400px;">
                        <div v-if="patientHistory.length === 0" class="text-center py-5">
                            <i class="bi bi-folder-x fs-1 text-muted d-block mb-3"></i>
                            <p class="text-muted">No clinical records found for this patient.</p>
                        </div>
                        <div v-else class="row g-4">
                            <div v-for="h in patientHistory" :key="h.id" class="col-12">
                                <div class="card border-0 shadow-sm p-4 rounded-4" style="border-left: 6px solid var(--admin-theme) !important;">
                                    <div class="d-flex justify-content-between align-items-center mb-3">
                                        <span class="badge bg-light text-dark border p-2 px-3 fw-normal small">
                                            <i class="bi bi-calendar-event me-2 text-indigo"></i>{{ h.date }}
                                        </span>
                                        <span class="badge rounded-pill px-3 py-2" :class="h.status==='Completed'?'bg-success':'bg-warning text-dark'">{{ h.status }}</span>
                                    </div>
                                    <div class="row g-3">
                                        <div class="col-md-4">
                                            <small class="text-muted d-block uppercase ls-1 mb-1">Consultant</small>
                                            <div class="fw-bold fs-5 text-indigo">Dr. {{ h.doctor }}</div>
                                            <small class="text-secondary">{{ h.department }}</small>
                                        </div>
                                        <div class="col-md-4">
                                            <small class="text-muted d-block uppercase ls-1 mb-1">Clinical Assessment</small>
                                            <div class="fw-bold">{{ h.diagnosis || 'Pending' }}</div>
                                        </div>
                                        <div class="col-md-4">
                                            <small class="text-muted d-block uppercase ls-1 mb-1">Prescription & Plan</small>
                                            <div class="text-dark small" style="white-space: pre-wrap;">{{ h.prescription || 'N/A' }}</div>
                                        </div>
                                    </div>
                                    <div v-if="h.medicines || h.tests_done" class="mt-3 pt-3 border-top d-flex gap-3">
                                        <div v-if="h.tests_done" class="small"><i class="bi bi-microscope me-1"></i> <strong>Tests:</strong> {{ h.tests_done }}</div>
                                        <div v-if="h.medicines" class="small"><i class="bi bi-capsule me-1"></i> <strong>Medication:</strong> {{ h.medicines }}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`
};

// doctor dashboard area
const DoctorDashboard = {
    setup() {
        const currentTab = ref('upcoming');
        const appointments = ref([]);
        const patients = ref([]);
        const patientHistory = ref([]);
        const availability = ref([]);
        const error = ref('');
        const router = VueRouter.useRouter();

        const activePatient = ref(null);
        const activeAppt = ref(null);
        const treatmentForm = ref({ appointment_id: null, visit_type: 'In-person', tests_done: '', diagnosis: '', prescription: '', medicines: '' });
        const availabilityGrid = ref([]);
        const showHistoryModal = ref(false);
        const selectedPatientName = ref('');

        const loadAppointments = async () => {
            try { appointments.value = await fetchApi('/api/doctor/dashboard'); }
            catch (e) { error.value = e.message; }
        };

        const loadPatients = async () => {
            try { patients.value = await fetchApi('/api/doctor/patients'); }
            catch (e) { error.value = e.message; }
        };

        // formats dates correctly for health records
        const localDateStr = (d) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        };

        const loadAvailability = async () => {
            const saved = await fetchApi('/api/doctor/availability');
            const today = new Date();
            const grid = [];
            for (let i = 0; i < 7; i++) {
                const d = new Date(today); d.setDate(today.getDate() + i);
                const dateStr = localDateStr(d);   // local date, not UTC
                const dateLabel = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
                const slots = [];
                const daySlots = saved.filter(s => s.date === dateStr);
                // Morning (8-12)
                if (daySlots.some(s => {
                    const hr = parseInt(s.start_time.split(':')[0]);
                    return hr >= 8 && hr < 12;
                })) slots.push('morning');
                // Evening (16-21)
                if (daySlots.some(s => {
                    const hr = parseInt(s.start_time.split(':')[0]);
                    return hr >= 16 && hr < 21;
                })) slots.push('evening');
                const pastSlots = [];
                const now = new Date();
                const [y, m, dayVal] = dateStr.split('-').map(Number);
                if (now > new Date(y, m - 1, dayVal, 12, 0)) pastSlots.push('morning');
                if (now > new Date(y, m - 1, dayVal, 21, 0)) pastSlots.push('evening');

                grid.push({ date: dateStr, dateLabel, slots, pastSlots });
            }
            availabilityGrid.value = grid;
        };

        onMounted(() => { loadAppointments(); loadPatients(); });



        const cancelAppt = async (id) => {
            try {
                await fetchApi(`/api/doctor/appointment/${id}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'Cancelled' })
                });
                loadAppointments();
            } catch (e) { alert(e.message); }
        };

        const openUpdate = (appt) => {
            activePatient.value = { id: appt.patient_id, name: appt.patient_name };
            activeAppt.value = appt;
            if (appt.treatment) {
                treatmentForm.value = {
                    appointment_id: appt.id,
                    visit_type: appt.treatment.visit_type || 'In-person',
                    tests_done: appt.treatment.tests_done || '',
                    diagnosis: appt.treatment.diagnosis || '',
                    prescription: appt.treatment.prescription || '',
                    medicines: appt.treatment.medicines || ''
                };
            } else {
                treatmentForm.value = { appointment_id: appt.id, visit_type: 'In-person', tests_done: '', diagnosis: '', prescription: '', medicines: '' };
            }
            currentTab.value = 'update_history';
        };

        const viewPatientHistory = async (patientId, name) => {
            try {
                patientHistory.value = await fetchApi(`/api/shared/patient/${patientId}/history`);
                selectedPatientName.value = name;
                showHistoryModal.value = true;
            } catch (e) { alert(e.message); }
        };

        const saveTreatment = async () => {
            try {
                await fetchApi('/api/doctor/treatment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(treatmentForm.value)
                });
                alert('Treatment saved!');
                currentTab.value = 'upcoming';
                loadAppointments();
            } catch (e) { alert(e.message); }
        };

        const toggleSlot = (day, slot) => {
            if (day.pastSlots.includes(slot)) return;
            const idx = day.slots.indexOf(slot);
            if (idx > -1) day.slots.splice(idx, 1);
            else day.slots.push(slot);
        };

        const saveAvailability = async () => {
            try {
                await fetchApi('/api/doctor/availability', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(availabilityGrid.value)
                });
                alert('Availability saved!');
                currentTab.value = 'upcoming';
            } catch (e) { alert(e.message); }
        };

        const logout = () => { localStorage.clear(); router.push('/'); };

        return {
            currentTab, appointments, patients, patientHistory, availability,
            activePatient, activeAppt, treatmentForm, availabilityGrid, error, showHistoryModal, selectedPatientName,
            loadAppointments, loadPatients, loadAvailability,
            cancelAppt, openUpdate, viewPatientHistory,
            saveTreatment, toggleSlot, saveAvailability, logout
        };
    },
    template: `
    <div class="container-fluid py-4 px-md-5">
        <div class="d-flex flex-wrap justify-content-between align-items-center mb-5 p-4 bg-white shadow-sm rounded-4" style="border-left: 5px solid var(--doctor-theme);">
            <div>
                <h2 class="fw-bold mb-0 text-dark"><i class="bi bi-stethoscope me-3 text-info"></i>Doctor Dashboard</h2>
                <small class="text-muted">Clinical Portal & Patient Care Management</small>
            </div>
            <div class="nav nav-pills gap-2 mt-3 mt-md-0">
                <button @click="currentTab = 'upcoming'; loadAppointments();" class="btn px-4 py-2 rounded-pill" :class="currentTab==='upcoming'?'btn-info text-white shadow':'btn-light text-muted'">Appointments</button>
                <button @click="currentTab = 'patients'; loadPatients();" class="btn px-4 py-2 rounded-pill" :class="currentTab==='patients'?'btn-info text-white shadow':'btn-light text-muted'">Patients</button>
                <button @click="currentTab = 'availability'; loadAvailability();" class="btn px-4 py-2 rounded-pill" :class="currentTab==='availability'?'btn-info text-white shadow':'btn-light text-muted'">Availability</button>
                <button @click="logout" class="btn btn-outline-danger px-4 py-2 rounded-pill">Logout</button>
            </div>
        </div>

        <!-- Upcoming Appointments View -->
        <div v-if="currentTab === 'upcoming'" class="card border-0 shadow-sm p-4">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h4 class="fw-bold mb-0"><i class="bi bi-calendar-check me-2 text-info"></i>Pending Sessions</h4>
                <span class="badge bg-soft-info text-info px-3 py-2" style="background:rgba(14,165,233,0.1);">Upcoming Today</span>
            </div>
            <div class="table-responsive">
                <table class="table table-hover align-middle">
                    <thead class="table-light">
                        <tr><th>Patient Name</th><th>Scheduled Date</th><th>Time Slot</th><th>Action required</th></tr>
                    </thead>
                    <tbody>
                        <tr v-for="a in appointments.filter(x => x.status === 'Booked')" :key="a.id">
                            <td class="fw-bold">
                                <div class="d-flex align-items-center">
                                    <div class="bg-light rounded-circle p-2 me-3"><i class="bi bi-person text-secondary"></i></div>
                                    {{ a.patient_name }}
                                </div>
                            </td>
                            <td><i class="bi bi-calendar3 me-2 text-muted"></i>{{ a.date }}</td>
                            <td><span class="badge bg-white text-dark border px-3"><i class="bi bi-clock me-1 text-info"></i>{{ a.start_time.substring(0,5) }}</span></td>
                            <td>
                                <div class="d-flex gap-2">
                                    <button @click="viewPatientHistory(a.patient_id, a.patient_name)" class="btn btn-sm btn-outline-info rounded-pill px-3">History</button>
                                    <button @click="openUpdate(a)" class="btn btn-sm btn-info text-white px-3 rounded-pill shadow-sm">Assess Patient</button>
                                    <button @click="cancelAppt(a.id)" class="btn btn-sm btn-outline-danger px-3 rounded-pill">Cancel</button>
                                </div>
                            </td>
                        </tr>
                        <tr v-if="appointments.filter(x => x.status === 'Booked').length === 0"><td colspan="4" class="text-center text-muted py-5">No patient appointments scheduled.</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Assessment Form (Already Upgraded) -->
        <div v-if="currentTab === 'update_history'" class="card border-0 shadow-lg mx-auto" style="max-width: 900px; border-radius: 15px;">
            <div class="card-header bg-primary text-white p-4" style="border-radius: 15px 15px 0 0;">
                <h4 class="mb-0"><i class="bi bi-person-badge me-2"></i>Clinical Assessment</h4>
                <p class="mb-0 opacity-75 mt-1">Updating records for: <strong>{{ activePatient?.name }}</strong></p>
            </div>
            <div class="card-body p-4 bg-light">
                <form @submit.prevent="saveTreatment">
                    <div class="row g-4">
                        <div class="col-md-7">
                            <div class="card border-0 shadow-sm p-3 mb-4">
                                <h6 class="text-secondary border-bottom pb-2 mb-3">Assessment Details</h6>
                                <div class="row mb-3">
                                    <div class="col-6"><label class="form-label small fw-bold">Visit Type</label><input v-model="treatmentForm.visit_type" class="form-control" type="text" placeholder="e.g. In-person"></div>
                                    <div class="col-6"><label class="form-label small fw-bold">Test Conducted</label><input v-model="treatmentForm.tests_done" class="form-control" type="text" placeholder="e.g. Blood test"></div>
                                </div>
                                <div class="mb-3"><label class="form-label small fw-bold">Final Diagnosis</label><textarea v-model="treatmentForm.diagnosis" class="form-control" rows="2" placeholder="Describe the findings..."></textarea></div>
                                <div class="mb-0"><label class="form-label small fw-bold">General Prescription/Instructions</label><textarea v-model="treatmentForm.prescription" class="form-control" rows="2" placeholder="Specific care instructions..."></textarea></div>
                            </div>
                        </div>
                        <div class="col-md-5">
                            <div class="card border-0 shadow-sm p-3 h-100" style="background: #fffbe6;">
                                <h6 class="text-dark border-bottom border-warning pb-2 mb-3"><i class="bi bi-capsule me-2"></i>Prescribed Medicines</h6>
                                <label class="form-label small fw-bold text-muted mb-2">Format: Medicine Name (Dosage)</label>
                                <textarea v-model="treatmentForm.medicines" class="form-control h-100" rows="8" style="font-family: monospace; font-size: 0.9rem; background: transparent; border: none;" placeholder="Paracetamol 500mg (1-0-1)&#10;Amoxicillin 250mg (1-1-1)"></textarea>
                            </div>
                        </div>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mt-5 pt-3 border-top">
                        <button type="button" class="btn btn-link text-muted" @click="currentTab = 'upcoming'"><i class="bi bi-arrow-left me-1"></i>Back</button>
                        <div class="d-flex gap-2">
                            <button type="button" class="btn btn-outline-secondary px-4 rounded-pill" @click="currentTab = 'upcoming'">Cancel</button>
                            <button type="submit" class="btn btn-info text-white px-5 rounded-pill shadow">Save Record</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>

        <!-- Patients List -->
        <div v-if="currentTab === 'patients'" class="card border-0 shadow-sm p-4">
            <h4 class="mb-4 fw-bold"><i class="bi bi-people me-2 text-info"></i>Your Assigned Patients</h4>
            <div class="row g-4">
                <div v-for="p in patients" :key="p.id" class="col-md-4">
                    <div class="card p-3 border-0 shadow-sm hover-grow h-100">
                        <div class="d-flex align-items-center justify-content-between">
                            <div class="d-flex align-items-center">
                                <img :src="'https://ui-avatars.com/api/?name=' + p.name + '&background=0ea5e9&color=fff'" class="rounded-circle me-3" width="45">
                                <div><div class="fw-bold">{{ p.name }}</div><small class="text-muted">Account Active</small></div>
                            </div>
                            <button @click="viewPatientHistory(p.id, p.name)" class="btn btn-sm btn-light rounded-pill px-3 border">History</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Availability Management -->
        <div v-if="currentTab === 'availability'" class="card border-0 shadow-sm p-4 mx-auto" style="max-width: 750px;">
            <div class="text-center mb-4">
                <h4 class="fw-bold mb-0">Manage Availability Slots</h4>
                <p class="text-muted small">Select your active periods for the upcoming week</p>
            </div>
            <div class="table-responsive">
                <table class="table table-borderless align-middle">
                    <thead><tr class="text-center text-muted small"><th class="text-start">Day / Date</th><th>Morning (8-12)</th><th>Evening (4-9)</th></tr></thead>
                    <tbody>
                        <tr v-for="day in availabilityGrid" :key="day.date">
                            <td class="fw-bold small py-3" style="width:180px;">{{ day.dateLabel }}</td>
                            <td>
                                <div class="d-grid"><button type="button" class="btn btn-sm py-2 rounded-3 shadow-none border" :disabled="day.pastSlots.includes('morning')" :class="day.slots.includes('morning') ? 'btn-info text-white border-0' : 'btn-light text-muted'" @click="toggleSlot(day, 'morning')">{{ day.pastSlots.includes('morning') ? 'Past' : (day.slots.includes('morning')?'Active':'Inactive') }}</button></div>
                            </td>
                            <td>
                                <div class="d-grid"><button type="button" class="btn btn-sm py-2 rounded-3 shadow-none border" :disabled="day.pastSlots.includes('evening')" :class="day.slots.includes('evening') ? 'btn-info text-white border-0' : 'btn-light text-muted'" @click="toggleSlot(day, 'evening')">{{ day.pastSlots.includes('evening') ? 'Past' : (day.slots.includes('evening')?'Active':'Inactive') }}</button></div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="text-center mt-5 pt-3 border-top">
                <button class="btn btn-primary px-5 rounded-pill shadow" @click="saveAvailability" style="background:var(--doctor-theme);">Update My Schedule</button>
            </div>
        </div>

        <!-- History Modal (Global shared style) -->
        <div v-if="showHistoryModal" class="modal d-block" style="background: rgba(15,23,42,0.8); z-index: 2000;">
            <div class="modal-dialog modal-lg modal-dialog-centered"><div class="modal-content shadow-2xl border-0 overflow-hidden" style="border-radius:24px;">
                <div class="modal-header bg-dark text-white p-4 border-0">
                    <h5 class="modal-title fw-bold">Clinical History: {{ selectedPatientName }}</h5>
                    <button type="button" class="btn-close btn-close-white" @click="showHistoryModal = false"></button>
                </div>
                <div class="modal-body p-4 bg-light" style="max-height: 70vh; overflow-y: auto;">
                    <div v-if="patientHistory.length === 0" class="text-center p-5"><i class="bi bi-folder2-open fs-1 text-muted d-block mb-3"></i>No medical records on file.</div>
                    <div v-else class="timeline">
                        <div v-for="h in patientHistory" :key="h.id" class="card border-0 mb-4 shadow-sm" style="border-radius:16px;">
                            <div class="card-body p-4">
                                <div class="d-flex justify-content-between mb-3">
                                    <span class="badge rounded-pill bg-white text-dark border px-3 py-2"><i class="bi bi-calendar-event me-2 text-info"></i>{{ h.date }}</span>
                                    <span class="badge rounded-pill" :class="h.visit_type==='In-person'?'bg-success':'bg-info'">{{ h.visit_type }}</span>
                                </div>
                                <div class="row g-3">
                                    <div class="col-md-6"><small class="text-muted d-block mb-1">Attending Physician</small><div class="fw-bold text-dark">Dr. {{ h.doctor }}</div></div>
                                    <div class="col-md-6"><small class="text-muted d-block mb-1">Clinical Unit</small><div class="fw-bold text-dark">{{ h.department }}</div></div>
                                    <div class="col-12"><small class="text-muted d-block mb-1">Medical Assessment</small><div class="p-3 bg-white border rounded-3 italic">"{{ h.diagnosis || 'No diagnosis recorded' }}"</div></div>
                                    <div class="col-12"><small class="text-muted d-block mb-1">Electronic Prescription</small><div class="p-3 border rounded-3 text-indigo fw-bold" style="background:rgba(67,56,202,0.05);">{{ h.medicines || 'None prescribed' }}</div></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer border-0 p-3 bg-white justify-content-center">
                    <button @click="showHistoryModal = false" class="btn btn-dark px-5 rounded-pill">Close File</button>
                </div>
            </div></div>
        </div>
    </div>`
};

// patient portal logic
const PatientDashboard = {
    setup() {
        const currentView = ref('main');
        const username = ref('');
        const appointments = ref([]);
        const historyAll = ref([]);
        const departments = ref([]);
        const profile = ref({ email: '', contact_number: '', dob: '', blood_group: '' });
        const activeDept = ref(null);
        const activeDoctor = ref(null);
        const selectedSlot = ref(null);
        const showPaymentModal = ref(false);
        const showProfileModal = ref(false);
        const searchQuery = ref('');
        const searchResults = ref([]);
        const rescheduleTargetId = ref(null);
        const router = VueRouter.useRouter();

        const getClaims = () => {
            const token = localStorage.getItem('token');
            if (!token) return {};
            try { return JSON.parse(atob(token.split('.')[1])); } catch { return {}; }
        };

        const loadMain = async () => {
            try {
                const claims = getClaims();
                username.value = claims.username || 'Patient';
                const [hist, deps, prof] = await Promise.all([
                    fetchApi('/api/patient/history'),
                    fetchApi('/api/departments'),
                    fetchApi('/api/patient/profile')
                ]);
                appointments.value = hist.filter(h => h.status === 'Booked');
                departments.value = deps;
                profile.value = prof;
            } catch (e) { console.error(e); }
        };

        onMounted(loadMain);

        const viewDept = async (dept) => {
            try { activeDept.value = await fetchApi('/api/departments/' + dept.id); currentView.value = 'dept'; }
            catch (e) { alert(e.message); }
        };

        const viewDoctor = async (doc) => {
            try { activeDoctor.value = await fetchApi('/api/doctors/' + doc.id); currentView.value = 'doctor'; }
            catch (e) { alert(e.message); }
        };

        const checkAvailability = async (doc) => {
            try {
                activeDoctor.value = await fetchApi('/api/doctors/' + doc.id);
                selectedSlot.value = null;
                currentView.value = 'availability';
            } catch (e) { alert(e.message); }
        };

        const groupedAvailability = Vue.computed(() => {
            if (!activeDoctor.value || !activeDoctor.value.availability) return [];
            const map = {};
            activeDoctor.value.availability.forEach(slot => {
                if (!map[slot.date]) map[slot.date] = [];
                map[slot.date].push(slot);
            });
            return Object.keys(map).sort().map(date => ({ date, slots: map[date] }));
        });

        const handleSearch = async () => {
            if (!searchQuery.value.trim()) { searchResults.value = []; return; }
            try { searchResults.value = await fetchApi('/api/doctors?q=' + encodeURIComponent(searchQuery.value)); }
            catch (e) { console.error(e); }
        };

        const viewHistory = async (target) => {
            const viewTarget = (target && typeof target === 'string') ? target : 'history_all';
            try {
                historyAll.value = await fetchApi('/api/patient/history');
                currentView.value = viewTarget;
            } catch (e) { console.error(e); }
        };

        const cancelAppointment = async (id) => {
            if (!confirm('Cancel this appointment?')) return;
            try { await fetchApi('/api/patient/appointment/' + id + '/cancel', { method: 'PUT' }); loadMain(); }
            catch (e) { alert(e.message); }
        };

        const triggerReschedule = async (appt) => {
            try {
                activeDoctor.value = await fetchApi('/api/doctors/' + appt.doctor_id);
                rescheduleTargetId.value = appt.id;
                selectedSlot.value = null;
                currentView.value = 'availability';
            } catch (e) { alert(e.message); }
        };

        const bookAppointment = async () => {
            try {
                const payload = {
                    doctor_id: activeDoctor.value.id,
                    date: selectedSlot.value.date,
                    start_time: selectedSlot.value.start_time,
                    end_time: selectedSlot.value.end_time
                };

                if (rescheduleTargetId.value) {
                    await fetchApi(`/api/patient/appointment/${rescheduleTargetId.value}/reschedule`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    alert('Appointment rescheduled successfully!');
                } else {
                    await fetchApi('/api/patient/appointment', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    alert('Success: Appointment secured!');
                }

                showPaymentModal.value = false;
                rescheduleTargetId.value = null;
                currentView.value = 'main';
                loadMain();
            } catch (e) { alert(e.message); }
        };

        const saveProfile = async () => {
            if (profile.value.contact_number.length !== 10) { alert('Phone must be 10 digits'); return; }
            try {
                await fetchApi('/api/patient/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile.value) });
                showProfileModal.value = false;
                alert('Records Updated');
            } catch (e) { alert(e.message); }
        };

        const downloadPrescription = (h) => {
            const printWindow = window.open('', '_blank');
            const html = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <title>Prescription_${h.id}</title>
                    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
                    <style>
                        body { font-family: 'Outfit', sans-serif; padding: 40px; color: #1e293b; background: white; }
                        .prescription-box { border: 2px solid #e2e8f0; border-radius: 20px; padding: 50px; position: relative; max-width: 800px; margin: auto; }
                        .header { border-bottom: 3px solid #10b981; padding-bottom: 25px; margin-bottom: 40px; }
                        .rx-symbol { font-size: 64px; font-weight: bold; color: #10b981; margin: 30px 0; font-family: 'Times New Roman', serif; }
                        .footer { margin-top: 60px; border-top: 1px solid #e2e8f0; padding-top: 25px; font-size: 13px; }
                        .label { color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 800; margin-bottom: 8px; }
                        .med-box { background: #f8fafc; padding: 25px; border-radius: 15px; border-left: 5px solid #10b981; font-family: 'Courier New', monospace; }
                    </style>
                </head>
                <body>
                    <div class="prescription-box shadow-sm">
                        <div class="header d-flex justify-content-between align-items-start">
                            <div class="text-start">
                                <h2 class="fw-bold mb-1" style="color:#0f172a;">HMS <span style="color:#10b981;">V2</span> Dashboard</h2>
                                <p class="text-muted small mb-0">Smart Healthcare Solutions • Clinical Excellence</p>
                            </div>
                            <div class="text-end">
                                <h4 class="fw-bold mb-1">Dr. ${h.doctor}</h4>
                                <p class="text-success small fw-bold mb-1">${h.department} Unit</p>
                                <p class="text-muted xsmall mb-0">Ref No: ${h.id}${Date.now().toString().slice(-4)}</p>
                            </div>
                        </div>
                        
                        <div class="row mb-5 border-bottom pb-4">
                            <div class="col-6">
                                <p class="label">Recipient Name</p>
                                <p class="fw-bold fs-5 text-dark mb-0">${username.value}</p>
                            </div>
                            <div class="col-6 text-end">
                                <p class="label">Date of Assessment</p>
                                <p class="fw-bold text-dark mb-0">${h.date}</p>
                            </div>
                        </div>

                        <div class="rx-symbol">℞</div>

                        <div class="mb-5">
                            <h6 class="label">Clinical Impression</h6>
                            <p class="fs-5 p-3 rounded-3" style="background:#f0fdf4; border: 1px dashed #10b981;">"${h.diagnosis || 'Standard Health Evaluation'}"</p>
                        </div>

                        <div class="mb-5">
                            <h6 class="label">Treatment Plan & Medication</h6>
                            <div class="med-box">
                                ${h.medicines || 'No pharmacotherapy indicated at this time.'}
                            </div>
                        </div>

                        <div class="mb-5">
                            <h6 class="label">Physician Notes</h6>
                            <p class="text-secondary">${h.prescription || 'Continue general preventive measures. Follow-up as needed.'}</p>
                        </div>

                        <div class="footer d-flex justify-content-between align-items-end">
                            <div style="flex: 2;">
                                <p class="mb-1 text-dark">Document Type: <strong>Official Electronic Prescription</strong></p>
                                <p class="text-muted xsmall mb-0">This document is digitally verified. It is valid for pharmacy use under local health regulations.</p>
                            </div>
                            <div class="text-center" style="flex: 1;">
                                <div style="display:inline-block; border-bottom: 2px solid #334155; width: 180px; margin-bottom: 5px;"></div>
                                <p class="xsmall text-uppercase fw-bold text-muted">Authorized Signature</p>
                            </div>
                        </div>
                    </div>
                    <script>
                        window.onload = function() { window.print(); window.close(); }
                    </script>
                </body>
                </html>
            `;
            printWindow.document.write(html);
            printWindow.document.close();
        };

        const logout = () => { localStorage.clear(); router.push('/'); };

        const exportCSV = () => {
            if (!historyAll.value || historyAll.value.length === 0) { alert('No records to export'); return; }
            const headers = ['Date', 'Doctor', 'Department', 'Diagnosis', 'Prescription', 'Medicines', 'Suggest Next Visit', 'Status'];
            const rows = historyAll.value.map(h => [
                h.date,
                `Dr. ${h.doctor}`,
                h.department,
                `"${(h.diagnosis || '').replace(/"/g, '""')}"`,
                `"${(h.prescription || '').replace(/"/g, '""')}"`,
                `"${(h.medicines || '').replace(/"/g, '""')}"`,
                h.next_visit_date || 'None',
                h.status
            ]);
            const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `Medical_History_${username.value.split(' ')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };

        return {
            currentView, username, appointments, historyAll, departments, profile, activeDept, activeDoctor, selectedSlot, showPaymentModal, showProfileModal, searchQuery, searchResults, rescheduleTargetId,
            handleSearch, viewDept, viewDoctor, checkAvailability, groupedAvailability, viewHistory, cancelAppointment, bookAppointment, saveProfile, logout, exportCSV, downloadPrescription, triggerReschedule
        };
    },
    template: `
    <div class="container-fluid py-4 px-md-5">
        <!-- Main View -->
        <div v-if="currentView === 'main'">
            <div class="d-flex flex-wrap justify-content-between align-items-center mb-5 p-4 bg-white shadow-sm rounded-4" style="border-left: 5px solid var(--patient-theme);">
                <div>
                    <h2 class="fw-bold mb-0"><i class="bi bi-heart-pulse me-3 text-success"></i>Hello, {{ username }}</h2>
                    <p class="text-muted mb-0 mt-1">Easily manage your consultations and medical records.</p>
                </div>
                <div class="d-flex gap-2 mt-3 mt-md-0 align-items-center">
                    <button @click="viewHistory('prescriptions')" class="btn btn-sm" :class="currentView==='prescriptions'?'btn-success text-white':'btn-outline-secondary rounded-pill px-4'">Prescriptions</button>
                    <button @click="showProfileModal = true" class="btn btn-sm btn-outline-secondary rounded-pill px-4">Profile Settings</button>
                    <button @click="viewHistory" class="btn btn-sm btn-outline-secondary rounded-pill px-4">View All History</button>
                    <button @click="logout" class="btn btn-sm btn-link text-danger p-0 fw-bold ms-3">Logout</button>
                </div>
            </div>

            <div class="row g-4 mb-5">
                <div class="col-lg-8">
                    <!-- Search Bar Section -->
                    <div class="mb-5 position-relative">
                        <div class="input-group shadow-sm border-0 rounded-4 overflow-hidden">
                            <span class="input-group-text bg-white border-0 ps-4"><i class="bi bi-search fs-4 text-success"></i></span>
                            <input v-model="searchQuery" @input="handleSearch" class="form-control border-0 py-3 shadow-none bg-white font-lg" placeholder="Find specialist name or expertise (e.g. Cardiologist)...">
                        </div>
                        <div v-if="searchResults.length > 0" class="mt-2 list-group shadow-lg position-absolute w-100 z-3" style="border-radius:15px; overflow:hidden;">
                            <a v-for="doc in searchResults" :key="doc.id" href="#" @click.prevent="viewDoctor(doc)" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center p-3">
                                <div><div class="fw-bold">Dr. {{ doc.name }}</div><small class="text-muted">{{ doc.specialization }} • {{ doc.department }}</small></div>
                                <span class="badge bg-success rounded-pill px-3">View Profile</span>
                            </a>
                        </div>
                    </div>

                    <!-- Department Grid -->
                    <h4 class="fw-bold mb-4">Our Clinical Departments</h4>
                    <div class="row g-3">
                        <div v-for="dept in departments" :key="dept.id" class="col-md-6">
                            <div class="card border-0 shadow-sm p-4 h-100 hover-grow">
                                <div class="d-flex align-items-start justify-content-between mb-3">
                                    <h5 class="fw-bold mb-0">{{ dept.name }}</h5>
                                    <div class="bg-soft-success p-2 rounded-circle" style="background:rgba(16,185,129,0.1);"><i class="bi bi-hospital text-success"></i></div>
                                </div>
                                <p class="text-muted small mb-3 text-truncate-2">{{ dept.description }}</p>
                                <button @click="viewDept(dept)" class="btn btn-sm btn-outline-success rounded-pill w-100">Find Specialists</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Sidebar: Upcoming -->
                <div class="col-lg-4">
                    <div class="card border-0 shadow-sm p-4 h-100">
                        <h5 class="fw-bold mb-4">Scheduled Bookings</h5>
                        <div v-if="appointments.length === 0" class="text-center py-5">
                            <i class="bi bi-calendar2-x fs-1 text-muted d-block mb-3"></i>
                            <div class="text-muted small">No upcoming visits found.</div>
                        </div>
                        <div v-else>
                            <div v-for="a in appointments" :key="a.id" class="p-3 mb-3 bg-light rounded-4 border-start border-4 border-success">
                                <div class="d-flex justify-content-between mb-1">
                                    <div class="fw-bold">Dr. {{ a.doctor }}</div>
                                    <div class="d-flex gap-2">
                                        <button @click="triggerReschedule(a)" class="btn btn-sm text-info p-0" title="Reschedule"><i class="bi bi-clock-history"></i></button>
                                        <button @click="cancelAppointment(a.id)" class="btn btn-sm text-danger p-0" title="Cancel"><i class="bi bi-x-circle"></i></button>
                                    </div>
                                </div>
                                <div class="small text-muted mb-2">{{ a.department }}</div>
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="badge bg-white text-dark border px-2"><i class="bi bi-clock me-1 text-success"></i>{{ a.start_time.substring(0,5) }}</span>
                                    <span class="text-muted small">{{ a.date }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- History All View -->
        <div v-if="currentView === 'history_all'" class="p-4 bg-white shadow-sm rounded-4">
            <div class="d-flex flex-wrap justify-content-between align-items-center mb-5 gap-3">
                <h3 class="fw-bold mb-0 text-success"><i class="bi bi-arrow-left me-3 cursor-pointer" @click="currentView = 'main'"></i>Your Medical Timeline</h3>
                <button v-if="historyAll.length > 0" @click="exportCSV" class="btn btn-outline-success rounded-pill px-4 shadow-sm">
                    <i class="bi bi-file-earmark-spreadsheet me-2"></i>Export as CSV
                </button>
            </div>
            <div class="timeline">
                <div v-for="h in historyAll" :key="h.id" class="card border-0 mb-4 shadow-sm" style="border-radius:20px; border-left: 6px solid #10b981 !important;">
                    <div class="card-body p-4">
                        <div class="d-flex justify-content-between mb-3 align-items-center">
                            <span class="badge bg-light text-dark border px-3 py-2"><i class="bi bi-calendar2-day text-success me-2"></i>{{ h.date }}</span>
                            <span class="badge rounded-pill" :class="h.status==='Completed'?'bg-success':'bg-warning text-dark'">{{ h.status }}</span>
                        </div>
                        <div class="row g-4">
                            <div class="col-md-4">
                                <small class="text-muted d-block mb-1">Consulting Physician</small>
                                <div class="fw-bold">Dr. {{ h.doctor }}</div>
                                <small class="text-secondary">{{ h.department }}</small>
                            </div>
                            <div class="col-md-5" v-if="h.diagnosis">
                                <small class="text-muted d-block mb-1">Assessment Outcome</small>
                                <div class="fw-bold font-italic">"{{ h.diagnosis }}"</div>
                            </div>
                            <div class="col-md-3 text-md-end" v-if="h.medicines">
                                <small class="text-muted d-block mb-1">Prescribed</small>
                                <span class="badge bg-soft-info text-info border border-info">{{ h.medicines.split('\\n').length }} Items</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div v-if="historyAll.length === 0" class="text-center p-5"><p class="text-muted">You have no medical records yet.</p></div>
        </div>

        <!-- Dept Specialists -->
        <div v-if="currentView === 'dept'" class="p-4 bg-white shadow-sm rounded-4">
            <div class="d-flex justify-content-between align-items-center mb-5">
                <h3 class="fw-bold mb-0"><i class="bi bi-chevron-left me-3 cursor-pointer" @click="currentView = 'main'"></i>{{ activeDept.name }} Specialists</h3>
            </div>
            <div class="row g-4">
                <div v-for="doc in activeDept.doctors" :key="doc.id" class="col-md-4">
                    <div class="card text-center p-4 border-0 shadow-sm hover-grow">
                        <img :src="'https://ui-avatars.com/api/?name=' + doc.name + '&background=10b981&color=fff'" class="rounded-circle mx-auto mb-3 shadow-sm" width="80">
                        <h5 class="fw-bold mb-1">Dr. {{ doc.name }}</h5>
                        <p class="text-muted small mb-4">{{ doc.specialization }}</p>
                        <button class="btn btn-success w-100 rounded-pill shadow-sm py-2" @click="viewDoctor(doc)">View Professional Profile</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Doctor Detail -->
        <div v-if="currentView === 'doctor'" class="card border-0 shadow-lg mx-auto" style="max-width: 800px; border-radius: 24px;">
            <div class="p-5">
                <div class="text-center mb-5">
                    <img :src="'https://ui-avatars.com/api/?name=' + activeDoctor.name + '&background=10b981&color=fff'" class="rounded-circle mb-3 shadow" width="120">
                    <h2 class="fw-bold mb-1">Dr. {{ activeDoctor.name }}</h2>
                    <p class="text-success fw-bold text-uppercase small ls-wide">{{ activeDoctor.specialization }} • Consultant</p>
                </div>
                <div class="bg-light p-4 rounded-4 mb-4 text-center">
                    <h6 class="text-muted text-uppercase xsmall fw-bold mb-2">Professional Summary</h6>
                    <p class="mb-0 text-dark lead italic" style="font-size:1rem;">{{ activeDoctor.bio || 'Dedicated medical professional committed to providing exceptional healthcare and personalized patient treatment plans.' }}</p>
                </div>
                <div class="d-grid gap-3 pt-3">
                    <button class="btn btn-success py-3 rounded-pill fw-bold shadow-lg" @click="checkAvailability(activeDoctor)">Check Live Availability</button>
                    <button class="btn btn-link text-muted mt-2" @click="currentView = 'dept'">Back to List</button>
                </div>
            </div>
        </div>

        <!-- Slot Selection -->
        <div v-if="currentView === 'availability'" class="card border-0 shadow-lg mx-auto overflow-hidden" style="max-width: 850px; border-radius: 24px;">
            <div class="card-header bg-dark text-white p-4 border-0">
                <h4 class="mb-0 fw-bold"><i class="bi bi-calendar-check me-2 text-success"></i>Reserve Session: Dr. {{ activeDoctor.name }}</h4>
            </div>
            <div class="card-body p-5 bg-light">
                <div v-if="groupedAvailability.length === 0" class="text-center py-5">
                    <i class="bi bi-alarm-off fs-1 text-muted d-block mb-3"></i>
                    <h5>No Sessions Available</h5>
                    <p class="text-muted">Try a different specialist or check back later.</p>
                </div>
                <div v-else>
                    <div v-for="group in groupedAvailability" :key="group.date" class="mb-5">
                        <div class="d-flex align-items-center mb-4">
                            <div class="flex-grow-1 border-bottom"></div>
                            <span class="px-4 text-muted small fw-bold text-uppercase ls-wide">{{ group.date }}</span>
                            <div class="flex-grow-1 border-bottom"></div>
                        </div>
                        <div class="d-flex flex-wrap gap-3 justify-content-center">
                            <button v-for="slot in group.slots" :key="slot.start_time" 
                                    class="btn px-4 py-3 rounded-4 shadow-sm fw-bold border-2"
                                    :class="slot === selectedSlot ? 'btn-success scale-up' : 'btn-white bg-white text-dark border-transparent'" 
                                    @click="selectedSlot = slot">
                                {{ slot.start_time.substring(0,5) }}
                                <i v-if="slot === selectedSlot" class="bi bi-check-circle-fill ms-2"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card-footer p-4 bg-white border-0 d-flex justify-content-between align-items-center">
                <button class="btn btn-link text-muted" @click="currentView = 'main'"><i class="bi bi-arrow-left me-1"></i>Return to Dashboard</button>
                <button class="btn btn-success px-5 py-3 rounded-pill shadow-lg fw-bold" :disabled="!selectedSlot" @click="showPaymentModal = true">Continue to Payment</button>
            </div>
        </div>

        <!-- Modals -->
        <div v-if="showPaymentModal" class="modal d-block" style="background: rgba(15,23,42,0.85); z-index: 3000;">
            <div class="modal-dialog modal-dialog-centered"><div class="modal-content border-0" style="border-radius:30px; overflow:hidden;">
                <div class="p-5 text-center">
                    <div class="bg-soft-success p-3 rounded-circle d-inline-block mb-3" style="background:rgba(16,185,129,0.1);"><i class="bi bi-shield-check text-success fs-1"></i></div>
                    <h4 class="fw-bold mb-2">{{ rescheduleTargetId ? 'Confirm Reschedule' : 'Final Step' }}</h4>
                    <p class="text-muted small px-4">
                        {{ rescheduleTargetId ? 'Updating your booking with' : 'Securely booking your consult with' }} 
                        <br><strong>Dr. {{ activeDoctor.name }}</strong>
                    </p>
                    <div class="bg-light p-3 rounded-4 my-4">
                        <div class="d-flex justify-content-between mb-2 small"><span class="text-muted">New Date</span><span class="fw-bold">{{ selectedSlot.date }}</span></div>
                        <div class="d-flex justify-content-between small"><span class="text-muted">New Time</span><span class="fw-bold">{{ selectedSlot.start_time.substring(0,5) }}</span></div>
                    </div>
                    <button class="btn btn-success w-100 py-3 rounded-pill fw-bold shadow-lg mb-3" @click="bookAppointment">
                        {{ rescheduleTargetId ? 'Confirm New Slot' : 'Confirm & Pay Securely' }}
                    </button>
                    <button class="btn btn-link text-muted btn-sm" @click="showPaymentModal = false; rescheduleTargetId = null">Cancel</button>
                </div>
            </div></div>
        </div>

        <div v-if="showProfileModal" class="modal d-block" style="background: rgba(15,23,42,0.85); z-index: 3000;">
            <div class="modal-dialog modal-dialog-centered"><div class="modal-content p-5 border-0" style="border-radius:30px;">
                <h4 class="fw-bold mb-4">Patient Profile</h4>
                <form @submit.prevent="saveProfile">
                    <div class="mb-3"><label class="form-label small fw-bold text-muted">Email Address</label><input v-model="profile.email" class="form-control bg-light border-0" type="email" required></div>
                    <div class="mb-3"><label class="form-label small fw-bold text-muted">Contact No.</label><input v-model="profile.contact_number" type="tel" pattern="[0-9]{10}" maxlength="10" placeholder="10-digit number" class="form-control bg-light border-0"></div>
                    <div class="row g-3">
                        <div class="col-6"><label class="form-label small fw-bold text-muted">Birth Date</label><input type="date" v-model="profile.dob" :max="new Date().toISOString().split('T')[0]" class="form-control bg-light border-0"></div>
                        <div class="col-6"><label class="form-label small fw-bold text-muted">Blood Group</label><input placeholder="B+" v-model="profile.blood_group" class="form-control bg-light border-0"></div>
                    </div>
                    <div class="d-grid mt-5 gap-2">
                        <button type="submit" class="btn btn-success py-3 rounded-pill shadow-lg fw-bold">Update My Profile</button>
                    </div>
                    <button type="button" class="btn btn-link text-muted w-100 mt-2 btn-sm" @click="showProfileModal = false">Discard Changes</button>
                </form>
            </div></div>
        </div>

        <div v-if="currentView === 'prescriptions'" class="p-4 bg-white shadow-sm rounded-4 mt-4">
            <div class="d-flex justify-content-between align-items-center mb-5">
                <h3 class="fw-bold mb-0 text-success"><i class="bi bi-chevron-left me-3 cursor-pointer" @click="currentView = 'main'"></i>Prescription Repository</h3>
                <span class="badge bg-soft-success text-success px-3 py-2" style="background:rgba(16,185,129,0.1);">Verified Reports</span>
            </div>
            <div class="row g-4">
                <div v-for="h in historyAll.filter(x => x.diagnosis || x.medicines)" :key="h.id" class="col-md-6">
                    <div class="card border-0 shadow-sm p-4 rounded-4 h-100 d-flex flex-column" style="border-top: 6px solid #10b981 !important;">
                        <div class="d-flex justify-content-between mb-3 align-items-center">
                            <span class="badge bg-light text-dark border px-3 py-2"><i class="bi bi-calendar-check text-success me-2"></i>{{ h.date }}</span>
                            <div class="text-end">
                                <div class="fw-bold text-dark">Dr. {{ h.doctor }}</div>
                                <small class="text-muted">{{ h.department }}</small>
                            </div>
                        </div>
                        <div class="mb-4">
                            <div class="small text-muted xsmall uppercase fw-bold mb-1">Diagnosis</div>
                            <div class="fw-bold italic" style="color:#334155;">{{ h.diagnosis || 'Routine Evaluation' }}</div>
                        </div>
                        <div class="bg-light p-3 rounded-3 mb-4 flex-grow-1" style="border: 1px solid #e2e8f0;">
                            <div class="small text-muted mb-2 fw-bold"><i class="bi bi-capsule me-1 text-success"></i> Medication Plan</div>
                            <div class="small text-dark font-monospace" style="white-space: pre-line;">{{ h.medicines || 'No medication prescribed.' }}</div>
                        </div>
                        <button class="btn btn-success w-100 rounded-pill shadow-sm py-3 fw-bold mt-auto" @click="downloadPrescription(h)">
                            <i class="bi bi-printer me-2"></i>Generate Official Report
                        </button>
                    </div>
                </div>
                <div v-if="historyAll.filter(x => x.diagnosis || x.medicines).length === 0" class="col-12 text-center py-5">
                    <div class="bg-light d-inline-block p-4 rounded-circle mb-3"><i class="bi bi-prescription2 fs-1 text-muted"></i></div>
                    <p class="text-muted">No prescriptions have been issued to your profile yet.</p>
                </div>
            </div>
        </div>
    </div>`
};

// setup all page routes
const routes = [
    { path: '/', component: Home },
    { path: '/login', component: Login },
    { path: '/register', component: Register },
    { path: '/admin', component: AdminDashboard },
    { path: '/doctor', component: DoctorDashboard },
    { path: '/patient', component: PatientDashboard }
];

const router = createRouter({ history: createWebHistory(), routes });

const app = createApp({ template: '<router-view></router-view>' });
app.use(router);
app.mount('#app');
