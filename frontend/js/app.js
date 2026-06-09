/* Main Application Logic */

// Inline SVG icon strings used in dynamically-generated HTML
const _SVG_LOCK     = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
const _SVG_UNLOCK   = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>`;
const _SVG_AWARD    = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>`;
const _SVG_DOWNLOAD = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
const _SVG_STAR     = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
const _SVG_INBOX    = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>`;
const _SVG_ALERT    = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
const _SVG_CHECK    = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
const _SVG_TREND    = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`;

let currentExercise = null;
let currentDiagnosticConcept = null;
let diagnosticQuestions = [];
let hintLevel = 0;

// Stores last mastery value so the message can be re-rendered on language change
let _lastAvgMastery = 0;

// Corrective exercises state
let _correctiveExercises = [];
let _correctiveIndex = 0;
let _correctiveSelected = -1;
let _correctiveResults = [];
let _lastDiagnosticAnswers = null;
let _lastTestTitle = '';

// Interactive question type states (shared by both diagnostic flows)
const _ddState = {}; // drag_drop: { questionIndex: [current item order] }
const _mlState = {}; // match_lines: { questionIndex: [current right selections] }

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    if (api.token) {
        showPage('dashboard');
        loadDashboard();
    } else {
        showPage('login');
    }
});

// ======================
// PAGE NAVIGATION
// ======================

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    const page = document.getElementById(pageId);
    if (page) {
        page.classList.add('active');

        const navbar = document.getElementById('navMenu');
        if (pageId === 'login') {
            navbar.style.display = 'none';
            document.querySelector('.navbar').style.display = 'none';
        } else if (pageId === 'sequenceDiagnosticTest') {
            navbar.style.display = 'none';
            document.querySelector('.navbar').style.display = 'none';
        } else {
            navbar.style.display = 'flex';
            document.querySelector('.navbar').style.display = '';
        }
    }
}

function navigateTo(pageId) {
    if (pageId === 'dashboard') {
        loadDashboard();
    } else if (pageId === 'exercise') {
        loadExercise();
    } else if (pageId === 'diagnostic') {
        loadDiagnosticConcepts();
    }
    showPage(pageId);
}

// ======================
// AUTHENTICATION
// ======================

function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
}

function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
}

async function handleLogin() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!username || !password) {
        alert(t('auth.fill_all_fields'));
        return;
    }

    try {
        await api.login(username, password);
        showPage('dashboard');
        loadDashboard();
    } catch (error) {
        alert(t('auth.login_failed') + ' : ' + error.message);
    }
}

async function handleRegister() {
    const username = document.getElementById('regUsername').value.trim();
    const email    = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value.trim();

    if (!username || !email || !password) {
        alert(t('auth.fill_all_fields'));
        return;
    }

    try {
        await api.register(username, email, password);
        alert(t('auth.register_success'));
        showLogin();
    } catch (error) {
        alert(t('auth.register_failed') + ' : ' + error.message);
    }
}

function logout() {
    if (confirm(t('auth.logout_confirm'))) {
        api.logout();
        showPage('login');
        showLogin();
    }
}

// ======================
// DASHBOARD
// ======================

// Last fetched modules progress (used by downloadCertificate)
let _lastModulesProgress = null;

async function loadDashboard() {
    try {
        const progress = await api.getModulesProgress();

        _lastModulesProgress = progress;

        // Flatten all sequences across all modules
        const allSequences = (progress.modules || []).flatMap(m => m.sequences || []);
        const totalSeqs    = allSequences.length;
        const validatedSeqs = allSequences.filter(s => s.badge_earned).length;

        // Stat 1: average mastery across ALL sequences (true global progress)
        const avgMastery = totalSeqs > 0
            ? allSequences.reduce((sum, s) => sum + s.avg_mastery, 0) / totalSeqs
            : 0;

        // Stat 3: best individual sequence mastery
        const bestSeq = totalSeqs > 0
            ? allSequences.reduce((best, s) => s.avg_mastery > best.avg_mastery ? s : best)
            : null;

        document.getElementById('overallMastery').textContent = Math.round(avgMastery) + '%';
        document.getElementById('totalAttempts').textContent  = validatedSeqs + ' / ' + totalSeqs;
        document.getElementById('accuracyRate').textContent   =
            bestSeq ? Math.round(bestSeq.avg_mastery) + '%' : '0%';

        const bestSeqNameEl = document.getElementById('bestSeqName');
        if (bestSeqNameEl) {
            bestSeqNameEl.textContent = (bestSeq && bestSeq.avg_mastery > 0)
                ? bestSeq.title
                : t('dashboard.no_data_yet');
        }

        _lastAvgMastery = avgMastery / 100;
        updateMasteryMessage(_lastAvgMastery);

        renderModuleCards(progress);
        await loadModulesMastery();

        const recommendations = await api.getRecommendations();
        loadRecommendations(recommendations);

    } catch (error) {
        console.error('Dashboard load error:', error);
        alert(t('dashboard.load_error') + ' : ' + error.message);
    }
}

