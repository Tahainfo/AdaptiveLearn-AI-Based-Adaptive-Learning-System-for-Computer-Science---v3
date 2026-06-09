/**
 * Admin Dashboard Application Logic
 */

// Inline SVG icon strings used in dynamically-generated HTML
const _A_SVG_USER   = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
const _A_SVG_BOOK   = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`;
const _A_SVG_TREND_UP   = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`;
const _A_SVG_TREND_DOWN = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>`;
const _A_SVG_TREND_FLAT = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;
const _A_SVG_STAR   = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none" style="vertical-align:-1px"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
const _A_SVG_ALERT  = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
const _A_SVG_CHECK_CIRCLE = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;

let currentPage = 'dashboard';
let conceptsList = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuthentication();
});

// =================================================================
// AUTHENTICATION
// =================================================================

function checkAdminAuthentication() {
    if (!adminAPI.token) {
        // Show login page
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('dashboardArea').style.display = 'none';
    } else {
        // Show dashboard
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('dashboardArea').style.display = 'block';
        loadDashboard();
    }
}

async function handleAdminLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    const errorElement = document.getElementById('loginError');
    
    try {
        errorElement.style.display = 'none';
        errorElement.textContent = '';
        
        // Clear fields
        document.getElementById('adminUsername').value = '';
        document.getElementById('adminPassword').value = '';
        
        // Attempt login
        await adminAPI.login(username, password);
        
        // On success, show dashboard
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('dashboardArea').style.display = 'block';
        loadDashboard();
        
    } catch (error) {
        errorElement.textContent = error.message;
        errorElement.style.display = 'block';
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        adminAPI.logout();
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('dashboardArea').style.display = 'none';
        document.getElementById('adminUsername').value = '';
        document.getElementById('adminPassword').value = '';
    }
}

// =================================================================
// NAVIGATION
// =================================================================

function navigateTo(pageId) {
    document.querySelectorAll('.admin-page').forEach(page => {
        page.classList.remove('active');
    });

    const page = document.getElementById(pageId);
    if (page) {
        page.classList.add('active');
    }

    currentPage = pageId;

    // Load page-specific data
    if (pageId === 'dashboard') {
        loadDashboard();
    } else if (pageId === 'students') {
        loadStudents();
    } else if (pageId === 'exercises') {
        loadExercises();
    } else if (pageId === 'analytics') {
        _studentsOverviewLoaded = false;
        _selectedClasse = null;
        loadAnalytics();
    } else if (pageId === 'logs') {
        loadLogs();
    }
}

// =================================================================
// DASHBOARD
// =================================================================

async function loadDashboard() {
    try {
        const dashboard = await adminAPI.getDashboard();

        // Update stats
        document.getElementById('totalStudents').textContent = dashboard.total_students;
        document.getElementById('activeStudents').textContent = dashboard.active_students;
        document.getElementById('totalExercises').textContent = dashboard.total_exercises;
        document.getElementById('adminExercises').textContent = dashboard.admin_exercises_count;

        // Update mastery distribution
        const dist = dashboard.student_mastery_distribution;
        const total = dist.excellent + dist.good + dist.weak;
        
        document.querySelector('.bar .excellent').style.width = total ? (dist.excellent / total * 100) + '%' : '0%';
        document.querySelector('.bar .good').style.width = total ? (dist.good / total * 100) + '%' : '0%';
        document.querySelector('.bar .weak').style.width = total ? (dist.weak / total * 100) + '%' : '0%';
        
        document.getElementById('excellentCount').textContent = dist.excellent;
        document.getElementById('goodCount').textContent = dist.good;
        document.getElementById('weakCount').textContent = dist.weak;

        // Recent logs
        const logsHtml = dashboard.recent_logs.map(log => `
            <div class="log-item">
                <strong>${log.admin_username}</strong> - ${log.action_type.replace(/_/g, ' ')}
                <small>${new Date(log.timestamp).toLocaleString()}</small>
            </div>
        `).join('');
        document.getElementById('recentLogs').innerHTML = logsHtml || '<p>Aucune action récente</p>';

        // Load sequence selector for quick stats
        try {
            if (!_analyticsSequencesCache) {
                _analyticsSequencesCache = await adminAPI.getSequencesWithDiagnostics();
            }
            _populateSequenceSelectors(_analyticsSequencesCache);
        } catch (e) { /* non-blocking */ }

    } catch (error) {
        console.error('Dashboard error:', error);
        alert('Error loading dashboard: ' + error.message);
    }
}

// =================================================================
// STUDENTS MANAGEMENT
// =================================================================

async function loadStudents() {
    try {
        const data = await adminAPI.listStudents();
        
        const tableBody = document.getElementById('studentsTableBody');
        tableBody.innerHTML = data.students.map(student => `
            <tr>
                <td>${student.id}</td>
                <td>${student.username}</td>
                <td>${student.email}</td>
                <td>${student.classe ? `<span class="badge">${_esc(student.classe)}</span>` : '<span style="color:#cbd5e1;">—</span>'}</td>
                <td><span class="badge ${student.role === 'admin' ? 'admin' : 'student'}">${student.role}</span></td>
                <td><span class="badge ${student.is_active ? 'active' : 'inactive'}">${student.is_active ? 'Active' : 'Inactive'}</span></td>
                <td>${new Date(student.created_at).toLocaleDateString()}</td>
                <td>
                    <button class="btn-small" onclick="viewStudentDetails(${student.id})">View</button>
                    <button class="btn-small btn-danger" onclick="deleteStudentConfirm(${student.id})">Delete</button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Students load error:', error);
        alert('Error loading students: ' + error.message);
    }
}

function showCreateStudentForm() {
    document.getElementById('createStudentForm').style.display = 'flex';
}

function hideCreateStudentForm() {
    document.getElementById('createStudentForm').style.display = 'none';
    document.getElementById('newUsername').value = '';
    document.getElementById('newEmail').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('newClasse').value = '';
    document.getElementById('newRole').value = 'student';
}

async function handleCreateStudent(event) {
    event.preventDefault();

    const username = document.getElementById('newUsername').value.trim();
    const email = document.getElementById('newEmail').value.trim();
    const password = document.getElementById('newPassword').value.trim();
    const classe = document.getElementById('newClasse').value.trim() || null;
    const role = document.getElementById('newRole').value;

    if (!username || !email || !password) {
        alert('Please fill in all fields');
        return;
    }

    try {
        await adminAPI.createStudent(username, email, password, role, classe);
        alert('Student created successfully');
        hideCreateStudentForm();
        loadStudents();
    } catch (error) {
        alert('Error creating student: ' + error.message);
    }
}

async function viewStudentDetails(studentId) {
    try {
        const student = await adminAPI.getStudentDetails(studentId);
        alert(`Student: ${student.username}\nEmail: ${student.email}\nAvg Mastery: ${Math.round(student.average_mastery * 100)}%\nExercises Completed: ${student.total_exercises_completed}`);
    } catch (error) {
        alert('Error loading student: ' + error.message);
    }
}

async function deleteStudentConfirm(studentId) {
    if (confirm('Permanently delete this account and all its data? This cannot be undone.')) {
        try {
            await adminAPI.deleteStudent(studentId);
            alert('Student permanently deleted.');
            loadStudents();
        } catch (error) {
            alert('Error deleting student: ' + error.message);
        }
    }
}

// =================================================================
// EXERCISES MANAGEMENT
// =================================================================

async function loadConcepts() {
    try {
        conceptsList = await adminAPI.getAllConcepts();
        populateConceptSelect();
    } catch (error) {
        console.error('Failed to load concepts:', error);
    }
}