async function loadModulesMastery() {
    try {
        const modules = await api.getAllModules();

        let treeHtml    = '';
        let moduleIndex = 0;

        for (const module of modules) {
            let moduleMasteryScore = 0;
            let totalConcepts      = 0;
            let sequencesHtml      = '';

            if (module.sequences && module.sequences.length > 0) {
                for (const sequence of module.sequences) {
                    try {
                        const sequenceDetails = await api.getSequenceDetails(sequence.id);

                        let sequenceMastery = 0;
                        let conceptsHtml    = '';

                        if (sequenceDetails.concepts && sequenceDetails.concepts.length > 0) {
                            let totalMastery = 0;
                            for (const concept of sequenceDetails.concepts) {
                                const conceptMastery = (concept.mastery_level || 0) * 100;
                                totalMastery += (concept.mastery_level || 0);
                                totalConcepts++;

                                conceptsHtml += `
                                    <div class="tree-item level-3">
                                        <div class="tree-item-header">
                                            <div class="tree-toggle no-children">▶</div>
                                            <span class="tree-item-title">${concept.name}</span>
                                            <span class="tree-item-percentage">${Math.round(conceptMastery)}%</span>
                                            <div class="tree-item-bar-container">
                                                <div class="tree-item-bar level-3">
                                                    <div class="tree-item-bar-fill" style="width: ${conceptMastery}%"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }
                            sequenceMastery    = (totalMastery / sequenceDetails.concepts.length) * 100;
                            moduleMasteryScore += totalMastery;
                        }

                        const sequenceId = `seq-${module.id}-${sequence.id}`;
                        sequencesHtml += `
                            <div class="tree-item level-2">
                                <div class="tree-item-header" onclick="toggleTreeItem('${sequenceId}')">
                                    <div class="tree-toggle expanded">▶</div>
                                    <span class="tree-item-title">${sequence.title}</span>
                                    <span class="tree-item-percentage">${Math.round(sequenceMastery)}%</span>
                                    <div class="tree-item-bar-container">
                                        <div class="tree-item-bar level-2">
                                            <div class="tree-item-bar-fill" style="width: ${sequenceMastery}%"></div>
                                        </div>
                                    </div>
                                </div>
                                <div class="tree-children" id="children-${sequenceId}">
                                    ${conceptsHtml}
                                </div>
                            </div>
                        `;
                    } catch (e) {
                        console.warn('Failed to load sequence details:', sequence.id);
                    }
                }

                if (totalConcepts > 0) {
                    moduleMasteryScore = (moduleMasteryScore / totalConcepts) * 100;
                }
            }

            const moduleId = `mod-${module.id}`;
            treeHtml += `
                <div class="tree-item level-1">
                    <div class="tree-item-header" onclick="toggleTreeItem('${moduleId}')">
                        <div class="tree-toggle expanded">▶</div>
                        <span class="tree-item-title">${module.title}</span>
                        <span class="tree-item-percentage">${Math.round(moduleMasteryScore)}%</span>
                        <div class="tree-item-bar-container">
                            <div class="tree-item-bar level-1">
                                <div class="tree-item-bar-fill" style="width: ${moduleMasteryScore}%"></div>
                            </div>
                        </div>
                    </div>
                    <div class="tree-children" id="children-${moduleId}">
                        ${sequencesHtml}
                    </div>
                </div>
            `;

            moduleIndex++;
        }

        document.getElementById('masteryByModules').innerHTML =
            treeHtml || `<p>${t('dashboard.no_mastery_data')}</p>`;

    } catch (error) {
        console.error('Failed to load modules mastery:', error);
        document.getElementById('masteryByModules').innerHTML =
            `<p>${t('dashboard.mastery_load_error')}</p>`;
    }
}

function toggleTreeItem(itemId) {
    const childrenDiv = document.getElementById(`children-${itemId}`);
    const headerDiv   = event.currentTarget;
    const toggleBtn   = headerDiv.querySelector('.tree-toggle');

    if (childrenDiv.classList.contains('collapsed')) {
        childrenDiv.classList.remove('collapsed');
        toggleBtn.classList.add('expanded');
    } else {
        childrenDiv.classList.add('collapsed');
        toggleBtn.classList.remove('expanded');
    }
}

function updateMasteryMessage(mastery) {
    let message;
    if (mastery < 0.2)      message = t('dashboard.mastery_0');
    else if (mastery < 0.4) message = t('dashboard.mastery_1');
    else if (mastery < 0.6) message = t('dashboard.mastery_2');
    else if (mastery < 0.8) message = t('dashboard.mastery_3');
    else                    message = t('dashboard.mastery_4');
    document.getElementById('masteryMessage').textContent = message;
}

function loadRecommendations(recommendations) {
    const next = recommendations.next_action;

    let html = `
        <div class="recommendation-item" style="margin-bottom: 1rem;">
            <div class="recommendation-text">
                <h4>${t('dashboard.next_step')}</h4>
                <p><strong>${next.recommended_action || next.action}</strong>: ${next.reason}</p>
            </div>
        </div>
    `;

    if (recommendations.algorithmics_path) {
        html += `<h3>${t('dashboard.algorithmics_path')}</h3>`;
        recommendations.algorithmics_path.forEach(item => {
            const statusColor = item.status === 'mastered'   ? '#16a34a' :
                                item.status === 'developing' ? '#2563eb' : '#f59e0b';
            html += `
                <div class="recommendation-item">
                    <div class="recommendation-text">
                        <h4>${item.concept_name}</h4>
                        <p>${t('dashboard.status')}: <span style="color: ${statusColor}; font-weight: bold;">${item.status}</span></p>
                    </div>
                </div>
            `;
        });
    }

    document.getElementById('recommendations').innerHTML = html;
}

// ======================
// EXERCISE MODE
// ======================

async function loadExercise() {
    const loading = document.getElementById('exerciseLoading');
    const content = document.getElementById('exerciseContent');

    loading.style.display = 'block';
    loading.textContent   = t('exercise.loading');
    content.style.display = 'none';
    document.getElementById('feedbackContainer').style.display = 'none';
    document.getElementById('studentAnswer').value = '';
    hintLevel = 0;
    document.getElementById('hintDisplay').style.display = 'none';

    try {
        const response = await api.getNextExercise();

        if (response.type === 'diagnostic') {
            alert(t('exercise.diagnostic_required'));
            navigateTo('diagnostic');
            return;
        }

        currentExercise = response;

        document.getElementById('exerciseTitle').textContent =
            `${t('exercise.exercise_label')} ${response.concept_name} (${response.difficulty})`;
        document.getElementById('exercisePrompt').innerHTML =
            response.exercise.replace(/\n/g, '<br>');

        loading.style.display = 'none';
        content.style.display = 'block';

    } catch (error) {
        loading.textContent = t('exercise.load_error') + ' : ' + error.message;
    }
}

async function submitAnswer() {
    const answer = document.getElementById('studentAnswer').value.trim();

    if (!answer) {
        alert(t('exercise.enter_answer'));
        return;
    }

    try {
        const result = await api.submitExerciseAnswer(currentExercise.exercise_id, answer);

        const container = document.getElementById('feedbackContainer');
        const content   = document.getElementById('feedbackContent');

        const isCorrect = result.is_correct;
        container.className = 'feedback-box ' + (isCorrect ? 'correct' : 'incorrect');

        content.innerHTML = `
            <h3>${isCorrect ? t('exercise.correct') : t('exercise.incorrect')}</h3>
            <p><strong>${t('exercise.feedback_label')}:</strong> ${result.feedback}</p>
            <p><strong>${t('exercise.hint_label')}:</strong> ${result.hint}</p>
            <p><strong>${t('exercise.new_mastery')}:</strong> ${Math.round(result.new_mastery * 100)}%</p>
        `;

        container.style.display = 'block';
        document.getElementById('studentAnswer').disabled = true;
        document.querySelector('button[onclick="submitAnswer()"]').disabled = true;

    } catch (error) {
        alert(t('exercise.submit_error') + ' : ' + error.message);
    }
}

async function getNextExercise() {
    loadExercise();
}

async function showHint() {
    if (hintLevel >= 3) {
        alert(t('exercise.no_hints'));
        return;
    }

    hintLevel++;

    try {
        const hint    = await api.getExerciseHint(currentExercise.exercise_id, hintLevel);
        const display = document.getElementById('hintDisplay');
        display.innerHTML =
            `<strong>${t('exercise.hint_label')} ${hintLevel} :</strong> ${hint.hint || currentExercise.hints[hintLevel - 1]}`;
        display.style.display = 'block';

    } catch (error) {
        if (currentExercise.hints && currentExercise.hints[hintLevel - 1]) {
            const display = document.getElementById('hintDisplay');
            display.innerHTML =
                `<strong>${t('exercise.hint_label')} ${hintLevel} :</strong> ${currentExercise.hints[hintLevel - 1]}`;
            display.style.display = 'block';
        } else {
            alert(t('exercise.hint_error') + ' : ' + error.message);
        }
    }
}

// ======================
// DIAGNOSTIC TEST
// ======================

async function loadDiagnosticConcepts() {
    try {
        const concepts = await api.getDiagnosticConcepts();

        const html = concepts.map(concept => `
            <div class="concept-card" onclick="selectDiagnosticConcept(${concept.id}, this)">
                <h4>${concept.name}</h4>
                <p style="font-size: 0.9rem; color: #666;">${concept.domain}</p>
            </div>
        `).join('');

        document.getElementById('conceptList').innerHTML = html;

    } catch (error) {
        alert(t('diagnostic.load_concepts_error') + ' : ' + error.message);
    }
}

async function selectDiagnosticConcept(conceptId, element) {
    currentDiagnosticConcept  = conceptId;
    currentSequenceDiagnosticId    = null;  // single-concept mode
    currentSequenceDiagnosticTitle = null;

    document.querySelectorAll('.concept-card').forEach(card => {
        card.classList.remove('selected');
    });
    element.classList.add('selected');

    const submitBtn = document.querySelector('#diagnosticStep2 button[onclick="submitDiagnostic()"]');

    try {
        diagnosticQuestions = await api.getDiagnosticQuestions(conceptId);

        if (diagnosticQuestions.length === 0) {
            document.getElementById('questionsContainer').innerHTML = `
                <div style="text-align:center; padding: 2rem; color: #64748b;">
                    <div style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;background:#f1f5f9;border-radius:12px;margin-bottom:0.75rem;color:#94a3b8;">${_SVG_INBOX}</div>
                    <p style="font-size: 1.1rem; font-weight: 600; color: #334155; margin-bottom: 0.5rem;">
                        ${t('diagnostic.no_exercises_title')}
                    </p>
                    <p>${t('diagnostic.no_exercises_msg')}</p>
                </div>`;
            if (submitBtn) submitBtn.style.display = 'none';
            document.getElementById('diagnosticStep1').style.display = 'none';
            document.getElementById('diagnosticStep2').style.display = 'block';
            return;
        }

        const html = diagnosticQuestions.map((q, idx) => {
            let inputHtml;
            if (q.input_type === 'text') {
                inputHtml = `<input type="text" name="q${idx}" class="text-answer-input"
                                   placeholder="${t('diagnostic.text_placeholder')}" autocomplete="off">`;
            } else if (q.input_type === 'long_answer') {
                inputHtml = `<textarea name="q${idx}" class="long-answer-textarea"
                                       placeholder="${t('diagnostic.long_answer_placeholder')}"></textarea>`;
            } else if (q.input_type === 'drag_drop') {
                _ddState[idx] = [...(q.items || [])];
                inputHtml = `
                    <p class="dd-instruction">${t('diagnostic.drag_drop_instruction')}</p>
                    <div class="dd-container" id="ddContainer-${idx}">
                        ${_buildDDItems(idx)}
                    </div>`;
            } else if (q.input_type === 'match_lines') {
                _mlState[idx] = Array((q.left_items || []).length).fill('');
                inputHtml = `
                    <p class="ml-instruction">${t('diagnostic.match_lines_instruction')}</p>
                    <div class="match-lines-container">
                        ${(q.left_items || []).map((left, i) => `
                            <div class="match-pair">
                                <div class="match-left">${_esc(left)}</div>
                                <div class="match-arrow">→</div>
                                <select class="match-right-select"
                                        onchange="saveMLAnswer(${idx}, ${i}, this.value)">
                                    <option value="">${t('diagnostic.match_select_placeholder')}</option>
                                    ${(q.right_items || []).map(right => `
                                        <option value="${_esc(right)}">${_esc(right)}</option>
                                    `).join('')}
                                </select>
                            </div>
                        `).join('')}
                    </div>`;
            } else {
                inputHtml = (q.options || []).map((opt, optIdx) => `
                    <label class="option-input">
                        <input type="radio" name="q${idx}" value="${optIdx}" required>
                        ${opt}
                    </label>`).join('');
            }

            return `
            <div class="question-item">
                <h4>${t('diagnostic.question_label')} ${idx + 1}</h4>
                <p>${q.question}</p>
                <div class="options">${inputHtml}</div>
            </div>`;
        }).join('');

        document.getElementById('questionsContainer').innerHTML = html;
        if (submitBtn) submitBtn.style.display = '';
        document.getElementById('diagnosticStep1').style.display = 'none';
        document.getElementById('diagnosticStep2').style.display = 'block';

    } catch (error) {
        alert(t('diagnostic.load_questions_error') + ' : ' + error.message);
    }
}

async function submitDiagnostic() {
    const answers = [];

    diagnosticQuestions.forEach((q, idx) => {
        if (q.input_type === 'text') {
            const input = document.querySelector(`input[name="q${idx}"]`);
            if (input && input.value.trim()) {
                answers.push({ question_id: q.id, selected_index: -1, text_answer: input.value.trim() });
            }
        } else if (q.input_type === 'long_answer') {
            const ta = document.querySelector(`textarea[name="q${idx}"]`);
            if (ta && ta.value.trim()) {
                answers.push({ question_id: q.id, selected_index: -1, text_answer: ta.value.trim() });
            }
        } else if (q.input_type === 'drag_drop') {
            const current = _ddState[idx] || q.items || [];
            answers.push({ question_id: q.id, selected_index: -1, text_answer: JSON.stringify(current) });
        } else if (q.input_type === 'match_lines') {
            const selections = _mlState[idx] || [];
            answers.push({ question_id: q.id, selected_index: -1, text_answer: JSON.stringify(selections) });
        } else {
            const selected = document.querySelector(`input[name="q${idx}"]:checked`);
            if (selected) {
                answers.push({ question_id: q.id, selected_index: parseInt(selected.value) });
            }
        }
    });

    // Validate completeness for non-auto-answered types
    const unansweredOld = diagnosticQuestions.reduce((acc, q, idx) => {
        if (q.input_type === 'drag_drop') return acc; // always answered
        const found = answers.find(a => a.question_id === q.id);
        if (!found) { acc.push(idx + 1); return acc; }
        if (q.input_type === 'match_lines') {
            try {
                const pairs = JSON.parse(found.text_answer || '[]');
                if (pairs.some(p => !p)) acc.push(idx + 1);
            } catch { acc.push(idx + 1); }
        }
        return acc;
    }, []);

    if (unansweredOld.length > 0) {
        alert(t('diagnostic.unanswered_questions', { numbers: unansweredOld.join(', ') }));
        return;
    }

    try {
        const results = await api.submitDiagnostic(currentDiagnosticConcept, answers);
        document.getElementById('diagnosticStep2').style.display = 'none';
        showDiagnosticReview(diagnosticQuestions, answers, results);
    } catch (error) {
        alert(t('diagnostic.submit_error') + ' : ' + error.message);
    }
}

async function retakeDiagnostic() {
    document.getElementById('diagnosticReview').style.display = 'none';
    Object.keys(_ddState).forEach(k => delete _ddState[k]);
    Object.keys(_mlState).forEach(k => delete _mlState[k]);
    Object.keys(_explanationCache).forEach(k => delete _explanationCache[k]);

    if (currentSequenceDiagnosticId) {
        // Sequence test — restart directly without going back to concept selection
        await startSequenceDiagnostic(currentSequenceDiagnosticId, currentSequenceDiagnosticTitle);
    } else if (currentDiagnosticConcept) {
        // Single concept test — reload questions and jump straight to step 2
        diagnosticQuestions = [];
        const submitBtn = document.querySelector('#diagnosticStep2 button[onclick="submitDiagnostic()"]');
        try {
            diagnosticQuestions = await api.getDiagnosticQuestions(currentDiagnosticConcept);
            // Re-render questions exactly like selectDiagnosticConcept does
            const html = diagnosticQuestions.map((q, idx) => {
                let inputHtml;
                if (q.input_type === 'text') {
                    inputHtml = `<input type="text" name="q${idx}" class="text-answer-input"
                                       placeholder="${t('diagnostic.text_placeholder')}" autocomplete="off">`;
                } else if (q.input_type === 'long_answer') {
                    inputHtml = `<textarea name="q${idx}" class="long-answer-textarea"
                                           placeholder="${t('diagnostic.long_answer_placeholder')}"></textarea>`;
                } else if (q.input_type === 'drag_drop') {
                    _ddState[idx] = [...(q.items || [])];
                    inputHtml = `<p class="dd-instruction">${t('diagnostic.drag_drop_instruction')}</p>
                        <div class="dd-container" id="ddContainer-${idx}">${_buildDDItems(idx)}</div>`;
                } else if (q.input_type === 'match_lines') {
                    _mlState[idx] = Array((q.left_items || []).length).fill('');
                    inputHtml = `<p class="ml-instruction">${t('diagnostic.match_lines_instruction')}</p>
                        <div class="match-lines-container">
                            ${(q.left_items || []).map((left, i) => `
                                <div class="match-pair">
                                    <div class="match-left">${_esc(left)}</div>
                                    <div class="match-arrow">→</div>
                                    <select class="match-right-select"
                                            onchange="saveMLAnswer(${idx}, ${i}, this.value)">
                                        <option value="">${t('diagnostic.match_select_placeholder')}</option>
                                        ${(q.right_items || []).map(right =>
                                            `<option value="${_esc(right)}">${_esc(right)}</option>`
                                        ).join('')}
                                    </select>
                                </div>`).join('')}
                        </div>`;
                } else {
                    inputHtml = (q.options || []).map((opt, optIdx) =>
                        `<label class="option-input">
                            <input type="radio" name="q${idx}" value="${optIdx}" required>
                            ${opt}
                        </label>`
                    ).join('');
                }
                return `<div class="question-item">
                    <h4>${t('diagnostic.question_label')} ${idx + 1}</h4>
                    <p>${q.question}</p>
                    <div class="options">${inputHtml}</div>
                </div>`;
            }).join('');
            document.getElementById('questionsContainer').innerHTML = html;
            if (submitBtn) submitBtn.style.display = '';
            document.getElementById('diagnosticStep1').style.display = 'none';
            document.getElementById('diagnosticStep2').style.display = 'block';
            document.getElementById('diagnosticStep2').scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (e) {
            document.getElementById('diagnosticStep1').style.display = 'block';
        }
    } else {
        document.getElementById('diagnosticStep1').style.display = 'block';
    }
}

// ======================
// MODULES & CURRICULUM
// ======================

async function loadModules() {
    try {
        const progress = await api.getModulesProgress();
        _lastModulesProgress = progress;
        renderModuleCards(progress);
    } catch (error) {
        console.error('Failed to load modules:', error);
        document.getElementById('modulesList').innerHTML = `<p>${t('module.load_error')}</p>`;
    }
}

function renderModuleCards(progress) {
    const html = (progress.modules || []).map(mod => buildModuleCard(mod)).join('');
    document.getElementById('modulesList').innerHTML = html || `<p>${t('module.load_error')}</p>`;
}

function buildModuleCard(mod) {
    const done = mod.certificate_earned;

    const padlocksHtml = (mod.sequences || []).map(seq => {
        const ok = seq.badge_earned;
        return `<div class="padlock-item ${ok ? 'padlock-unlocked' : 'padlock-locked'}">
            <span class="padlock-icon">${ok ? _SVG_UNLOCK : _SVG_LOCK}</span>
            <span class="padlock-label">${_esc(seq.title)}</span>
            <span class="padlock-pct">${seq.avg_mastery}%</span>
            ${ok ? `<span class="seq-badge">${_SVG_AWARD}</span>` : ''}
        </div>`;
    }).join('');

    const certBtn = done
        ? `<button class="certificate-btn" onclick="downloadCertificate(${mod.id})">
               ${_SVG_DOWNLOAD} ${t('reward.download_certificate')}
           </button>`
        : '';

    return `
        <div class="treasure-module-card ${done ? 'module-complete' : ''}">
            <div class="treasure-chest-header">
                <div class="chest-wrap ${done ? 'chest-open' : 'chest-closed'}">
                    <div class="chest-lid"><div class="chest-latch"></div></div>
                    <div class="chest-body"><span class="chest-content">${done ? _SVG_STAR : _SVG_LOCK}</span></div>
                </div>
                <h3 class="chest-module-title">${_esc(mod.title)}</h3>
                <div class="chest-progress-label">
                    ${mod.sequences_completed}/${mod.total_sequences} ${t('dashboard.sequences')}
                </div>
            </div>
            <div class="padlock-row">${padlocksHtml}</div>
            <div class="module-card-actions">
                ${certBtn}
                <button class="module-open-btn" onclick="openModuleModal(${mod.id})">
                    ${t('module.open')}
                </button>
            </div>
        </div>`;
}

function downloadCertificate(moduleId) {
    const progress = _lastModulesProgress;
    if (!progress) return;
    const mod = progress.modules.find(m => m.id === moduleId);
    if (!mod) return;

    const lang = getCurrentLang();
    const today = new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
    const seqRows = mod.sequences.map(s =>
        `<tr><td>${_esc(s.title)}</td><td>${s.avg_mastery}%</td><td>${s.badge_earned ? '&#10003;' : '—'}</td></tr>`
    ).join('');

    const certHtml = `<!DOCTYPE html><html lang="${lang}"><head>
<meta charset="UTF-8">
<title>${t('reward.certificate_title')}</title>
<style>
  body { font-family: 'Georgia', serif; margin: 0; padding: 40px; background: #fffef7; color: #1a1a1a; }
  .cert-border { border: 8px double #b8860b; padding: 32px 40px; max-width: 680px; margin: 0 auto;
                 background: white; box-shadow: 0 4px 24px rgba(0,0,0,0.1); }
  .cert-top { text-align: center; margin-bottom: 24px; }
  .cert-badge { font-size: 56px; margin-bottom: 8px; }
  .cert-title { font-size: 28px; color: #b8860b; font-weight: bold; letter-spacing: 1px; margin: 0; }
  .cert-subtitle { font-size: 14px; color: #666; margin: 4px 0 0; }
  .cert-divider { border: none; border-top: 2px solid #b8860b; margin: 20px 0; }
  .cert-student { text-align: center; font-size: 22px; font-weight: bold; margin: 12px 0; }
  .cert-module { text-align: center; font-size: 17px; color: #444; margin: 8px 0 20px; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; margin: 16px 0; }
  th { background: #b8860b; color: white; padding: 8px 12px; text-align: left; }
  td { padding: 7px 12px; border-bottom: 1px solid #e8e0c8; }
  .cert-date { text-align: right; font-size: 13px; color: #888; margin-top: 24px; }
  .cert-seal { text-align: center; font-size: 36px; margin-top: 16px; }
  @media print { body { padding: 0; } }
</style>
</head><body>
<div class="cert-border">
  <div class="cert-top">
    <div class="cert-badge" style="font-size:48px;letter-spacing:2px;color:#b8860b;font-weight:800;">&#9733;</div>
    <h1 class="cert-title">${t('reward.certificate_title')}</h1>
    <p class="cert-subtitle">AdaptiveLearn — Système d'Apprentissage Adaptatif</p>
  </div>
  <hr class="cert-divider">
  <p style="text-align:center;font-size:15px;color:#555;">${t('reward.certificate_awarded_to')}</p>
  <div class="cert-student">${_esc(progress.student_name)}</div>
  <div class="cert-module">${t('reward.certificate_module')} : <strong>${_esc(mod.title)}</strong></div>
  <table>
    <thead><tr>
      <th>${t('reward.cert_sequence')}</th>
      <th>${t('reward.cert_score')}</th>
      <th>${t('reward.cert_badge')}</th>
    </tr></thead>
    <tbody>${seqRows}</tbody>
  </table>
  <div class="cert-date">${today}</div>
  <div class="cert-seal" style="color:#b8860b;">&#9733; &#9733; &#9733;</div>
</div>
<script>window.onload = function(){ window.print(); }<\/script>
</body></html>`;

    const win = window.open('', '_blank');
    win.document.write(certHtml);
    win.document.close();
}

async function openModuleModal(moduleId) {
    try {
        const module = await api.getModuleDetails(moduleId);

        document.getElementById('moduleTitle').textContent       = module.title;
        document.getElementById('moduleDescription').textContent = module.description || '';

        const sequencesHtml = module.sequences.map(sequence => `
            <div class="sequence-item">
                <h4>${sequence.title}</h4>
                <p class="concepts-count">${sequence.concepts ? sequence.concepts.length : 0} ${t('diagnostic.concepts_notions')}</p>
                <button onclick="startSequenceDiagnostic(${sequence.id}, '${sequence.title.replace(/'/g, "\\'")}')">
                    ${t('diagnostic.start_diagnostic')}
                </button>
            </div>
        `).join('');

        document.getElementById('sequencesList').innerHTML = sequencesHtml;
        document.getElementById('moduleModal').style.display = 'block';

    } catch (error) {
        alert(t('module.load_module_error') + ' : ' + error.message);
    }
}

function closeModuleModal() {
    document.getElementById('moduleModal').style.display = 'none';
}

const _QUESTION_TYPE_ORDER = {
    true_false:   1,
    drag_drop:    2,
    match_lines:  3,
    mcq:          4,
    short_answer: 5,
    long_answer:  6
};

async function startSequenceDiagnostic(sequenceId, sequenceTitle) {
    try {
        const sequence    = await api.getSequenceDetails(sequenceId);
        const allQuestions = [];

        for (const concept of sequence.concepts) {
            try {
                const questions = await api.getDiagnosticQuestionsForConcept(concept.id);
                if (questions.length > 0) {
                    allQuestions.push(...questions.map(q => ({
                        ...q,
                        concept_id:   concept.id,
                        concept_name: concept.name
                    })));
                }
            } catch (e) {
                console.warn('Could not load questions for concept:', concept.name);
            }
        }

        // Sort globally: VF → Drag&Drop → Match lines → QCM → Réponse courte → Réponse longue
        allQuestions.sort((a, b) =>
            (_QUESTION_TYPE_ORDER[a.type] ?? 99) - (_QUESTION_TYPE_ORDER[b.type] ?? 99)
        );

        if (allQuestions.length === 0) {
            closeModuleModal();
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position:fixed; inset:0; background:rgba(0,0,0,.5);
                display:flex; align-items:center; justify-content:center; z-index:9999;`;
            overlay.innerHTML = `
                <div style="background:#fff; border-radius:12px; padding:2rem 2.5rem;
                            max-width:420px; text-align:center; box-shadow:0 8px 32px rgba(0,0,0,.2);">
                    <div style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;background:#f1f5f9;border-radius:12px;margin-bottom:0.75rem;color:#94a3b8;">${_SVG_INBOX}</div>
                    <h3 style="margin:0 0 .75rem; color:#1e293b;">${t('diagnostic.no_exercises_seq_title')}</h3>
                    <p style="color:#64748b; margin:0 0 1.5rem; line-height:1.6;">
                        ${t('diagnostic.no_exercises_seq_msg', { title: _esc(sequenceTitle) })}
                    </p>
                    <button onclick="this.closest('[style*=fixed]').remove()"
                            style="background:#2563eb; color:#fff; border:none; border-radius:8px;
                                   padding:.65rem 1.5rem; font-size:1rem; cursor:pointer;">
                        ${t('common.ok')}
                    </button>
                </div>`;
            document.body.appendChild(overlay);
            return;
        }

        diagnosticQuestions              = allQuestions;
        currentSequenceDiagnosticId      = sequenceId;
        currentSequenceDiagnosticTitle   = sequenceTitle;
        currentFullscreenDiagnosticIndex = 0;
        fullscreenDiagnosticAnswers      = {};
        Object.keys(_ddState).forEach(k => delete _ddState[k]);
        Object.keys(_mlState).forEach(k => delete _mlState[k]);

        closeModuleModal();

        document.getElementById('testSequenceName').textContent = sequenceTitle;
        document.getElementById('testSequenceDesc').textContent =
            t('diagnostic.test_covering', { n: sequence.concepts.length });

        showFullscreenQuestion(0);
        navigateToFullscreenDiagnostic();

        setTimeout(() => { requestFullscreen(); }, 300);

    } catch (error) {
        alert(t('diagnostic.load_error') + ' : ' + error.message);
    }
}

function closeSequenceDiagnosticModal() {
    document.getElementById('sequenceDiagnosticModal').style.display = 'none';
}

// ===== FULLSCREEN DIAGNOSTIC TEST FUNCTIONS =====

let currentSequenceDiagnosticId      = null;
let currentSequenceDiagnosticTitle   = null;
let currentFullscreenDiagnosticIndex = 0;
let fullscreenDiagnosticAnswers      = {};

function navigateToFullscreenDiagnostic() {
    document.querySelector('.navbar').style.display = 'none';
    showPage('sequenceDiagnosticTest');
}

function showFullscreenQuestion(index) {
    if (index < 0 || index >= diagnosticQuestions.length) return;

    currentFullscreenDiagnosticIndex = index;
    const question = diagnosticQuestions[index];

    document.getElementById('questionProgress').textContent =
        `${index + 1}/${diagnosticQuestions.length}`;

    const progressPercent = ((index + 1) / diagnosticQuestions.length) * 100;
    document.getElementById('progressFill').style.width = progressPercent + '%';

    let inputHtml;
    if (question.input_type === 'text') {
        const savedText = fullscreenDiagnosticAnswers[index] || '';
        inputHtml = `<input type="text" class="text-answer-input" id="fsTextAnswer"
                            value="${savedText}" autocomplete="off"
                            placeholder="${t('diagnostic.text_placeholder')}"
                            oninput="fullscreenDiagnosticAnswers[${index}] = this.value">`;

    } else if (question.input_type === 'long_answer') {
        const savedText = fullscreenDiagnosticAnswers[index] || '';
        inputHtml = `
            <textarea class="long-answer-textarea" id="fsLongAnswer-${index}"
                      oninput="fullscreenDiagnosticAnswers[${index}] = this.value"
                      placeholder="${t('diagnostic.long_answer_placeholder')}">${_esc(savedText)}</textarea>`;

    } else if (question.input_type === 'drag_drop') {
        if (!_ddState[index]) {
            _ddState[index] = [...(question.items || [])];
        }
        fullscreenDiagnosticAnswers[index] = JSON.stringify(_ddState[index]);
        inputHtml = `
            <p class="dd-instruction">${t('diagnostic.drag_drop_instruction')}</p>
            <div class="dd-container" id="ddContainer-${index}">
                ${_buildDDItems(index)}
            </div>`;

    } else if (question.input_type === 'match_lines') {
        if (!_mlState[index]) {
            _mlState[index] = Array((question.left_items || []).length).fill('');
        }
        inputHtml = `
            <p class="ml-instruction">${t('diagnostic.match_lines_instruction')}</p>
            <div class="match-lines-container">
                ${(question.left_items || []).map((left, i) => `
                    <div class="match-pair">
                        <div class="match-left">${_esc(left)}</div>
                        <div class="match-arrow">→</div>
                        <select class="match-right-select"
                                onchange="saveMLAnswer(${index}, ${i}, this.value)">
                            <option value="">${t('diagnostic.match_select_placeholder')}</option>
                            ${(question.right_items || []).map(right => `
                                <option value="${_esc(right)}"
                                    ${_mlState[index][i] === right ? 'selected' : ''}>
                                    ${_esc(right)}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                `).join('')}
            </div>`;

    } else {
        inputHtml = (question.options || []).map((opt, optIdx) => {
            const isChecked = fullscreenDiagnosticAnswers[index] === optIdx ? 'checked' : '';
            return `
                <label class="option-input">
                    <input type="radio" name="currentQuestion" value="${optIdx}" ${isChecked}
                           onchange="fullscreenDiagnosticAnswers[${index}] = ${optIdx}">
                    ${opt}
                </label>`;
        }).join('');
    }

    const questionHtml = `
        <div class="question-item">
            <h4>${t('diagnostic.question_label')} ${index + 1} - ${question.concept_name}</h4>
            <p>${question.question}</p>
            <div class="options">${inputHtml}</div>
        </div>
    `;

    document.getElementById('fullscreenQuestionsContent').innerHTML = questionHtml;

    const prevBtn   = document.getElementById('prevBtn');
    const nextBtn   = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');

    prevBtn.style.display   = index === 0 ? 'none' : 'block';
    nextBtn.style.display   = index === diagnosticQuestions.length - 1 ? 'none'  : 'block';
    submitBtn.style.display = index === diagnosticQuestions.length - 1 ? 'block' : 'none';
}

function previousQuestion() {
    if (currentFullscreenDiagnosticIndex > 0) {
        showFullscreenQuestion(currentFullscreenDiagnosticIndex - 1);
    }
}

function nextQuestion() {
    if (currentFullscreenDiagnosticIndex < diagnosticQuestions.length - 1) {
        showFullscreenQuestion(currentFullscreenDiagnosticIndex + 1);
    }
}

function requestFullscreen() {
    const container = document.querySelector('.fullscreen-diagnostic-container');

    if (container.requestFullscreen) {
        container.requestFullscreen().catch(err => {
            console.log('Fullscreen request failed:', err);
        });
    } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
    } else if (container.mozRequestFullScreen) {
        container.mozRequestFullScreen();
    } else if (container.msRequestFullscreen) {
        container.msRequestFullscreen();
    }

    document.addEventListener('fullscreenchange',       handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange',    handleFullscreenChange);
    document.addEventListener('msfullscreenchange',     handleFullscreenChange);
    document.addEventListener('keydown', preventExitFullscreen);
}

function handleFullscreenChange() {
    const isFullscreen = document.fullscreenElement        ||
                         document.webkitFullscreenElement  ||
                         document.mozFullScreenElement     ||
                         document.msFullscreenElement;

    if (!isFullscreen && currentFullscreenDiagnosticIndex < diagnosticQuestions.length - 1) {
        setTimeout(() => {
            const container = document.querySelector('.fullscreen-diagnostic-container');
            if (container && container.requestFullscreen) {
                container.requestFullscreen().catch(err => {
                    console.log('Fullscreen re-request failed:', err);
                });
            }
        }, 100);
    }
}

function preventExitFullscreen(e) {
    if ((e.key === 'F11' || e.keyCode === 122) &&
        currentFullscreenDiagnosticIndex < diagnosticQuestions.length - 1) {
        e.preventDefault();
    }
}

function exitFullscreen() {
    if (document.exitFullscreen)            document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    else if (document.mozCancelFullScreen)  document.mozCancelFullScreen();
    else if (document.msExitFullscreen)     document.msExitFullscreen();

    document.removeEventListener('fullscreenchange',       handleFullscreenChange);
    document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.removeEventListener('mozfullscreenchange',    handleFullscreenChange);
    document.removeEventListener('msfullscreenchange',     handleFullscreenChange);
    document.removeEventListener('keydown', preventExitFullscreen);
}

// ── Drag & Drop helpers ──────────────────────────────────────────────────────

function _buildDDItems(questionIndex) {
    const arr = _ddState[questionIndex] || [];
    return arr.map((item, i) => `
        <div class="dd-item">
            <button type="button" class="dd-btn" onclick="moveDDItem(${questionIndex}, ${i}, -1)"
                    ${i === 0 ? 'disabled' : ''}>▲</button>
            <span class="dd-item-text">${_esc(item)}</span>
            <button type="button" class="dd-btn" onclick="moveDDItem(${questionIndex}, ${i}, 1)"
                    ${i === arr.length - 1 ? 'disabled' : ''}>▼</button>
        </div>
    `).join('');
}

function moveDDItem(questionIndex, itemPos, direction) {
    const arr = _ddState[questionIndex];
    if (!arr) return;
    const newPos = itemPos + direction;
    if (newPos < 0 || newPos >= arr.length) return;
    [arr[itemPos], arr[newPos]] = [arr[newPos], arr[itemPos]];
    fullscreenDiagnosticAnswers[questionIndex] = JSON.stringify(arr);
    const container = document.getElementById(`ddContainer-${questionIndex}`);
    if (container) container.innerHTML = _buildDDItems(questionIndex);
}

// ── Match Lines helpers ──────────────────────────────────────────────────────

function saveMLAnswer(questionIndex, pairIndex, value) {
    if (!_mlState[questionIndex]) {
        const q = diagnosticQuestions[questionIndex];
        _mlState[questionIndex] = Array((q?.left_items || []).length).fill('');
    }
    _mlState[questionIndex][pairIndex] = value;
    fullscreenDiagnosticAnswers[questionIndex] = JSON.stringify(_mlState[questionIndex]);
}

async function submitFullscreenDiagnostic() {
    const unanswered = [];
    for (let i = 0; i < diagnosticQuestions.length; i++) {
        const val = fullscreenDiagnosticAnswers[i];
        const inputType = diagnosticQuestions[i].input_type;

        if (inputType === 'drag_drop') {
            // Always answered — initialized on render
        } else if (inputType === 'match_lines') {
            try {
                const pairs = JSON.parse(val || '[]');
                const nLeft = diagnosticQuestions[i].left_items?.length || 0;
                if (!Array.isArray(pairs) || pairs.length !== nLeft || pairs.some(p => !p)) {
                    unanswered.push(i + 1);
                }
            } catch { unanswered.push(i + 1); }
        } else if (inputType === 'long_answer' || inputType === 'text') {
            if (val === undefined || String(val).trim() === '') unanswered.push(i + 1);
        } else {
            if (val === undefined) unanswered.push(i + 1);
        }
    }

    if (unanswered.length > 0) {
        alert(t('diagnostic.unanswered_questions', { numbers: unanswered.join(', ') }));
        return;
    }

    const answers = diagnosticQuestions.map((q, idx) => {
        const inputType = q.input_type;
        if (['text', 'long_answer', 'drag_drop', 'match_lines'].includes(inputType)) {
            return {
                question_id:    q.id || idx,
                selected_index: -1,
                text_answer:    String(fullscreenDiagnosticAnswers[idx] || ''),
                concept_id:     q.concept_id
            };
        }
        return {
            question_id:    q.id || idx,
            selected_index: fullscreenDiagnosticAnswers[idx] ?? -1,
            text_answer:    null,
            concept_id:     q.concept_id
        };
    });

    try {
        const results = await api.submitDiagnosticTest(answers);
        exitFullscreen();
        showFullscreenResults(results);
    } catch (error) {
        alert(t('diagnostic.submit_error') + ' : ' + error.message);
    }
}

function showFullscreenResults(results) {
    document.querySelector('.navbar').style.display = '';
    exitFullscreen();

    const answers = diagnosticQuestions.map((q, idx) => {
        const inputType = q.input_type;
        if (['text', 'long_answer', 'drag_drop', 'match_lines'].includes(inputType)) {
            return {
                question_id:    q.id || idx,
                selected_index: -1,
                text_answer:    String(fullscreenDiagnosticAnswers[idx] || ''),
                concept_id:     q.concept_id
            };
        }
        return {
            question_id:    q.id || idx,
            selected_index: fullscreenDiagnosticAnswers[idx] ?? -1,
            text_answer:    null,
            concept_id:     q.concept_id
        };
    });

    navigateTo('diagnostic');
    showDiagnosticReview(diagnosticQuestions, answers, results);
}

async function submitSequenceDiagnostic() {
    const answers = [];

    diagnosticQuestions.forEach((q, idx) => {
        const selected = document.querySelector(`input[name="q${idx}"]:checked`);
        if (selected) {
            answers.push({
                question_id:    q.id,
                selected_index: parseInt(selected.value),
                concept_id:     q.concept_id
            });
        }
    });

    if (answers.length !== diagnosticQuestions.length) {
        alert(t('diagnostic.please_answer_all'));
        return;
    }

    try {
        const results = await api.submitDiagnosticTest(answers);

        let resultHtml = `<h3>${t('diagnostic.diagnostic_results')}</h3>`;
        resultHtml += '<div class="results-summary">';

        if (Array.isArray(results)) {
            results.forEach(result => {
                resultHtml += `
                    <div class="result-item">
                        <h4>${result.concept_name}</h4>
                        <p><strong>${t('diagnostic.score_colon')}</strong> ${Math.round(result.score)}%</p>
                    </div>
                `;
            });
        } else {
            resultHtml += `
                <p><strong>${t('diagnostic.score_colon')}</strong> ${Math.round(results.score)}%</p>
                <p>${t('diagnostic.mastery_recorded')}</p>
            `;
        }

        resultHtml += '</div>';
        resultHtml += `<button onclick="closeSequenceDiagnosticModal(); loadDashboard(); showPage('dashboard')" class="btn-primary">${t('diagnostic.back_dashboard')}</button>`;

        document.getElementById('diagnosticQuestionsContainer').innerHTML = resultHtml;
        document.querySelector('#sequenceDiagnosticModal .modal-content button').style.display = 'none';

    } catch (error) {
        alert(t('diagnostic.submit_error') + ' : ' + error.message);
    }
}

// (loadModules is now called directly from loadDashboard)

// =================================================================
// DIAGNOSTIC REVIEW  (shown after any diagnostic submit)
// =================================================================

// Cache so clicking "Explain" twice doesn't re-call the API
const _explanationCache = {};

function _resolveStudentAnswer(question, answer) {
    if (question.input_type === 'text' || question.input_type === 'long_answer') {
        return answer.text_answer || t('review.no_answer');
    }
    if (question.input_type === 'drag_drop') {
        try {
            const items = JSON.parse(answer.text_answer || '[]');
            return items.join(' → ') || t('review.no_answer');
        } catch { return t('review.no_answer'); }
    }
    if (question.input_type === 'match_lines') {
        try {
            const rights = JSON.parse(answer.text_answer || '[]');
            return (question.left_items || []).map((l, i) => `${l} → ${rights[i] || '?'}`).join(', ') || t('review.no_answer');
        } catch { return t('review.no_answer'); }
    }
    const idx = answer.selected_index;
    if (idx < 0) return t('review.not_answered');
    return (question.options && question.options[idx]) || `Option ${idx}`;
}

function _resolveCorrectAnswer(question) {
    if (question.input_type === 'text' || question.input_type === 'long_answer') {
        return question.correct_answer || '';
    }
    if (question.input_type === 'drag_drop') {
        return (question.correct_items || []).join(' → ');
    }
    if (question.input_type === 'match_lines') {
        const rights = (question.correct_pairs || []).map(i => (question.right_items || [])[i] || '?');
        return (question.left_items || []).map((l, i) => `${l} → ${rights[i]}`).join(', ');
    }
    const idx = question.correct_index ?? 0;
    return (question.options && question.options[idx]) || `Option ${idx}`;
}

function _isAnswerCorrect(question, answer) {
    if (question.input_type === 'text') {
        const student  = (answer.text_answer || '').trim().toLowerCase();
        const expected = (question.correct_answer || '').trim().toLowerCase();
        const alts     = (question.alternative_answers || []).map(a => a.trim().toLowerCase());
        return student === expected || alts.includes(student);
    }
    if (question.input_type === 'long_answer') {
        const student  = (answer.text_answer || '').trim().toLowerCase();
        const keywords = (question.keywords || []).map(k => k.trim().toLowerCase()).filter(Boolean);
        if (keywords.length > 0) {
            const matched = keywords.filter(kw => student.includes(kw)).length;
            return matched >= Math.max(1, keywords.length * 0.5);
        }
        const words = (question.correct_answer || '').toLowerCase().split(/\s+/).filter(w => w.length >= 4);
        if (words.length > 0) {
            const matched = words.filter(w => student.includes(w)).length;
            return matched >= Math.max(1, words.length * 0.5);
        }
        return student !== '' && student === (question.correct_answer || '').trim().toLowerCase();
    }
    if (question.input_type === 'drag_drop') {
        try {
            const studentItems = JSON.parse(answer.text_answer || '[]');
            return JSON.stringify(studentItems) === JSON.stringify(question.correct_items || []);
        } catch { return false; }
    }
    if (question.input_type === 'match_lines') {
        try {
            const studentRights = JSON.parse(answer.text_answer || '[]');
            const correctRights = (question.correct_pairs || []).map(i => (question.right_items || [])[i]);
            return JSON.stringify(studentRights) === JSON.stringify(correctRights);
        } catch { return false; }
    }
    return answer.selected_index === (question.correct_index ?? -99);
}

/**
 * Build the answer block for a review card.
 * For drag_drop / match_lines: renders each item/pair individually with ✓/✗.
 * For other types: falls back to the standard answer pills.
 */
function _buildReviewAnswerHtml(question, answer) {
    // ── Drag & Drop ──────────────────────────────────────────────────────────
    if (question.input_type === 'drag_drop') {
        let studentItems = [];
        try { studentItems = JSON.parse(answer.text_answer || '[]'); } catch {}
        const correctItems = question.correct_items || [];

        if (!studentItems.length) {
            return `<div class="answer-row"><span class="answer-pill student-wrong">
                <span class="pill-icon">✗</span> ${t('review.no_answer')}</span></div>`;
        }

        const rows = correctItems.map((correctItem, i) => {
            const studentItem = i < studentItems.length ? studentItems[i] : '?';
            const ok = studentItem === correctItem;
            return `
                <div class="rdi-row ${ok ? 'rdi-ok' : 'rdi-err'}">
                    <span class="rdi-pos">${i + 1}.</span>
                    <span class="rdi-val">${_esc(studentItem)}</span>
                    <span class="rdi-icon">${ok ? '✓' : '✗'}</span>
                    ${!ok ? `<span class="rdi-hint">→ <strong>${_esc(correctItem)}</strong></span>` : ''}
                </div>`;
        }).join('');

        return `<div class="review-detail-list">${rows}</div>`;
    }

    // ── Match Lines ──────────────────────────────────────────────────────────
    if (question.input_type === 'match_lines') {
        let studentRights = [];
        try { studentRights = JSON.parse(answer.text_answer || '[]'); } catch {}
        const leftItems    = question.left_items   || [];
        const rightItems   = question.right_items  || [];
        const correctPairs = question.correct_pairs || [];

        if (!studentRights.length) {
            return `<div class="answer-row"><span class="answer-pill student-wrong">
                <span class="pill-icon">✗</span> ${t('review.no_answer')}</span></div>`;
        }

        const rows = leftItems.map((left, i) => {
            const correctRight = rightItems[correctPairs[i]] || '?';
            const studentRight = studentRights[i] || '?';
            const ok = studentRight === correctRight;
            return `
                <div class="rdi-row rdi-ml ${ok ? 'rdi-ok' : 'rdi-err'}">
                    <span class="rdi-left">${_esc(left)}</span>
                    <span class="rdi-arrow">→</span>
                    <span class="rdi-val">${_esc(studentRight)}</span>
                    <span class="rdi-icon">${ok ? '✓' : '✗'}</span>
                    ${!ok ? `<span class="rdi-hint">${_esc(correctRight)}</span>` : ''}
                </div>`;
        }).join('');

        return `<div class="review-detail-list">${rows}</div>`;
    }

    // ── Default (MCQ, True/False, Short Answer, Long Answer) ────────────────
    const correct      = _isAnswerCorrect(question, answer);
    const studentText  = _resolveStudentAnswer(question, answer);
    const correctText  = _resolveCorrectAnswer(question);
    const pillClass    = correct ? 'student-correct' : 'student-wrong';
    const icon         = correct ? '✓' : '✗';
    const correctPill  = correct ? '' : `
        <span class="answer-pill correct-answer">
            <span class="pill-icon">✓</span> ${correctText}
        </span>`;
    return `
        <div class="answer-row">
            <span class="answer-pill ${pillClass}">
                <span class="pill-icon">${icon}</span> ${studentText}
            </span>
            ${correctPill}
        </div>`;
}

function showDiagnosticReview(questions, answers, results) {
    ['diagnosticStep1', 'diagnosticStep2', 'diagnosticResults', 'correctiveExercisesSection'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    const _skeleton = document.getElementById('learningGuideSkeleton');
    const _guide    = document.getElementById('learningGuide');
    const _content  = document.getElementById('learningGuideContent');
    if (_skeleton) _skeleton.style.display = 'none';
    if (_guide)    _guide.style.display    = 'none';
    if (_content)  _content.innerHTML      = '';

    // --- Score banner ---
    let totalCorrect = 0;
    const answerMap  = {};
    answers.forEach(a => { answerMap[a.question_id] = a; });
    questions.forEach(q => {
        const a = answerMap[q.id];
        if (a && _isAnswerCorrect(q, a)) totalCorrect++;
    });

    const pct = questions.length ? Math.round((totalCorrect / questions.length) * 100) : 0;
    let conceptLabel = '';
    if (Array.isArray(results)) {
        conceptLabel = results.map(r => r.concept_name).join(', ');
    } else if (results && results.concept_name) {
        conceptLabel = results.concept_name;
    }

    const masteryColor = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';

    document.getElementById('reviewScoreBanner').innerHTML = `
        <div class="score-left">
            <h2>${conceptLabel || t('review.diagnostic_review')}</h2>
            <p>${t('review.correct_out_of', { correct: totalCorrect, total: questions.length })}</p>
        </div>
        <div class="score-right">
            <div class="score-circle" style="border-color:${masteryColor};">
                <span class="score-num" style="color:${masteryColor};">${pct}%</span>
                <span class="score-label">${t('review.score')}</span>
            </div>
        </div>
        <div id="progressionStrip" class="progression-strip">
            <span class="prog-loading">…</span>
        </div>`;

    _lastDiagnosticAnswers = answers;
    _lastTestTitle         = conceptLabel || t('review.diagnostic_review');

    const correctivesBtn = document.getElementById('correctivesBtn');
    if (correctivesBtn) {
        correctivesBtn.style.display = 'inline-flex';
        correctivesBtn.disabled      = false;
        correctivesBtn.textContent   = t('diagnostic.correctives_btn');
    }

    // --- Question cards ---
    const cardsHtml = questions.map((q, idx) => {
        const answer  = answerMap[q.id] || { selected_index: -1, text_answer: '' };
        const correct = _isAnswerCorrect(q, answer);

        const _typeLabelMap = {
            'text':        t('review.short_answer'),
            'long_answer': t('review.long_answer'),
            'drag_drop':   t('review.drag_drop'),
            'match_lines': t('review.match_lines'),
        };
        const questionMeta = _typeLabelMap[q.input_type]
            ?? (q.options?.length === 2 ? t('review.true_false') : t('review.mcq'));

        return `
        <div class="review-card ${correct ? 'correct' : 'incorrect'}" id="review-card-${idx}">
            <div class="review-card-header">
                <span style="font-size:0.85rem;color:#64748b;font-weight:500;">
                    ${q.concept_name ? `<em>${q.concept_name}</em> · ` : ''}Q${idx + 1}
                </span>
                <span class="question-meta">${questionMeta}</span>
            </div>
            <div class="review-card-body">
                <p class="review-question-text">${q.question}</p>
                ${_buildReviewAnswerHtml(q, answer)}
                <button class="explain-btn" id="explain-btn-${idx}"
                        onclick="explainAnswer(${idx})">
                    ${t('review.explain_btn')}
                </button>
                <div id="explanation-box-${idx}"></div>
            </div>
        </div>`;
    }).join('');

    document.getElementById('reviewQuestionsContainer').innerHTML = cardsHtml;

    const reviewEl = document.getElementById('diagnosticReview');
    reviewEl.style.display = 'block';
    reviewEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

    _fetchAndRenderLearningGuide(questions, answers, conceptLabel);
    _fetchAndRenderProgression();
}

async function _fetchAndRenderProgression() {
    const strip = document.getElementById('progressionStrip');
    if (!strip) return;
    try {
        let history = [];
        if (currentSequenceDiagnosticId) {
            history = await api.getSequenceDiagnosticHistory(currentSequenceDiagnosticId);
            // history: [{attempt_num, overall, per_concept:[...]}]
        } else if (currentDiagnosticConcept) {
            const raw = await api.getConceptDiagnosticHistory(currentDiagnosticConcept);
            // raw: [{attempt_num, score, date}]
            history = raw.map(r => ({ attempt_num: r.attempt_num, overall: r.score }));
        }
        if (!history.length) { strip.style.display = 'none'; return; }

        const last = history[history.length - 1].attempt_num;
        const bubbles = history.map(h => {
            const isCurrent = h.attempt_num === last;
            const sc = h.overall;
            const color = sc >= 80 ? '#22c55e' : sc >= 50 ? '#f59e0b' : '#ef4444';
            return `
                <div class="prog-bubble ${isCurrent ? 'prog-bubble--current' : ''}"
                     style="border-color:${color};${isCurrent ? `background:${color};` : ''}">
                    <span class="prog-num" style="${isCurrent ? 'color:#fff;' : `color:${color};`}">T${h.attempt_num}</span>
                    <span class="prog-score" style="${isCurrent ? 'color:#fff;' : `color:${color};`}">${sc}%</span>
                    ${isCurrent ? '<span class="prog-current-tag">actuel</span>' : ''}
                </div>
                ${h.attempt_num < last ? '<div class="prog-arrow">→</div>' : ''}`;
        }).join('');

        strip.innerHTML = `
            <div class="prog-label">${_SVG_TREND} Progression</div>
            <div class="prog-row">${bubbles}</div>`;
    } catch (_) {
        if (strip) strip.style.display = 'none';
    }
}

async function explainAnswer(questionIndex) {
    const cacheKey = questionIndex;
    const btn      = document.getElementById(`explain-btn-${questionIndex}`);
    const box      = document.getElementById(`explanation-box-${questionIndex}`);

    if (_explanationCache[cacheKey]) {
        box.innerHTML = `
            <div class="explanation-box">
                <div class="explain-label">${t('review.ai_explanation')}</div>
                ${_explanationCache[cacheKey]}
            </div>`;
        btn.style.display = 'none';
        return;
    }

    btn.disabled  = true;
    btn.innerHTML = `<span class="btn-spinner"></span> ${t('review.generating')}`;

    const q = diagnosticQuestions[questionIndex];
    if (!q) {
        btn.disabled  = false;
        btn.innerHTML = t('review.explain_btn');
        return;
    }

    // Resolve the student's stored answer rather than scraping the DOM
    const _answerLookup = {};
    (_lastDiagnosticAnswers || []).forEach(a => { _answerLookup[a.question_id] = a; });
    const _storedAnswer = _answerLookup[q.id] || { selected_index: -1, text_answer: '' };

    const studentText = _resolveStudentAnswer(q, _storedAnswer);
    const correctText = _resolveCorrectAnswer(q);
    const card        = document.getElementById(`review-card-${questionIndex}`);
    const isCorrect   = card?.classList.contains('correct') ?? false;

    const _exerciseTypeMap = { 'text': 'short_answer', 'long_answer': 'long_answer', 'drag_drop': 'drag_drop', 'match_lines': 'match_lines' };
    const exerciseType = _exerciseTypeMap[q.input_type] || 'mcq';

    try {
        const data = await api.explainAnswer({
            concept_name:   q.concept_name || 'Computer Science',
            question_text:  q.question,
            exercise_type:  exerciseType,
            student_answer: studentText,
            correct_answer: correctText,
            is_correct:     isCorrect
        });

        _explanationCache[cacheKey] = data.explanation;

        box.innerHTML = `
            <div class="explanation-box">
                <div class="explain-label">${t('review.ai_explanation')}</div>
                ${data.explanation}
            </div>`;
        btn.style.display = 'none';

    } catch (err) {
        box.innerHTML = `
            <div class="explanation-box explanation-error">
                ${t('review.explanation_error')} : ${err.message}
            </div>`;
        btn.disabled  = false;
        btn.innerHTML = t('review.explain_btn');
    }
}

// =================================================================
// LEARNING GUIDE  ("What to Learn From This Test")
// =================================================================

// ── AI progress loader state ──────────────────────────────
let _aiProgressTimer = null;
let _aiProgressVal   = 0;

function _renderAILoader() {
    const wrap = document.getElementById('learningGuideSkeleton');
    if (!wrap) return;
    wrap.innerHTML = `
    <div class="ai-loader-panel">
        <div class="ai-loader-orb">
            <svg viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        </div>
        <h3 class="ai-loader-title">${t('guide.ai_loading_title')}</h3>
        <p class="ai-loader-subtitle">${t('guide.ai_loading_subtitle')}</p>
        <div class="ai-loader-bar-wrap">
            <div class="ai-loader-track">
                <div class="ai-loader-fill" id="aiProgressBar"></div>
            </div>
            <span class="ai-loader-pct" id="aiProgressPct">0%</span>
        </div>
        <div class="ai-loader-steps">
            <span class="ai-step ai-step--active" id="aiStep0">${t('guide.ai_step_1')}</span>
            <span class="ai-step-sep">→</span>
            <span class="ai-step ai-step--pending" id="aiStep1">${t('guide.ai_step_2')}</span>
            <span class="ai-step-sep">→</span>
            <span class="ai-step ai-step--pending" id="aiStep2">${t('guide.ai_step_3')}</span>
        </div>
    </div>`;
}

function _startAIProgress() {
    _aiProgressVal = 0;
    _renderAILoader();

    _aiProgressTimer = setInterval(() => {
        const remaining = 87 - _aiProgressVal;
        _aiProgressVal  = Math.min(87, _aiProgressVal + Math.max(0.5, remaining * 0.045));
        const pct = Math.round(_aiProgressVal);

        const barEl = document.getElementById('aiProgressBar');
        const pctEl = document.getElementById('aiProgressPct');
        if (barEl) barEl.style.width = pct + '%';
        if (pctEl) pctEl.textContent  = pct + '%';

        // Advance step indicators at thresholds
        const step = pct < 34 ? 0 : pct < 68 ? 1 : 2;
        for (let i = 0; i < 3; i++) {
            const el = document.getElementById('aiStep' + i);
            if (!el) continue;
            el.className = 'ai-step ' + (i < step ? 'ai-step--done' : i === step ? 'ai-step--active' : 'ai-step--pending');
        }

        if (_aiProgressVal >= 87) clearInterval(_aiProgressTimer);
    }, 220);
}

async function _completeAIProgress() {
    clearInterval(_aiProgressTimer);
    const barEl = document.getElementById('aiProgressBar');
    const pctEl = document.getElementById('aiProgressPct');
    if (barEl) { barEl.style.transition = 'width 0.55s ease'; barEl.style.width = '100%'; }
    if (pctEl) pctEl.textContent = '100%';
    for (let i = 0; i < 3; i++) {
        const el = document.getElementById('aiStep' + i);
        if (el) el.className = 'ai-step ai-step--done';
    }
    await new Promise(r => setTimeout(r, 520));
}

// ── Section icon helper ───────────────────────────────────
function _lgHead(svgBody, bg, stroke, labelKey) {
    return `<div class="lg-section-head">
        <div class="lg-section-icon-box" style="background:${bg};">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                 stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                 width="18" height="18">${svgBody}</svg>
        </div>
        <span class="lg-section-label">${t(labelKey)}</span>
    </div>`;
}

async function _fetchAndRenderLearningGuide(questions, answers, testTitle) {
    const skeleton  = document.getElementById('learningGuideSkeleton');
    const guideEl   = document.getElementById('learningGuide');
    const contentEl = document.getElementById('learningGuideContent');

    if (!skeleton || !guideEl || !contentEl) return;

    window._lastGuideArgs = [questions, answers, testTitle];

    skeleton.style.display = 'block';
    guideEl.style.display  = 'none';
    _startAIProgress();

    const answerMap = {};
    answers.forEach(a => { answerMap[a.question_id] = a; });

    const questionResults = questions.map(q => {
        const answer  = answerMap[q.id] || {};
        const correct = _isAnswerCorrect(q, answer);
        return {
            question:       q.question,
            student_answer: _resolveStudentAnswer(q, answer),
            correct_answer: _resolveCorrectAnswer(q),
            is_correct:     correct,
            concept_name:   q.concept_name || ''
        };
    });

    try {
        const guide = await api.getLearningGuide({
            test_title: testTitle || t('review.diagnostic_review'),
            questions:  questionResults
        });

        await _completeAIProgress();

        const html = _buildGuideHTML(guide);
        contentEl.innerHTML = html;

        skeleton.style.display = 'none';
        guideEl.style.display  = 'block';

    } catch (err) {
        clearInterval(_aiProgressTimer);
        console.error('[LearningGuide] fetch failed:', err);
        skeleton.style.display = 'none';
        guideEl.style.display  = 'block';
        contentEl.innerHTML = `
            <div style="padding:1.5rem 2rem; color:#64748b; font-size:0.9rem; text-align:center;">
                ${_SVG_ALERT} ${t('guide.error')} — ${err.message}<br>
                <button onclick="_retryLearningGuide()" style="margin-top:0.75rem;padding:0.4rem 1rem;
                    border:1.5px solid #6366f1;border-radius:6px;color:#6366f1;background:none;cursor:pointer;font-size:0.85rem;">
                    ${t('guide.retry')}
                </button>
            </div>`;
    }
}

function _retryLearningGuide() {
    const args = window._lastGuideArgs;
    if (args) _fetchAndRenderLearningGuide(...args);
}

function _buildGuideHTML(guide) {
    const sections = [];

    if (guide.summary) {
        sections.push(`
        <div>
            ${_lgHead('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>', '#eef2ff', '#4f46e5', 'guide.summary')}
            <div class="lg-summary">${_esc(guide.summary)}</div>
        </div>`);
    }

    if (guide.weak_areas && guide.weak_areas.length) {
        const chips = guide.weak_areas.map(w => `
            <div class="lg-chip">
                <div class="lg-chip-concept">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    ${_esc(w.concept)}
                </div>
                <div class="lg-chip-gap">${_esc(w.gap)}</div>
            </div>`).join('');

        sections.push(`
        <div>
            ${_lgHead('<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>', '#fff7ed', '#ea580c', 'guide.weak_areas')}
            <div class="lg-chips">${chips}</div>
        </div>`);
    }

    if (guide.key_lessons && guide.key_lessons.length) {
        const lessons = guide.key_lessons.map((l, i) => `
            <div class="lg-lesson">
                <div class="lg-lesson-num">${i + 1}</div>
                <div class="lg-lesson-body">
                    <p class="lg-lesson-title">${_esc(l.title)}</p>
                    <p class="lg-lesson-content">${_esc(l.content)}</p>
                    ${l.tip ? `<span class="lg-lesson-tip">${_esc(l.tip)}</span>` : ''}
                </div>
            </div>`).join('');

        sections.push(`
        <div>
            ${_lgHead('<path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>', '#eff6ff', '#2563eb', 'guide.key_lessons')}
            <div class="lg-lessons">${lessons}</div>
        </div>`);
    }

    if (guide.action_plan && guide.action_plan.length) {
        const items = guide.action_plan.map(s => `<li>${_esc(s)}</li>`).join('');
        sections.push(`
        <div>
            ${_lgHead('<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>', '#ecfdf5', '#059669', 'guide.action_plan')}
            <ul class="lg-action-list">${items}</ul>
        </div>`);
    }

    if (guide.strengths) {
        sections.push(`
        <div>
            ${_lgHead('<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>', '#fefce8', '#ca8a04', 'guide.strengths')}
            <div class="lg-strengths">
                <span class="lg-strengths-icon">${_SVG_STAR}</span>
                <p class="lg-strengths-text">${_esc(guide.strengths)}</p>
            </div>
        </div>`);
    }

    if (sections.length === 0) {
        console.warn('[LearningGuide] guide object had no usable sections:', guide);
        return `
            <div style="padding:1.5rem 2rem; color:#64748b; font-size:0.9rem; text-align:center;">
                ${_SVG_ALERT} ${t('guide.empty')}<br>
                <button onclick="_retryLearningGuide()" style="margin-top:0.75rem;padding:0.4rem 1rem;
                    border:1.5px solid #6366f1;border-radius:6px;color:#6366f1;background:none;cursor:pointer;font-size:0.85rem;">
                    ${t('guide.retry')}
                </button>
            </div>`;
    }

    return sections.join('');
}

/** Minimal HTML-escape to prevent XSS from AI output. */
function _esc(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// =================================================================
// CORRECTIVE EXERCISES
// =================================================================

async function startCorrectiveExercises() {
    const btn = document.getElementById('correctivesBtn');
    if (!btn || !diagnosticQuestions.length || !_lastDiagnosticAnswers) return;

    const answerMap = {};
    _lastDiagnosticAnswers.forEach(a => { answerMap[a.question_id] = a; });

    const wrongQuestions = diagnosticQuestions
        .filter(q => !_isAnswerCorrect(q, answerMap[q.id] || {}))
        .map(q => ({
            concept:        q.concept_name || 'Informatique',
            question:       q.question,
            correct_answer: _resolveCorrectAnswer(q)
        }));

    if (!wrongQuestions.length) return;

    btn.disabled  = true;
    btn.innerHTML = `<span class="ce-btn-spinner"></span> ${t('corrective.generating')}`;

    try {
        const response = await api.getCorrectiveExercises({
            test_title:     _lastTestTitle || t('review.diagnostic_review'),
            wrong_questions: wrongQuestions
        });

        _correctiveExercises = response.exercises || [];
        _correctiveIndex     = 0;
        _correctiveResults   = [];

        document.getElementById('diagnosticReview').style.display = 'none';
        const section = document.getElementById('correctiveExercisesSection');
        section.style.display = 'block';
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });

        _renderCorrectiveExercise();

    } catch (err) {
        btn.disabled  = false;
        btn.innerHTML = t('diagnostic.correctives_btn');
        const errDiv = document.createElement('div');
        errDiv.className   = 'ce-toast-error';
        errDiv.textContent = t('corrective.generate_error') + ' : ' + err.message;
        btn.parentElement.appendChild(errDiv);
        setTimeout(() => errDiv.remove(), 5000);
    }
}

function _renderCorrectiveExercise() {
    const card          = document.getElementById('ceExerciseCard');
    const endScreen     = document.getElementById('ceEndScreen');
    const progressLabel = document.getElementById('ceProgressLabel');
    const progressFill  = document.getElementById('ceProgressFill');

    card.style.display      = 'block';
    endScreen.style.display = 'none';
    _correctiveSelected     = -1;

    const total = _correctiveExercises.length;
    const i     = _correctiveIndex;
    const ex    = _correctiveExercises[i];

    progressLabel.textContent      = `${i + 1} / ${total}`;
    progressFill.style.width       = `${((i + 1) / total) * 100}%`;

    const optionsHtml = ex.options.map((opt, idx) => `
        <button class="ce-option" id="ce-opt-${idx}" onclick="selectCorrectiveOption(${idx})">
            <span class="ce-option-letter">${String.fromCharCode(65 + idx)}</span>
            <span class="ce-option-text">${_esc(opt)}</span>
        </button>`).join('');

    card.innerHTML = `
        <div class="ce-question-num">${t('corrective.question_of', { n: i + 1, total })}</div>
        <p class="ce-question-text">${_esc(ex.question)}</p>
        <div class="ce-options" id="ceOptions">${optionsHtml}</div>
        <div class="ce-actions">
            <button class="ce-submit-btn" id="ceSubmitBtn" onclick="submitCorrectiveAnswer()" disabled>
                ${t('corrective.submit')}
            </button>
        </div>
        <div id="ceFeedback" class="ce-feedback" style="display:none;"></div>
    `;
}

function selectCorrectiveOption(idx) {
    if (_correctiveSelected >= 0) return;
    _correctiveSelected = idx;

    document.querySelectorAll('.ce-option').forEach((btn, i) => {
        btn.classList.toggle('selected', i === idx);
    });

    const submitBtn = document.getElementById('ceSubmitBtn');
    if (submitBtn) submitBtn.disabled = false;
}

function submitCorrectiveAnswer() {
    if (_correctiveSelected < 0) return;

    const ex        = _correctiveExercises[_correctiveIndex];
    const isCorrect = _correctiveSelected === ex.correct_index;
    _correctiveResults.push(isCorrect);

    document.querySelectorAll('.ce-option').forEach((btn, i) => {
        btn.disabled = true;
        if (i === ex.correct_index) btn.classList.add('ce-correct');
        else if (i === _correctiveSelected && !isCorrect) btn.classList.add('ce-wrong');
    });

    const submitBtn = document.getElementById('ceSubmitBtn');
    if (submitBtn) submitBtn.style.display = 'none';

    const isLast  = _correctiveIndex >= _correctiveExercises.length - 1;
    const nextLabel = isLast ? t('corrective.see_results') : t('corrective.next');
    const nextFn    = isLast ? 'showCorrectiveEndScreen()' : 'nextCorrectiveExercise()';

    const correctOptionText = ex.options[ex.correct_index] || '';
    const correctWasHtml = !isCorrect
        ? `<div class="ce-correct-was">
               <span class="ce-correct-was-label">${t('corrective.correct_was')}</span>
               <span class="ce-correct-was-text">${_esc(correctOptionText)}</span>
           </div>`
        : '';

    const feedback = document.getElementById('ceFeedback');
    feedback.innerHTML = `
        <div class="ce-feedback-banner ${isCorrect ? 'ce-fb-correct' : 'ce-fb-wrong'}">
            ${isCorrect ? t('corrective.correct_answer') : t('corrective.wrong_answer')}
        </div>
        ${correctWasHtml}
        <div class="ce-explanation">
            <span class="ce-explanation-label">${t('corrective.explanation')}</span>
            ${_esc(ex.explanation)}
        </div>
        <button class="ce-next-btn" onclick="${nextFn}">${nextLabel}</button>
    `;
    feedback.style.display = 'block';
}

function nextCorrectiveExercise() {
    _correctiveIndex++;
    _renderCorrectiveExercise();
    document.getElementById('correctiveExercisesSection')
        .scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showCorrectiveEndScreen() {
    const card         = document.getElementById('ceExerciseCard');
    const endScreen    = document.getElementById('ceEndScreen');
    const progressFill = document.getElementById('ceProgressFill');

    card.style.display         = 'none';
    progressFill.style.width   = '100%';

    const total   = _correctiveResults.length;
    const correct = _correctiveResults.filter(Boolean).length;
    const pct     = total ? Math.round((correct / total) * 100) : 0;
    const color   = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';

    const message = pct === 100
        ? t('corrective.end_msg_perfect')
        : pct >= 60
            ? t('corrective.end_msg_good')
            : t('corrective.end_msg_keep_going');

    endScreen.innerHTML = `
        <div class="ce-end-icon">${_SVG_CHECK}</div>
        <h3 class="ce-end-title">${t('corrective.end_title')}</h3>
        <div class="ce-end-score-wrap">
            <div class="ce-end-score-circle" style="border-color:${color};">
                <span class="ce-end-score-num" style="color:${color};">${pct}%</span>
                <span class="ce-end-score-sub">${correct}/${total}</span>
            </div>
        </div>
        <p class="ce-end-message">${_esc(message)}</p>
        <div class="ce-end-actions">
            <button class="btn-secondary ce-back-btn" onclick="backToReview()">${t('corrective.back_to_review')}</button>
            <button class="ce-end-primary-btn" onclick="navigateTo('dashboard')">${t('corrective.dashboard')}</button>
        </div>
    `;
    endScreen.style.display = 'block';
    endScreen.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function backToReview() {
    document.getElementById('correctiveExercisesSection').style.display = 'none';

    const btn = document.getElementById('correctivesBtn');
    if (btn) {
        btn.disabled  = false;
        btn.textContent = t('diagnostic.correctives_btn');
    }

    const review = document.getElementById('diagnosticReview');
    review.style.display = 'block';
    review.scrollIntoView({ behavior: 'smooth', block: 'start' });

    const contentEl = document.getElementById('learningGuideContent');
    const guideEl   = document.getElementById('learningGuide');
    const isEmpty   = !contentEl || contentEl.innerHTML.trim() === '' ||
                      (guideEl && guideEl.style.display === 'none');
    if (isEmpty && _lastDiagnosticAnswers && diagnosticQuestions.length) {
        _fetchAndRenderLearningGuide(diagnosticQuestions, _lastDiagnosticAnswers, _lastTestTitle);
    }
}

// =================================================================
// LANGUAGE CHANGE — re-render dynamic content for active page
// =================================================================

document.addEventListener('languageChanged', async () => {
    // Always keep the mastery message in sync
    updateMasteryMessage(_lastAvgMastery);

    // Reload dashboard dynamic content (modules, recommendations, mastery tree)
    const activePage = document.querySelector('.page.active');
    if (activePage && activePage.id === 'dashboard' && api.token) {
        try {
            await loadDashboard();
        } catch (e) {
            console.error('Dashboard reload failed on language change:', e);
        }
    }
});