async function loadExercises() {
    // Always refresh concepts when the exercises page loads
    await loadConcepts();

    try {
        const data = await adminAPI.listExercises();
        
        const tableBody = document.getElementById('exercisesTableBody');
        tableBody.innerHTML = data.exercises.map(ex => `
            <tr>
                <td>${ex.id}</td>
                <td>${ex.title}</td>
                <td>${ex.concept_name || '—'}</td>
                <td><span class="badge">${ex.exercise_type}</span></td>
                <td>${ex.difficulty}</td>
                <td>${ex.is_diagnostic ? '✓' : '—'}</td>
                <td>${ex.error_type_targeted || '—'}</td>
                <td><span class="badge ${ex.is_active ? 'active' : 'inactive'}">${ex.is_active ? 'Yes' : 'No'}</span></td>
                <td>
                    <button class="btn-small" onclick="editExercise(${ex.id})">Edit</button>
                    ${ex.is_active ?
                        `<button class="btn-small" onclick="deactivateExerciseConfirm(${ex.id})">Deactivate</button>` :
                        `<button class="btn-small" onclick="activateExerciseConfirm(${ex.id})">Activate</button>`
                    }
                    <button class="btn-small btn-danger" onclick="deleteExerciseConfirm(${ex.id})">Delete</button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Exercises load error:', error);
        alert('Error loading exercises: ' + error.message);
    }
}

function populateConceptSelect() {
    const select = document.getElementById('exConcept');
    select.innerHTML = '<option value="">-- Select Concept --</option>' +
        conceptsList.map(c =>
            `<option value="${c.id}"
                     data-module-id="${c.module_id}"
                     data-sequence-id="${c.sequence_id}">
                ${c.sequence_title} → ${c.name}
             </option>`
        ).join('');
}

async function showCreateExerciseForm() {
    if (conceptsList.length === 0) {
        await loadConcepts();
    }
    if (conceptsList.length === 0) {
        alert('Could not load concepts. Please refresh the page and try again.');
        return;
    }
    document.getElementById('createExerciseForm').style.display = 'flex';
}

function hideCreateExerciseForm() {
    document.getElementById('createExerciseForm').style.display = 'none';
}

function updateExerciseForm() {
    const type = document.getElementById('exType').value;
    const fieldsDiv = document.getElementById('dynamicExerciseFields');
    
    fieldsDiv.innerHTML = '';

    if (type === 'mcq') {
        fieldsDiv.innerHTML = `
            <div class="form-group">
                <label>Question *</label>
                <input type="text" id="exMCQQuestion" placeholder="Enter the question" required>
            </div>
            <div class="form-group">
                <label>Options (comma separated) *</label>
                <textarea id="exMCQOptions" placeholder="Option 1, Option 2, Option 3" required></textarea>
            </div>
            <div class="form-group">
                <label>Correct Option Index (0-based) *</label>
                <input type="number" id="exMCQCorrect" min="0" required>
            </div>
        `;
    } else if (type === 'short_answer') {
        fieldsDiv.innerHTML = `
            <div class="form-group">
                <label>Question *</label>
                <input type="text" id="exSAQuestion" placeholder="Enter the question" required>
            </div>
            <div class="form-group">
                <label>Correct Answer *</label>
                <input type="text" id="exSAAnswer" placeholder="Expected answer" required>
            </div>
            <div class="form-group">
                <label>Alternative Accepted Answers <small>(comma-separated, optional)</small></label>
                <input type="text" id="exSAAlternatives" placeholder="alt1, alt2, alt3">
            </div>
        `;
    } else if (type === 'true_false') {
        fieldsDiv.innerHTML = `
            <div class="form-group">
                <label>Statement *</label>
                <input type="text" id="exTFStatement" placeholder="Enter the statement" required>
            </div>
            <div class="form-group">
                <label>Correct Answer *</label>
                <select id="exTFAnswer" required>
                    <option value="">-- Select --</option>
                    <option value="true">True</option>
                    <option value="false">False</option>
                </select>
            </div>
        `;
    } else if (type === 'long_answer') {
        fieldsDiv.innerHTML = `
            <div class="form-group">
                <label>Question *</label>
                <textarea id="exLAQuestion" placeholder="Enter the question" required></textarea>
            </div>
            <div class="form-group">
                <label>Model Answer *</label>
                <textarea id="exLAAnswer" placeholder="Enter the expected answer" required></textarea>
            </div>
            <div class="form-group">
                <label>Keywords for auto-grading <small>(comma-separated, optional)</small></label>
                <input type="text" id="exLAKeywords" placeholder="variable, boucle, condition">
            </div>
        `;
    } else if (type === 'drag_drop') {
        fieldsDiv.innerHTML = `
            <div class="form-group">
                <label>Question *</label>
                <input type="text" id="exDDQuestion" placeholder="E.g. Reorder the following steps..." required>
            </div>
            <div class="form-group">
                <label>Items in correct order * <small>(one item per line)</small></label>
                <textarea id="exDDItems" placeholder="Step 1: Initialize&#10;Step 2: Loop&#10;Step 3: Print result" rows="5" required></textarea>
            </div>
        `;
    } else if (type === 'match_lines') {
        fieldsDiv.innerHTML = `
            <div class="form-group">
                <label>Question *</label>
                <input type="text" id="exMLQuestion" placeholder="E.g. Match each concept to its definition" required>
            </div>
            <div class="form-group">
                <label>Pairs * <small>(one pair per line, format: Left term | Right term)</small></label>
                <textarea id="exMLPairs" placeholder="Variable | Stores a value&#10;Loop | Repeats instructions&#10;Condition | Branching" rows="5" required></textarea>
            </div>
        `;
    }
}

async function handleCreateExercise(event) {
    event.preventDefault();

    const type = document.getElementById('exType').value;
    const conceptSelect = document.getElementById('exConcept');
    const conceptId = parseInt(conceptSelect.value);
    const title = document.getElementById('exTitle').value;
    const difficulty = document.getElementById('exDifficulty').value;
    const errorType = document.getElementById('exErrorType').value || null;
    const isDiagnostic = document.getElementById('exDiagnostic').checked;

    if (!type || !conceptId || !title || !difficulty) {
        alert('Please fill in all required fields');
        return;
    }

    // Derive module_id and sequence_id from the selected concept option
    const selectedOption = conceptSelect.options[conceptSelect.selectedIndex];
    const moduleId = parseInt(selectedOption.dataset.moduleId) || 1;
    const sequenceId = parseInt(selectedOption.dataset.sequenceId) || 1;

    let contentJson = {};

    if (type === 'mcq') {
        const question = document.getElementById('exMCQQuestion').value;
        const options = document.getElementById('exMCQOptions').value.split(',').map(o => o.trim());
        const correctIdx = parseInt(document.getElementById('exMCQCorrect').value);
        contentJson = { question, options, correct_option: correctIdx, explanation: '' };
    } else if (type === 'short_answer') {
        const altsRaw = document.getElementById('exSAAlternatives')?.value || '';
        const alternatives = altsRaw ? altsRaw.split(',').map(a => a.trim()).filter(Boolean) : [];
        contentJson = {
            question: document.getElementById('exSAQuestion').value,
            correct_answer: document.getElementById('exSAAnswer').value,
            alternative_answers: alternatives
        };
    } else if (type === 'true_false') {
        contentJson = {
            statement: document.getElementById('exTFStatement').value,
            correct_answer: document.getElementById('exTFAnswer').value === 'true'
        };
    } else if (type === 'long_answer') {
        const keywords = (document.getElementById('exLAKeywords')?.value || '')
            .split(',').map(k => k.trim()).filter(Boolean);
        contentJson = {
            question:       document.getElementById('exLAQuestion').value,
            correct_answer: document.getElementById('exLAAnswer').value,
            keywords
        };
    } else if (type === 'drag_drop') {
        const items = document.getElementById('exDDItems').value
            .split('\n').map(s => s.trim()).filter(Boolean);
        if (items.length < 2) {
            alert('Drag & Drop requires at least 2 items.');
            return;
        }
        contentJson = {
            question: document.getElementById('exDDQuestion').value,
            items
        };
    } else if (type === 'match_lines') {
        const rawPairs = document.getElementById('exMLPairs').value
            .split('\n').map(s => s.trim()).filter(Boolean);
        const pairs = rawPairs.map(line => {
            const parts = line.split('|').map(s => s.trim());
            return parts.length >= 2 ? [parts[0], parts[1]] : null;
        }).filter(Boolean);
        if (pairs.length < 2) {
            alert('Match Lines requires at least 2 pairs in format "Left | Right" (one per line).');
            return;
        }
        contentJson = {
            question: document.getElementById('exMLQuestion').value,
            pairs
        };
    }

    try {
        await adminAPI.createExercise({
            title,
            description: '',
            module_id: moduleId,
            sequence_id: sequenceId,
            concept_id: conceptId,
            difficulty,
            exercise_type: type,
            is_diagnostic: isDiagnostic,
            error_type_targeted: errorType,
            content_json: contentJson
        });

        alert('Exercise created successfully');
        hideCreateExerciseForm();
        loadExercises();
    } catch (error) {
        alert('Error creating exercise: ' + error.message);
    }
}

async function editExercise(exerciseId) {
    try {
        const ex = await adminAPI.getExerciseDetails(exerciseId);

        document.getElementById('editExId').value = ex.id;
        document.getElementById('editExTitle').value = ex.title;
        document.getElementById('editExDifficulty').value = ex.difficulty;
        document.getElementById('editExDiagnostic').checked = ex.is_diagnostic;

        const errorSelect = document.getElementById('editExErrorType');
        errorSelect.value = ex.error_type_targeted || '';

        document.getElementById('editExContentJson').value =
            ex.content_json ? JSON.stringify(ex.content_json, null, 2) : '';

        document.getElementById('editExerciseForm').style.display = 'flex';
    } catch (error) {
        alert('Error loading exercise: ' + error.message);
    }
}

function hideEditExerciseForm() {
    document.getElementById('editExerciseForm').style.display = 'none';
}

async function handleEditExercise(event) {
    event.preventDefault();

    const exerciseId = document.getElementById('editExId').value;
    const contentRaw = document.getElementById('editExContentJson').value.trim();

    let contentJson = null;
    if (contentRaw) {
        try {
            contentJson = JSON.parse(contentRaw);
        } catch (e) {
            alert('Invalid JSON in Content JSON field: ' + e.message);
            return;
        }
    }

    const updateData = {
        title: document.getElementById('editExTitle').value,
        difficulty: document.getElementById('editExDifficulty').value,
        is_diagnostic: document.getElementById('editExDiagnostic').checked,
        error_type_targeted: document.getElementById('editExErrorType').value || null,
        content_json: contentJson,
    };

    try {
        await adminAPI.updateExercise(exerciseId, updateData);
        alert('Exercise updated successfully');
        hideEditExerciseForm();
        loadExercises();
    } catch (error) {
        alert('Error updating exercise: ' + error.message);
    }
}

async function deleteExerciseConfirm(exerciseId) {
    if (confirm('Permanently delete this exercise and all its attempt records? This cannot be undone.')) {
        try {
            await adminAPI.deleteExercise(exerciseId);
            alert('Exercise deleted');
            loadExercises();
        } catch (error) {
            alert('Error deleting exercise: ' + error.message);
        }
    }
}

async function activateExerciseConfirm(exerciseId) {
    try {
        await adminAPI.activateExercise(exerciseId);
        alert('Exercise activated');
        loadExercises();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function deactivateExerciseConfirm(exerciseId) {
    try {
        await adminAPI.deactivateExercise(exerciseId);
        alert('Exercise deactivated');
        loadExercises();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// =================================================================
// ANALYTICS
// =================================================================

// =================================================================
// ANALYTICS — tabs, group stats, students overview
// =================================================================

let _analyticsSequencesCache = null;  // shared by dash + analytics selectors
let _studentsOverviewLoaded = false;
let _selectedClasse = null;           // current class filter

async function loadAnalytics() {
    try {
        _analyticsSequencesCache = await adminAPI.getSequencesWithDiagnostics();
        _populateSequenceSelectors(_analyticsSequencesCache);
    } catch (e) {
        console.error('Could not load sequences for analytics', e);
    }
    // Populate class dropdowns
    try {
        const classes = await adminAPI.getClasses();
        _populateClasseSelectors(classes);
    } catch (e) { /* non-blocking */ }
    switchAnalyticsTab('group');
}

function _populateClasseSelectors(classes) {
    const opts = classes.map(c => `<option value="${_esc(c)}">${_esc(c)}</option>`).join('');
    ['groupClasseSelect', 'studentsClasseSelect'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '<option value="">— Toutes les classes —</option>' + opts;
    });
}

function onAnalyticsClasseChange() {
    _selectedClasse = document.getElementById('groupClasseSelect').value || null;
    // Reset the students overview so it reloads with the new filter
    _studentsOverviewLoaded = false;
    // Reload current sequence stats if one is selected
    if (document.getElementById('groupSeqSelect').value) loadGroupSequenceStats();
}

function onStudentsClasseChange() {
    _selectedClasse = document.getElementById('studentsClasseSelect').value || null;
    _studentsOverviewLoaded = false;
    loadStudentsOverview();
    _studentsOverviewLoaded = true;
}

function _populateSequenceSelectors(sequences) {
    const opts = sequences.map(s =>
        `<option value="${s.id}">${s.name}${s.module ? ' — ' + s.module : ''}</option>`
    ).join('');
    const selGroup = document.getElementById('groupSeqSelect');
    const selDash  = document.getElementById('dashSeqSelect');
    if (selGroup) selGroup.innerHTML = '<option value="">— Sélectionner un test —</option>' + opts;
    if (selDash)  selDash.innerHTML  = '<option value="">— Sélectionner un test —</option>' + opts;
}

function switchAnalyticsTab(tab) {
    document.getElementById('analyticsTabGroup').style.display    = tab === 'group'    ? '' : 'none';
    document.getElementById('analyticsTabStudents').style.display  = tab === 'students' ? '' : 'none';
    document.getElementById('atab-group').classList.toggle('active',    tab === 'group');
    document.getElementById('atab-students').classList.toggle('active', tab === 'students');

    if (tab === 'students' && !_studentsOverviewLoaded) {
        loadStudentsOverview();
        _studentsOverviewLoaded = true;
    }
}

// Build distribution HTML from a dist object
function _buildDistHtml(dist, unit = 'étudiant') {
    const maxVal = Math.max(...Object.values(dist), 1);
    return Object.entries(dist).map(([range, count]) => {
        const pct = Math.round(count / maxVal * 100);
        return `<div class="dist-row">
            <span class="dist-label">${range}%</span>
            <div class="dist-bar-wrap"><div class="dist-bar-fill" style="width:${pct}%"></div></div>
            <span class="dist-count">${count} ${unit}${count !== 1 ? 's' : ''}</span>
        </div>`;
    }).join('');
}

// Switch attempt distribution AND stats (called by inline onchange)
function _switchAttemptDist(conceptId) {
    const sel = document.getElementById('attSel_' + conceptId);
    const val = sel.value;
    const attStats  = window['_attStats_' + conceptId] || [];
    const allDist   = window['_allDist_'  + conceptId] || {};
    const allStats  = window['_allStats_' + conceptId] || {};

    let dist, ss;
    if (val === 'all') {
        dist = allDist;
        ss   = allStats;
    } else {
        const att = attStats.find(a => a.attempt_num === parseInt(val));
        dist = att ? att.distribution : allDist;
        ss   = att || allStats;
    }

    // Update distribution bars
    document.getElementById('distContainer_' + conceptId).innerHTML = _buildDistHtml(dist);

    // Update stat values
    const set = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
    set(`ss_mean_${conceptId}`,   (ss.mean   ?? '—') + '%');
    set(`ss_std_${conceptId}`,    '±' + (ss.std_dev ?? 0));
    set(`ss_median_${conceptId}`, (ss.median ?? '—') + '%');
    set(`ss_q1q3_${conceptId}`,   (ss.q1 ?? '—') + ' / ' + (ss.q3 ?? '—'));
    set(`ss_min_${conceptId}`,    (ss.min    ?? '—') + '%');
    set(`ss_max_${conceptId}`,    (ss.max    ?? '—') + '%');
    set(`ss_p50_${conceptId}`,    (ss.pass_rate_50 ?? '—') + '%');
    set(`ss_p70_${conceptId}`,    (ss.pass_rate_70 ?? '—') + '%');
}

// Switch global attempt (distribution + stats)
function _switchGlobalAttemptDist() {
    const sel = document.getElementById('globalAttSel');
    const val = sel.value;
    const attStats = window['_globalAttStats'] || [];
    const allDist  = window['_globalAllDist']  || {};
    const allStats = window['_globalAllStats'] || {};

    let dist, ss;
    if (val === 'all') {
        dist = allDist;
        ss   = allStats;
    } else {
        const att = attStats.find(a => a.attempt_num === parseInt(val));
        dist = att ? att.distribution : allDist;
        ss   = att || allStats;
    }

    document.getElementById('globalDistContainer').innerHTML = _buildDistHtml(dist, 'étudiant');

    const set = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
    set('gs_mean',   (ss.mean   ?? '—') + '%');
    set('gs_std',    '±' + (ss.std_dev ?? 0));
    set('gs_median', (ss.median ?? '—') + '%');
    set('gs_q1q3',   (ss.q1 ?? '—') + ' / ' + (ss.q3 ?? '—'));
    set('gs_min',    (ss.min    ?? '—') + '%');
    set('gs_max',    (ss.max    ?? '—') + '%');
    set('gs_p50',    (ss.pass_rate_50 ?? '—') + '%');
    set('gs_p70',    (ss.pass_rate_70 ?? '—') + '%');
}

// Global test summary section (all concepts combined)
function _renderGlobalStats(g, seqName) {
    const ss = g.score_stats;

    // Store for dynamic switching
    window['_globalAttStats'] = g.attempt_stats || [];
    window['_globalAllDist']  = g.distribution;
    window['_globalAllStats'] = { ...ss, pass_rate_50: g.pass_rate_50, pass_rate_70: g.pass_rate_70 };

    // Attempt selector
    const attStats = g.attempt_stats || [];
    const minAtt = g.min_avg_attempt;
    const maxAtt = g.max_avg_attempt;
    let attSelectorHtml = '';
    if (attStats.length > 1) {
        const opts = attStats.map(a => {
            const tag = a.attempt_num === minAtt ? ' — moy. min' : a.attempt_num === maxAtt ? ' — moy. max' : '';
            return `<option value="${a.attempt_num}">Tentative ${a.attempt_num} (${a.mean}%${tag})</option>`;
        }).join('');
        attSelectorHtml = `<div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.75rem;flex-wrap:wrap;">
            <label style="font-size:.85rem;font-weight:600;color:#475569;">Filtrer par tentative :</label>
            <select id="globalAttSel" onchange="_switchGlobalAttemptDist()" style="padding:.3rem .7rem;border-radius:6px;border:1px solid #c7d2fe;font-size:.84rem;">
                <option value="all">Toutes les tentatives</option>
                ${opts}
            </select>
            ${minAtt ? `<span style="font-size:.75rem;color:#dc2626;background:#fee2e2;padding:.15rem .5rem;border-radius:4px;">T${minAtt}: moyenne min</span>` : ''}
            ${maxAtt && maxAtt !== minAtt ? `<span style="font-size:.75rem;color:#16a34a;background:#dcfce7;padding:.15rem .5rem;border-radius:4px;">T${maxAtt}: moyenne max</span>` : ''}
        </div>`;
    }

    return `<div class="gs-section global-test-section">
        <h3 class="gs-section-title" style="color:#4f46e5;">
            Résumé Global du Test
            <span style="font-size:.8rem;font-weight:normal;color:#64748b;margin-left:.6rem;">
                ${g.unique_students} étudiant${g.unique_students !== 1 ? 's' : ''} · ${g.total_attempts} passage${g.total_attempts !== 1 ? 's' : ''} du test
            </span>
        </h3>
        <div class="gs-stats-row">
            <div class="gs-stat"><div class="gss-label">Moyenne globale</div><div class="gss-val" id="gs_mean" style="color:#4f46e5;">${ss.mean}%</div></div>
            <div class="gs-stat"><div class="gss-label">Écart-type</div><div class="gss-val" id="gs_std">±${ss.std_dev}</div></div>
            <div class="gs-stat"><div class="gss-label">Médiane</div><div class="gss-val" id="gs_median">${ss.median}%</div></div>
            <div class="gs-stat"><div class="gss-label">Q1 / Q3</div><div class="gss-val" id="gs_q1q3">${ss.q1} / ${ss.q3}</div></div>
            <div class="gs-stat"><div class="gss-label">Min</div><div class="gss-val" id="gs_min">${ss.min}%</div></div>
            <div class="gs-stat"><div class="gss-label">Max</div><div class="gss-val" id="gs_max">${ss.max}%</div></div>
            <div class="gs-stat gs-pass"><div class="gss-label">Taux ≥50%</div><div class="gss-val" id="gs_p50">${g.pass_rate_50}%</div></div>
            <div class="gs-stat gs-pass"><div class="gss-label">Taux ≥70%</div><div class="gss-val" id="gs_p70">${g.pass_rate_70}%</div></div>
        </div>
        <div class="gs-subsection">
            <h4 class="gs-subsection-title">Distribution Globale des Scores</h4>
            ${attSelectorHtml}
            <div class="score-dist" id="globalDistContainer">${_buildDistHtml(g.distribution, 'passage')}</div>
        </div>
        <hr style="border:none;border-top:2px dashed #e2e8f0;margin:1.5rem 0;">
    </div>`;
}

// Render one concept block (used in both analytics and dashboard)
function _renderConceptStats(c) {
    if (c.total_attempts === 0) {
        return `<div class="gs-section" style="opacity:.55;">
            <h3 class="gs-section-title">${_A_SVG_BOOK} ${_esc(c.concept_name)}
                <small style="color:#94a3b8;font-weight:normal;margin-left:.5rem;">— Aucune tentative</small>
            </h3>
        </div>`;
    }

    const ss = c.score_stats;
    const cid = c.concept_id;

    // Attempt number filter (only if > 1 unique attempt number exists)
    const attStats = c.attempt_stats || [];
    let attSelectorHtml = '';
    if (attStats.length > 1) {
        const minAtt = c.min_avg_attempt;
        const maxAtt = c.max_avg_attempt;
        const opts = attStats.map(a => {
            const tag = a.attempt_num === minAtt ? ' — moy. min' : a.attempt_num === maxAtt ? ' — moy. max' : '';
            return `<option value="${a.attempt_num}">Tentative ${a.attempt_num} (${a.mean}%${tag})</option>`;
        }).join('');
        attSelectorHtml = `<div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.75rem;flex-wrap:wrap;">
            <label style="font-size:.85rem;font-weight:600;color:#475569;">Filtrer distribution :</label>
            <select id="attSel_${cid}" onchange="_switchAttemptDist(${cid})" style="padding:.3rem .7rem;border-radius:6px;border:1px solid #cbd5e1;font-size:.84rem;">
                <option value="all">Toutes les tentatives</option>
                ${opts}
            </select>
            ${minAtt ? `<span style="font-size:.75rem;color:#dc2626;background:#fee2e2;padding:.15rem .5rem;border-radius:4px;">T${minAtt}: moyenne min</span>` : ''}
            ${maxAtt && maxAtt !== minAtt ? `<span style="font-size:.75rem;color:#16a34a;background:#dcfce7;padding:.15rem .5rem;border-radius:4px;">T${maxAtt}: moyenne max</span>` : ''}
        </div>`;
    }

    const prog = c.progression;
    const progHtml = `
        <span class="prog-badge prog-up">▲ Amélioré : ${prog.improved}</span>
        <span class="prog-badge prog-same">→ Stable : ${prog.same}</span>
        <span class="prog-badge prog-down">▼ Régressé : ${prog.declined}</span>
        <span class="prog-badge prog-avg">Δ moy. : ${prog.avg_improvement > 0 ? '+' : ''}${prog.avg_improvement}%</span>`;

    // Only show questions with actual errors
    const failedQs = c.hardest_questions.filter(q => q.wrong_count > 0);
    const hardestHtml = failedQs.length === 0
        ? `<p style="color:#16a34a;font-size:.87rem;">${_A_SVG_CHECK_CIRCLE} Toutes les questions ont été bien répondues.</p>`
        : `<table class="data-table" style="font-size:.85rem;">
            <thead><tr>
                <th>Énoncé</th><th>Type</th><th>Tentatives</th><th>Erreurs</th><th>% Échec</th>
            </tr></thead>
            <tbody>${failedQs.map(q => `
                <tr>
                    <td style="max-width:320px;word-break:break-word;">${_esc(q.question)}</td>
                    <td><span class="type-badge">${q.type}</span></td>
                    <td style="text-align:center;">${q.total_attempts}</td>
                    <td style="text-align:center;">${q.wrong_count}</td>
                    <td><span class="fail-pct ${q.wrong_pct >= 70 ? 'high' : q.wrong_pct >= 40 ? 'med' : 'low'}">${q.wrong_pct}%</span></td>
                </tr>`).join('')}
            </tbody>
        </table>`;

    return `<div class="gs-section concept-section">
        <h3 class="gs-section-title">${_A_SVG_BOOK} ${_esc(c.concept_name)}
            <span style="font-size:.8rem;font-weight:normal;color:#64748b;margin-left:.6rem;">
                ${c.unique_students} étudiant${c.unique_students !== 1 ? 's' : ''} · ${c.total_attempts} tentative${c.total_attempts !== 1 ? 's' : ''}
            </span>
        </h3>
        <div class="gs-stats-row">
            <div class="gs-stat"><div class="gss-label">Moyenne</div><div class="gss-val" id="ss_mean_${cid}">${ss.mean}%</div></div>
            <div class="gs-stat"><div class="gss-label">Écart-type</div><div class="gss-val" id="ss_std_${cid}">±${ss.std_dev}</div></div>
            <div class="gs-stat"><div class="gss-label">Médiane</div><div class="gss-val" id="ss_median_${cid}">${ss.median}%</div></div>
            <div class="gs-stat"><div class="gss-label">Q1 / Q3</div><div class="gss-val" id="ss_q1q3_${cid}">${ss.q1} / ${ss.q3}</div></div>
            <div class="gs-stat"><div class="gss-label">Min</div><div class="gss-val" id="ss_min_${cid}">${ss.min}%</div></div>
            <div class="gs-stat"><div class="gss-label">Max</div><div class="gss-val" id="ss_max_${cid}">${ss.max}%</div></div>
            <div class="gs-stat gs-pass"><div class="gss-label">Taux ≥50%</div><div class="gss-val" id="ss_p50_${cid}">${c.pass_rate_50}%</div></div>
            <div class="gs-stat gs-pass"><div class="gss-label">Taux ≥70%</div><div class="gss-val" id="ss_p70_${cid}">${c.pass_rate_70}%</div></div>
        </div>
        <div class="gs-subsection">
            <h4 class="gs-subsection-title">Distribution des Scores</h4>
            ${attSelectorHtml}
            <div class="score-dist" id="distContainer_${cid}">${_buildDistHtml(c.distribution)}</div>
        </div>
        <div class="gs-subsection">
            <h4 class="gs-subsection-title">Progression entre Tentatives</h4>
            <div class="progression-badges">${progHtml}</div>
        </div>
        <div class="gs-subsection">
            <h4 class="gs-subsection-title">Énoncés les plus Manqués</h4>
            ${hardestHtml}
        </div>
    </div>`;
}

async function loadGroupSequenceStats() {
    const seqId = document.getElementById('groupSeqSelect').value;
    const content = document.getElementById('groupStatsContent');
    const empty   = document.getElementById('groupStatsEmpty');
    content.innerHTML = '';
    empty.style.display = 'none';
    if (!seqId) return;

    document.getElementById('groupStatsLoading').style.display = '';
    try {
        const d = await adminAPI.getDiagnosticSequenceStats(seqId, _selectedClasse);
        document.getElementById('groupStatsLoading').style.display = 'none';

        const hasData = d.concepts.some(c => c.total_attempts > 0);
        if (!hasData) { empty.style.display = ''; return; }

        // Store per-concept data for dynamic switching
        d.concepts.forEach(c => {
            window['_attStats_' + c.concept_id] = c.attempt_stats;
            window['_allDist_'  + c.concept_id] = c.distribution;
            window['_allStats_' + c.concept_id] = {
                ...c.score_stats,
                pass_rate_50: c.pass_rate_50,
                pass_rate_70: c.pass_rate_70
            };
        });

        const globalHtml = d.global_stats ? _renderGlobalStats(d.global_stats, d.sequence_name) : '';
        content.innerHTML = globalHtml + d.concepts.map(c => _renderConceptStats(c)).join('');
    } catch (e) {
        document.getElementById('groupStatsLoading').style.display = 'none';
        console.error('Group sequence stats error:', e);
    }
}

// Dashboard quick stats — sequence → mini card per concept
async function loadDashSeqStats() {
    const seqId = document.getElementById('dashSeqSelect').value;
    const statsDiv  = document.getElementById('dashSeqStats');
    const noDataDiv = document.getElementById('dashSeqNoData');
    statsDiv.innerHTML = '';
    statsDiv.style.display = 'none';
    noDataDiv.style.display = 'none';
    if (!seqId) return;

    try {
        const d = await adminAPI.getDiagnosticSequenceStats(seqId);
        const hasData = d.concepts.some(c => c.total_attempts > 0);
        if (!hasData) { noDataDiv.style.display = ''; return; }

        statsDiv.innerHTML = d.concepts.map(c => {
            if (c.total_attempts === 0) {
                return `<div class="dash-concept-card" style="opacity:.5;">
                    <div class="dcc-name">${_esc(c.concept_name)}</div>
                    <div style="color:#94a3b8;font-size:.8rem;margin:.3rem 0;">Aucune tentative</div>
                </div>`;
            }
            const ss = c.score_stats;
            const col = ss.mean >= 70 ? '#16a34a' : ss.mean >= 50 ? '#d97706' : '#dc2626';
            const top2 = c.hardest_questions.slice(0, 2);
            const topHtml = top2.length === 0
                ? ''
                : '<div class="dcc-hardest"><small>Énoncés difficiles :</small>' +
                  top2.map(q => `<div class="dcc-q">
                      <span class="fail-pct ${q.wrong_pct >= 70 ? 'high' : 'med'}" style="font-size:.7rem;">${q.wrong_pct}%</span>
                      ${_esc(q.question.substring(0, 70))}${q.question.length > 70 ? '…' : ''}
                  </div>`).join('') + '</div>';
            return `<div class="dash-concept-card">
                <div class="dcc-name">${_esc(c.concept_name)}</div>
                <div class="dcc-mean" style="color:${col};">${ss.mean}%</div>
                <div class="dcc-sub">${c.unique_students} étud. · ±${ss.std_dev}</div>
                <div class="dcc-rates">
                    <span class="dcc-rate">≥50%: <strong>${c.pass_rate_50}%</strong></span>
                    <span class="dcc-rate">≥70%: <strong>${c.pass_rate_70}%</strong></span>
                </div>
                ${topHtml}
            </div>`;
        }).join('');
        statsDiv.style.display = 'flex';
    } catch (e) {
        console.error('Dash sequence stats error:', e);
    }
}

async function loadStudentsOverview() {
    const container = document.getElementById('studentsOverviewContent');
    container.innerHTML = '<p style="color:#6366f1;font-style:italic;">Chargement…</p>';
    try {
        const d = await adminAPI.getStudentsOverview(_selectedClasse);
        if (!d.students.length) {
            container.innerHTML = '<p style="color:#94a3b8;">Aucun étudiant trouvé.</p>';
            return;
        }

        const conceptCols = d.concepts.map(c =>
            `<th title="${_esc(c.name)}" style="max-width:120px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${_esc(c.name.substring(0, 18))}…</th>`
        ).join('');

        const rows = d.students.map(s => {
            const scoreCells = d.concepts.map(c => {
                const sc = s.scores[String(c.id)];
                if (!sc) return '<td style="text-align:center;color:#cbd5e1;">—</td>';
                const cls = sc.latest_score >= 70 ? 'score-good' : sc.latest_score >= 50 ? 'score-mid' : 'score-bad';
                const arrow = sc.improvement > 2 ? '▲' : sc.improvement < -2 ? '▼' : '→';
                const arrowCls = sc.improvement > 2 ? 'arr-up' : sc.improvement < -2 ? 'arr-down' : 'arr-same';
                return `<td style="text-align:center;">
                    <span class="${cls}">${sc.latest_score}%</span>
                    <span class="${arrowCls}" style="font-size:.75rem;">${arrow}</span>
                </td>`;
            }).join('');

            const avgCell = s.overall_avg !== null
                ? `<td style="text-align:center;font-weight:700;${s.overall_avg >= 70 ? 'color:#16a34a' : s.overall_avg >= 50 ? 'color:#d97706' : 'color:#dc2626'}">${s.overall_avg}%</td>`
                : '<td style="text-align:center;color:#cbd5e1;">—</td>';

            return `<tr style="cursor:pointer;" onclick="showStudentDetail(${s.id})">
                <td><strong>${_esc(s.username)}</strong></td>
                <td style="text-align:center;">${s.concepts_attempted}/${d.concepts.length}</td>
                ${avgCell}
                ${scoreCells}
            </tr>`;
        }).join('');

        container.innerHTML = `
            <p style="font-size:.85rem;color:#64748b;margin-bottom:.75rem;">
                Cliquez sur un étudiant pour voir sa progression détaillée.
                <span style="color:#16a34a;">▲ amélioration</span> /
                <span style="color:#dc2626;">▼ régression</span> par rapport à la 1ère tentative.
            </p>
            <div class="table-responsive">
            <table class="data-table">
                <thead><tr>
                    <th>Étudiant</th>
                    <th>Concepts testés</th>
                    <th>Moy. globale</th>
                    ${conceptCols}
                </tr></thead>
                <tbody>${rows}</tbody>
            </table>
            </div>`;
    } catch (e) {
        container.innerHTML = `<p style="color:#dc2626;">Erreur : ${e.message}</p>`;
        console.error('Students overview error:', e);
    }
}

async function showStudentDetail(studentId) {
    const modal   = document.getElementById('studentDetailModal');
    const content = document.getElementById('studentDetailContent');
    const title   = document.getElementById('studentDetailName');
    title.textContent = 'Chargement…';
    content.innerHTML = '<p style="color:#6366f1;font-style:italic;">Chargement des données…</p>';
    modal.style.display = 'flex';

    try {
        const d = await adminAPI.getStudentAnalytics(studentId);
        title.innerHTML = _A_SVG_USER + ' ' + _esc(d.student.username);

        // Per-concept progression
        const histHtml = d.concept_histories.length === 0
            ? '<p style="color:#94a3b8;font-style:italic;">Aucune tentative encore.</p>'
            : d.concept_histories.map(h => {
                const trend = h.trend === 'improving' ? _A_SVG_TREND_UP : h.trend === 'declining' ? _A_SVG_TREND_DOWN : _A_SVG_TREND_FLAT;
                const sparkline = h.attempts.map((a, i) => {
                    const w = Math.round(a.score);
                    const cls = a.score >= 70 ? 'score-good' : a.score >= 50 ? 'score-mid' : 'score-bad';
                    return `<div class="spark-step">
                        <span style="font-size:.72rem;color:#64748b;">T${i+1}</span>
                        <div class="spark-bar-wrap">
                            <div class="spark-bar ${cls}" style="height:${w}%;"></div>
                        </div>
                        <span class="${cls}" style="font-size:.78rem;font-weight:600;">${a.score}%</span>
                        <span style="font-size:.68rem;color:#94a3b8;">${a.date}</span>
                    </div>`;
                }).join('');
                return `<div class="student-concept-card">
                    <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.75rem;">
                        <strong>${_esc(h.concept_name)}</strong>
                        <span>${trend}</span>
                        ${h.improvement !== 0 ? `<span style="font-size:.8rem;color:${h.improvement > 0 ? '#16a34a' : '#dc2626'};">${h.improvement > 0 ? '+' : ''}${h.improvement}%</span>` : ''}
                        <span style="margin-left:auto;font-size:.8rem;color:#64748b;">Maîtrise: ${h.mastery_level}%</span>
                    </div>
                    <div class="sparkline-row">${sparkline}</div>
                </div>`;
            }).join('');

        // Weak / Strong
        const strongHtml = d.strong_concepts.length
            ? d.strong_concepts.map(c => `<span class="concept-chip chip-strong">${_A_SVG_STAR} ${_esc(c.concept_name)} (${c.score}%)</span>`).join('')
            : '<em style="color:#94a3b8;">Aucun</em>';
        const weakHtml = d.weak_concepts.length
            ? d.weak_concepts.map(c => `<span class="concept-chip chip-weak">${_A_SVG_ALERT} ${_esc(c.concept_name)} (${c.score}%)</span>`).join('')
            : '<em style="color:#94a3b8;">Aucun</em>';

        // Per-question stats
        const qHtml = d.question_stats.length === 0
            ? '<p style="color:#94a3b8;font-style:italic;">Pas encore de données par question (elles apparaîtront après les prochains tests).</p>'
            : `<table class="data-table" style="font-size:.85rem;">
                <thead><tr><th>Question</th><th>Type</th><th>Tentatives</th><th>Réussies</th><th>Taux</th></tr></thead>
                <tbody>${d.question_stats.map(q => `
                    <tr>
                        <td style="max-width:280px;word-break:break-word;">${_esc(q.question)}</td>
                        <td><span class="type-badge">${q.type}</span></td>
                        <td style="text-align:center;">${q.total_attempts}</td>
                        <td style="text-align:center;">${q.correct_count}</td>
                        <td><span class="fail-pct ${q.success_rate >= 70 ? 'low' : q.success_rate >= 40 ? 'med' : 'high'}">${q.success_rate}%</span></td>
                    </tr>`).join('')}
                </tbody></table>`;

        content.innerHTML = `
            <div style="display:flex;gap:1.5rem;flex-wrap:wrap;margin-bottom:1.25rem;">
                <div style="flex:1;min-width:200px;">
                    <h3 style="font-size:.9rem;color:#16a34a;margin-bottom:.5rem;">Points Forts</h3>
                    <div style="display:flex;flex-wrap:wrap;gap:.4rem;">${strongHtml}</div>
                </div>
                <div style="flex:1;min-width:200px;">
                    <h3 style="font-size:.9rem;color:#dc2626;margin-bottom:.5rem;">Points à Renforcer</h3>
                    <div style="display:flex;flex-wrap:wrap;gap:.4rem;">${weakHtml}</div>
                </div>
            </div>
            <h3 style="font-size:.95rem;margin-bottom:.75rem;color:#1e293b;">Progression par Concept</h3>
            ${histHtml}
            <h3 style="font-size:.95rem;margin:1.25rem 0 .75rem;color:#1e293b;">Statistiques par Question</h3>
            ${qHtml}`;
    } catch (e) {
        content.innerHTML = `<p style="color:#dc2626;">Erreur : ${e.message}</p>`;
        console.error('Student detail error:', e);
    }
}

function closeStudentDetail() {
    document.getElementById('studentDetailModal').style.display = 'none';
}

function _esc(str) {
    return String(str || '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// =================================================================
// LOGS
// =================================================================

async function loadLogs() {
    try {
        const data = await adminAPI.getLogs();

        const tableBody = document.getElementById('logsTableBody');
        tableBody.innerHTML = data.logs.map(log => `
            <tr>
                <td>${log.id}</td>
                <td>${log.admin_username}</td>
                <td>${log.action_type.replace(/_/g, ' ')}</td>
                <td>${log.entity}</td>
                <td>${log.entity_id || '—'}</td>
                <td>${new Date(log.timestamp).toLocaleString()}</td>
                <td><small>${JSON.stringify(log.details || {})}</small></td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Logs error:', error);
        alert('Error loading logs: ' + error.message);
    }
}

function filterLogs() {
    // Implement log filtering
    loadLogs();
}

// =================================================================
// LOGOUT
// =================================================================
